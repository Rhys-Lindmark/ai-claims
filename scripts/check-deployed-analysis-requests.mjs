import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const claimsBase = (process.argv[2] ?? 'https://ai.rhyslindmark.com/claims').replace(/\/$/, '');
const endpoint = `${claimsBase}/api/v1/analysis-requests`;
const input = { contract_version: '1.0.0', entity_key: 'web:request-fixture.invalid/article', canonical_url: 'https://request-fixture.invalid/article', page_kind: 'web' };
const expectedId = `req_${createHash('sha256').update(`1.0.0:${input.entity_key}`).digest('hex')}`;

const submit = () => fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input) });
const firstResponse = await submit();
assert.ok([200, 201].includes(firstResponse.status));
assert.equal(firstResponse.headers.get('access-control-allow-origin'), '*');
assert.equal(firstResponse.headers.get('cache-control'), 'no-store');
assert.equal(firstResponse.headers.get('x-ai-claims-contract'), '1.0.0');
const first = await firstResponse.json();
assert.equal(first.contract_version, '1.0.0');
assert.equal(first.analysis_request.request_id, expectedId);
assert.equal(first.analysis_request.entity_key, input.entity_key);
assert.equal(first.analysis_request.state, 'queued');
assert.equal(first.analysis_request.attempt, 1);
assert.equal(first.lifecycle_events.length, 1);
assert.deepEqual(first.lifecycle_events[0], {
  event_id: `${expectedId}_1`, contract_version: '1.0.0', request_id: expectedId, sequence: 1, from_state: null, to_state: 'queued', attempt: 1, public_summary: 'Canonical page added to the public analysis queue.', occurred_at: first.analysis_request.created_at,
});

const duplicateResponse = await submit();
assert.equal(duplicateResponse.status, 200);
const duplicate = await duplicateResponse.json();
assert.equal(duplicate.created, false);
assert.deepEqual(duplicate.analysis_request, first.analysis_request);
assert.deepEqual(duplicate.lifecycle_events, first.lifecycle_events);

const entityResponse = await fetch(`${endpoint}?entity_key=${encodeURIComponent(input.entity_key)}`);
assert.equal(entityResponse.status, 200);
assert.deepEqual((await entityResponse.json()).analysis_request, first.analysis_request);

const idResponse = await fetch(`${endpoint}/${expectedId}`);
assert.equal(idResponse.status, 200);
const id = await idResponse.json();
assert.deepEqual(id.analysis_request, first.analysis_request);
assert.deepEqual(id.lifecycle_events, first.lifecycle_events);

const statusPage = await fetch(`${claimsBase}/request?request_id=${expectedId}`);
assert.equal(statusPage.status, 200);
assert.match(await statusPage.text(), /A RECEIPT, NOT A PROMISE/);

const broaderResponse = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...input, page_title: 'Must be rejected' }) });
assert.equal(broaderResponse.status, 400);
assert.match((await broaderResponse.json()).error, /Page text, titles, and account data are not accepted/);

const mismatchResponse = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...input, entity_key: 'web:request-fixture.invalid/other' }) });
assert.equal(mismatchResponse.status, 400);
const malformedResponse = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{' });
assert.equal(malformedResponse.status, 400);
assert.equal((await fetch(`${endpoint}?entity_key=${encodeURIComponent('web:missing-request.invalid')}`)).status, 404);
assert.equal((await fetch(`${endpoint}/not-a-request`)).status, 400);

const optionsResponse = await fetch(endpoint, { method: 'OPTIONS' });
assert.equal(optionsResponse.status, 204);
assert.match(optionsResponse.headers.get('access-control-allow-methods') ?? '', /POST/);

console.log(`Analysis request lifecycle passed: ${expectedId} · canonical duplicate reused · public receipt route live · privacy rejections enforced`);
