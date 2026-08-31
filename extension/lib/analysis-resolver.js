import { scoreState } from './analysis-registry.js';

export const RESOLVER_CONTRACT_VERSION = '1.0.0';
export const SUPPORTED_CORRECTION_FEED_CONTRACTS = ['1.0.0', '1.1.0'];
export const SUPPORTED_DEPLOYMENT_ATTESTATION_CONTRACTS = ['1.0.0'];

const CORRECTION_POINTER_FIELDS = [
  'latest_correction_event_id',
  'latest_correction_public_score_state',
  'latest_correction_summary',
  'latest_correction_from_version_id',
  'latest_correction_to_version_id',
  'latest_correction_url',
  'latest_correction_event_api_url',
  'correction_feed_api_url',
];

export function correctionFeedCompatibility(discovery) {
  if (!discovery) return { state: 'not_advertised', contractVersion: null };
  const supported = SUPPORTED_CORRECTION_FEED_CONTRACTS.includes(discovery.contract_version);
  return { state: supported ? 'supported' : 'unsupported', contractVersion: discovery.contract_version ?? null };
}

export function deploymentAttestationCompatibility(discovery) {
  if (!discovery) return { state: 'not_advertised', contractVersion: null };
  const supported = SUPPORTED_DEPLOYMENT_ATTESTATION_CONTRACTS.includes(discovery.contract_version);
  return { state: supported ? 'supported' : 'unsupported', contractVersion: discovery.contract_version ?? null };
}

function scoreResolverEnvelope(envelope) {
  const compatibility = correctionFeedCompatibility(envelope.correction_feed_discovery);
  const attestationCompatibility = deploymentAttestationCompatibility(envelope.deployment_attestation_discovery);
  const analysis = envelope.analysis ? { ...envelope.analysis } : null;
  if (analysis && compatibility.state === 'unsupported') {
    for (const field of CORRECTION_POINTER_FIELDS) delete analysis[field];
  }
  return { ...scoreState(analysis), correctionFeedCompatibility: compatibility.state, correctionFeedContractVersion: compatibility.contractVersion, deploymentAttestationCompatibility: attestationCompatibility.state, deploymentAttestationContractVersion: attestationCompatibility.contractVersion, deploymentAttestationUrl: attestationCompatibility.state === 'supported' ? envelope.deployment_attestation_discovery.current_url : null, deploymentAttestationDigest: attestationCompatibility.state === 'supported' ? envelope.deployment_attestation_discovery.current_digest : null };
}

function assertEnvelope(envelope) {
  if (envelope.contract_version !== RESOLVER_CONTRACT_VERSION) {
    throw new Error(`Unsupported resolver contract: ${envelope.contract_version ?? 'missing'}`);
  }
  if (!Object.hasOwn(envelope, 'analysis')) throw new Error('Resolver response is missing analysis.');
  return envelope;
}

export function createLocalResolver({ registryUrl, fetchImpl = fetch }) {
  return {
    async resolve(entityKey) {
      const response = await fetchImpl(registryUrl);
      if (!response.ok) throw new Error(`Local registry failed with ${response.status}.`);
      const registry = await response.json();
      const analysis = registry.analyses.find((entry) => entry.entity_key === entityKey) ?? null;
      return scoreState(analysis);
    },
  };
}

export function createApiResolver({ endpoint, fetchImpl = fetch }) {
  return {
    async resolve(entityKey) {
      const url = new URL('v1/analyses/resolve', endpoint.endsWith('/') ? endpoint : `${endpoint}/`);
      url.searchParams.set('entity_key', entityKey);
      const response = await fetchImpl(url, { cache: 'default', headers: { accept: 'application/json', 'x-ai-claims-correction-feed-accept': SUPPORTED_CORRECTION_FEED_CONTRACTS.join(', ') } });
      if (response.status === 404) return scoreState(null);
      if (!response.ok) throw new Error(`Analysis resolver failed with ${response.status}.`);
      const envelope = assertEnvelope(await response.json());
      if (envelope.entity_key !== entityKey) throw new Error('Resolver returned a mismatched entity key.');
      return scoreResolverEnvelope(envelope);
    },
  };
}

export function createConfiguredResolver(config, options = {}) {
  if (config.mode === 'local') return createLocalResolver({ registryUrl: config.registry_url, ...options });
  if (config.mode === 'api') return createApiResolver({ endpoint: config.endpoint, ...options });
  throw new Error(`Unknown resolver mode: ${config.mode}`);
}
