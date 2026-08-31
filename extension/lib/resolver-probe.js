import { scoreState } from './analysis-registry.js';
import { identifyPage } from './page-identity.js';

export async function probeResolverUrl(rawUrl, { endpoint = 'https://ai.rhyslindmark.com/claims/api/', fetchImpl = fetch } = {}) {
  const identity = identifyPage(rawUrl);
  if (identity.kind !== 'youtube' || !identity.entityKey) return { state: 'invalid', reason: 'Enter a YouTube watch, short, live, embed, or youtu.be URL.', identity };
  const resolverUrl = new URL('v1/analyses/resolve', endpoint.endsWith('/') ? endpoint : `${endpoint}/`);
  resolverUrl.searchParams.set('entity_key', identity.entityKey);
  try {
    const response = await fetchImpl(resolverUrl, { headers: { accept: 'application/json', 'x-ai-claims-correction-feed-accept': '1.0.0, 1.1.0' } });
    if (response.status === 404) return { state: 'not_analyzed', reason: 'No shared analysis exists for this video yet.', identity };
    if (!response.ok) return { state: 'error', reason: `Resolver returned ${response.status}.`, identity };
    const envelope = await response.json();
    if (envelope.contract_version !== '1.0.0' || envelope.entity_key !== identity.entityKey) return { state: 'error', reason: 'Resolver returned an incompatible response.', identity };
    const score = scoreState(envelope.analysis);
    return score.state === 'published'
      ? { state: 'reviewed', identity, score: score.score, reviewedClaims: score.reviewedClaims, eligibleClaims: score.eligibleClaims, methodologyVersion: score.methodologyVersion, analysisUrl: score.analysisUrl }
      : { state: score.state === 'not_analyzed' ? 'not_analyzed' : 'pending', reason: score.reason, identity, analysisUrl: score.analysisUrl ?? null };
  } catch {
    return { state: 'error', reason: 'The shared resolver is temporarily unavailable.', identity };
  }
}
