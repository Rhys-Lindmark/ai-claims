export const findingStates = ['supported', 'mostly_supported', 'mixed', 'mostly_unsupported', 'unsupported', 'insufficient_evidence', 'disputed', 'outdated', 'not_yet_resolved', 'not_applicable'] as const;
export type FindingState = (typeof findingStates)[number];
export type FindingDimension = 'factual_accuracy' | 'causal_support' | 'quantitative_accuracy' | 'framing_context' | 'currency' | 'evidence_sufficiency';

export interface DimensionFinding {
  dimension: FindingDimension;
  state: FindingState;
  rationale: string;
  evidence_link_ids: string[];
  reviewer_confidence: 'high' | 'medium' | 'low';
}

export interface ReviewedClaimFinding {
  canonical_claim_id: string;
  review_state: 'unreviewed' | 'in_review' | 'editor_reviewed';
  findings: DimensionFinding[];
  last_reviewed_at: string | null;
}

export function summarizeReviewCoverage(records: ReviewedClaimFinding[]) {
  const eligible = records.length;
  const reviewed = records.filter((record) => record.review_state === 'editor_reviewed').length;
  const unresolved = records.filter((record) => record.findings.some((finding) => finding.state === 'insufficient_evidence' || finding.state === 'disputed' || finding.state === 'not_yet_resolved')).length;
  const coverage = eligible === 0 ? 0 : reviewed / eligible;
  return {
    eligible,
    reviewed,
    unresolved,
    coverage,
    showAggregateScore: coverage === 1 && unresolved === 0,
    hiddenReason: coverage < 1 ? `${eligible - reviewed} eligible claim${eligible - reviewed === 1 ? '' : 's'} still lack editor review.` : unresolved > 0 ? `${unresolved} reviewed claim${unresolved === 1 ? '' : 's'} remain unresolved.` : null,
  };
}

export function validateReviewedFinding(record: ReviewedClaimFinding): string[] {
  const errors: string[] = [];
  if (record.review_state === 'editor_reviewed' && !record.last_reviewed_at) errors.push('Editor-reviewed claims need a review date.');
  if (new Set(record.findings.map((finding) => finding.dimension)).size !== record.findings.length) errors.push('Finding dimensions must be unique per claim.');
  for (const finding of record.findings) {
    if (!finding.rationale.trim()) errors.push(`${finding.dimension} needs a rationale.`);
    if (finding.state !== 'not_applicable' && finding.evidence_link_ids.length === 0) errors.push(`${finding.dimension} needs linked evidence.`);
  }
  return errors;
}

