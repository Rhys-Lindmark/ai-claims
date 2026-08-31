import registry from '@/extension/data/analyses.json';
import deploymentAttestation from '@/extension/data/deployment-attestation.json';
import extensionRelease from '@/releases/extension-v0.2.20.json';
import releaseChannelPolicy from '@/releases/channel-policy.json';
import { releaseDownloadUrls } from '@/extension/lib/extension-release-api.js';
import { CORRECTION_EVENT_URL_TEMPLATE, CORRECTION_FEED_DEFAULT_PAGE_SIZE, CORRECTION_FEED_MAX_PAGE_SIZE, CORRECTION_FEED_SUPPORTED_CONTRACTS, latestCorrectionForEntity, negotiateCorrectionFeedContract } from '@/lib/correction-feed-api';

export const ANALYSIS_RESOLVER_CONTRACT = '1.0.0';
export const DEPLOYMENT_ATTESTATION_URL = 'https://ai.rhyslindmark.com/claims/api/v1/deployment-attestations';
export const EXTENSION_RELEASE_URL = 'https://ai.rhyslindmark.com/claims/api/v1/extension-releases';

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function resolveAnalysisEnvelope(entityKey: string, versionId?: string | null, acceptedCorrectionContracts: string[] | null = null) {
  const analysis = registry.analyses.find((entry) => entry.entity_key === entityKey) ?? null;
  const latestCorrection = latestCorrectionForEntity(entityKey);
  const negotiatedCorrectionContract = negotiateCorrectionFeedContract(acceptedCorrectionContracts);
  const correctionPointers = latestCorrection && negotiatedCorrectionContract ? {
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
  const correctionFeedDiscovery = negotiatedCorrectionContract === '1.1.0' ? {
    contract_version: negotiatedCorrectionContract,
    supported_contract_versions: CORRECTION_FEED_SUPPORTED_CONTRACTS,
    compatible: true,
    default_page_size: CORRECTION_FEED_DEFAULT_PAGE_SIZE,
    max_page_size: CORRECTION_FEED_MAX_PAGE_SIZE,
    feed_url: `https://ai.rhyslindmark.com/claims/api/v1/analyses/corrections?entity_key=${encodeURIComponent(entityKey)}`,
    immutable_event_url_template: CORRECTION_EVENT_URL_TEMPLATE,
  } : negotiatedCorrectionContract === '1.0.0' ? {
    contract_version: negotiatedCorrectionContract,
    supported_contract_versions: CORRECTION_FEED_SUPPORTED_CONTRACTS,
    compatible: true,
    feed_url: `https://ai.rhyslindmark.com/claims/api/v1/analyses/corrections?entity_key=${encodeURIComponent(entityKey)}`,
  } : {
    contract_version: null,
    supported_contract_versions: CORRECTION_FEED_SUPPORTED_CONTRACTS,
    compatible: false,
  };
  return {
    contract_version: ANALYSIS_RESOLVER_CONTRACT,
    analysis_schema_version: registry.schema_version,
    correction_feed_discovery: correctionFeedDiscovery,
    deployment_attestation_discovery: {
      contract_version: '1.0.0',
      current_digest: deploymentAttestation.integrity.digest_hex,
      current_url: DEPLOYMENT_ATTESTATION_URL,
      immutable_url: `${DEPLOYMENT_ATTESTATION_URL}/${deploymentAttestation.integrity.digest_hex}`,
      verified_at: deploymentAttestation.verified_at,
      visitor_data_collected: false,
    },
    extension_release_discovery: {
      contract_version: '1.0.0',
      current_version: extensionRelease.extension_version,
      current_url: EXTENSION_RELEASE_URL,
      immutable_url: `${EXTENSION_RELEASE_URL}/${extensionRelease.extension_version}`,
      package_digest: extensionRelease.package.integrity.digest_hex,
      ...releaseDownloadUrls(extensionRelease.extension_version),
      installation_telemetry_collected: false,
      channel: releaseChannelPolicy.channel,
      channel_policy_revision: releaseChannelPolicy.policy_revision,
      minimum_supported_version: releaseChannelPolicy.minimum_supported_version,
      publisher_signed: releaseChannelPolicy.signing.publisher_signed,
      automatic_install_or_update: releaseChannelPolicy.distribution.automatic_install_or_update,
      update_check_identity_collected: releaseChannelPolicy.privacy.update_check_identity_collected,
    },
    entity_key: entityKey,
    requested_version_id: requestedVersion,
    analysis: requestedVersion && version ? { entity_key: entityKey, ...version } : requestedVersion ? null : analysis ? { ...analysis, ...correctionPointers } : null,
    version,
  };
}

export function analysisEtag(envelope: ReturnType<typeof resolveAnalysisEnvelope>) {
  const revision = envelope.requested_version_id ?? envelope.analysis?.analysis_version_id ?? 'missing';
  return `\"claims-${stableHash(`${envelope.analysis_schema_version}:${envelope.correction_feed_discovery.contract_version ?? 'none'}:${envelope.deployment_attestation_discovery.current_digest}:${envelope.extension_release_discovery.package_digest}:${envelope.extension_release_discovery.channel_policy_revision}:${envelope.entity_key}:${revision}`)}\"`;
}
