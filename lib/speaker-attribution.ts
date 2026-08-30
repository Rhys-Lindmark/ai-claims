export type AttributionMode = 'single_speaker' | 'overlapping_speech' | 'unknown_speaker';
export type AttributionConfidence = 'high' | 'medium' | 'low' | 'unknown';

export interface SpeakerIdentity {
  speaker_id: string;
  display_name: string;
  identity_state: 'confirmed' | 'probable' | 'unknown';
  identity_basis: 'publisher_roster' | 'self_introduction' | 'editor_confirmation' | 'none';
}

export interface AttributionRevision {
  revision_number: number;
  previous_speaker_ids: string[];
  next_speaker_ids: string[];
  changed_by: string;
  changed_at: string;
  reason: string;
}

export interface SegmentAttribution {
  attribution_id: string;
  segment_id: string;
  mode: AttributionMode;
  speaker_ids: string[];
  confidence: AttributionConfidence;
  review_state: 'machine_suggested' | 'editor_reviewed';
  revisions: AttributionRevision[];
}

export function validateAttributions(speakers: SpeakerIdentity[], records: SegmentAttribution[]): string[] {
  const errors: string[] = [];
  const speakerIds = new Set(speakers.map((speaker) => speaker.speaker_id));
  if (speakerIds.size !== speakers.length) errors.push('Speaker IDs must be unique.');
  for (const speaker of speakers) {
    if (!speaker.display_name.trim()) errors.push(`${speaker.speaker_id} needs a display name.`);
    if (speaker.identity_state === 'unknown' && speaker.identity_basis !== 'none') errors.push(`${speaker.speaker_id} cannot claim an identity basis while unknown.`);
  }
  for (const record of records) {
    if (record.mode === 'single_speaker' && record.speaker_ids.length !== 1) errors.push(`${record.segment_id} needs exactly one speaker.`);
    if (record.mode === 'overlapping_speech' && record.speaker_ids.length < 2) errors.push(`${record.segment_id} needs at least two overlapping speakers.`);
    if (record.mode === 'unknown_speaker' && (record.speaker_ids.length || record.confidence !== 'unknown')) errors.push(`${record.segment_id} must preserve an empty, unknown attribution.`);
    for (const id of record.speaker_ids) if (!speakerIds.has(id)) errors.push(`${record.segment_id} references missing speaker ${id}.`);
    record.revisions.forEach((revision, index) => {
      if (revision.revision_number !== index + 1) errors.push(`${record.segment_id} revisions must be contiguous.`);
      if (!revision.changed_by.trim() || !revision.reason.trim()) errors.push(`${record.segment_id} revision ${revision.revision_number} needs editor and reason.`);
    });
    const last = record.revisions.at(-1);
    if (last && JSON.stringify(last.next_speaker_ids) !== JSON.stringify(record.speaker_ids)) errors.push(`${record.segment_id} current attribution must match its latest revision.`);
  }
  return errors;
}
