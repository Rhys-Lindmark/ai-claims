import assert from 'node:assert/strict';
import test from 'node:test';
import { ANALYSIS_REQUEST_CONTRACT_VERSION, analysisRequestId, getAnalysisRequestById, submitAnalysisRequest, validateAnalysisRequestInput } from './analysis-request-store.ts';

const input = { contract_version: ANALYSIS_REQUEST_CONTRACT_VERSION, entity_key: 'web:example.com/article', canonical_url: 'https://example.com/article', page_kind: 'web' as const };

function memoryD1() {
  const rows = new Map<string, Record<string, unknown>>();
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
        async run() {
          if (!sql.startsWith('INSERT OR IGNORE')) throw new Error('Unexpected test query.');
          const [request_id, contract_version, entity_key, canonical_url, page_kind, state, attempt, created_at, updated_at] = values;
          if ([...rows.values()].some((row) => row.entity_key === entity_key)) return { meta: { changes: 0 } };
          rows.set(String(request_id), { request_id, contract_version, entity_key, canonical_url, page_kind, state, attempt, created_at, updated_at });
          return { meta: { changes: 1 } };
        },
      };
    },
  };
  return { db: db as unknown as D1Database, rows };
}

test('analysis request input accepts canonical identity and rejects broader payloads', () => {
  assert.equal(validateAnalysisRequestInput(input).ok, true);
  assert.match(validateAnalysisRequestInput({ ...input, page_title: 'Private title' }).error, /Page text, titles, and account data are not accepted/);
  assert.match(validateAnalysisRequestInput({ ...input, entity_key: 'web:example.com/other' }).error, /do not describe the same page/);
  assert.match(validateAnalysisRequestInput({ ...input, canonical_url: 'https://example.com/article?utm_source=x' }).error, /do not describe the same page/);
});

test('analysis request IDs and D1 submissions are deterministic by canonical entity', async () => {
  const firstId = await analysisRequestId(input.entity_key);
  assert.match(firstId, /^req_[0-9a-f]{64}$/);
  assert.equal(firstId, await analysisRequestId(input.entity_key));
  assert.notEqual(firstId, await analysisRequestId('web:example.com/other'));

  const { db, rows } = memoryD1();
  const first = await submitAnalysisRequest(db, input, () => '2026-08-31T00:00:00Z');
  const duplicate = await submitAnalysisRequest(db, input, () => '2026-08-31T01:00:00Z');
  assert.equal(first.created, true);
  assert.equal(duplicate.created, false);
  assert.equal(rows.size, 1);
  assert.deepEqual(duplicate.record, first.record);
  assert.equal((await getAnalysisRequestById(db, firstId))?.entity_key, input.entity_key);
});
