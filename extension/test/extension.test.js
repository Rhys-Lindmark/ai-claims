import assert from 'node:assert/strict';
import test from 'node:test';
import registry from '../data/analyses.json' with { type: 'json' };
import resolverConfig from '../data/resolver-config.json' with { type: 'json' };
import manifest from '../manifest.json' with { type: 'json' };
import { resolveAnalysis, scoreState } from '../lib/analysis-registry.js';
import { createApiResolver, createLocalResolver } from '../lib/analysis-resolver.js';
import { createRequestStore } from '../lib/analysis-requests.js';
import { computeTruthScore } from '../lib/truth-score.js';
import { goodreadsBookResolution, sourceNotice, transcriptAcquisition } from '../lib/source-policy.js';
import { createBookIdentityRecord, isValidIsbn } from '../lib/book-identity.js';
import { createMetricsStore } from '../lib/local-metrics.js';
import { identifyPage } from '../lib/page-identity.js';
import { actionBadgeForState } from '../lib/action-badge.js';

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

test('API resolver preserves a custom endpoint path', async () => {
  let requestedUrl;
  const resolver = createApiResolver({
    endpoint: 'https://ai.example.invalid/claims/api/',
    fetchImpl: async (url) => {
      requestedUrl = url;
      return { ok: false, status: 404 };
    },
  });
  await resolver.resolve('goodreads:123');
  assert.equal(requestedUrl.pathname, '/claims/api/v1/analyses/resolve');
});

test('packaged extension uses the public resolver with a narrow host permission', () => {
  assert.equal(resolverConfig.mode, 'api');
  assert.equal(resolverConfig.endpoint, 'https://ai.rhyslindmark.com/claims/api/');
  assert.deepEqual(manifest.host_permissions, ['https://ai.rhyslindmark.com/*']);
});

test('toolbar badge exposes numbers only for published scores', () => {
  assert.equal(actionBadgeForState({ state: 'published', score: 84 }).text, '84');
  assert.equal(actionBadgeForState({ state: 'not_analyzed' }).text, '?');
  assert.equal(actionBadgeForState({ state: 'pending', score: 91 }).text, '');
});

test('API resolver maps 404 to not analyzed and rejects incompatible contracts', async () => {
  const missing = createApiResolver({ endpoint: 'https://api.example.invalid', fetchImpl: async () => ({ ok: false, status: 404 }) });
  assert.equal((await missing.resolve('web:missing.invalid')).state, 'not_analyzed');

  const incompatible = createApiResolver({ endpoint: 'https://api.example.invalid', fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ contract_version: '2.0.0', entity_key: 'web:x', analysis: null }) }) });
  await assert.rejects(incompatible.resolve('web:x'), /Unsupported resolver contract/);
});

function memoryStorage() {
  const values = {};
  return {
    get: async (key) => ({ [key]: values[key] }),
    set: async (updates) => Object.assign(values, updates),
  };
}

test('analysis requests are idempotent by canonical entity', async () => {
  const store = createRequestStore({ storageArea: memoryStorage(), now: () => '2026-08-30T00:00:00.000Z', createId: () => 'request-1' });
  const identity = identifyPage('https://youtu.be/abc123xyz00?t=42');
  const first = await store.submit(identity);
  const duplicate = await store.submit(identifyPage('https://www.youtube.com/watch?v=abc123xyz00'));
  assert.equal(first.created, true);
  assert.equal(duplicate.created, false);
  assert.equal(duplicate.record.request_id, 'request-1');
});

test('request lifecycle permits review, publication, failure, and explicit retry only', async () => {
  const store = createRequestStore({ storageArea: memoryStorage(), now: () => '2026-08-30T00:00:00.000Z', createId: () => 'request-2' });
  const identity = identifyPage('https://example.com/article');
  await store.submit(identity);
  await assert.rejects(store.transition(identity.entityKey, 'published'), /Cannot transition/);
  await store.transition(identity.entityKey, 'failed');
  const retried = await store.transition(identity.entityKey, 'queued');
  assert.equal(retried.attempt, 2);
  await store.transition(identity.entityKey, 'in_review');
  const published = await store.transition(identity.entityKey, 'published');
  assert.equal(published.state, 'published');
});

function reviewedClaim(id, summaryVerdict, overrides = {}) {
  return {
    canonical_claim_id: id,
    eligibility_reviewed: true,
    eligible: true,
    review_state: 'reviewed',
    summary_verdict: summaryVerdict,
    publication_gates_passed: true,
    provenance_complete: true,
    consequence: 'high',
    ...overrides,
  };
}

test('truth score is equal-weight truth credit with a disclosed denominator', () => {
  const result = computeTruthScore([
    reviewedClaim('c1', 'accurate'),
    reviewedClaim('c2', 'mostly_accurate'),
    reviewedClaim('c3', 'mixed'),
    reviewedClaim('c4', 'inaccurate'),
  ]);
  assert.equal(result.state, 'published');
  assert.equal(result.score, 56);
  assert.equal(result.earned_credits, 2.25);
  assert.equal(result.eligible_claims, 4);
});

