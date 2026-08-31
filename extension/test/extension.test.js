import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import registry from '../data/analyses.json' with { type: 'json' };
import resolverConfig from '../data/resolver-config.json' with { type: 'json' };
import manifest from '../manifest.json' with { type: 'json' };
import { resolveAnalysis, scoreState } from '../lib/analysis-registry.js';
import { correctionFeedCompatibility, createApiResolver, createLocalResolver, deploymentAttestationCompatibility } from '../lib/analysis-resolver.js';
import { createRequestStore } from '../lib/analysis-requests.js';
import { computeTruthScore } from '../lib/truth-score.js';
import { goodreadsBookResolution, sourceNotice, transcriptAcquisition } from '../lib/source-policy.js';
import { createBookIdentityRecord, isValidIsbn } from '../lib/book-identity.js';
import { createMetricsStore } from '../lib/local-metrics.js';
import { identifyPage } from '../lib/page-identity.js';
import { actionBadgeForState } from '../lib/action-badge.js';
import { createOriginOptInStore } from '../lib/origin-opt-in.js';
import { correctionLinkForState, correctionPreviewForState, escapeHtml } from '../lib/correction-links.js';
import { canonicalPrivacyReceipt, privacyReceiptArtifact, SUPPORTED_PRIVACY_RECEIPT_SCHEMAS, verifyPrivacyReceiptDocument } from '../lib/privacy-receipt.js';
import syntheticEpisode from '../data/synthetic-youtube-fixture.json' with { type: 'json' };
import { syntheticEpisodeScore, validateSyntheticEpisodeFixture } from '../lib/episode-fixture.js';
import syntheticBook from '../data/synthetic-goodreads-fixture.json' with { type: 'json' };
import { syntheticBookScore, validateSyntheticBookFixture } from '../lib/book-fixture.js';
import syntheticWeb from '../data/synthetic-web-fixture.json' with { type: 'json' };
import { syntheticWebScore, validateSyntheticWebFixture } from '../lib/web-fixture.js';
import { probeResolverUrl } from '../lib/resolver-probe.js';
import architecture from '../data/architecture.json' with { type: 'json' };
import compatibility from '../data/compatibility.json' with { type: 'json' };
import attestation from '../data/deployment-attestation.json' with { type: 'json' };
import { validateDeploymentAttestation } from '../lib/deployment-attestation.js';
import { currentDeploymentAttestationEnvelope, deploymentAttestationEtag, immutableDeploymentAttestationEnvelope } from '../lib/deployment-attestation-api.js';
import { deploymentProofForState } from '../lib/deployment-proof.js';
import { currentExtensionReleaseEnvelope, extensionReleaseEtag, immutableExtensionReleaseEnvelope } from '../lib/extension-release-api.js';
import release from '../../releases/extension-v0.2.16.json' with { type: 'json' };
import { addProbeHistory, parseProbeHistory, probeHistoryReceipt, probeHistoryReceiptArtifact, verifyProbeHistoryReceiptDocument, PROBE_HISTORY_LIMIT, PROBE_HISTORY_RECEIPT_SCHEMA } from '../lib/probe-history.js';

test('canonicalizes common YouTube URL forms to one entity', () => {
  const urls = [
    'https://www.youtube.com/watch?v=abc123xyz00&utm_source=test',
    'https://youtu.be/abc123xyz00?t=42',
    'https://www.youtube.com/shorts/abc123xyz00',
    'https://www.youtube.com/embed/abc123xyz00',
  ];
  assert.deepEqual(urls.map((url) => identifyPage(url).entityKey), Array(4).fill('youtube:abc123xyz00'));
});

test('public architecture map is backed by packaged implementation files', () => {
  assert.equal(architecture.schema_version, 'ai-claims.extension-architecture/1.0.0');
  assert.equal(architecture.boundaries.length, 5);
  assert.deepEqual(architecture.boundaries.map((boundary) => boundary.number), ['01', '02', '03', '04', '05']);
  for (const boundary of architecture.boundaries) {
    assert.match(boundary.privacy, /./);
    assert.equal(existsSync(boundary.file), true, `${boundary.file} must exist`);
  }
});

