export interface ClaimSelectionRemediation {
  remediation_id: string;
  trigger_batch_id: string;
  affected_stratum_ids: string[];
  root_cause_hypothesis: string;
  method_change_id: string;
  resulting_methodology_version: string;
  owner: string;
  due_at: string;
  re_review_sample_ids: string[];
  required_evidence: string[];
  state: 'planned' | 'in_progress' | 'verified';
  verification: null | {
    calibration_batch_id: string;
    reviewed_records: number;
    agreements: number;
    required_threshold: number;
    unresolved_disagreements: number;
    evidence_links: string[];
    verified_by: string;
    verified_at: string;
  };
}

export function validateClaimSelectionRemediations(records: ClaimSelectionRemediation[]): string[] {
  const errors: string[] = [];
  if (!records.length) errors.push('At least one remediation record is required.');
  if (new Set(records.map((record) => record.remediation_id)).size !== records.length) errors.push('Remediation IDs must be unique.');
  for (const record of records) {
    if (!record.trigger_batch_id || !record.root_cause_hypothesis.trim() || !record.method_change_id || !record.owner.trim() || !record.due_at) errors.push(`${record.remediation_id} needs trigger, root-cause hypothesis, method change, owner, and deadline.`);
    if (!/^\d+\.\d+\.\d+$/.test(record.resulting_methodology_version)) errors.push(`${record.remediation_id} needs a semantic methodology version.`);
    if (!record.affected_stratum_ids.length || !record.re_review_sample_ids.length || !record.required_evidence.length) errors.push(`${record.remediation_id} needs affected strata, re-review samples, and required evidence.`);
    if (record.state === 'verified' && !record.verification) errors.push(`${record.remediation_id} is verified without verification evidence.`);
    if (record.state !== 'verified' && record.verification) errors.push(`${record.remediation_id} cannot attach final verification before it is verified.`);
    const verification = record.verification;
    if (verification) {
      if (verification.reviewed_records < 1 || verification.agreements < 0 || verification.agreements > verification.reviewed_records) errors.push(`${record.remediation_id} has invalid verification counts.`);
      if (verification.required_threshold <= 0 || verification.required_threshold > 1) errors.push(`${record.remediation_id} has an invalid verification threshold.`);
      if (verification.unresolved_disagreements < 0 || verification.unresolved_disagreements > verification.reviewed_records - verification.agreements) errors.push(`${record.remediation_id} has invalid unresolved verification counts.`);
      if (!verification.evidence_links.length || verification.evidence_links.some((link) => !link.startsWith('https://'))) errors.push(`${record.remediation_id} verification needs HTTPS evidence links.`);
      if (!verification.verified_by.trim() || !verification.verified_at) errors.push(`${record.remediation_id} verification must be attributed and timestamped.`);
    }
  }
  return errors;
}

export function claimSelectionRemediationDecision(records: ClaimSelectionRemediation[]) {
  const blockers = validateClaimSelectionRemediations(records);
  for (const record of records) {
    if (record.state !== 'verified') blockers.push(`${record.remediation_id} is ${record.state.replaceAll('_', ' ')}.`);
    if (record.verification) {
      const agreement = record.verification.agreements / record.verification.reviewed_records;
      if (agreement < record.verification.required_threshold) blockers.push(`${record.remediation_id} verification agreement is below threshold.`);
      if (record.verification.unresolved_disagreements) blockers.push(`${record.remediation_id} verification has unresolved disagreements.`);
    }
  }
  return { denominator_publication_resumes: blockers.length === 0, blockers };
}
