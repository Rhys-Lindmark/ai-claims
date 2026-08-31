import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const packet = JSON.parse(await readFile(new URL('../data/books/guns-germs-and-steel.json', import.meta.url), 'utf8'));

assert.equal(packet.schema_version, 'ai-claims.book-review/0.2.0');
assert.equal(packet.evidence_method_version, 'source-note/0.1.0');
assert.equal(packet.entity_key, 'goodreads:1842');
assert.equal(packet.review_state, 'claim_inventory');
assert.equal(packet.score_0_100, null);
assert.equal(packet.publication_gates_passed, false);
assert.equal(packet.last_reviewed_at, null);
assert.deepEqual(packet.coverage, { candidate_claims: 8, eligible_claims: 0, reviewed_claims: 0 });
assert.ok(packet.score_hidden_reason.length > 30);
assert.equal(packet.claims.length, 8);
assert.equal(new Set(packet.claims.map((claim) => claim.claim_id)).size, packet.claims.length);
assert.ok(packet.claims.every((claim) => claim.review_state === 'unreviewed'));
assert.ok(packet.claims.every((claim) => claim.eligibility_state === 'needs_passage_confirmation'));
assert.ok(packet.claims.every((claim) => claim.passage_locator === null));
assert.ok(packet.claims.every((claim) => typeof claim.canonical_group_id === 'string' && claim.canonical_group_id.length > 10));
assert.equal(new Set(packet.claims.map((claim) => claim.canonical_group_id)).size, packet.claims.length);
assert.ok(packet.claims.every((claim) => Array.isArray(claim.evidence_record_ids)));
assert.ok(packet.claims.every((claim) => !('verdict' in claim) && !('truth_credit' in claim)));

const eligibleClaims = packet.claims.filter((claim) => claim.eligibility_state === 'eligible');
assert.equal(eligibleClaims.length, packet.coverage.eligible_claims);
assert.equal(packet.claims.filter((claim) => claim.review_state === 'reviewed').length, packet.coverage.reviewed_claims);
assert.ok(packet.claims.filter((claim) => claim.eligibility_state !== 'eligible').every((claim) => !('denominator_weight' in claim)));

const groupIds = new Set(packet.claims.map((claim) => claim.canonical_group_id));
assert.ok(packet.dependencies.length > 0);
assert.ok(packet.dependencies.every((edge) => groupIds.has(edge.from_group_id) && groupIds.has(edge.to_group_id)));
assert.ok(packet.dependencies.every((edge) => edge.from_group_id !== edge.to_group_id));

const evidenceIds = new Set(packet.evidence_records.map((record) => record.evidence_id));
assert.equal(evidenceIds.size, packet.evidence_records.length);
assert.equal(packet.evidence_records.length, 25);
assert.ok(packet.claims.every((claim) => claim.evidence_record_ids.every((evidenceId) => evidenceIds.has(evidenceId))));
assert.ok(packet.evidence_records.every((record) => ['supports', 'complicates', 'contradicts'].includes(record.direction)));
assert.ok(packet.evidence_records.every((record) => record.finding.length > 50 && record.scope_and_limits.length > 50));
assert.ok(packet.evidence_records.every((record) => record.review_state === 'machine_draft_unreviewed'));
assert.ok(packet.evidence_records.every((record) => record.evidence_basis === 'sourced'));
assert.ok(packet.evidence_records.every((record) => ['low', 'medium', 'high'].includes(record.confidence)));
assert.ok(packet.evidence_records.every((record) => /^2026-08-(30|31)$/.test(record.last_verified_at)));
const axisClaims = packet.claims.filter((claim) => ['ggs-claim-03', 'ggs-claim-07', 'ggs-claim-08'].includes(claim.claim_id));
assert.equal(axisClaims.length, 3);
assert.deepEqual(axisClaims.map((claim) => claim.evidence_record_ids.length), [15, 1, 1]);
assert.equal(packet.evidence_records.find((record) => record.claim_id === 'ggs-claim-03').direction, 'complicates');
assert.equal(packet.evidence_records.find((record) => record.claim_id === 'ggs-claim-07').direction, 'supports');
assert.equal(packet.evidence_records.find((record) => record.claim_id === 'ggs-claim-08').direction, 'supports');

const sourceIds = new Set(packet.sources.map((source) => source.source_id));
assert.equal(sourceIds.size, packet.sources.length);
assert.ok(packet.sources.every((source) => source.url.startsWith('https://')));
assert.ok(packet.claims.every((claim) => claim.source_ids.length > 0 && claim.source_ids.every((sourceId) => sourceIds.has(sourceId))));
assert.ok(packet.evidence_records.every((record) => sourceIds.has(record.source_id)));
assert.ok(packet.evidence_records.every((record) => packet.claims.some((claim) => claim.claim_id === record.claim_id)));
assert.ok(packet.sources.some((source) => source.independence === 'independent'));
assert.ok(packet.sources.filter((source) => source.independence === 'independent').every((source) => source.assessment_state !== 'attribution_only'));

const serialized = JSON.stringify(packet);
assert.ok(!serialized.match(/"score_0_100":\s*\d/));
assert.equal(packet.evidence_records.filter((record) => record.claim_id === 'ggs-claim-03' && record.direction === 'supports').length, 2);
assert.equal(packet.evidence_records.filter((record) => record.claim_id === 'ggs-claim-03' && record.direction === 'complicates').length, 13);
assert.equal(packet.evidence_records.filter((record) => record.claim_id === 'ggs-claim-04' && record.direction === 'supports').length, 2);
assert.equal(packet.evidence_records.filter((record) => record.claim_id === 'ggs-claim-04' && record.direction === 'complicates').length, 3);
console.log('real book packet: 8 passage-unconfirmed candidates, 25 scoped evidence records, aggregate score locked');
