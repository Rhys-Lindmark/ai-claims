import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const packet = JSON.parse(await readFile(new URL('../data/books/guns-germs-and-steel.json', import.meta.url), 'utf8'));

assert.equal(packet.schema_version, 'ai-claims.book-review/0.1.0');
assert.equal(packet.entity_key, 'goodreads:1842');
assert.equal(packet.review_state, 'claim_inventory');
assert.equal(packet.score_0_100, null);
assert.equal(packet.publication_gates_passed, false);
assert.equal(packet.last_reviewed_at, null);
assert.ok(packet.score_hidden_reason.length > 30);
assert.equal(packet.claims.length, 6);
assert.equal(new Set(packet.claims.map((claim) => claim.claim_id)).size, packet.claims.length);
assert.ok(packet.claims.every((claim) => claim.review_state === 'unreviewed'));
assert.ok(packet.claims.every((claim) => !('verdict' in claim) && !('truth_credit' in claim)));

const sourceIds = new Set(packet.sources.map((source) => source.source_id));
assert.equal(sourceIds.size, packet.sources.length);
assert.ok(packet.sources.every((source) => source.url.startsWith('https://')));
assert.ok(packet.claims.every((claim) => claim.source_ids.length > 0 && claim.source_ids.every((sourceId) => sourceIds.has(sourceId))));
assert.ok(packet.sources.some((source) => source.independence === 'independent'));
assert.ok(packet.sources.filter((source) => source.independence === 'independent').every((source) => source.assessment_state !== 'attribution_only'));

const serialized = JSON.stringify(packet);
assert.ok(!serialized.match(/"score_0_100":\s*\d/));
console.log('real book packet: 6 provisional claims, 7 sources, aggregate score locked');
