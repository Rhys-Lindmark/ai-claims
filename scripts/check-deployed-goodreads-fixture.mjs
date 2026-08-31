import assert from 'node:assert/strict';

const claimsBase = (process.argv[2] ?? 'https://ai.rhyslindmark.com/claims').replace(/\/$/, '');
const entityKey = 'goodreads:999999999999';
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
assert.equal(envelope.analysis?.analysis_url, `${claimsBase}/book?entity_key=${encodeURIComponent(entityKey)}`);

const bookResponse = await fetch(envelope.analysis.analysis_url);
assert.equal(bookResponse.status, 200, `Book route returned ${bookResponse.status}.`);
const bookHtml = await bookResponse.text();
assert.match(bookHtml, /Synthetic end-to-end fixture/);
assert.match(bookHtml, /synthetic end-to-end Goodreads identity, publication-gate, and passage-evidence fixture/i);
console.log(`Deployed Goodreads fixture passed: ${resolverUrl} -> ${envelope.analysis.analysis_url}`);
