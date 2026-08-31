import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const claimsBase = (process.argv[2] ?? 'https://ai.rhyslindmark.com/claims').replace(/\/$/, '');
const currentUrl = `${claimsBase}/api/v1/extension-releases`;
const currentResponse = await fetch(currentUrl);
assert.equal(currentResponse.status, 200);
assert.equal(currentResponse.headers.get('access-control-allow-origin'), '*');
assert.match(currentResponse.headers.get('cache-control') ?? '', /max-age=60/);
assert.match(currentResponse.headers.get('cache-control') ?? '', /stale-while-revalidate=300/);
const current = await currentResponse.json();
assert.equal(current.contract_version, '1.0.0');
assert.equal(current.current_version, current.release.extension_version);
assert.equal(current.release.privacy.installation_telemetry_collected, false);
assert.deepEqual(current.release.privacy.retained_installation_fields, []);
const expectedEtag = `"sha256-${current.release.package.integrity.digest_hex}"`;
assert.equal(currentResponse.headers.get('etag')?.replace(/^W\//, ''), expectedEtag);
assert.equal((await fetch(currentUrl, { headers: { 'if-none-match': expectedEtag } })).status, 304);

const immutableResponse = await fetch(current.immutable_url);
assert.equal(immutableResponse.status, 200);
assert.match(immutableResponse.headers.get('cache-control') ?? '', /max-age=31536000/);
assert.match(immutableResponse.headers.get('cache-control') ?? '', /immutable/);
assert.equal(immutableResponse.headers.get('etag')?.replace(/^W\//, ''), expectedEtag);
assert.equal((await immutableResponse.json()).release.extension_version, current.current_version);
assert.equal((await fetch(current.immutable_url, { headers: { 'if-none-match': expectedEtag } })).status, 304);

const [packageResponse, manifestResponse] = await Promise.all([fetch(current.package_url), fetch(current.manifest_url)]);
assert.equal(packageResponse.status, 200);
assert.equal(manifestResponse.status, 200);
const packageBytes = Buffer.from(await packageResponse.arrayBuffer());
assert.equal(packageBytes.byteLength, current.release.package.bytes);
assert.equal(createHash('sha256').update(packageBytes).digest('hex'), current.release.package.integrity.digest_hex);
const publicManifest = await manifestResponse.json();
assert.equal(publicManifest.package.integrity.digest_hex, current.release.package.integrity.digest_hex);
assert.equal(publicManifest.source_commit_sha, current.release.source_commit_sha);

assert.equal((await fetch(`${currentUrl}/9.9.9`)).status, 404);
assert.equal((await fetch(`${currentUrl}/not-a-version`)).status, 400);
console.log(`Extension release API passed: ${current.current_version} · ${packageBytes.byteLength} bytes · ${current.release.package.integrity.digest_hex}`);
