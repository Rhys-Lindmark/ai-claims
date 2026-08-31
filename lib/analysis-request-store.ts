import { identifyPage } from '../extension/lib/page-identity.js';

export const ANALYSIS_REQUEST_CONTRACT_VERSION = '1.0.0';
export const ANALYSIS_REQUEST_STATES = ['queued', 'in_review', 'published', 'failed'] as const;
export type AnalysisRequestState = (typeof ANALYSIS_REQUEST_STATES)[number];

export type AnalysisRequestRecord = {
  request_id: string;
  contract_version: string;
  entity_key: string;
  canonical_url: string;
  page_kind: 'youtube' | 'goodreads' | 'web';
  state: AnalysisRequestState;
  attempt: number;
  created_at: string;
  updated_at: string;
};

export type AnalysisRequestInput = Pick<AnalysisRequestRecord, 'contract_version' | 'entity_key' | 'canonical_url' | 'page_kind'>;

export type AnalysisRequestEvent = {
  event_id: string;
  contract_version: string;
  request_id: string;
  sequence: number;
  from_state: AnalysisRequestState | null;
  to_state: AnalysisRequestState;
  attempt: number;
  public_summary: string;
  occurred_at: string;
};

const allowedInputKeys = new Set(['contract_version', 'entity_key', 'canonical_url', 'page_kind']);

export function validateAnalysisRequestInput(value: unknown): { ok: true; input: AnalysisRequestInput } | { ok: false; error: string } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { ok: false, error: 'A JSON object is required.' };
  const object = value as Record<string, unknown>;
  const unexpected = Object.keys(object).filter((key) => !allowedInputKeys.has(key));
  if (unexpected.length) return { ok: false, error: `Unsupported request field: ${unexpected[0]}. Page text, titles, and account data are not accepted.` };
  if (object.contract_version !== ANALYSIS_REQUEST_CONTRACT_VERSION) return { ok: false, error: `Contract version ${ANALYSIS_REQUEST_CONTRACT_VERSION} is required.` };
  if (typeof object.entity_key !== 'string' || !object.entity_key || object.entity_key.length > 2048) return { ok: false, error: 'A bounded canonical entity key is required.' };
  if (typeof object.canonical_url !== 'string' || !object.canonical_url || object.canonical_url.length > 2048) return { ok: false, error: 'A bounded canonical URL is required.' };
  if (!['youtube', 'goodreads', 'web'].includes(String(object.page_kind))) return { ok: false, error: 'Page kind must be youtube, goodreads, or web.' };
  const identity = identifyPage(object.canonical_url);
  if (identity.entityKey !== object.entity_key || identity.canonicalUrl !== object.canonical_url || identity.kind !== object.page_kind) return { ok: false, error: 'The canonical URL, entity key, and page kind do not describe the same page.' };
  return { ok: true, input: object as AnalysisRequestInput };
}

export async function analysisRequestId(entityKey: string) {
  const bytes = new TextEncoder().encode(`${ANALYSIS_REQUEST_CONTRACT_VERSION}:${entityKey}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return `req_${[...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}

export async function getAnalysisRequestByEntity(db: D1Database, entityKey: string) {
  return db.prepare('SELECT request_id, contract_version, entity_key, canonical_url, page_kind, state, attempt, created_at, updated_at FROM analysis_requests WHERE entity_key = ? LIMIT 1').bind(entityKey).first<AnalysisRequestRecord>();
}

export async function getAnalysisRequestById(db: D1Database, requestId: string) {
  return db.prepare('SELECT request_id, contract_version, entity_key, canonical_url, page_kind, state, attempt, created_at, updated_at FROM analysis_requests WHERE request_id = ? LIMIT 1').bind(requestId).first<AnalysisRequestRecord>();
}

export async function getAnalysisRequestLifecycle(db: D1Database, requestId: string) {
  const result = await db.prepare('SELECT event_id, contract_version, request_id, sequence, from_state, to_state, attempt, public_summary, occurred_at FROM analysis_request_events WHERE request_id = ? ORDER BY sequence ASC').bind(requestId).all<AnalysisRequestEvent>();
  return result.results ?? [];
}

export async function getAnalysisRequestStatus(db: D1Database, requestId: string) {
  const record = await getAnalysisRequestById(db, requestId);
  if (!record) return null;
  return { record, lifecycle_events: await getAnalysisRequestLifecycle(db, requestId) };
}

export async function submitAnalysisRequest(db: D1Database, input: AnalysisRequestInput, now = () => new Date().toISOString()) {
  const timestamp = now();
  const requestId = await analysisRequestId(input.entity_key);
  const result = await db.prepare('INSERT OR IGNORE INTO analysis_requests (request_id, contract_version, entity_key, canonical_url, page_kind, state, attempt, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(requestId, input.contract_version, input.entity_key, input.canonical_url, input.page_kind, 'queued', 1, timestamp, timestamp).run();
  const record = await getAnalysisRequestByEntity(db, input.entity_key);
  if (!record) throw new Error('The analysis request could not be read after submission.');
  await db.prepare('INSERT OR IGNORE INTO analysis_request_events (event_id, contract_version, request_id, sequence, from_state, to_state, attempt, public_summary, occurred_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(`${record.request_id}_1`, ANALYSIS_REQUEST_CONTRACT_VERSION, record.request_id, 1, null, 'queued', record.attempt, 'Canonical page added to the public analysis queue.', record.created_at).run();
  return { created: Number(result.meta.changes ?? 0) === 1, record, lifecycle_events: await getAnalysisRequestLifecycle(db, record.request_id) };
}
