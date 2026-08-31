import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import compatibility from '../extension/data/compatibility.json' with { type: 'json' };

const claimsBase = (process.argv[2] ?? 'https://ai.rhyslindmark.com/claims').replace(/\/$/, '');
const results = [];
for (const surface of compatibility.surfaces.filter((entry) => entry.proof_level === 'end_to_end')) {
  const resolverUrl = `${claimsBase}/api/v1/analyses/resolve?entity_key=${encodeURIComponent(surface.proof_entity_key)}`;
  const response = await fetch(resolverUrl, { headers: { 'x-ai-claims-correction-feed-accept': '1.0.0, 1.1.0' } });
  assert.equal(response.status, 200, `${surface.kind} resolver returned ${response.status}.`);
  const envelope = await response.json();
  assert.equal(envelope.contract_version, '1.0.0');
  assert.equal(envelope.entity_key, surface.proof_entity_key);
  assert.equal(envelope.analysis?.publication_state, 'active');
  assert.equal(envelope.analysis?.score_0_100, surface.proof_score);
  assert.equal(envelope.analysis?.reviewed_claims, envelope.analysis?.eligible_claims);
  assert.equal(envelope.analysis?.unresolved_claims, 0);
  const expectedRoute = `${claimsBase}${surface.proof_route}?entity_key=${encodeURIComponent(surface.proof_entity_key)}`;
  assert.equal(envelope.analysis?.analysis_url, expectedRoute);
  const routeResponse = await fetch(expectedRoute);
  assert.equal(routeResponse.status, 200, `${surface.kind} evidence route returned ${routeResponse.status}.`);
  assert.match(await routeResponse.text(), /Synthetic end-to-end fixture/);
  results.push({ kind: surface.kind, entity_key: surface.proof_entity_key, expected_score: surface.proof_score, observed_score: envelope.analysis.score_0_100, reviewed_claims: envelope.analysis.reviewed_claims, eligible_claims: envelope.analysis.eligible_claims, unresolved_claims: envelope.analysis.unresolved_claims, resolver_status: response.status, route_status: routeResponse.status, evidence_url: expectedRoute, verified: true });
  console.log(`${surface.kind}: ${surface.proof_score}/100 -> ${expectedRoute}`);
}

const attestationPath = process.env.AI_CLAIMS_ATTESTATION_PATH;
if (attestationPath) {
  assert.match(process.env.AI_CLAIMS_COMMIT_SHA ?? '', /^[0-9a-f]{40}$/, 'AI_CLAIMS_COMMIT_SHA must be the exact deployed commit.');
  assert.match(process.env.AI_CLAIMS_SITE_VERSION ?? '', /^\d+$/, 'AI_CLAIMS_SITE_VERSION must be the deployed Sites version.');
  const payload = {
    schema_version: 'ai-claims.deployment-attestation/1.0.0',
    verified_at: new Date().toISOString(),
    claims_base: claimsBase,
    tested_site_version: Number(process.env.AI_CLAIMS_SITE_VERSION),
    tested_commit_sha: process.env.AI_CLAIMS_COMMIT_SHA,
    verifier: 'scripts/check-deployed-compatibility.mjs',
    verification_command: 'npm run test:deployed-compatibility',
    privacy: { visitor_data_collected: false, retained_visitor_fields: [], request_scope: 'published synthetic fixture entity keys only' },
    all_passed: results.every((result) => result.verified),
    results,
  };
  const digest = createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  const attestation = { ...payload, integrity: { algorithm: 'SHA-256', digest_scope: 'attestation_without_integrity', digest_hex: digest } };
  writeFileSync(attestationPath, `${JSON.stringify(attestation, null, 2)}\n`);
  console.log(`Attestation: ${attestationPath} (${digest})`);
}
