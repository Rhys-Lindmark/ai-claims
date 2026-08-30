import registry from '@/extension/data/analyses.json';

export const ANALYSIS_RESOLVER_CONTRACT = '1.0.0';

export function resolveAnalysisEnvelope(entityKey: string) {
  const analysis = registry.analyses.find((entry) => entry.entity_key === entityKey) ?? null;
  return {
    contract_version: ANALYSIS_RESOLVER_CONTRACT,
    entity_key: entityKey,
    analysis,
  };
}
