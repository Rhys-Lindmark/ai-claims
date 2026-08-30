export type ConsequenceLevel = 0 | 1 | 2 | 3;

export interface ClaimConsequenceRecord {
  canonical_claim_id: string;
  severity: ConsequenceLevel;
  reach: ConsequenceLevel;
  urgency: ConsequenceLevel;
  decision_relevance: ConsequenceLevel;
  rationale: string;
  reviewer_confidence: 'high' | 'medium' | 'low';
  review_state: 'machine_suggestion' | 'editor_reviewed';
  evidence_standard: 'unchanged';
  truth_score_weight: 1;
}

export function reviewPriority(record: ClaimConsequenceRecord) {
  return record.severity * 4 + record.reach * 2 + record.urgency * 2 + record.decision_relevance;
}

export function orderClaimsForReview(records: ClaimConsequenceRecord[]) {
  return [...records].sort((a, b) => reviewPriority(b) - reviewPriority(a) || a.canonical_claim_id.localeCompare(b.canonical_claim_id));
}

export function validateConsequenceRecord(record: ClaimConsequenceRecord): string[] {
  const errors: string[] = [];
  if (!record.rationale.trim()) errors.push('Consequence review needs a rationale.');
  if (record.evidence_standard !== 'unchanged') errors.push('Consequence cannot lower the evidence standard.');
  if (record.truth_score_weight !== 1) errors.push('Consequence cannot alter truth-score weight.');
  for (const field of ['severity', 'reach', 'urgency', 'decision_relevance'] as const) {
    if (![0, 1, 2, 3].includes(record[field])) errors.push(`${field} must be between 0 and 3.`);
  }
  return errors;
}

