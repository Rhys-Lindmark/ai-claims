import registry from '@/extension/data/analyses.json';

export const ANALYSIS_RESOLVER_CONTRACT = '1.0.0';

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function resolveAnalysisEnvelope(entityKey: string, versionId?: string | null) {
  const analysis = registry.analyses.find((entry) => entry.entity_key === entityKey) ?? null;
  const requestedVersion = versionId?.trim() || null;
  const matchedVersion = !analysis || !requestedVersion
    ? null
    : analysis.analysis_version_id === requestedVersion
      ? { analysis_version_id: requestedVersion, publication_state: analysis.publication_state }
      : analysis.version_history.find((entry) => entry.analysis_version_id === requestedVersion) ?? null;
  const version = matchedVersion ? { analysis_version_id: matchedVersion.analysis_version_id, publication_state: matchedVersion.publication_state } : null;
  return {
    contract_version: ANALYSIS_RESOLVER_CONTRACT,
    analysis_schema_version: registry.schema_version,
    entity_key: entityKey,
    requested_version_id: requestedVersion,
    analysis: requestedVersion && version ? { entity_key: entityKey, ...version } : requestedVersion ? null : analysis,
    version,
  };
}

export function analysisEtag(envelope: ReturnType<typeof resolveAnalysisEnvelope>) {
  const revision = envelope.requested_version_id ?? envelope.analysis?.analysis_version_id ?? 'missing';
  return `\"claims-${stableHash(`${envelope.analysis_schema_version}:${envelope.entity_key}:${revision}`)}\"`;
}
