import assert from 'node:assert/strict';
import fixture from '../data/claim-selection-audit-fixture.json' with { type: 'json' };
import { selectionAuditSummary, validateClaimSelectionAudit } from '../lib/claim-selection-audit.ts';

assert.deepEqual(validateClaimSelectionAudit(fixture.samples), []);
const summary = selectionAuditSummary(fixture.samples);
assert.deepEqual(summary.counts, { true_positive: 2, false_positive: 2, false_negative: 1, true_negative: 1 });
assert.equal(summary.sample_size, 6);
assert.equal(summary.sample_precision, 0.5);
assert.equal(summary.sample_recall, 2 / 3);
console.log('Claim-selection audit fixture passed.');
