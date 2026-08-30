import type { EditorSelectionDecision } from './claim-selection-audit';

export interface IndependentSelectionReview {
  editor_id: string;
  decision: EditorSelectionDecision;
  rationale: string;
  reviewed_at: string;
  blind_to_peer_decision: true;
}

export interface ClaimSelectionCalibrationRecord {
  calibration_id: string;
  audit_sample_id: string;
  stratum_ids: string[];
  first_review: IndependentSelectionReview;
  second_review: IndependentSelectionReview;
  adjudication: {
    state: 'not_needed' | 'pending' | 'resolved';
    final_decision: EditorSelectionDecision | null;
    adjudicator_id: string | null;
    rationale: string;
    adjudicated_at: string | null;
  };
}

export function validateClaimSelectionCalibration(records: ClaimSelectionCalibrationRecord[]): string[] {
  const errors: string[] = [];
  if (!records.length) errors.push('At least one calibration record is required.');
  if (new Set(records.map((record) => record.calibration_id)).size !== records.length) errors.push('Calibration IDs must be unique.');
  if (new Set(records.map((record) => record.audit_sample_id)).size !== records.length) errors.push('Audit samples cannot appear twice in one calibration set.');
  for (const record of records) {
    const reviews = [record.first_review, record.second_review];
    if (reviews[0].editor_id === reviews[1].editor_id) errors.push(`${record.calibration_id} needs two different editors.`);
    if (!record.stratum_ids.length || new Set(record.stratum_ids).size !== record.stratum_ids.length) errors.push(`${record.calibration_id} needs unique stratum links.`);
    for (const review of reviews) if (!review.editor_id || !review.rationale.trim() || !review.reviewed_at || review.blind_to_peer_decision !== true) errors.push(`${record.calibration_id} reviews must be independent, attributed, reasoned, and timestamped.`);
    const agrees = reviews[0].decision === reviews[1].decision;
    if (agrees && record.adjudication.state !== 'not_needed') errors.push(`${record.calibration_id} agrees and must not be adjudicated.`);
    if (!agrees && record.adjudication.state === 'not_needed') errors.push(`${record.calibration_id} disagrees and needs adjudication.`);
    if (record.adjudication.state === 'resolved' && (!record.adjudication.final_decision || !record.adjudication.adjudicator_id || !record.adjudication.rationale.trim() || !record.adjudication.adjudicated_at)) errors.push(`${record.calibration_id} resolved adjudication is incomplete.`);
    if (record.adjudication.state !== 'resolved' && record.adjudication.final_decision) errors.push(`${record.calibration_id} cannot have a final decision before resolution.`);
  }
  return errors;
}

export function claimSelectionCalibrationSummary(records: ClaimSelectionCalibrationRecord[]) {
  const agreements = records.filter((record) => record.first_review.decision === record.second_review.decision).length;
  const unresolved = records.filter((record) => record.adjudication.state === 'pending');
  const stratumIds = [...new Set(records.flatMap((record) => record.stratum_ids))].sort();
  const by_stratum = stratumIds.map((stratum_id) => {
    const scoped = records.filter((record) => record.stratum_ids.includes(stratum_id));
    const scopedAgreements = scoped.filter((record) => record.first_review.decision === record.second_review.decision).length;
    return { stratum_id, reviewed: scoped.length, agreements: scopedAgreements, disagreements: scoped.length - scopedAgreements };
  });
  return { reviewed: records.length, agreements, disagreements: records.length - agreements, observed_agreement: records.length ? agreements / records.length : null, unresolved, by_stratum };
}

export function claimSelectionCalibrationDecision(records: ClaimSelectionCalibrationRecord[]) {
  const blockers = validateClaimSelectionCalibration(records);
  const summary = claimSelectionCalibrationSummary(records);
  for (const record of summary.unresolved) blockers.push(`${record.calibration_id} has an unresolved editor disagreement.`);
  return { denominator_publishable: blockers.length === 0, blockers, summary };
}
