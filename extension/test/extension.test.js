import assert from 'node:assert/strict';
import test from 'node:test';
import registry from '../data/analyses.json' with { type: 'json' };
import { resolveAnalysis, scoreState } from '../lib/analysis-registry.js';
import { createApiResolver, createLocalResolver } from '../lib/analysis-resolver.js';
import { identifyPage } from '../lib/page-identity.js';

test('canonicalizes common YouTube URL forms to one entity', () => {
  const urls = [
    'https://www.youtube.com/watch?v=abc123xyz00&utm_source=test',
    'https://youtu.be/abc123xyz00?t=42',
    'https://www.youtube.com/shorts/abc123xyz00',
    'https://www.youtube.com/embed/abc123xyz00',
  ];
  assert.deepEqual(urls.map((url) => identifyPage(url).entityKey), Array(4).fill('youtube:abc123xyz00'));
});

test('recognizes Goodreads books without edition-slug noise', () => {
  const page = identifyPage('https://www.goodreads.com/book/show/12345.Some_Book?from_search=true');
  assert.equal(page.kind, 'goodreads');
  assert.equal(page.entityKey, 'goodreads:12345');
  assert.equal(page.canonicalUrl, 'https://www.goodreads.com/book/show/12345');
});

test('canonicalizes generic pages and removes tracking parameters', () => {
  const page = identifyPage('https://example.com/story/?b=2&utm_medium=email&a=1#notes');
  assert.equal(page.entityKey, 'web:example.com/story?a=1&b=2');
  assert.equal(page.canonicalUrl, 'https://example.com/story?a=1&b=2');
});

test('publishes only complete, reviewed scores', () => {
  const state = resolveAnalysis(registry, 'web:example.invalid/reviewed-fixture');
  assert.equal(state.state, 'published');
  assert.equal(state.score, 84);
  assert.equal(state.reviewedClaims, 25);
});

test('suppresses partial or malformed scores', () => {
  assert.equal(resolveAnalysis(registry, 'web:example.invalid/incomplete-fixture').state, 'pending');
  assert.equal(resolveAnalysis(registry, 'web:missing.invalid').state, 'not_analyzed');
  assert.equal(scoreState({ status: 'published', eligible_claims: 1, reviewed_claims: 1, unresolved_claims: 0, publication_gates_passed: true, provenance_complete: false, score_0_100: 90 }).state, 'pending');
});

test('local resolver preserves the score gate behind an adapter', async () => {
  const resolver = createLocalResolver({
    registryUrl: 'chrome-extension://fixture/data/analyses.json',
    fetchImpl: async () => ({ ok: true, json: async () => registry }),
  });
  assert.equal((await resolver.resolve('web:example.invalid/reviewed-fixture')).score, 84);
});

test('API resolver uses the versioned envelope and exact entity key', async () => {
  let requestedUrl;
  const analysis = registry.analyses[0];
  const resolver = createApiResolver({
    endpoint: 'https://api.example.invalid',
    fetchImpl: async (url) => {
      requestedUrl = url;
      return { ok: true, status: 200, json: async () => ({ contract_version: '1.0.0', entity_key: analysis.entity_key, analysis }) };
    },
  });
  const state = await resolver.resolve(analysis.entity_key);
  assert.equal(requestedUrl.pathname, '/v1/analyses/resolve');
  assert.equal(requestedUrl.searchParams.get('entity_key'), analysis.entity_key);
  assert.equal(state.state, 'published');
});

test('API resolver maps 404 to not analyzed and rejects incompatible contracts', async () => {
  const missing = createApiResolver({ endpoint: 'https://api.example.invalid', fetchImpl: async () => ({ ok: false, status: 404 }) });
  assert.equal((await missing.resolve('web:missing.invalid')).state, 'not_analyzed');

  const incompatible = createApiResolver({ endpoint: 'https://api.example.invalid', fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ contract_version: '2.0.0', entity_key: 'web:x', analysis: null }) }) });
  await assert.rejects(incompatible.resolve('web:x'), /Unsupported resolver contract/);
});
