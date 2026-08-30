export const claimTypes = ['factual', 'causal', 'quantitative', 'prediction', 'opinion_value', 'rhetorical_hypothetical', 'anecdote_personal'] as const;
export type ClaimType = (typeof claimTypes)[number];

export interface AtomicClaimCandidate {
  id: string;
  source_segment_id: string;
  text: string;
  type: ClaimType;
  checkability: 'checkable_now' | 'checkable_later' | 'not_truth_scored' | 'needs_review';
  split_from_compound: boolean;
  embedded_factual_premise: boolean;
  review_state: 'machine_draft' | 'editor_reviewed';
  reviewer_note: string;
}

export function validateAtomicClaim(candidate: AtomicClaimCandidate): string[] {
  const errors: string[] = [];
  if (!candidate.text.trim()) errors.push('Claim text is required.');
  if (candidate.type === 'prediction' && candidate.checkability === 'checkable_now') errors.push('Predictions cannot default to checkable now.');
  if ((candidate.type === 'opinion_value' || candidate.type === 'rhetorical_hypothetical' || candidate.type === 'anecdote_personal') && candidate.checkability === 'checkable_now') errors.push(`${candidate.type} speech cannot default to truth-scored now.`);
  if (candidate.review_state === 'machine_draft' && !candidate.reviewer_note.trim()) errors.push('Machine drafts need a visible review note.');
  return errors;
}

