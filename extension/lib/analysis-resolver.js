import { scoreState } from './analysis-registry.js';

export const RESOLVER_CONTRACT_VERSION = '1.0.0';

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
      const url = new URL('/v1/analyses/resolve', endpoint);
      url.searchParams.set('entity_key', entityKey);
      const response = await fetchImpl(url, { headers: { accept: 'application/json' } });
      if (response.status === 404) return scoreState(null);
      if (!response.ok) throw new Error(`Analysis resolver failed with ${response.status}.`);
      const envelope = assertEnvelope(await response.json());
      if (envelope.entity_key !== entityKey) throw new Error('Resolver returned a mismatched entity key.');
      return scoreState(envelope.analysis);
    },
  };
}

export function createConfiguredResolver(config, options = {}) {
  if (config.mode === 'local') return createLocalResolver({ registryUrl: config.registry_url, ...options });
  if (config.mode === 'api') return createApiResolver({ endpoint: config.endpoint, ...options });
  throw new Error(`Unknown resolver mode: ${config.mode}`);
}
