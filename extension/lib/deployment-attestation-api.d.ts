export const DEPLOYMENT_ATTESTATION_CONTRACT: '1.0.0';
export function deploymentAttestationEtag(attestation: { integrity: { digest_hex: string } }): string;
export function currentDeploymentAttestationEnvelope<T>(attestation: T & { integrity: { digest_hex: string } }, immutableUrl: string): { contract_version: '1.0.0'; current_digest: string; immutable_url: string; attestation: T };
export function immutableDeploymentAttestationEnvelope<T>(attestation: T & { integrity: { digest_hex: string } }, requestedDigest: string): { contract_version: '1.0.0'; requested_digest: string; attestation: T | null };
