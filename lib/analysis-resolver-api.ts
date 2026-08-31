import registry from '@/extension/data/analyses.json';
import { latestCorrectionForEntity } from '@/lib/correction-feed-api';

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
  const latestCorrection = latestCorrectionForEntity(entityKey);
  const correctionPointers = latestCorrection ? {
    latest_correction_event_id: latestCorrection.event_id,
    latest_correction_public_score_state: latestCorrection.public_score_state,
    latest_correction_summary: latestCorrection.summary,
    latest_correction_from_version_id: latestCorrection.from_version_id,
    latest_correction_to_version_id: latestCorrection.to_version_id,
    latest_correction_url: `https://ai.rhyslindmark.com/claims#${latestCorrection.event_id}`,
    latest_correction_event_api_url: `https://ai.rhyslindmark.com/claims/api/v1/analyses/corrections/${latestCorrection.event_id}?entity_key=${encodeURIComponent(entityKey)}`,
    correction_feed_api_url: `https://ai.rhyslindmark.com/claims/api/v1/analyses/corrections?entity_key=${encodeURIComponent(entityKey)}`,
  } : {};
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
    analysis: requestedVersion && version ? { entity_key: entityKey, ...version } : requestedVersion ? null : analysis ? { ...analysis, ...correctionPointers } : null,
    version,
  };
}

export function analysisEtag(envelope: ReturnType<typeof resolveAnalysisEnvelope>) {
  const revision = envelope.requested_version_id ?? envelope.analysis?.analysis_version_id ?? 'missing';
  return `\"claims-${stableHash(`${envelope.analysis_schema_version}:${envelope.entity_key}:${revision}`)}\"`;
}
