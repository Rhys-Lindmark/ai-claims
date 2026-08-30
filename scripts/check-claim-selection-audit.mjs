import assert from 'node:assert/strict';
import fixture from '../data/claim-selection-audit-fixture.json' with { type: 'json' };
import { selectionAuditSummary, validateClaimSelectionAudit } from '../lib/claim-selection-audit.ts';
import samplingFixture from '../data/claim-selection-sampling-frame-fixture.json' with { type: 'json' };
import { claimSelectionSamplingDecision, validateClaimSelectionSamplingFrame } from '../lib/claim-selection-sampling.ts';

assert.deepEqual(validateClaimSelectionAudit(fixture.samples), []);
const summary = selectionAuditSummary(fixture.samples);
assert.deepEqual(summary.counts, { true_positive: 2, false_positive: 2, false_negative: 1, true_negative: 1 });
assert.equal(summary.sample_size, 6);
assert.equal(summary.sample_precision, 0.5);
assert.equal(summary.sample_recall, 2 / 3);
assert.deepEqual(validateClaimSelectionSamplingFrame(samplingFixture), []);
const samplingDecision = claimSelectionSamplingDecision(samplingFixture);
assert.equal(samplingDecision.metrics_publishable, false);
assert.match(samplingDecision.blockers.join(' '), /12 are required/);
assert.match(samplingDecision.blockers.join(' '), /Unknown \/ overlap/);
assert.match(samplingDecision.blockers.join(' '), /Low confidence/);
console.log('Claim-selection audit fixture passed.');
