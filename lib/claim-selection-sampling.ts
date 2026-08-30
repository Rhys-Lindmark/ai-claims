export type SamplingDimension = 'transcript_region' | 'speaker' | 'machine_claim_type' | 'machine_confidence';

export interface ClaimSelectionAuditStratum {
  stratum_id: string;
  dimension: SamplingDimension;
  label: string;
  population_count: number;
  sampled_count: number;
  required_minimum: number;
  coverage_note: string;
}

export interface ClaimSelectionSamplingFrame {
  frame_id: string;
  episode_id: string;
  sampling_method: 'stratified_random_with_editor_challenge';
  transcript_segment_count: number;
  sampled_segment_count: number;
  minimum_sample_size: number;
  selection_seed_digest: string;
  created_at: string;
  reviewed_by: string;
  strata: ClaimSelectionAuditStratum[];
}

const requiredDimensions: SamplingDimension[] = ['transcript_region', 'speaker', 'machine_claim_type', 'machine_confidence'];

export function validateClaimSelectionSamplingFrame(frame: ClaimSelectionSamplingFrame): string[] {
  const errors: string[] = [];
  if (!frame.frame_id || !frame.episode_id || !frame.created_at || !frame.reviewed_by.trim()) errors.push('Frame identity, review attribution, and timestamp are required.');
  if (!/^sha256:[a-f0-9]{16,64}$/.test(frame.selection_seed_digest)) errors.push('Selection seed needs a stable SHA-256 digest.');
  if (!Number.isInteger(frame.transcript_segment_count) || frame.transcript_segment_count < 1) errors.push('Transcript segment count must be a positive integer.');
  if (!Number.isInteger(frame.sampled_segment_count) || frame.sampled_segment_count < 1 || frame.sampled_segment_count > frame.transcript_segment_count) errors.push('Sampled segment count must be positive and cannot exceed the transcript.');
  if (!Number.isInteger(frame.minimum_sample_size) || frame.minimum_sample_size < 1) errors.push('Minimum sample size must be a positive integer.');
  if (new Set(frame.strata.map((stratum) => stratum.stratum_id)).size !== frame.strata.length) errors.push('Sampling stratum IDs must be unique.');
  for (const dimension of requiredDimensions) if (!frame.strata.some((stratum) => stratum.dimension === dimension)) errors.push(`Missing ${dimension} strata.`);
  for (const stratum of frame.strata) {
    if (!stratum.label.trim() || !stratum.coverage_note.trim()) errors.push(`${stratum.stratum_id} needs a label and coverage note.`);
    if (![stratum.population_count, stratum.sampled_count, stratum.required_minimum].every(Number.isInteger)) errors.push(`${stratum.stratum_id} counts must be integers.`);
    if (stratum.population_count < 0 || stratum.sampled_count < 0 || stratum.required_minimum < 1 || stratum.sampled_count > stratum.population_count) errors.push(`${stratum.stratum_id} has invalid population or sampling counts.`);
  }
  return errors;
}

export function claimSelectionSamplingDecision(frame: ClaimSelectionSamplingFrame) {
  const blockers = validateClaimSelectionSamplingFrame(frame);
  if (frame.sampled_segment_count < frame.minimum_sample_size) blockers.push(`Sample has ${frame.sampled_segment_count} segments; ${frame.minimum_sample_size} are required.`);
  for (const stratum of frame.strata) if (stratum.sampled_count < stratum.required_minimum) blockers.push(`${stratum.label} has ${stratum.sampled_count}/${stratum.required_minimum} required samples.`);
  return { metrics_publishable: blockers.length === 0, blockers };
}
