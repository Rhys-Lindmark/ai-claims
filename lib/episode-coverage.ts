export interface EpisodeCoverageRecord {
  transcript_segments: number;
  candidate_claims: number;
  canonical_claims: number;
  checkable_claims: number;
  editor_reviewed_claims: number;
  unresolved_claims: number;
  transcript_duration_seconds: number;
  last_calculated_at: string;
}

export function validateEpisodeCoverage(record: EpisodeCoverageRecord): string[] {
  const errors: string[] = [];
  for (const [field, value] of Object.entries(record)) {
    if (typeof value === 'number' && (!Number.isInteger(value) || value < 0)) errors.push(`${field} must be a non-negative integer.`);
  }
  if (record.candidate_claims > record.transcript_segments) errors.push('Candidate claims cannot exceed transcript segments.');
  if (record.canonical_claims > record.candidate_claims) errors.push('Canonical claims cannot exceed candidate claims.');
  if (record.checkable_claims > record.canonical_claims) errors.push('Checkable claims cannot exceed canonical claims.');
  if (record.editor_reviewed_claims > record.checkable_claims) errors.push('Reviewed claims cannot exceed checkable claims.');
  if (record.unresolved_claims > record.editor_reviewed_claims) errors.push('Unresolved claims cannot exceed reviewed claims.');
  return errors;
}

export function coverageRates(record: EpisodeCoverageRecord) {
  return {
    selection: record.transcript_segments ? record.candidate_claims / record.transcript_segments : 0,
    deduplication: record.candidate_claims ? record.canonical_claims / record.candidate_claims : 0,
    checkability: record.canonical_claims ? record.checkable_claims / record.canonical_claims : 0,
    review: record.checkable_claims ? record.editor_reviewed_claims / record.checkable_claims : 0,
    resolution: record.editor_reviewed_claims ? (record.editor_reviewed_claims - record.unresolved_claims) / record.editor_reviewed_claims : 0,
  };
}

