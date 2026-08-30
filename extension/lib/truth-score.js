export const TRUTH_SCORE_METHOD = {
  id: 'equal-claim-truth-credit',
  version: '0.1.0',
  verdictCredits: {
    accurate: 1,
    mostly_accurate: 0.75,
    mixed: 0.5,
    mostly_inaccurate: 0.25,
    inaccurate: 0,
  },
};

function pending(reason, blockers = []) {
  return { state: 'pending', score: null, reason, blockers, methodology_version: TRUTH_SCORE_METHOD.version };
}

export function computeTruthScore(claims) {
  if (!Array.isArray(claims) || claims.length === 0) return pending('No claim set was supplied.');

  const ids = claims.map((claim) => claim.canonical_claim_id);
  if (ids.some((id) => !id) || new Set(ids).size !== ids.length) return pending('Canonical claim IDs are missing or duplicated.');

  const eligibilityMissing = claims.filter((claim) => claim.eligibility_reviewed !== true).map((claim) => claim.canonical_claim_id);
  if (eligibilityMissing.length) return pending('Claim eligibility review is incomplete.', eligibilityMissing);

  const eligible = claims.filter((claim) => claim.eligible === true);
  if (eligible.length === 0) return pending('No eligible claims were defined.');

  const blockers = eligible.flatMap((claim) => {
    const reasons = [];
    if (claim.review_state !== 'reviewed') reasons.push('review incomplete');
    if (!(claim.summary_verdict in TRUTH_SCORE_METHOD.verdictCredits)) reasons.push('verdict unresolved');
    if (claim.publication_gates_passed !== true) reasons.push('publication gate failed');
    if (claim.provenance_complete !== true) reasons.push('provenance incomplete');
    return reasons.map((reason) => `${claim.canonical_claim_id}: ${reason}`);
  });
  if (blockers.length) return pending('Every eligible claim must be reviewed, resolved, publishable, and provenance-complete.', blockers);

  const distribution = Object.fromEntries(Object.keys(TRUTH_SCORE_METHOD.verdictCredits).map((verdict) => [verdict, 0]));
  const earnedCredits = eligible.reduce((sum, claim) => {
    distribution[claim.summary_verdict] += 1;
    return sum + TRUTH_SCORE_METHOD.verdictCredits[claim.summary_verdict];
  }, 0);

  return {
    state: 'published',
    score: Math.round((earnedCredits / eligible.length) * 100),
    earned_credits: earnedCredits,
    eligible_claims: eligible.length,
    reviewed_claims: eligible.length,
    unresolved_claims: 0,
    distribution,
    methodology_id: TRUTH_SCORE_METHOD.id,
    methodology_version: TRUTH_SCORE_METHOD.version,
    weighting: 'one equal unit per eligible canonical claim',
  };
}
