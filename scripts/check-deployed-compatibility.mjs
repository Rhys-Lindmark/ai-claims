import assert from 'node:assert/strict';
import compatibility from '../extension/data/compatibility.json' with { type: 'json' };

const claimsBase = (process.argv[2] ?? 'https://ai.rhyslindmark.com/claims').replace(/\/$/, '');
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
  console.log(`${surface.kind}: ${surface.proof_score}/100 -> ${expectedRoute}`);
}
