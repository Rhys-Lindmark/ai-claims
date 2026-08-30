export type SourceState = 'active' | 'corrected' | 'retracted' | 'unavailable';
export interface SourceStatusEvent { event_id: string; state: SourceState; detected_at: string; reviewed_by: string; reason: string; replacement_source_id: string | null; }
export interface EvidenceSourceStatus { source_id: string; title: string; current_state: SourceState; events: SourceStatusEvent[]; dependent_finding_ids: string[]; published_analysis_version_ids: string[]; }
export function sourceWarnings(records: EvidenceSourceStatus[]) { return records.flatMap((record) => record.current_state === 'active' ? [] : record.dependent_finding_ids.map((finding_id) => ({ source_id: record.source_id, finding_id, state: record.current_state, reason: record.events.at(-1)?.reason ?? 'Source status changed.' }))); }