test('compatibility matrix discloses all page kinds and source rules', () => {
  assert.equal(compatibility.schema_version, 'ai-claims.page-compatibility/1.0.0');
  assert.deepEqual(compatibility.surfaces.map((surface) => surface.kind), ['youtube', 'goodreads', 'web']);
  for (const surface of compatibility.surfaces) {
    assert.equal(surface.resolver, 'Public canonical-key lookup');
    assert.match(surface.acquisition, /./);
    assert.match(surface.evidence_destination, /^\/claims\//);
    assert.match(surface.proof, /synthetic/i);
    assert.match(surface.proof_entity_key, /^(youtube|goodreads|web):/);
    assert.equal(Number.isInteger(surface.proof_score), true);
    assert.match(surface.proof_route, /^\/(episode|book|web)$/);
  }
  assert.equal(compatibility.surfaces[0].proof_level, 'end_to_end');
});

test('deployment attestation is intact, privacy-safe, and manifest-complete', () => {
  assert.deepEqual(validateDeploymentAttestation(attestation, compatibility), []);
  const { integrity, ...payload } = attestation;
  assert.equal(integrity.algorithm, 'SHA-256');
  assert.equal(integrity.digest_scope, 'attestation_without_integrity');
  assert.equal(createHash('sha256').update(JSON.stringify(payload)).digest('hex'), integrity.digest_hex);
  assert.equal(attestation.privacy.visitor_data_collected, false);
  assert.deepEqual(attestation.privacy.retained_visitor_fields, []);
});

test('deployment attestation API exposes a revalidating pointer and immutable digest record', () => {
  const digest = attestation.integrity.digest_hex;
  const immutableUrl = `https://ai.rhyslindmark.com/claims/api/v1/deployment-attestations/${digest}`;
  const current = currentDeploymentAttestationEnvelope(attestation, immutableUrl);
  assert.equal(current.contract_version, '1.0.0');
  assert.equal(current.current_digest, digest);
  assert.equal(current.immutable_url, immutableUrl);
  assert.equal(deploymentAttestationEtag(attestation), `"sha256-${digest}"`);
  assert.equal(immutableDeploymentAttestationEnvelope(attestation, digest).attestation.integrity.digest_hex, digest);
  assert.equal(immutableDeploymentAttestationEnvelope(attestation, '0'.repeat(64)).attestation, null);
});

test('extension release API exposes a revalidating pointer and immutable version record', () => {
  const immutableUrl = `https://ai.rhyslindmark.com/claims/api/v1/extension-releases/${release.extension_version}`;
  const current = currentExtensionReleaseEnvelope(release, immutableUrl);
  assert.equal(extensionReleaseEtag(release), `"sha256-${release.package.integrity.digest_hex}"`);
  assert.equal(current.current_version, release.extension_version);
  assert.equal(current.immutable_url, immutableUrl);
  assert.match(current.package_url, /ai-claims-extension-v0\.2\.16\.zip$/);
  assert.equal(current.release.privacy.installation_telemetry_collected, false);
  assert.equal(immutableExtensionReleaseEnvelope(release, release.extension_version).release.extension_version, release.extension_version);
  assert.equal(immutableExtensionReleaseEnvelope(release, '9.9.9').release, null);
});

test('synthetic YouTube page resolves through the reviewed gate to its episode route', () => {
  const identity = identifyPage(syntheticEpisode.canonical_url);
  const state = resolveAnalysis(registry, identity.entityKey);
  assert.equal(identity.entityKey, syntheticEpisode.entity_key);
  assert.equal(state.state, 'published');
  assert.equal(state.score, 75);
  assert.match(state.analysisUrl, /\/claims\/episode\?entity_key=youtube%3Aai-claims-synthetic-001$/);
});

test('synthetic episode packet is internally linked and score-reproducible', () => {
  assert.deepEqual(validateSyntheticEpisodeFixture(syntheticEpisode), []);
  assert.equal(syntheticEpisodeScore(syntheticEpisode), 75);
  assert.match(syntheticEpisode.fixture_notice, /no real episode/i);
  assert.equal(syntheticEpisode.claims.length, 4);
});

test('synthetic Goodreads page resolves through the reviewed gate to its book route', async () => {
  const identity = identifyPage(syntheticBook.canonical_url);
  const analysis = registry.analyses.find((entry) => entry.entity_key === syntheticBook.entity_key);
  const result = await probeResolverUrl(syntheticBook.canonical_url, { fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ contract_version: '1.0.0', entity_key: syntheticBook.entity_key, analysis }) }) });
  assert.equal(identity.entityKey, syntheticBook.entity_key);
  assert.equal(result.state, 'reviewed');
  assert.equal(result.score, 75);
  assert.match(result.analysisUrl, /\/claims\/book\?entity_key=goodreads%3A999999999999$/);
});

