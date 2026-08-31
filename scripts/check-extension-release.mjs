import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import extensionManifest from '../extension/manifest.json' with { type: 'json' };
import attestation from '../extension/data/deployment-attestation.json' with { type: 'json' };
import release from '../releases/extension-v0.2.20.json' with { type: 'json' };
import { RESOLVER_CONTRACT_VERSION } from '../extension/lib/analysis-resolver.js';

assert.equal(release.schema_version, 'ai-claims.extension-release/1.0.0');
assert.equal(release.extension_version, extensionManifest.version);
assert.equal(release.manifest_version, extensionManifest.manifest_version);
assert.equal(release.contracts.resolver, RESOLVER_CONTRACT_VERSION);
assert.equal(release.contracts.analysis_request, '1.0.0');
assert.equal(release.contracts.deployment_attestation, '1.0.0');
assert.equal(release.contracts.deployment_attestation_digest, attestation.integrity.digest_hex);
assert.equal(release.privacy.installation_telemetry_collected, false);
assert.deepEqual(release.privacy.retained_installation_fields, []);
assert.match(release.source_commit_sha, /^[0-9a-f]{40}$/);
execFileSync('git', ['cat-file', '-e', `${release.source_commit_sha}^{commit}`]);
const changedPackagedFiles = execFileSync('git', ['diff', '--name-only', release.source_commit_sha, '--', 'extension'], { encoding: 'utf8' }).trim().split('\n').filter((path) => path && !path.startsWith('extension/test/') && path !== 'extension/README.md');
assert.deepEqual(changedPackagedFiles, [], 'Packaged extension source changed after the declared release commit.');

const temporaryDirectory = mkdtempSync(join(tmpdir(), 'ai-claims-release-'));
const archivePath = join(temporaryDirectory, release.package.filename);
try {
  execFileSync('sh', ['scripts/package-extension.sh', '.', archivePath], { stdio: 'ignore' });
  const archive = readFileSync(archivePath);
  assert.equal(statSync(archivePath).size, release.package.bytes);
  assert.equal(createHash('sha256').update(archive).digest('hex'), release.package.integrity.digest_hex);
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}

console.log(`Extension release ${release.extension_version} passed: ${release.package.integrity.digest_hex}`);
