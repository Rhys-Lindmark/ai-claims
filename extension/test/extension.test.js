import assert from 'node:assert/strict';
import test from 'node:test';
import registry from '../data/analyses.json' with { type: 'json' };
import { resolveAnalysis, scoreState } from '../lib/analysis-registry.js';
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
