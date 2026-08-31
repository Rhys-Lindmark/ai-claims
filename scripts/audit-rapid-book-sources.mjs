import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const catalogUrl = new URL('../data/rapid-books.json', import.meta.url);
const outputUrl = new URL('../data/audits/rapid-books-source-audit.json', import.meta.url);
const catalog = JSON.parse(await readFile(catalogUrl, 'utf8'));
const checkedAt = new Date().toISOString();
const concurrency = Number(process.env.SOURCE_AUDIT_CONCURRENCY ?? 12);
const timeoutMs = Number(process.env.SOURCE_AUDIT_TIMEOUT_MS ?? 15_000);

const citationRows = catalog.books.flatMap((book) => book.claims.flatMap((claim, claimIndex) =>
  claim.sources.map((source) => ({
    slug: book.slug,
    title: book.title,
    score: book.score,
    confidence: book.confidence,
    claim_index: claimIndex + 1,
    source_title: source.title,
    url: source.url,
  })),
));

const byUrl = new Map();
for (const row of citationRows) {
  const current = byUrl.get(row.url) ?? { url: row.url, citations: [] };
  current.citations.push({ slug: row.slug, claim_index: row.claim_index, source_title: row.source_title });
  byUrl.set(row.url, current);
}

function classifyStatus(status) {
  if (status >= 200 && status < 400) return 'reachable';
  if ([401, 403, 418, 429, 451].includes(status)) return 'access_blocked';
  if ([404, 410].includes(status)) return 'broken';
  if (status >= 500) return 'transient';
  return 'other_http';
}

async function request(url, method) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method,
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        accept: 'text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8',
        'user-agent': 'AI-Claims-Source-Audit/0.1 (+https://ai.rhyslindmark.com/claims)',
      },
    });
    if (method === 'GET') await response.body?.cancel();
    return {
      status: response.status,
      final_url: response.url,
      redirected: response.redirected || response.url !== url,
      error: null,
    };
  } catch (error) {
    return {
      status: null,
      final_url: null,
      redirected: false,
      error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
    };
  } finally {
    clearTimeout(timer);
  }
}

async function check(entry) {
  let result = await request(entry.url, 'HEAD');
  let method = 'HEAD';
  // Many DOI resolvers, publishers, and government hosts reject HEAD even when a
  // normal browser GET succeeds. Retry non-success responses with GET before
  // assigning a public audit state.
  if (result.status === null || result.status >= 400) {
    result = await request(entry.url, 'GET');
    method = 'GET';
  }
  const state = result.status === null
    ? (/AbortError|timeout/i.test(result.error ?? '') ? 'transient' : 'network_error')
    : classifyStatus(result.status);
  return {
    ...entry,
    host: new URL(entry.url).hostname.replace(/^www\./, ''),
    state,
    method,
    ...result,
  };
}

const queue = [...byUrl.values()];
const checked = Array.from({ length: queue.length });
let cursor = 0;
async function worker() {
  while (cursor < queue.length) {
    const index = cursor++;
    checked[index] = await check(queue[index]);
  }
}
await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, worker));

const counts = Object.fromEntries([...new Set(checked.map((item) => item.state))]
  .sort((a, b) => a.localeCompare(b))
  .map((state) => [state, checked.filter((item) => item.state === state).length]));
const redirects = checked.filter((item) => item.redirected).length;
const domains = new Map();
for (const item of checked) {
  const current = domains.get(item.host) ?? { host: item.host, unique_urls: 0, citations: 0, states: {} };
  current.unique_urls += 1;
  current.citations += item.citations.length;
  current.states[item.state] = (current.states[item.state] ?? 0) + 1;
  domains.set(item.host, current);
}

const scoreDistribution = Object.fromEntries([...new Set(catalog.books.map((book) => book.score))]
  .sort((a, b) => a - b)
  .map((score) => [score, catalog.books.filter((book) => book.score === score).length]));
const confidenceDistribution = Object.fromEntries([...new Set(catalog.books.map((book) => book.confidence))]
  .sort((a, b) => a.localeCompare(b))
  .map((confidence) => [confidence, catalog.books.filter((book) => book.confidence === confidence).length]));
const repeatedUrls = checked
  .filter((item) => item.citations.length > 1)
  .sort((a, b) => b.citations.length - a.citations.length || a.url.localeCompare(b.url))
  .map((item) => ({ url: item.url, host: item.host, citation_count: item.citations.length, state: item.state, books: [...new Set(item.citations.map((citation) => citation.slug))] }));

const audit = {
  schema_version: 'ai-claims.rapid-book-source-audit/0.1.0',
  catalog_method_version: catalog.method_version,
  catalog_last_updated: catalog.last_updated,
  checked_at: checkedAt,
  checker: {
    version: 'http-head-get/0.1.0',
    timeout_ms: timeoutMs,
    concurrency,
    caveat: 'HTTP reachability is not evidence quality. Access-blocked responses are kept separate from broken links; redirects are recorded after following them.',
  },
  summary: {
    books: catalog.books.length,
    claims: catalog.books.reduce((sum, book) => sum + book.claims.length, 0),
    citations: citationRows.length,
    unique_urls: checked.length,
    repeated_citations: citationRows.length - checked.length,
    redirected_urls: redirects,
    states: counts,
    score_distribution: scoreDistribution,
    confidence_distribution: confidenceDistribution,
  },
  domain_summary: [...domains.values()].sort((a, b) => b.citations - a.citations || a.host.localeCompare(b.host)),
  repeated_urls: repeatedUrls,
  results: checked.sort((a, b) => a.url.localeCompare(b.url)),
};

assert.equal(audit.summary.books, catalog.books.length);
assert.equal(audit.summary.claims, catalog.books.length * 3);
assert.equal(audit.summary.citations, catalog.books.length * 6);
assert.ok(audit.summary.unique_urls >= catalog.books.length * 4, 'source reuse unexpectedly collapsed the evidence base');
await mkdir(new URL('../data/audits/', import.meta.url), { recursive: true });
await writeFile(outputUrl, `${JSON.stringify(audit, null, 2)}\n`);
console.log(JSON.stringify(audit.summary, null, 2));
