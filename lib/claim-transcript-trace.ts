export interface ClaimTranscriptTrace {
  trace_id: string;
  candidate_claim_id: string;
  atomic_claim: string;
  segment_id: string;
  timestamp: string;
  context_before: string;
  exact_utterance: string;
  context_after: string;
  speaker_attribution: {
    speaker_ids: string[];
    display_names: string[];
    mode: 'single_speaker' | 'overlapping_speech' | 'unknown_speaker';
    confidence: 'high' | 'medium' | 'low' | 'unknown';
    review_state: 'machine_suggested' | 'editor_reviewed';
  };
  canonical_membership: {
    canonical_claim_id: string;
    occurrence_id: string;
    relationship: 'canonical_wording' | 'exact_repeat' | 'paraphrase';
    grouping_state: 'machine_suggestion' | 'editor_reviewed';
    group_occurrence_count: number;
  };
}

export function validateClaimTrace(trace: ClaimTranscriptTrace): string[] {
  const errors: string[] = [];
  if (!trace.context_before.trim() || !trace.exact_utterance.trim() || !trace.context_after.trim()) errors.push('Trace needs before, exact, and after transcript context.');
  if (trace.speaker_attribution.mode === 'single_speaker' && trace.speaker_attribution.speaker_ids.length !== 1) errors.push('Single-speaker trace needs one speaker.');
  if (trace.speaker_attribution.mode === 'overlapping_speech' && trace.speaker_attribution.speaker_ids.length < 2) errors.push('Overlapping trace needs at least two speakers.');
  if (trace.speaker_attribution.mode === 'unknown_speaker' && (trace.speaker_attribution.speaker_ids.length || trace.speaker_attribution.confidence !== 'unknown')) errors.push('Unknown attribution must stay empty and unknown.');
  if (trace.speaker_attribution.speaker_ids.length !== trace.speaker_attribution.display_names.length) errors.push('Speaker IDs and names must remain paired.');
  if (trace.canonical_membership.group_occurrence_count < 1) errors.push('Canonical group must contain at least one occurrence.');
  return errors;
}