test('synthetic book packet is internally linked and score-reproducible', () => {
  assert.deepEqual(validateSyntheticBookFixture(syntheticBook), []);
  assert.equal(syntheticBookScore(syntheticBook), 75);
  assert.match(syntheticBook.fixture_notice, /no real book/i);
  assert.equal(syntheticBook.claims.length, 4);
});

test('synthetic generic page resolves through the reviewed gate to its web route', async () => {
  const identity = identifyPage(`${syntheticWeb.canonical_url}?utm_source=fixture`);
  const analysis = registry.analyses.find((entry) => entry.entity_key === syntheticWeb.entity_key);
  const result = await probeResolverUrl(`${syntheticWeb.canonical_url}?utm_source=fixture`, { fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ contract_version: '1.0.0', entity_key: syntheticWeb.entity_key, analysis }) }) });
  assert.equal(identity.entityKey, syntheticWeb.entity_key);
  assert.equal(result.state, 'reviewed');
  assert.equal(result.score, 50);
  assert.match(result.analysisUrl, /\/claims\/web\?entity_key=web%3Aexample.invalid%2Fai-claims-synthetic-page$/);
});

test('synthetic web packet is internally linked and score-reproducible', () => {
  assert.deepEqual(validateSyntheticWebFixture(syntheticWeb), []);
  assert.equal(syntheticWebScore(syntheticWeb), 50);
  assert.match(syntheticWeb.fixture_notice, /no real site/i);
  assert.equal(syntheticWeb.claims.length, 4);
});

test('resolver probe publishes only complete reviewed YouTube analyses', async () => {
  let requestedUrl;
  const analysis = registry.analyses.find((entry) => entry.entity_key === syntheticEpisode.entity_key);
  const result = await probeResolverUrl(syntheticEpisode.canonical_url, { endpoint: 'https://api.example.invalid/', fetchImpl: async (url) => { requestedUrl = url; return { ok: true, status: 200, json: async () => ({ contract_version: '1.0.0', entity_key: syntheticEpisode.entity_key, analysis }) }; } });
  assert.equal(requestedUrl.searchParams.get('entity_key'), syntheticEpisode.entity_key);
  assert.equal(result.state, 'reviewed');
  assert.equal(result.score, 75);
  assert.equal(result.analysisUrl, analysis.analysis_url);

  const pendingAnalysis = { ...analysis, reviewed_claims: 3, score_0_100: 99 };
  const pending = await probeResolverUrl(syntheticEpisode.canonical_url, { fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ contract_version: '1.0.0', entity_key: syntheticEpisode.entity_key, analysis: pendingAnalysis }) }) });
  assert.equal(pending.state, 'pending');
  assert.equal(Object.hasOwn(pending, 'score'), false);
});

test('resolver probe gives source-specific next actions for missing entities', async () => {
  const missing = await probeResolverUrl('https://youtu.be/unreviewed-demo-001', { fetchImpl: async () => ({ ok: false, status: 404 }) });
  assert.equal(missing.state, 'not_analyzed');
  assert.match(missing.nextAction.url, /\/claims\/intake\?url=/);
  const book = await probeResolverUrl('https://www.goodreads.com/book/show/12345.Some_Book', { fetchImpl: async () => ({ ok: false, status: 404 }) });
  assert.equal(book.identity.entityKey, 'goodreads:12345');
  assert.match(book.nextAction.url, /\/claims\/book-intake\?url=/);
  const page = await probeResolverUrl('https://example.com/article?utm_source=test', { fetchImpl: async () => ({ ok: false, status: 404 }) });
  assert.equal(page.identity.entityKey, 'web:example.com/article');
  assert.match(page.nextAction.url, /\/claims\/analysis\?entity_key=/);
});

test('resolver probe rejects unsupported page protocols without a request', async () => {
  let called = false;
  const invalid = await probeResolverUrl('chrome://extensions', { fetchImpl: async () => { called = true; } });
  assert.equal(invalid.state, 'invalid');
  assert.equal(called, false);
});

