import { scoreState } from './analysis-registry.js';
import { identifyPage } from './page-identity.js';

function nextAction(identity) {
  if (identity.kind === 'youtube') return { label: 'Supply a permitted transcript', url: `https://ai.rhyslindmark.com/claims/intake?url=${encodeURIComponent(identity.canonicalUrl)}` };
  if (identity.kind === 'goodreads') return { label: 'Confirm the book edition', url: `https://ai.rhyslindmark.com/claims/book-intake?url=${encodeURIComponent(identity.canonicalUrl)}` };
  return { label: 'Open the canonical no-score record', url: `https://ai.rhyslindmark.com/claims/analysis?entity_key=${encodeURIComponent(identity.entityKey)}` };
}

export async function probeResolverUrl(rawUrl, { endpoint = 'https://ai.rhyslindmark.com/claims/api/', fetchImpl = fetch } = {}) {
  const identity = identifyPage(rawUrl);
  if (!identity.entityKey) return { state: 'invalid', reason: 'Enter a public HTTP or HTTPS page URL.', identity };
  const resolverUrl = new URL('v1/analyses/resolve', endpoint.endsWith('/') ? endpoint : `${endpoint}/`);
  resolverUrl.searchParams.set('entity_key', identity.entityKey);
  try {
    const response = await fetchImpl(resolverUrl, { headers: { accept: 'application/json', 'x-ai-claims-correction-feed-accept': '1.0.0, 1.1.0' } });
    if (response.status === 404) return { state: 'not_analyzed', reason: 'No shared analysis exists for this page yet.', identity, nextAction: nextAction(identity) };
    if (!response.ok) return { state: 'error', reason: `Resolver returned ${response.status}.`, identity };
    const envelope = await response.json();
    if (envelope.contract_version !== '1.0.0' || envelope.entity_key !== identity.entityKey) return { state: 'error', reason: 'Resolver returned an incompatible response.', identity };
    const score = scoreState(envelope.analysis);
    return score.state === 'published'
      ? { state: 'reviewed', identity, score: score.score, reviewedClaims: score.reviewedClaims, eligibleClaims: score.eligibleClaims, methodologyVersion: score.methodologyVersion, analysisUrl: score.analysisUrl }
      : { state: score.state === 'not_analyzed' ? 'not_analyzed' : 'pending', reason: score.reason, identity, analysisUrl: score.analysisUrl ?? null, ...(score.state === 'not_analyzed' ? { nextAction: nextAction(identity) } : {}) };
  } catch {
    return { state: 'error', reason: 'The shared resolver is temporarily unavailable.', identity };
  }
}
