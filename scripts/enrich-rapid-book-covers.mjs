import { readFile, writeFile } from 'fs/promises';
import https from 'https';

const catalogPath = new URL('../data/rapid-books.json', import.meta.url);
const outputPath = new URL('../data/rapid-book-covers.json', import.meta.url);

function normalize(value = '') {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b(jr|sr)\.?\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function authorMatches(expected, candidates = []) {
  const wantedAuthors = expected.split(/\s+(?:and|&)\s+/i).map(normalize).filter(Boolean);
  const actualAuthors = candidates.map(normalize);
  return wantedAuthors.every((wanted) => actualAuthors.some((actual) =>
    actual === wanted || actual.includes(wanted) || wanted.includes(actual)));
}

function titleMatches(book, candidate) {
  const actual = normalize(candidate);
  return actual === normalize(book.title) || (book.subtitle && actual === normalize(`${book.title} ${book.subtitle}`));
}

async function lookup(book) {
  const query = new URLSearchParams({
    title: book.title,
    author: book.author.split(/\s+(?:and|&)\s+/i)[0],
    limit: '5',
    fields: 'key,title,author_name,cover_i',
  });
  const payload = await requestJson(`https://openlibrary.org/search.json?${query}`);
  const match = (payload.docs || []).find((candidate) =>
    candidate.cover_i && titleMatches(book, candidate.title) && authorMatches(book.author, candidate.author_name));
  if (!match) return { slug: book.slug, match_state: 'unresolved' };
  const workKey = match.key.startsWith('/') ? match.key : `/works/${match.key}`;
  return {
    slug: book.slug,
    match_state: 'exact_title_author',
    cover_id: match.cover_i,
    cover_url: `https://covers.openlibrary.org/b/id/${match.cover_i}-M.jpg`,
    source_url: `https://openlibrary.org${workKey}`,
    source_title: match.title,
    source_authors: match.author_name,
  };
}

function requestJsonOnce(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, { headers: { 'User-Agent': 'AIClaims/0.1 (https://ai.rhyslindmark.com/claims)' } }, (response) => {
      if (response.statusCode < 200 || response.statusCode >= 300) {
        response.resume();
        reject(new Error(`Open Library returned ${response.statusCode}`));
        return;
      }
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => {
        try { resolve(JSON.parse(body)); } catch (error) { reject(error); }
      });
    });
    request.on('error', reject);
  });
}

async function requestJson(url) {
  const delays = [0, 500, 1500];
  let lastError;
  for (const delay of delays) {
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    try {
      return await requestJsonOnce(url);
    } catch (error) {
      lastError = error;
      if (!['ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN'].includes(error.code)) throw error;
    }
  }
  throw lastError;
}

async function main() {
  const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
  const covers = [];
  for (const [index, book] of catalog.books.entries()) {
    covers.push(await lookup(book));
    process.stdout.write(`\r${index + 1}/${catalog.books.length}`);
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  process.stdout.write('\n');

  const output = {
    schema_version: 'ai-claims.rapid-book-covers/0.1.0',
    provider: 'Open Library',
    provider_url: 'https://openlibrary.org/dev/docs/api/covers',
    match_policy: 'Exact normalized title and compatible normalized author; unmatched records render a local placeholder.',
    last_verified: new Date().toISOString().slice(0, 10),
    covers,
  };
  await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`Matched ${covers.filter((cover) => cover.match_state === 'exact_title_author').length}/${covers.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