test('resolver probe history keeps five identity-free local outcomes', () => {
  const secret = { entityKey: 'youtube:private-video', canonicalUrl: 'https://youtube.com/watch?v=private-video', title: 'Private title' };
  let history = [];
  for (const state of ['reviewed', 'pending', 'not_analyzed', 'error', 'reviewed', 'pending']) {
    history = addProbeHistory(history, { state, identity: { ...secret, kind: state === 'error' ? 'web' : 'youtube' } });
  }
  assert.equal(history.length, PROBE_HISTORY_LIMIT);
  assert.deepEqual(history[0], { state: 'pending', kind: 'youtube' });
  const serialized = JSON.stringify(history);
  assert.doesNotMatch(serialized, /private-video|Private title|canonicalUrl|entityKey|score/i);
  assert.deepEqual(parseProbeHistory('{bad json'), []);
  assert.deepEqual(parseProbeHistory('[{"state":"reviewed","kind":"youtube","url":"secret"}]'), [{ state: 'reviewed', kind: 'youtube' }]);
});

test('resolver probe history receipt discloses its narrow local schema', () => {
  const receipt = probeHistoryReceipt([{ state: 'reviewed', kind: 'goodreads', url: 'secret', score: 100 }]);
  assert.equal(receipt.schema_version, PROBE_HISTORY_RECEIPT_SCHEMA);
  assert.equal(receipt.storage_scope, 'browser-local');
  assert.equal(receipt.identity_fields_retained, false);
  assert.deepEqual(receipt.retained_fields, ['kind', 'state']);
  assert.deepEqual(receipt.entries, [{ state: 'reviewed', kind: 'goodreads' }]);
  assert.doesNotMatch(JSON.stringify(receipt), /secret|score|url/i);
});

test('resolver history receipt verifier rejects altered and overbroad documents locally', async () => {
  const artifact = await probeHistoryReceiptArtifact([{ state: 'reviewed', kind: 'youtube' }]);
  assert.equal((await verifyProbeHistoryReceiptDocument(artifact.content)).state, 'valid');
  const altered = JSON.parse(artifact.content);
  altered.entries[0].state = 'pending';
  assert.equal((await verifyProbeHistoryReceiptDocument(JSON.stringify(altered))).state, 'altered');
  const overbroad = JSON.parse(artifact.content);
  overbroad.entries[0].url = 'https://example.com/private';
  assert.equal((await verifyProbeHistoryReceiptDocument(JSON.stringify(overbroad))).state, 'overbroad');
  assert.equal((await verifyProbeHistoryReceiptDocument('{bad')).state, 'invalid');
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
  assert.equal(state.analysisVersionId, 'analysis-demo-v4');
  assert.equal(state.resumedFromVersionId, 'analysis-demo-v3');
});

test('paused analysis versions suppress otherwise complete scores', () => {
  const state = resolveAnalysis(registry, 'web:example.invalid/paused-fixture');
  assert.equal(state.state, 'paused');
  assert.equal(state.analysisVersionId, 'analysis-paused-v2');
  assert.equal(Object.hasOwn(state, 'score'), false);
  assert.match(state.reason, /calibration drift/);
});

test('correction links distinguish paused, resumed, and superseded transitions', () => {
  const url = 'https://ai.rhyslindmark.com/claims#correction-event-fixture';
  assert.deepEqual(correctionLinkForState({ state: 'paused', latestCorrectionUrl: url }), { url, label: 'Open latest pause transition' });
  assert.deepEqual(correctionLinkForState({ state: 'published', resumedFromVersionId: 'analysis-v3', latestCorrectionUrl: url }), { url, label: 'Open latest resumption transition' });
  assert.deepEqual(correctionLinkForState({ state: 'published', supersededVersionIds: ['analysis-v1'], latestCorrectionUrl: url }), { url, label: 'Open latest correction transition' });
  assert.equal(correctionLinkForState({ state: 'pending' }), null);
});

