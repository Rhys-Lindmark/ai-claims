import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const catalog = JSON.parse(await readFile(new URL('../data/rapid-books.json', import.meta.url), 'utf8'));
const audit = JSON.parse(await readFile(new URL('../data/audits/rapid-books-source-audit.json', import.meta.url), 'utf8'));
const calibration = JSON.parse(await readFile(new URL('../data/audits/rapid-book-calibration-sample.json', import.meta.url), 'utf8'));
const citedUrls = new Set(catalog.books.flatMap((book) => book.claims.flatMap((claim) => claim.sources.map((source) => source.url))));
const auditedUrls = new Set(audit.results.map((result) => result.url));

assert.equal(audit.schema_version, 'ai-claims.rapid-book-source-audit/0.1.0');
assert.equal(audit.catalog_method_version, catalog.method_version);
assert.equal(audit.catalog_last_updated, catalog.last_updated);
assert.equal(audit.summary.books, catalog.books.length);
assert.equal(audit.summary.claims, catalog.books.length * 3);
assert.equal(audit.summary.citations, catalog.books.length * 6);
assert.equal(audit.summary.unique_urls, citedUrls.size);
assert.deepEqual(auditedUrls, citedUrls, 'audit must cover exactly the current catalog URLs');
assert.equal(audit.summary.states.broken ?? 0, 0, 'confirmed broken links must be repaired before publication');
assert.ok((audit.summary.states.reachable ?? 0) > catalog.books.length * 3);
assert.ok((audit.summary.states.access_blocked ?? 0) > 0, 'anti-bot responses must remain visible, not silently counted as reachable');
assert.equal(calibration.review_state, 'rough_ai_audit');
assert.equal(calibration.domains.length, 5);
assert.equal(new Set(calibration.domains.flatMap((domain) => domain.slugs)).size, 15);
for (const slug of calibration.domains.flatMap((domain) => domain.slugs)) {
  assert.ok(catalog.books.some((book) => book.slug === slug), `unknown calibration slug: ${slug}`);
}

console.log(`Source audit: ${auditedUrls.size} unique URLs checked, zero confirmed broken, ${calibration.domains.length} calibration domains`);
