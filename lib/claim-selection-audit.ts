import type { ClaimType } from './claim-types';

export type SelectionOutcome = 'true_positive' | 'false_positive' | 'false_negative' | 'true_negative';
export type EditorSelectionDecision = 'include' | 'exclude' | 'add_missed' | 'confirm_nonclaim';

export interface ClaimSelectionAuditSample {
  sample_id: string;
  segment_id: string;
  transcript_excerpt: string;
  machine_candidate: null | {
    candidate_id: string;
    text: string;
    type: ClaimType;
    confidence: number;
  };
  editor_decision: EditorSelectionDecision;
  outcome: SelectionOutcome;
  canonical_claim_text: string | null;
  review_note: string;
  reviewed_by: string;
  reviewed_at: string;
}

const expectedDecision: Record<SelectionOutcome, EditorSelectionDecision> = {
  true_positive: 'include',
  false_positive: 'exclude',
  false_negative: 'add_missed',
  true_negative: 'confirm_nonclaim',
};

export function validateClaimSelectionAudit(samples: ClaimSelectionAuditSample[]): string[] {
  const errors: string[] = [];
  if (!samples.length) errors.push('At least one audit sample is required.');
  if (new Set(samples.map((sample) => sample.sample_id)).size !== samples.length) errors.push('Audit sample IDs must be unique.');

  for (const sample of samples) {
    if (!sample.transcript_excerpt.trim()) errors.push(`${sample.sample_id} needs transcript context.`);
    if (!sample.review_note.trim() || !sample.reviewed_by.trim() || !sample.reviewed_at) errors.push(`${sample.sample_id} needs an attributed editor review.`);
    if (sample.editor_decision !== expectedDecision[sample.outcome]) errors.push(`${sample.sample_id} decision does not match its audit outcome.`);
    const machineShouldExist = sample.outcome === 'true_positive' || sample.outcome === 'false_positive';
    if (machineShouldExist !== Boolean(sample.machine_candidate)) errors.push(`${sample.sample_id} has an inconsistent machine-candidate state.`);
    const claimShouldExist = sample.outcome === 'true_positive' || sample.outcome === 'false_negative';
    if (claimShouldExist !== Boolean(sample.canonical_claim_text?.trim())) errors.push(`${sample.sample_id} has an inconsistent editor-selected claim.`);
    if (sample.machine_candidate && (sample.machine_candidate.confidence < 0 || sample.machine_candidate.confidence > 1)) errors.push(`${sample.sample_id} confidence must be between 0 and 1.`);
  }
  return errors;
}

export function selectionAuditSummary(samples: ClaimSelectionAuditSample[]) {
  const counts = Object.fromEntries((['true_positive', 'false_positive', 'false_negative', 'true_negative'] as const).map((outcome) => [outcome, samples.filter((sample) => sample.outcome === outcome).length])) as Record<SelectionOutcome, number>;
  const predictedPositive = counts.true_positive + counts.false_positive;
  const actualPositive = counts.true_positive + counts.false_negative;
  return {
    counts,
    sample_size: samples.length,
    sample_precision: predictedPositive ? counts.true_positive / predictedPositive : null,
    sample_recall: actualPositive ? counts.true_positive / actualPositive : null,
  };
}