test('score state propagates correction pointers without adding a paused score', () => {
  const latestCorrectionUrl = 'https://ai.rhyslindmark.com/claims#correction-event-paused-001';
  const pausedFixture = registry.analyses.find((analysis) => analysis.entity_key === 'web:example.invalid/paused-fixture');
  const state = scoreState({ ...pausedFixture, latest_correction_event_id: 'correction-event-paused-001', latest_correction_url: latestCorrectionUrl, correction_feed_api_url: 'https://ai.rhyslindmark.com/claims/api/v1/analyses/corrections' });
  assert.equal(state.latestCorrectionEventId, 'correction-event-paused-001');
  assert.equal(state.latestCorrectionUrl, latestCorrectionUrl);
  assert.equal(Object.hasOwn(state, 'score'), false);
});

test('correction previews are compact and escaped before side-panel rendering', () => {
  const preview = correctionPreviewForState({ latestCorrectionEventId: 'event-1', latestCorrectionFromVersionId: 'v1', latestCorrectionToVersionId: 'v2', latestCorrectionSummary: 'A concise change.' });
  assert.deepEqual(preview, { lineage: 'v1 → v2', summary: 'A concise change.' });
  assert.equal(escapeHtml('<img src=x onerror="bad">'), '&lt;img src=x onerror=&quot;bad&quot;&gt;');
  assert.equal(correctionPreviewForState({}), null);
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
  const analysis = registry.analyses.find((entry) => entry.entity_key === 'web:example.invalid/reviewed-fixture');
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

test('resolver advertises a supported privacy-safe deployment attestation', async () => {
  const analysis = registry.analyses.find((entry) => entry.entity_key === syntheticWeb.entity_key);
  const discovery = { contract_version: '1.0.0', current_digest: attestation.integrity.digest_hex, current_url: 'https://ai.rhyslindmark.com/claims/api/v1/deployment-attestations', immutable_url: `https://ai.rhyslindmark.com/claims/api/v1/deployment-attestations/${attestation.integrity.digest_hex}`, verified_at: attestation.verified_at, visitor_data_collected: false };
  const resolver = createApiResolver({ endpoint: 'https://api.example.invalid', fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ contract_version: '1.0.0', entity_key: analysis.entity_key, deployment_attestation_discovery: discovery, analysis }) }) });
  const state = await resolver.resolve(analysis.entity_key);
  assert.equal(state.deploymentAttestationCompatibility, 'supported');
  assert.equal(state.deploymentAttestationContractVersion, '1.0.0');
  assert.equal(state.deploymentAttestationUrl, discovery.current_url);
  assert.equal(state.deploymentAttestationImmutableUrl, discovery.immutable_url);
  assert.equal(state.deploymentAttestationDigest, discovery.current_digest);
  assert.equal(state.deploymentAttestationVerifiedAt, discovery.verified_at);
  assert.equal(state.deploymentAttestationVisitorDataCollected, false);
  assert.deepEqual(deploymentProofForState(state), { url: discovery.immutable_url, verifiedAt: discovery.verified_at, digestLabel: `SHA-256 ${discovery.current_digest.slice(0, 12)}…`, privacyLabel: 'No visitor data collected' });
  assert.equal(deploymentProofForState({ ...state, deploymentAttestationCompatibility: 'unsupported' }), null);
  assert.equal(deploymentProofForState({ ...state, deploymentAttestationVisitorDataCollected: true }), null);
  assert.deepEqual(deploymentAttestationCompatibility({ contract_version: '9.0.0' }), { state: 'unsupported', contractVersion: '9.0.0' });
});

test('API resolver opts into browser HTTP-cache revalidation', async () => {
  let requestOptions;
  const analysis = registry.analyses.find((entry) => entry.entity_key === 'web:example.invalid/reviewed-fixture');
  const resolver = createApiResolver({
    endpoint: 'https://api.example.invalid',
    fetchImpl: async (_url, options) => {
      requestOptions = options;
      return { ok: true, status: 200, json: async () => ({ contract_version: '1.0.0', entity_key: analysis.entity_key, analysis }) };
    },
  });
  await resolver.resolve(analysis.entity_key);
  assert.equal(requestOptions.cache, 'default');
  assert.equal(requestOptions.headers['x-ai-claims-correction-feed-accept'], '1.0.0, 1.1.0');
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

  const entityKey = 'web:missing-with-proof.invalid';
  const discovery = { contract_version: '1.0.0', current_digest: attestation.integrity.digest_hex, current_url: 'https://ai.rhyslindmark.com/claims/api/v1/deployment-attestations', immutable_url: `https://ai.rhyslindmark.com/claims/api/v1/deployment-attestations/${attestation.integrity.digest_hex}`, verified_at: attestation.verified_at, visitor_data_collected: false };
  const discoveredMissing = createApiResolver({ endpoint: 'https://api.example.invalid', fetchImpl: async () => ({ ok: false, status: 404, json: async () => ({ contract_version: '1.0.0', entity_key: entityKey, correction_feed_discovery: { contract_version: '1.1.0' }, deployment_attestation_discovery: discovery, analysis: null }) }) });
  const missingState = await discoveredMissing.resolve(entityKey);
  assert.equal(missingState.state, 'not_analyzed');
  assert.equal(missingState.deploymentAttestationCompatibility, 'supported');
  assert.equal(deploymentProofForState(missingState)?.url, discovery.immutable_url);

  const incompatible = createApiResolver({ endpoint: 'https://api.example.invalid', fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ contract_version: '2.0.0', entity_key: 'web:x', analysis: null }) }) });
  await assert.rejects(incompatible.resolve('web:x'), /Unsupported resolver contract/);
});

