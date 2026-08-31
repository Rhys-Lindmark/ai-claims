import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function main() {
  const path = new URL('../data/rapid-books.json', import.meta.url);
  const data = JSON.parse(await readFile(path, 'utf8'));
  const allowed = new Map([['supported', 1], ['mostly supported', 0.75], ['mixed', 0.5], ['weak', 0.25]]);

  assert.equal(data.schema_version, 'ai-claims.rapid-books/0.1.0');
  assert.equal(data.method_version, 'three-central-claims/0.1.0');
  assert.equal(new Set(data.books.map((book) => book.slug)).size, data.books.length);
  for (const book of data.books) {
    assert.equal(book.claims.length, 3, `${book.slug} must have exactly three claims`);
    assert.ok(book.summary && book.confidence && book.other_claims.length > 0, `${book.slug} needs visible scope`);
    for (const claim of book.claims) {
      assert.equal(claim.credit, allowed.get(claim.assessment), `${book.slug}: credit must match assessment`);
      assert.ok(claim.rationale.length >= 120, `${book.slug}: rationale too short`);
      assert.ok(claim.sources.length >= 2, `${book.slug}: each claim needs two sources`);
      for (const source of claim.sources) assert.match(source.url, /^https:\/\//);
    }
    const expected = Math.round(book.claims.reduce((sum, claim) => sum + claim.credit, 0) / 3 * 100);
    assert.equal(book.score, expected, `${book.slug}: score must be derived from claim credits`);
  }
  console.log(`Rapid books: ${data.books.length}/${data.target_books}; all scores and source gates verified`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
