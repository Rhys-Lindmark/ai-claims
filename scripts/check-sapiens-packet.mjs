import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const packet = JSON.parse(await readFile(new URL('../data/books/sapiens.json', import.meta.url), 'utf8'));

assert.equal(packet.schema_version, 'ai-claims.book-review/0.2.0');
assert.equal(packet.entity_key, 'goodreads:23692271');
assert.equal(packet.review_state, 'claim_inventory');
assert.equal(packet.score_0_100, null);
assert.equal(packet.publication_gates_passed, false);
assert.equal(packet.last_reviewed_at, null);
assert.deepEqual(packet.coverage, { candidate_claims: 6, eligible_claims: 0, reviewed_claims: 0 });
assert.equal(packet.claims.length, 6);
assert.equal(new Set(packet.claims.map((claim) => claim.claim_id)).size, 6);
assert.ok(packet.claims.every((claim) => claim.review_state === 'unreviewed'));
assert.ok(packet.claims.every((claim) => claim.eligibility_state === 'needs_passage_confirmation'));
assert.ok(packet.claims.every((claim) => claim.passage_locator === null));
assert.ok(packet.claims.filter((claim) => claim.claim_id !== 'sapiens-claim-02').every((claim) => claim.evidence_record_ids.length === 0));
assert.ok(packet.claims.every((claim) => !('verdict' in claim) && !('truth_credit' in claim) && !('denominator_weight' in claim)));

const groupIds = new Set(packet.claims.map((claim) => claim.canonical_group_id));
assert.equal(groupIds.size, 6);
assert.ok(packet.dependencies.every((edge) => groupIds.has(edge.from_group_id) && groupIds.has(edge.to_group_id) && edge.from_group_id !== edge.to_group_id));

const sourceIds = new Set(packet.sources.map((source) => source.source_id));
assert.equal(sourceIds.size, packet.sources.length);
assert.ok(packet.sources.every((source) => source.url.startsWith('https://')));
assert.ok(packet.claims.every((claim) => claim.source_ids.length > 0 && claim.source_ids.every((sourceId) => sourceIds.has(sourceId))));
assert.ok(packet.sources.some((source) => source.independence === 'independent'));
assert.ok(packet.sources.filter((source) => source.independence === 'independent').every((source) => source.assessment_state !== 'attribution_only'));
assert.equal(packet.evidence_records.length, 4);
const evidenceIds = new Set(packet.evidence_records.map((evidence) => evidence.evidence_id));
assert.equal(evidenceIds.size, packet.evidence_records.length);
assert.deepEqual(packet.claims.find((claim) => claim.claim_id === 'sapiens-claim-02').evidence_record_ids, [...evidenceIds]);
assert.ok(packet.evidence_records.every((evidence) => evidence.claim_id === 'sapiens-claim-02'));
assert.ok(packet.evidence_records.every((evidence) => sourceIds.has(evidence.source_id)));
assert.ok(packet.evidence_records.every((evidence) => ['supports', 'complicates'].includes(evidence.direction)));
assert.equal(packet.evidence_records.filter((evidence) => evidence.direction === 'supports').length, 2);
assert.equal(packet.evidence_records.filter((evidence) => evidence.direction === 'complicates').length, 2);
assert.ok(packet.evidence_records.every((evidence) => evidence.finding.length > 80 && evidence.scope_and_limits.length > 80));
assert.ok(packet.evidence_records.every((evidence) => evidence.review_state === 'machine_draft_unreviewed'));
assert.ok(packet.evidence_records.every((evidence) => evidence.evidence_basis === 'sourced'));
assert.ok(packet.evidence_records.every((evidence) => evidence.confidence === 'medium'));
assert.ok(packet.evidence_records.every((evidence) => evidence.last_verified_at === '2026-08-31'));
assert.ok(!JSON.stringify(packet).match(/"score_0_100":\s*\d/));

console.log('Sapiens packet: 6 passage-unconfirmed candidates, 12 sources, 4 bounded evidence records, aggregate score locked');