test('resolver keeps scores but removes correction pointers for newer unsupported feed contracts', async () => {
  const analysis = { ...registry.analyses.find((entry) => entry.entity_key === 'web:example.invalid/reviewed-fixture'), latest_correction_summary: 'Fixture transition.', latest_correction_url: 'https://ai.rhyslindmark.com/claims#event' };
  const resolver = createApiResolver({
    endpoint: 'https://api.example.invalid',
    fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ contract_version: '1.0.0', entity_key: analysis.entity_key, correction_feed_discovery: { contract_version: '9.0.0' }, analysis }) }),
  });
  const state = await resolver.resolve(analysis.entity_key);
  assert.equal(state.state, 'published');
  assert.equal(state.score, 84);
  assert.equal(state.correctionFeedCompatibility, 'unsupported');
  assert.equal(state.latestCorrectionUrl, null);
  assert.deepEqual(correctionFeedCompatibility({ contract_version: '1.1.0' }), { state: 'supported', contractVersion: '1.1.0' });
});

function memoryStorage() {
  const values = {};
  return {
    get: async (key) => ({ [key]: values[key] }),
    set: async (updates) => Object.assign(values, updates),
    remove: async (key) => { delete values[key]; },
  };
}

test('automatic checking requires an explicit local origin opt-in', async () => {
  const store = createOriginOptInStore({ storageArea: memoryStorage() });
  assert.equal(await store.has('https://ai.rhyslindmark.com'), false);
  await store.grant('https://ai.rhyslindmark.com');
  assert.equal(await store.has('https://ai.rhyslindmark.com'), true);
  await store.revoke('https://ai.rhyslindmark.com');
  assert.equal(await store.has('https://ai.rhyslindmark.com'), false);
});

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

test('negotiation telemetry stores daily outcome aggregates without page identity', async () => {
  const values = {};
  const storageArea = { get: async (key) => ({ [key]: values[key] }), set: async (updates) => Object.assign(values, updates) };
  const store = createMetricsStore({ storageArea, now: () => '2026-08-30T12:34:56.000Z' });
  await store.recordNegotiation('supported_1_1');
  await store.recordNegotiation('supported_1_1');
  await store.recordNegotiation('legacy_1_0');
  const serialized = JSON.stringify(values);
  assert.equal(serialized.includes('entity'), false);
  assert.equal(serialized.includes('url'), false);
  assert.equal(serialized.includes('title'), false);
  assert.equal(serialized.includes('12:34:56'), false);
  assert.deepEqual((await store.negotiationSummary(7)).counts, { supported_1_1: 2, legacy_1_0: 1, unsupported: 0, not_advertised: 0 });
  await assert.rejects(store.recordNegotiation('page-specific'), /Unknown negotiation outcome/);
});

