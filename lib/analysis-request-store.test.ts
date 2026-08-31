import assert from 'node:assert/strict';
import test from 'node:test';
import { ANALYSIS_REQUEST_CONTRACT_VERSION, analysisRequestId, getAnalysisRequestById, getAnalysisRequestLifecycle, submitAnalysisRequest, transitionAnalysisRequest, validateAnalysisRequestInput } from './analysis-request-store.ts';

const input = { contract_version: ANALYSIS_REQUEST_CONTRACT_VERSION, entity_key: 'web:example.com/article', canonical_url: 'https://example.com/article', page_kind: 'web' as const };

function memoryD1() {
  const rows = new Map<string, Record<string, unknown>>();
  const events = new Map<string, Record<string, unknown>>();
  const db = {
    prepare(sql: string) {
      let values: unknown[] = [];
      return {
        bind(...bound: unknown[]) { values = bound; return this; },
        async first() {
          if (sql.includes('WHERE entity_key')) return [...rows.values()].find((row) => row.entity_key === values[0]) ?? null;
          if (sql.includes('WHERE request_id')) return rows.get(String(values[0])) ?? null;
          return null;
        },
        async all() {
          if (!sql.includes('FROM analysis_request_events')) throw new Error('Unexpected test query.');
          return { results: [...events.values()].filter((row) => row.request_id === values[0]).sort((a, b) => Number(a.sequence) - Number(b.sequence)) };
        },
        async run() {
          if (sql.startsWith('UPDATE analysis_requests')) {
            const [state, attempt, updated_at, request_id, expected_state, expected_attempt] = values;
            const row = rows.get(String(request_id));
            if (!row || row.state !== expected_state || row.attempt !== expected_attempt) return { meta: { changes: 0 } };
            rows.set(String(request_id), { ...row, state, attempt, updated_at });
            return { meta: { changes: 1 } };
          }
          if (sql.includes('INTO analysis_request_events')) {
            const [event_id, contract_version, request_id, sequence, from_state, to_state, attempt, public_summary, occurred_at] = values;
            if (sql.includes('WHERE EXISTS')) {
              const row = rows.get(String(request_id));
              if (!row || row.state !== values[10] || row.attempt !== values[11] || row.updated_at !== values[12]) return { meta: { changes: 0 } };
            }
            if (events.has(String(event_id))) return { meta: { changes: 0 } };
            events.set(String(event_id), { event_id, contract_version, request_id, sequence, from_state, to_state, attempt, public_summary, occurred_at });
            return { meta: { changes: 1 } };
          }
          if (!sql.startsWith('INSERT OR IGNORE')) throw new Error('Unexpected test query.');
          const [request_id, contract_version, entity_key, canonical_url, page_kind, state, attempt, created_at, updated_at] = values;
          if ([...rows.values()].some((row) => row.entity_key === entity_key)) return { meta: { changes: 0 } };
          rows.set(String(request_id), { request_id, contract_version, entity_key, canonical_url, page_kind, state, attempt, created_at, updated_at });
          return { meta: { changes: 1 } };
        },
      };
    },
    async batch(statements: Array<{ run(): Promise<unknown> }>) { return Promise.all(statements.map((statement) => statement.run())); },
  };
  return { db: db as unknown as D1Database, rows, events };
}

test('analysis request input accepts canonical identity and rejects broader payloads', () => {
  assert.equal(validateAnalysisRequestInput(input).ok, true);
  assert.match(validateAnalysisRequestInput({ ...input, page_title: 'Private title' }).error, /Page text, titles, and account data are not accepted/);
  assert.match(validateAnalysisRequestInput({ ...input, entity_key: 'web:example.com/other' }).error, /do not describe the same page/);
  assert.match(validateAnalysisRequestInput({ ...input, canonical_url: 'https://example.com/article?utm_source=x' }).error, /do not describe the same page/);
});

test('request transitions enforce guarded edges and append retry attempts', async () => {
  const { db } = memoryD1();
  const submitted = await submitAnalysisRequest(db, input, () => '2026-08-31T00:00:00Z');
  assert.equal((await transitionAnalysisRequest(db, submitted.record.request_id, 'published')).error, 'invalid_transition');
  const reviewing = await transitionAnalysisRequest(db, submitted.record.request_id, 'in_review', () => '2026-08-31T01:00:00Z');
  assert.equal(reviewing.ok, true);
  assert.equal(reviewing.record?.state, 'in_review');
  assert.equal(reviewing.lifecycle_events?.length, 2);
  const failed = await transitionAnalysisRequest(db, submitted.record.request_id, 'failed', () => '2026-08-31T02:00:00Z');
  assert.equal(failed.ok, true);
  assert.equal(failed.record?.attempt, 1);
  const retried = await transitionAnalysisRequest(db, submitted.record.request_id, 'queued', () => '2026-08-31T03:00:00Z');
  assert.equal(retried.ok, true);
  assert.equal(retried.record?.attempt, 2);
  assert.deepEqual(retried.lifecycle_events?.map((event) => [event.sequence, event.from_state, event.to_state, event.attempt]), [[1, null, 'queued', 1], [2, 'queued', 'in_review', 1], [3, 'in_review', 'failed', 1], [4, 'failed', 'queued', 2]]);
  assert.equal((await transitionAnalysisRequest(db, submitted.record.request_id, 'queued')).error, 'invalid_transition');
  assert.equal((await transitionAnalysisRequest(db, 'req_'.padEnd(68, '0'), 'in_review')).error, 'not_found');
});

test('analysis request IDs and D1 submissions are deterministic by canonical entity', async () => {
  const firstId = await analysisRequestId(input.entity_key);
  assert.match(firstId, /^req_[0-9a-f]{64}$/);
  assert.equal(firstId, await analysisRequestId(input.entity_key));
  assert.notEqual(firstId, await analysisRequestId('web:example.com/other'));

  const { db, rows, events } = memoryD1();
  const first = await submitAnalysisRequest(db, input, () => '2026-08-31T00:00:00Z');
  const duplicate = await submitAnalysisRequest(db, input, () => '2026-08-31T01:00:00Z');
  assert.equal(first.created, true);
  assert.equal(duplicate.created, false);
  assert.equal(rows.size, 1);
  assert.equal(events.size, 1);
  assert.deepEqual(duplicate.record, first.record);
  assert.deepEqual(duplicate.lifecycle_events, first.lifecycle_events);
  assert.deepEqual(await getAnalysisRequestLifecycle(db, firstId), [{
    event_id: `${firstId}_1`, contract_version: ANALYSIS_REQUEST_CONTRACT_VERSION, request_id: firstId, sequence: 1, from_state: null, to_state: 'queued', attempt: 1, public_summary: 'Canonical page added to the public analysis queue.', occurred_at: '2026-08-31T00:00:00Z',
  }]);
  assert.equal((await getAnalysisRequestById(db, firstId))?.entity_key, input.entity_key);
});