test('consequence and confidence cannot silently change score weight', () => {
  const low = computeTruthScore([reviewedClaim('c1', 'accurate', { consequence: 'low', confidence: 0.55 }), reviewedClaim('c2', 'inaccurate', { consequence: 'low', confidence: 0.55 })]);
  const high = computeTruthScore([reviewedClaim('c1', 'accurate', { consequence: 'critical', confidence: 0.99 }), reviewedClaim('c2', 'inaccurate', { consequence: 'critical', confidence: 0.99 })]);
  assert.equal(low.score, 50);
  assert.equal(high.score, 50);
});

test('uncheckable claims are excluded only after eligibility review', () => {
  const result = computeTruthScore([
    reviewedClaim('c1', 'accurate'),
    reviewedClaim('opinion', null, { eligible: false, review_state: 'excluded', publication_gates_passed: false, provenance_complete: false, exclusion_reason: 'opinion' }),
  ]);
  assert.equal(result.score, 100);
  assert.equal(result.eligible_claims, 1);
});

test('partial coverage, unresolved verdicts, and duplicate canonical claims suppress the score', () => {
  assert.equal(computeTruthScore([reviewedClaim('c1', 'accurate'), reviewedClaim('c2', 'mixed', { review_state: 'pending' })]).state, 'pending');
  assert.equal(computeTruthScore([reviewedClaim('c1', null)]).state, 'pending');
  assert.equal(computeTruthScore([reviewedClaim('c1', 'accurate'), reviewedClaim('c1', 'inaccurate')]).state, 'pending');
  assert.equal(computeTruthScore([reviewedClaim('c1', 'accurate', { eligibility_reviewed: false })]).state, 'pending');
});

test('YouTube acquisition blocks scraping-shaped defaults', () => {
  const decision = transcriptAcquisition({ kind: 'youtube' });
  assert.equal(decision.state, 'permission_required');
  assert.equal(decision.permitted, false);
  assert.match(sourceNotice('youtube'), /does not scrape YouTube/);
});

test('YouTube acquisition permits only documented authorization or rights-confirmed supply', () => {
  assert.equal(transcriptAcquisition({ kind: 'youtube', creatorAuthorized: true }).state, 'creator_authorized');
  assert.equal(transcriptAcquisition({ kind: 'youtube', licensedSource: true }).state, 'licensed_source');
  assert.equal(transcriptAcquisition({ kind: 'youtube', transcriptSupplied: true }).state, 'rights_required');
  assert.equal(transcriptAcquisition({ kind: 'youtube', transcriptSupplied: true, rightsConfirmed: true }).state, 'user_supplied');
});

test('Goodreads URL detection never implies scraped book metadata', () => {
  const unresolved = goodreadsBookResolution({ kind: 'goodreads' });
  assert.equal(unresolved.state, 'identity_unresolved');
  assert.equal(unresolved.resolved, false);
  assert.match(sourceNotice('goodreads'), /separately sourced/);
});

test('Goodreads book identity resolves only from explicit permitted mappings', () => {
  assert.equal(goodreadsBookResolution({ kind: 'goodreads', registryMatch: true }).state, 'registry_match');
  assert.equal(goodreadsBookResolution({ kind: 'goodreads', suppliedIsbn: true }).state, 'user_supplied_isbn');
  assert.equal(goodreadsBookResolution({ kind: 'goodreads', publisherMetadata: true }).state, 'publisher_metadata');
});

test('validates ISBN-10 and ISBN-13 checksums', () => {
  assert.equal(isValidIsbn('0-306-40615-2'), true);
  assert.equal(isValidIsbn('978-0-306-40615-7'), true);
  assert.equal(isValidIsbn('978-0-306-40615-8'), false);
});

test('stages a browser-local Goodreads-to-edition mapping without page metadata', () => {
  const result = createBookIdentityRecord({ goodreadsUrl: 'https://www.goodreads.com/book/show/12345.Some_Book', isbn: '978-0-306-40615-7', editionNote: 'Hardcover', editionConfirmed: true, suppliedAt: '2026-08-30T00:00:00.000Z' });
  assert.equal(result.ok, true);
  assert.equal(result.record.entity_key, 'goodreads:12345');
  assert.equal(result.record.isbn, '9780306406157');
  assert.equal(Object.hasOwn(result.record, 'title'), false);
});

test('local metrics omit page identity and summarize seven-day activity', async () => {
  const storage = memoryStorage();
  const store = createMetricsStore({ storageArea: storage, now: () => '2026-08-30T12:00:00.000Z' });
  const event = await store.record('page_checked', { kind: 'youtube', entity_key: 'youtube:secret', url: 'https://youtube.com/watch?v=secret', title: 'Secret' });
  await store.record('score_pending', { kind: 'youtube' });
  assert.deepEqual(Object.keys(event).sort(), ['kind', 'timestamp', 'type']);
  assert.equal(JSON.stringify(event).includes('secret'), false);
  const summary = await store.summary(7);
  assert.equal(summary.counts.page_checked, 1);
  assert.equal(summary.counts.score_pending, 1);
});

test('local metrics reject unknown event types', async () => {
  const store = createMetricsStore({ storageArea: memoryStorage() });
  await assert.rejects(store.record('page_url'), /Unknown metric event/);
});
