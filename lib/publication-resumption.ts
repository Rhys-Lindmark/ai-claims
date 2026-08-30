import { currentPublishedVersion, validateAnalysisHistory, type AnalysisVersionRecord } from './analysis-history.ts';

export interface PublicationResumptionRecord {
  decision_id: string;
  analysis_id: string;
  paused_public_version_id: string;
  pause_reason: 'claim_selection_calibration_drift';
  previous_methodology_version: string;
  resumed_methodology_version: string;
  gate_snapshot: {
    drift_batch_id: string;
    observed_agreement: number;
    required_threshold: number;
    unresolved_disagreements: number;
    calibration_set_ids: string[];
    remediation_ids: string[];
    all_remediations_verified: boolean;
    publication_readiness_passed: boolean;
    evidence_digest: string;
    captured_at: string;
    captured_by: string;
  };
  proposed_version: AnalysisVersionRecord;
  approved_by: string;
  approved_at: string;
}

export function publicationResumptionDecision(history: AnalysisVersionRecord[], record: PublicationResumptionRecord) {
  const blockers = validateAnalysisHistory(history);
  const current = currentPublishedVersion(history);
  if (!record.decision_id || !record.analysis_id || !record.approved_by.trim() || !record.approved_at) blockers.push('Resumption decision identity and approval are required.');
  if (!current || current.version_id !== record.paused_public_version_id) blockers.push('Paused version must be the current published version.');
  if (current?.analysis_id !== record.analysis_id || record.proposed_version.analysis_id !== record.analysis_id) blockers.push('Analysis identity must remain stable across resumption.');
  if (record.proposed_version.version_id === record.paused_public_version_id || history.some((version) => version.version_id === record.proposed_version.version_id)) blockers.push('Resumption must create a new version ID.');
  if (current && record.proposed_version.parent_version_id !== current.version_id) blockers.push('Resumed version must point to the paused public version as parent.');
  if (current && record.proposed_version.version_number !== current.version_number + 1) blockers.push('Resumed version must increment the version number exactly once.');
  if (record.proposed_version.review_state !== 'published' || !record.proposed_version.supersedes_public_version) blockers.push('Resumed version must explicitly publish and supersede the paused version.');
  if (record.previous_methodology_version === record.resumed_methodology_version || !/^\d+\.\d+\.\d+$/.test(record.resumed_methodology_version)) blockers.push('Resumption needs a new semantic methodology version.');
  const snapshot = record.gate_snapshot;
  if (snapshot.observed_agreement < snapshot.required_threshold) blockers.push('Calibration agreement remains below threshold.');
  if (snapshot.unresolved_disagreements !== 0) blockers.push('Calibration disagreements remain unresolved.');
  if (!snapshot.calibration_set_ids.length || !snapshot.remediation_ids.length || !snapshot.all_remediations_verified || !snapshot.publication_readiness_passed) blockers.push('Calibration, remediation, and publication-readiness gates must all be captured as passed.');
  if (!/^sha256:[a-f0-9]{16,64}$/.test(snapshot.evidence_digest) || !snapshot.captured_at || !snapshot.captured_by.trim()) blockers.push('Gate snapshot needs a stable evidence digest and review attribution.');
  if (!record.proposed_version.changed_record_ids.includes(record.decision_id)) blockers.push('New version must link the resumption decision in its changed records.');
  return { can_resume_publication: blockers.length === 0, blockers, previous_public_version_id: current?.version_id ?? null, new_public_version_id: blockers.length ? null : record.proposed_version.version_id };
}
