export type CorrectionRecordKind = 'claim' | 'evidence' | 'method' | 'publication_gate';

export interface CorrectionEvent {
  event_id: string;
  sequence: number;
  occurred_at: string;
  from_version_id: string;
  to_version_id: string;
  summary: string;
  changed_records: { kind: CorrectionRecordKind; record_id: string; change: string }[];
  public_score_state: 'active' | 'paused' | 'superseded';
}

export function validateCorrectionEventFeed(events: CorrectionEvent[]) {
  const errors: string[] = [];
  const forbiddenScoreKeys = /^(score|score_0_100|truth_score|truth_score_0_100|percentage)$/i;
  if (new Set(events.map((event) => event.event_id)).size !== events.length) errors.push('Correction event IDs must be unique.');
  for (const [index, event] of events.entries()) {
    if (event.sequence !== index + 1) errors.push(`${event.event_id} must be append-only sequence ${index + 1}.`);
    if (!event.from_version_id || !event.to_version_id || event.from_version_id === event.to_version_id) errors.push(`${event.event_id} needs distinct source and destination versions.`);
    if (!event.summary.trim() || event.changed_records.length === 0) errors.push(`${event.event_id} needs a summary and changed records.`);
    if (index > 0 && events[index - 1].to_version_id !== event.from_version_id) errors.push(`${event.event_id} must continue the prior version chain.`);
    const serializedKeys = Object.keys(event).concat(event.changed_records.flatMap((record) => Object.keys(record)));
    if (serializedKeys.some((key) => forbiddenScoreKeys.test(key))) errors.push(`${event.event_id} must not carry score fields.`);
  }
  return errors;
}
