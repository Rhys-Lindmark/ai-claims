export function scoreState(analysis) {
  if (!analysis) return { state: 'not_analyzed', reason: 'No shared analysis exists for this page yet.' };
  if (analysis.status !== 'published') return { state: 'pending', reason: `Analysis is ${analysis.status.replaceAll('_', ' ')}.` };
  if (analysis.publication_state === 'paused') return { state: 'paused', reason: `Score publication is paused: ${(analysis.paused_reason ?? 'editorial review').replaceAll('_', ' ')}.`, analysisVersionId: analysis.analysis_version_id, supersededVersionIds: analysis.superseded_version_ids ?? [], analysisUrl: analysis.analysis_url, latestCorrectionEventId: analysis.latest_correction_event_id ?? null, latestCorrectionSummary: analysis.latest_correction_summary ?? null, latestCorrectionFromVersionId: analysis.latest_correction_from_version_id ?? null, latestCorrectionToVersionId: analysis.latest_correction_to_version_id ?? null, latestCorrectionUrl: analysis.latest_correction_url ?? null, latestCorrectionEventApiUrl: analysis.latest_correction_event_api_url ?? null, correctionFeedApiUrl: analysis.correction_feed_api_url ?? null };
  if (analysis.publication_state !== 'active') return { state: 'pending', reason: 'The current analysis version is not active.' };

  const checks = [
    [analysis.eligible_claims > 0, 'No eligible claims were defined.'],
    [analysis.reviewed_claims === analysis.eligible_claims, 'Not every eligible claim has been reviewed.'],
    [analysis.unresolved_claims === 0, 'One or more reviewed claims remain unresolved.'],
    [analysis.publication_gates_passed === true, 'Publication gates have not passed.'],
    [analysis.provenance_complete === true, 'Evidence provenance is incomplete.'],
    [Number.isInteger(analysis.score_0_100) && analysis.score_0_100 >= 0 && analysis.score_0_100 <= 100, 'The score is invalid.'],
  ];
  const failed = checks.find(([passes]) => !passes);
  if (failed) return { state: 'pending', reason: failed[1] };

  return {
    state: 'published',
    score: analysis.score_0_100,
    reviewedClaims: analysis.reviewed_claims,
    eligibleClaims: analysis.eligible_claims,
    methodologyVersion: analysis.methodology_version,
    analysisUrl: analysis.analysis_url,
    lastReviewedAt: analysis.last_reviewed_at,
    publicationState: analysis.publication_state,
    analysisVersionId: analysis.analysis_version_id,
    supersededVersionIds: analysis.superseded_version_ids ?? [],
    resumedFromVersionId: analysis.resumed_from_version_id ?? null,
    latestCorrectionEventId: analysis.latest_correction_event_id ?? null,
    latestCorrectionSummary: analysis.latest_correction_summary ?? null,
    latestCorrectionFromVersionId: analysis.latest_correction_from_version_id ?? null,
    latestCorrectionToVersionId: analysis.latest_correction_to_version_id ?? null,
    latestCorrectionUrl: analysis.latest_correction_url ?? null,
    latestCorrectionEventApiUrl: analysis.latest_correction_event_api_url ?? null,
    correctionFeedApiUrl: analysis.correction_feed_api_url ?? null,
  };
}

export function resolveAnalysis(registry, entityKey) {
  return scoreState(registry.analyses.find((analysis) => analysis.entity_key === entityKey));
}
