import type { ResolverProbeResult } from './resolver-probe.js';

export type ProbeHistoryEntry = {
  state: 'reviewed' | 'pending' | 'not_analyzed' | 'invalid' | 'error';
  kind: 'youtube' | 'goodreads' | 'web' | 'unsupported';
};
export const PROBE_HISTORY_LIMIT: 5;
export const PROBE_HISTORY_RECEIPT_SCHEMA: 'ai-claims.probe-history-receipt/1.0.0';
export function parseProbeHistory(rawValue: string | null | undefined): ProbeHistoryEntry[];
export function addProbeHistory(history: ProbeHistoryEntry[], result: ResolverProbeResult): ProbeHistoryEntry[];
export function probeHistoryReceipt(history: ProbeHistoryEntry[]): { schema_version: typeof PROBE_HISTORY_RECEIPT_SCHEMA; storage_scope: 'browser-local'; retention_limit: 5; retained_fields: ['kind', 'state']; identity_fields_retained: false; entries: ProbeHistoryEntry[] };
