export const DEPLOYMENT_ATTESTATION_CONTRACT = '1.0.0';

export function deploymentAttestationEtag(attestation) {
  return `"sha256-${attestation.integrity.digest_hex}"`;
}

export function currentDeploymentAttestationEnvelope(attestation, immutableUrl) {
  return { contract_version: DEPLOYMENT_ATTESTATION_CONTRACT, current_digest: attestation.integrity.digest_hex, immutable_url: immutableUrl, attestation };
}

export function immutableDeploymentAttestationEnvelope(attestation, requestedDigest) {
  return { contract_version: DEPLOYMENT_ATTESTATION_CONTRACT, requested_digest: requestedDigest, attestation: requestedDigest === attestation.integrity.digest_hex ? attestation : null };
}
