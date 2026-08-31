export function deploymentProofForState(state) {
  if (state.deploymentAttestationCompatibility !== 'supported' || state.deploymentAttestationVisitorDataCollected !== false) return null;
  if (!/^[0-9a-f]{64}$/.test(state.deploymentAttestationDigest ?? '')) return null;
  const verifiedAt = new Date(state.deploymentAttestationVerifiedAt ?? '');
  if (Number.isNaN(verifiedAt.getTime())) return null;
  let immutableUrl;
  try {
    immutableUrl = new URL(state.deploymentAttestationImmutableUrl);
  } catch {
    return null;
  }
  if (immutableUrl.protocol !== 'https:' || !immutableUrl.pathname.endsWith(`/${state.deploymentAttestationDigest}`)) return null;
  return {
    url: immutableUrl.href,
    verifiedAt: verifiedAt.toISOString(),
    digestLabel: `SHA-256 ${state.deploymentAttestationDigest.slice(0, 12)}…`,
    privacyLabel: 'No visitor data collected',
  };
}