test('privacy receipt is machine-readable and negotiation reset preserves unrelated metrics', async () => {
  const storage = memoryStorage();
  const store = createMetricsStore({ storageArea: storage, now: () => '2026-08-30T12:34:56.000Z', extensionVersion: manifest.version });
  await store.record('page_checked', { kind: 'web' });
  await store.recordNegotiation('supported_1_1');
  const initialReceipt = await store.privacyReceipt();
  assert.deepEqual(initialReceipt, {
    schema_version: '1.0.0',
    storage_scope: 'chrome.storage.local',
    transmitted: false,
    retention_days: 30,
    retained_fields: ['date', 'outcome_count'],
    prohibited_fields: ['url', 'entity_key', 'title', 'page_kind', 'per_check_timestamp'],
    generator: { product: 'ai-claims-extension', extension_version: manifest.version },
    last_reset_at: null,
  });
  const resetReceipt = await store.resetNegotiations();
  assert.equal(resetReceipt.last_reset_at, '2026-08-30T12:34:56.000Z');
  assert.deepEqual((await store.negotiationSummary(7)).counts, { supported_1_1: 0, legacy_1_0: 0, unsupported: 0, not_advertised: 0 });
  assert.equal((await store.summary(7)).counts.page_checked, 1);
  const serialized = JSON.stringify(await store.privacyReceipt());
  assert.equal(serialized.includes('https://'), false);
  assert.equal(serialized.includes('entity_key'), true);
  assert.equal((await store.privacyReceipt()).transmitted, false);
});

test('privacy receipt export is deterministic and needs no download permission', async () => {
  const receipt = {
    schema_version: '1.0.0',
    storage_scope: 'chrome.storage.local',
    transmitted: false,
    retention_days: 30,
    retained_fields: ['date', 'outcome_count'],
    prohibited_fields: ['url'],
    last_reset_at: '2026-08-30T12:34:56.000Z',
  };
  const download = await privacyReceiptArtifact(receipt);
  assert.equal(download.filename, 'ai-claims-privacy-receipt-2026-08-30.json');
  assert.equal(download.mimeType, 'application/json');
  const document = JSON.parse(download.content);
  assert.equal(document.integrity.digest_hex, download.digestHex);
  assert.equal(document.integrity.algorithm, 'SHA-256');
  assert.equal(document.integrity.canonicalization, 'recursive-key-sort-json-utf8');
  assert.equal(download.digestHex.length, 64);
  assert.equal(canonicalPrivacyReceipt({ b: 2, a: 1 }), '{"a":1,"b":2}');
  assert.equal(manifest.permissions.includes('downloads'), false);
  assert.equal(manifest.host_permissions.length, 1);
});

test('privacy receipt verifier distinguishes valid, altered, unsupported, and invalid documents', async () => {
  const receipt = { schema_version: '1.0.0', storage_scope: 'chrome.storage.local', transmitted: false, retention_days: 30, last_reset_at: null };
  const artifact = await privacyReceiptArtifact(receipt);
  assert.equal((await verifyPrivacyReceiptDocument(artifact.content)).state, 'valid');
  const altered = JSON.parse(artifact.content);
  altered.retention_days = 365;
  assert.equal((await verifyPrivacyReceiptDocument(JSON.stringify(altered))).state, 'altered');
  const unsupported = JSON.parse(artifact.content);
  unsupported.integrity.canonicalization = 'unknown';
  assert.equal((await verifyPrivacyReceiptDocument(JSON.stringify(unsupported))).state, 'unsupported');
  assert.equal((await verifyPrivacyReceiptDocument('{not json')).state, 'invalid');
});

test('privacy receipt verifier rejects intact but unknown receipt schemas', async () => {
  assert.deepEqual(SUPPORTED_PRIVACY_RECEIPT_SCHEMAS, ['1.0.0']);
  const artifact = await privacyReceiptArtifact({ schema_version: '2.0.0', storage_scope: 'chrome.storage.local', transmitted: false });
  const verification = await verifyPrivacyReceiptDocument(artifact.content);
  assert.equal(verification.state, 'unsupported');
  assert.match(verification.reason, /schema 2\.0\.0/);
  assert.deepEqual(verification.supportedSchemas, ['1.0.0']);
});

test('receipt verification is tied to schema, not generating extension release', async () => {
  const receipt = {
    schema_version: '1.0.0',
    storage_scope: 'chrome.storage.local',
    transmitted: false,
    generator: { product: 'ai-claims-extension', extension_version: '99.88.77' },
    last_reset_at: null,
  };
  const artifact = await privacyReceiptArtifact(receipt);
  const verification = await verifyPrivacyReceiptDocument(artifact.content);
  assert.equal(verification.state, 'valid');
  assert.equal(JSON.parse(artifact.content).generator.extension_version, '99.88.77');
});
