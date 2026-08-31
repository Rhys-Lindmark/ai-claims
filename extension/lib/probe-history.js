const STATES = new Set(['reviewed', 'pending', 'not_analyzed', 'invalid', 'error']);
const KINDS = new Set(['youtube', 'goodreads', 'web', 'unsupported']);

export const PROBE_HISTORY_LIMIT = 5;
export const PROBE_HISTORY_RECEIPT_SCHEMA = 'ai-claims.probe-history-receipt/1.0.0';

function validEntry(entry) {
  return entry && STATES.has(entry.state) && KINDS.has(entry.kind)
    ? { state: entry.state, kind: entry.kind }
    : null;
}

export function parseProbeHistory(rawValue) {
  try {
    const parsed = JSON.parse(rawValue ?? '[]');
    return Array.isArray(parsed) ? parsed.map(validEntry).filter(Boolean).slice(0, PROBE_HISTORY_LIMIT) : [];
  } catch {
    return [];
  }
}

export function addProbeHistory(history, result) {
  const entry = validEntry({ state: result?.state, kind: result?.identity?.kind });
  if (!entry) return parseProbeHistory(JSON.stringify(history));
  return [entry, ...parseProbeHistory(JSON.stringify(history))].slice(0, PROBE_HISTORY_LIMIT);
}

export function probeHistoryReceipt(history) {
  return {
    schema_version: PROBE_HISTORY_RECEIPT_SCHEMA,
    storage_scope: 'browser-local',
    retention_limit: PROBE_HISTORY_LIMIT,
    retained_fields: ['kind', 'state'],
    identity_fields_retained: false,
    entries: parseProbeHistory(JSON.stringify(history)),
  };
}
