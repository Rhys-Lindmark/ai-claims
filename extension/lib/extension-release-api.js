export const EXTENSION_RELEASE_CONTRACT = '1.0.0';

export function extensionReleaseEtag(release) {
  return `"sha256-${release.package.integrity.digest_hex}"`;
}

export function releaseDownloadUrls(version) {
  const base = `https://github.com/Rhys-Lindmark/ai-claims/releases/download/v${version}`;
  return { package_url: `${base}/ai-claims-extension-v${version}.zip`, manifest_url: `${base}/extension-v${version}.json` };
}

export function currentExtensionReleaseEnvelope(release, immutableUrl) {
  return { contract_version: EXTENSION_RELEASE_CONTRACT, current_version: release.extension_version, immutable_url: immutableUrl, ...releaseDownloadUrls(release.extension_version), release };
}

export function immutableExtensionReleaseEnvelope(release, requestedVersion) {
  return { contract_version: EXTENSION_RELEASE_CONTRACT, requested_version: requestedVersion, ...releaseDownloadUrls(requestedVersion), release: requestedVersion === release.extension_version ? release : null };
}
