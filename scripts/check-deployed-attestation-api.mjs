import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const claimsBase = (process.argv[2] ?? 'https://ai.rhyslindmark.com/claims').replace(/\/$/, '');
const currentUrl = `${claimsBase}/api/v1/deployment-attestations`;
const currentResponse = await fetch(currentUrl);
assert.equal(currentResponse.status, 200);
assert.equal(currentResponse.headers.get('access-control-allow-origin'), '*');
assert.match(currentResponse.headers.get('cache-control') ?? '', /max-age=60/);
assert.match(currentResponse.headers.get('cache-control') ?? '', /stale-while-revalidate=300/);
const currentEtag = currentResponse.headers.get('etag');
const current = await currentResponse.json();
assert.equal(current.contract_version, '1.0.0');
assert.equal(current.current_digest, current.attestation.integrity.digest_hex);
assert.equal(current.attestation.privacy.visitor_data_collected, false);
assert.deepEqual(current.attestation.privacy.retained_visitor_fields, []);
const { integrity, ...payload } = current.attestation;
assert.equal(createHash('sha256').update(JSON.stringify(payload)).digest('hex'), integrity.digest_hex);
const strongEtag = currentEtag?.replace(/^W\//, '');
assert.equal(strongEtag, `"sha256-${current.current_digest}"`);

const current304 = await fetch(currentUrl, { headers: { 'if-none-match': strongEtag } });
assert.equal(current304.status, 304);
const immutableResponse = await fetch(current.immutable_url);
assert.equal(immutableResponse.status, 200);
assert.equal(immutableResponse.headers.get('access-control-allow-origin'), '*');
assert.match(immutableResponse.headers.get('cache-control') ?? '', /max-age=31536000/);
assert.match(immutableResponse.headers.get('cache-control') ?? '', /immutable/);
assert.equal(immutableResponse.headers.get('etag')?.replace(/^W\//, ''), strongEtag);
assert.equal((await immutableResponse.json()).attestation.integrity.digest_hex, current.current_digest);
const immutable304 = await fetch(current.immutable_url, { headers: { 'if-none-match': strongEtag } });
assert.equal(immutable304.status, 304);

const unknownResponse = await fetch(`${currentUrl}/${'0'.repeat(64)}`);
assert.equal(unknownResponse.status, 404);
assert.equal((await unknownResponse.json()).attestation, null);
const malformedResponse = await fetch(`${currentUrl}/not-a-digest`);
assert.equal(malformedResponse.status, 400);
console.log(`Deployment attestation API passed: ${currentUrl} -> ${current.immutable_url}`);
