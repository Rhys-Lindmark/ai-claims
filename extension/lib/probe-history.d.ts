import type { ResolverProbeResult } from './resolver-probe.js';

export type ProbeHistoryEntry = {
  state: 'reviewed' | 'pending' | 'not_analyzed' | 'invalid' | 'error';
  kind: 'youtube' | 'goodreads' | 'web' | 'unsupported';
};
export const PROBE_HISTORY_LIMIT: 5;
export function parseProbeHistory(rawValue: string | null | undefined): ProbeHistoryEntry[];
export function addProbeHistory(history: ProbeHistoryEntry[], result: ResolverProbeResult): ProbeHistoryEntry[];
