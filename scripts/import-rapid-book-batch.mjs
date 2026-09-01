import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const [batchPath, mode] = process.argv.slice(2);

if (!batchPath || !['--check', '--write'].includes(mode)) {
  console.error('Usage: node scripts/import-rapid-book-batch.mjs <batch.json> --check|--write');
  process.exit(2);
}

const catalogPath = new URL('../data/rapid-books.json', import.meta.url);
const batch = JSON.parse(await readFile(resolve(batchPath), 'utf8'));
const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));

assert.equal(batch.schema_version, 'ai-claims.rapid-book-batch/0.1.0');
assert.match(batch.batch_id, /^\d+$/);
assert.match(batch.checked_date, /^\d{4}-\d{2}-\d{2}$/);
assert.ok(Array.isArray(batch.books) && batch.books.length > 0, 'batch must contain books');

const existingSlugs = new Set(catalog.books.map((book) => book.slug));
const existingEntities = new Set(catalog.books.map((book) => book.entity_key));
const incomingSlugs = new Set();
const incomingEntities = new Set();

for (const book of batch.books) {
  assert.ok(!existingSlugs.has(book.slug), `duplicate catalog slug: ${book.slug}`);
  assert.ok(!existingEntities.has(book.entity_key), `duplicate catalog entity: ${book.entity_key}`);
  assert.ok(!incomingSlugs.has(book.slug), `duplicate batch slug: ${book.slug}`);
  assert.ok(!incomingEntities.has(book.entity_key), `duplicate batch entity: ${book.entity_key}`);
  incomingSlugs.add(book.slug);
  incomingEntities.add(book.entity_key);
}

console.log(`Rapid book batch ${batch.batch_id}: ${batch.books.length} unique books ready; catalog ${catalog.books.length} -> ${catalog.books.length + batch.books.length}`);

if (mode === '--write') {
  catalog.last_updated = batch.checked_date;
  catalog.books.push(...batch.books);
  await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
  console.log(`Updated ${catalogPath.pathname}`);
}
