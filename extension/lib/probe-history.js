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

function canonicalValue(value) {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalValue(value[key])]));
  return value;
}

async function digestReceipt(receipt, cryptoImpl) {
  const bytes = new TextEncoder().encode(JSON.stringify(canonicalValue(receipt)));
  const digest = await cryptoImpl.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function probeHistoryReceiptArtifact(history, cryptoImpl = globalThis.crypto) {
  const receipt = probeHistoryReceipt(history);
  const digestHex = await digestReceipt(receipt, cryptoImpl);
  const document = { ...receipt, integrity: { algorithm: 'SHA-256', canonicalization: 'recursive-key-sort-json-utf8', digest_scope: 'receipt_without_integrity', digest_hex: digestHex } };
  return { filename: 'ai-claims-probe-history-receipt.json', content: `${JSON.stringify(document, null, 2)}\n`, mimeType: 'application/json', digestHex };
}

export async function verifyProbeHistoryReceiptDocument(jsonText, cryptoImpl = globalThis.crypto) {
  let document;
  try { document = JSON.parse(jsonText); } catch { return { state: 'invalid', reason: 'The receipt is not valid JSON.' }; }
  const integrity = document?.integrity;
  if (integrity?.algorithm !== 'SHA-256' || integrity?.canonicalization !== 'recursive-key-sort-json-utf8' || integrity?.digest_scope !== 'receipt_without_integrity') return { state: 'unsupported', reason: 'The receipt uses an unsupported integrity format.' };
  if (document.schema_version !== PROBE_HISTORY_RECEIPT_SCHEMA) return { state: 'unsupported', reason: `Receipt schema ${document.schema_version ?? 'missing'} is not supported.` };
  const allowedKeys = ['entries', 'identity_fields_retained', 'integrity', 'retained_fields', 'retention_limit', 'schema_version', 'storage_scope'];
  const exactShape = Object.keys(document).sort().join('|') === allowedKeys.join('|')
    && document.storage_scope === 'browser-local'
    && document.retention_limit === PROBE_HISTORY_LIMIT
    && document.identity_fields_retained === false
    && JSON.stringify(document.retained_fields) === JSON.stringify(['kind', 'state'])
    && Array.isArray(document.entries)
    && document.entries.length <= PROBE_HISTORY_LIMIT
    && document.entries.every((entry) => Object.keys(entry).sort().join('|') === 'kind|state' && validEntry(entry));
  if (!exactShape) return { state: 'overbroad', reason: 'The receipt contains fields or values outside the identity-free history schema.' };
  const { integrity: _ignored, ...receipt } = document;
  const expected = await digestReceipt(receipt, cryptoImpl);
  if (integrity.digest_hex !== expected) return { state: 'altered', reason: 'The receipt does not match its SHA-256 integrity digest.' };
  return { state: 'valid', reason: 'The receipt is intact and contains only page-kind and outcome categories.', digestHex: expected };
}
