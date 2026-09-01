import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");
const fail = (message) => {
  throw new Error(`Batch 38 research gate: ${message}`);
};

async function main() {
const [metadataRaw, hypothesesRaw, coversRaw, bindings, fairness] = await Promise.all([
  read("data/research/batch-38-book-metadata.json"),
  read("data/research/batch-38-assessment-hypotheses.json"),
  read("data/research/batch-38-cover-leads.json"),
  read("data/research/batch-38-claim-source-bindings.md"),
  read("data/research/batch-38-claim-fairness-review.md"),
]);

const metadata = JSON.parse(metadataRaw);
const hypotheses = JSON.parse(hypothesesRaw);
const covers = JSON.parse(coversRaw);
const books = metadata.books ?? metadata;
const hypothesisBooks = hypotheses.books ?? hypotheses;
const coverBooks = covers.covers ?? covers;

if (books.length !== 10) fail(`expected 10 metadata rows, found ${books.length}`);
if (hypothesisBooks.length !== 10) fail(`expected 10 hypothesis books, found ${hypothesisBooks.length}`);
if (coverBooks.length !== 10) fail(`expected 10 cover leads, found ${coverBooks.length}`);

const slugs = hypothesisBooks.map((book) => book.slug);
if (new Set(slugs).size !== 10) fail("hypothesis slugs are not unique");
for (const book of hypothesisBooks) {
  if (book.hypotheses?.length !== 3) fail(`${book.slug} does not have exactly three hypotheses`);
  for (const item of book.hypotheses) {
    if (!item.claim?.trim()) fail(`${book.slug} contains a blank claim`);
    if (![0, 0.25, 0.5, 0.75, 1].includes(item.credit)) fail(`${book.slug} contains an invalid credit`);
  }
}

const bindingRows = bindings.split("\n").filter((line) => line.startsWith("| *"));
if (bindingRows.length !== 30) fail(`expected 30 source-binding rows, found ${bindingRows.length}`);
if (bindingRows.some((line) => /Needs |Add direct/.test(line))) fail("an unresolved source state remains");

const fairnessRows = fairness.split("\n").filter((line) => line.startsWith("| *"));
if (fairnessRows.length !== 30) fail(`expected 30 fairness rows, found ${fairnessRows.length}`);
const replacements = fairnessRows.filter((line) => line.includes("| Replace |")).length;
const rephrases = fairnessRows.filter((line) => line.includes("| Rephrase |")).length;
if (replacements !== 4 || rephrases !== 4) fail(`expected 4 replacements and 4 rephrases, found ${replacements} and ${rephrases}`);

console.log("Batch 38 research gate passed: 10 books, 30 hypotheses, 30 source bindings, 30 fairness decisions, 10 cover leads.");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
