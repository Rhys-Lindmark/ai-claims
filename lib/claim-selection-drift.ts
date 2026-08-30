export interface ClaimSelectionCalibrationBatch {
  batch_id: string;
  methodology_version: string;
  window_start: string;
  window_end: string;
  reviewed_records: number;
  agreements: number;
  predeclared_agreement_threshold: number;
  unresolved_disagreements: number;
  stratum_warnings: { stratum_id: string; disagreements: number; reviewed: number; note: string }[];
  reviewed_by: string;
}

export function validateClaimSelectionCalibrationBatches(batches: ClaimSelectionCalibrationBatch[]): string[] {
  const errors: string[] = [];
  if (!batches.length) errors.push('At least one calibration batch is required.');
  if (new Set(batches.map((batch) => batch.batch_id)).size !== batches.length) errors.push('Calibration batch IDs must be unique.');
  for (const batch of batches) {
    if (!/^\d+\.\d+\.\d+$/.test(batch.methodology_version)) errors.push(`${batch.batch_id} needs a semantic methodology version.`);
    if (!batch.window_start || !batch.window_end || batch.window_end <= batch.window_start) errors.push(`${batch.batch_id} needs an ordered review window.`);
    if (!Number.isInteger(batch.reviewed_records) || batch.reviewed_records < 1 || !Number.isInteger(batch.agreements) || batch.agreements < 0 || batch.agreements > batch.reviewed_records) errors.push(`${batch.batch_id} has invalid review counts.`);
    if (batch.predeclared_agreement_threshold <= 0 || batch.predeclared_agreement_threshold > 1) errors.push(`${batch.batch_id} threshold must be greater than 0 and at most 1.`);
    if (!Number.isInteger(batch.unresolved_disagreements) || batch.unresolved_disagreements < 0 || batch.unresolved_disagreements > batch.reviewed_records - batch.agreements) errors.push(`${batch.batch_id} has invalid unresolved disagreement counts.`);
    if (!batch.reviewed_by.trim()) errors.push(`${batch.batch_id} needs review attribution.`);
    for (const warning of batch.stratum_warnings) if (!warning.stratum_id || warning.reviewed < 1 || warning.disagreements < 1 || warning.disagreements > warning.reviewed || !warning.note.trim()) errors.push(`${batch.batch_id} has an invalid stratum warning.`);
  }
  return errors;
}

export function claimSelectionDriftDecision(batches: ClaimSelectionCalibrationBatch[]) {
  const blockers = validateClaimSelectionCalibrationBatches(batches);
  const ordered = [...batches].sort((a, b) => a.window_end.localeCompare(b.window_end));
  const latest = ordered.at(-1) ?? null;
  const previous = ordered.at(-2) ?? null;
  const recent = ordered.slice(-3);
  const recentReviewed = recent.reduce((sum, batch) => sum + batch.reviewed_records, 0);
  const recentAgreements = recent.reduce((sum, batch) => sum + batch.agreements, 0);
  const rollingAgreement = recentReviewed ? recentAgreements / recentReviewed : null;
  const latestAgreement = latest ? latest.agreements / latest.reviewed_records : null;
  const previousAgreement = previous ? previous.agreements / previous.reviewed_records : null;
  if (latest && latestAgreement !== null && latestAgreement < latest.predeclared_agreement_threshold) blockers.push(`${latest.batch_id} agreement is below its predeclared threshold.`);
  if (latest?.unresolved_disagreements) blockers.push(`${latest.batch_id} has ${latest.unresolved_disagreements} unresolved disagreements.`);
  return {
    methodology_review_required: blockers.length > 0,
    denominator_publication_paused: blockers.length > 0,
    blockers,
    latest_agreement: latestAgreement,
    rolling_three_batch_agreement: rollingAgreement,
    change_from_previous: latestAgreement !== null && previousAgreement !== null ? latestAgreement - previousAgreement : null,
  };
}
