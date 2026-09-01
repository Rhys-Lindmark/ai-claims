import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectDirectory = fileURLToPath(new URL('../', import.meta.url));
const catalog = JSON.parse(readFileSync(resolve(projectDirectory, 'data/rapid-books.json'), 'utf8'));
const serverDirectory = process.env.RELEASE_BUILD_SERVER_DIRECTORY
  ? resolve(process.env.RELEASE_BUILD_SERVER_DIRECTORY)
  : resolve(projectDirectory, 'dist/server');
const javascriptFiles = [];

function collectJavascriptFiles(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) collectJavascriptFiles(path);
    else if (entry.isFile() && entry.name.endsWith('.js')) javascriptFiles.push(path);
  }
}

try {
  collectJavascriptFiles(serverDirectory);
} catch (error) {
  throw new Error('Release build is missing or unreadable. Run `npm run build` before this check.', { cause: error });
}

assert.ok(javascriptFiles.length > 0, 'Release build must contain server JavaScript');
assert.equal(catalog.books.length, 350, 'Update the release gate count when the reviewed catalog changes');

const bundle = javascriptFiles.map((path) => readFileSync(path, 'utf8')).join('\n');
const missingSlugs = catalog.books.map((book) => book.slug).filter((slug) => !bundle.includes(slug));

assert.deepEqual(missingSlugs, [], `Release build is stale; missing book slugs: ${missingSlugs.join(', ')}`);
assert.match(bundle, /the-rise-and-fall-of-the-dinosaurs/);
assert.match(bundle, /annals-of-the-former-world/);

console.log(`Release build matches source: all ${catalog.books.length} reviewed book slugs are packaged`);
