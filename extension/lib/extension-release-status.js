function semverParts(version) {
  if (!/^\d+\.\d+\.\d+$/.test(version ?? '')) return null;
  return version.split('.').map(Number);
}

export function extensionReleaseStatusForState(state, installedVersion) {
  if (state.extensionReleaseCompatibility !== 'supported' || state.extensionReleaseInstallationTelemetryCollected !== false) return null;
  const installed = semverParts(installedVersion);
  const advertised = semverParts(state.extensionReleaseVersion);
  if (!installed || !advertised || !/^[0-9a-f]{64}$/.test(state.extensionReleasePackageDigest ?? '')) return null;
  let packageUrl;
  try {
    packageUrl = new URL(state.extensionReleasePackageUrl);
  } catch {
    return null;
  }
  if (packageUrl.protocol !== 'https:' || packageUrl.hostname !== 'github.com') return null;
  const comparison = advertised.findIndex((part, index) => part !== installed[index]);
  const stateName = comparison === -1 ? 'current' : advertised[comparison] > installed[comparison] ? 'update_available' : 'development_ahead';
  const minimumSupported = semverParts(state.extensionReleaseMinimumSupportedVersion);
  if (!minimumSupported || state.extensionReleaseAutomaticInstallOrUpdate !== false || state.extensionReleaseUpdateCheckIdentityCollected !== false) return null;
  return { state: stateName, installedVersion, currentVersion: state.extensionReleaseVersion, packageUrl: packageUrl.href, digestLabel: `SHA-256 ${state.extensionReleasePackageDigest.slice(0, 12)}…`, privacyLabel: 'No installation or update-check identity telemetry', channelLabel: `${state.extensionReleaseChannel} channel · minimum ${state.extensionReleaseMinimumSupportedVersion}`, signingLabel: state.extensionReleasePublisherSigned ? 'Publisher signed' : 'Not publisher signed · manual update only' };
}
