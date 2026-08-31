import assert from 'node:assert/strict';

const claimsBase = (process.argv[2] ?? 'https://ai.rhyslindmark.com/claims').replace(/\/$/, '');
const entityKey = 'youtube:ai-claims-synthetic-001';
const resolverUrl = `${claimsBase}/api/v1/analyses/resolve?entity_key=${encodeURIComponent(entityKey)}`;
const resolverResponse = await fetch(resolverUrl, { headers: { 'x-ai-claims-correction-feed-accept': '1.0.0, 1.1.0' } });
assert.equal(resolverResponse.status, 200, `Resolver returned ${resolverResponse.status}.`);
const envelope = await resolverResponse.json();
assert.equal(envelope.contract_version, '1.0.0');
assert.equal(envelope.entity_key, entityKey);
assert.equal(envelope.analysis?.publication_state, 'active');
assert.equal(envelope.analysis?.score_0_100, 75);
assert.equal(envelope.analysis?.reviewed_claims, envelope.analysis?.eligible_claims);
assert.equal(envelope.analysis?.unresolved_claims, 0);
assert.equal(envelope.analysis?.analysis_url, `${claimsBase}/episode?entity_key=${encodeURIComponent(entityKey)}`);

const episodeResponse = await fetch(envelope.analysis.analysis_url);
assert.equal(episodeResponse.status, 200, `Episode route returned ${episodeResponse.status}.`);
const episodeHtml = await episodeResponse.text();
assert.match(episodeHtml, /Synthetic end-to-end fixture/);
assert.match(episodeHtml, /synthetic end-to-end YouTube entity, resolver, publication-gate, and evidence-route fixture/i);
console.log(`Deployed YouTube fixture passed: ${resolverUrl} -> ${envelope.analysis.analysis_url}`);
