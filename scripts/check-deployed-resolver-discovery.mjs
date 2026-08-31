import assert from 'node:assert/strict';
import compatibility from '../extension/data/compatibility.json' with { type: 'json' };

const claimsBase = (process.argv[2] ?? 'https://ai.rhyslindmark.com/claims').replace(/\/$/, '');
const attestationUrl = `${claimsBase}/api/v1/deployment-attestations`;

function stableHash(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function strongEtag(value) {
  return value?.replace(/^W\//, '') ?? null;
}

const pointerResponse = await fetch(attestationUrl);
assert.equal(pointerResponse.status, 200);
const pointer = await pointerResponse.json();
assert.equal(pointer.contract_version, '1.0.0');
assert.equal(pointer.attestation.privacy.visitor_data_collected, false);

const observedEtags = new Set();
for (const surface of compatibility.surfaces.filter((entry) => entry.proof_level === 'end_to_end')) {
  const resolverUrl = `${claimsBase}/api/v1/analyses/resolve?entity_key=${encodeURIComponent(surface.proof_entity_key)}`;
  const response = await fetch(resolverUrl, { headers: { 'x-ai-claims-correction-feed-accept': '1.0.0, 1.1.0' } });
  assert.equal(response.status, 200, `${surface.kind} resolver returned ${response.status}.`);
  assert.equal(response.headers.get('x-ai-claims-deployment-attestation-contract'), '1.0.0');
  const envelope = await response.json();
  const discovery = envelope.deployment_attestation_discovery;
  assert.equal(discovery.contract_version, '1.0.0');
  assert.equal(discovery.current_digest, pointer.current_digest);
  assert.equal(discovery.current_url, attestationUrl);
  assert.equal(discovery.immutable_url, pointer.immutable_url);
  assert.equal(discovery.verified_at, pointer.attestation.verified_at);
  assert.equal(discovery.visitor_data_collected, false);

  const revision = envelope.requested_version_id ?? envelope.analysis?.analysis_version_id ?? 'missing';
  assert.equal(envelope.extension_release_discovery.contract_version, '1.0.0');
  assert.equal(envelope.extension_release_discovery.installation_telemetry_collected, false);
  const expectedEtag = `"claims-${stableHash(`${envelope.analysis_schema_version}:${envelope.correction_feed_discovery.contract_version ?? 'none'}:${discovery.current_digest}:${envelope.extension_release_discovery.package_digest}:${envelope.entity_key}:${revision}`)}"`;
  assert.equal(strongEtag(response.headers.get('etag')), expectedEtag, `${surface.kind} ETag must include the attestation digest.`);
  observedEtags.add(expectedEtag);
  const cached = await fetch(resolverUrl, { headers: { 'if-none-match': expectedEtag, 'x-ai-claims-correction-feed-accept': '1.0.0, 1.1.0' } });
  assert.equal(cached.status, 304, `${surface.kind} resolver did not honor its digest-linked ETag.`);
  console.log(`${surface.kind}: attestation ${discovery.current_digest.slice(0, 12)}… -> ${expectedEtag}`);
}

assert.equal(observedEtags.size, 3, 'Each proof entity must retain an entity-specific resolver ETag.');
const immutableResponse = await fetch(pointer.immutable_url);
assert.equal(immutableResponse.status, 200);
assert.equal((await immutableResponse.json()).attestation.integrity.digest_hex, pointer.current_digest);
console.log(`Resolver discovery passed for three proof entities: ${attestationUrl}`);
