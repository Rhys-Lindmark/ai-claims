'use client';

import { ArrowRight, BookOpen, Check, Copy, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { SyntheticEvent, useState } from 'react';
import rapidBooks from '@/data/rapid-books.json';

type BookIdentity = {
  title: string;
  author?: string;
  entityKey: string;
  canonicalUrl: string;
  kind: 'goodreads' | 'web';
  reviewUrl?: string;
  rapidScore?: number;
};

type CheckResult = {
  identity: BookIdentity;
  state: 'checking' | 'queued' | 'in_review' | 'published' | 'failed';
  requestId?: string;
  score?: number;
  reviewedClaims?: number;
  eligibleClaims?: number;
  analysisUrl?: string;
  message?: string;
};

const starterBooks: Array<BookIdentity & { aliases: string[] }> = rapidBooks.books.map((book) => ({
  title: book.title,
  author: book.author,
  entityKey: book.entity_key,
  canonicalUrl: `https://ai.rhyslindmark.com/claims/book?slug=${book.slug}`,
  kind: book.entity_key.startsWith('goodreads:') ? 'goodreads' : 'web',
  reviewUrl: `https://ai.rhyslindmark.com/claims/book?slug=${book.slug}`,
  rapidScore: book.score,
  aliases: [normalizeTitle(book.title), normalizeTitle(`${book.title} ${book.subtitle}`)],
}));

function normalizeTitle(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function slugify(value: string) {
  return normalizeTitle(value).replaceAll(' ', '-').slice(0, 120);
}

function identityFromInput(raw: string): BookIdentity | null {
  const input = raw.trim();
  if (!input) return null;
  const normalized = normalizeTitle(input);
  const known = starterBooks.find((book) => book.aliases.includes(normalized));
  if (known) return known;

  try {
    const url = new URL(input);
    const match = url.hostname.replace(/^www\./, '') === 'goodreads.com' ? url.pathname.match(/^\/book\/show\/(\d+)/) : null;
    if (match) {
      const starter = starterBooks.find((book) => book.entityKey === `goodreads:${match[1]}`);
      return starter ?? { title: `Goodreads book ${match[1]}`, entityKey: `goodreads:${match[1]}`, canonicalUrl: `https://www.goodreads.com/book/show/${match[1]}`, kind: 'goodreads' };
    }
  } catch {
    // A plain title is the primary path.
  }

  const slug = slugify(input);
  if (!slug) return null;
  const canonicalUrl = `https://ai.rhyslindmark.com/claims/book?title=${encodeURIComponent(slug)}`;
  return { title: input, entityKey: `web:ai.rhyslindmark.com/claims/book?title=${slug}`, canonicalUrl, kind: 'web' };
}

function apiPath(path: string) {
  const prefix = window.location.pathname.startsWith('/claims') ? '/claims' : '';
  return `${prefix}${path}`;
}

export function BookChecker() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<CheckResult | null>(null);
  const [copied, setCopied] = useState(false);

  async function checkBook(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const identity = identityFromInput(query);
    if (!identity) return;
    setCopied(false);
    setResult({ identity, state: 'checking' });
    window.history.replaceState(null, '', `${window.location.pathname}?book=${encodeURIComponent(identity.title)}`);

    if (identity.rapidScore !== undefined) {
      setResult({ identity, state: 'published', score: identity.rapidScore, reviewedClaims: 3, eligibleClaims: 3, analysisUrl: identity.reviewUrl });
      return;
    }

    try {
      const resolver = await fetch(`${apiPath('/api/v1/analyses/resolve')}?entity_key=${encodeURIComponent(identity.entityKey)}`, { headers: { accept: 'application/json' } });
      if (resolver.ok) {
        const envelope = await resolver.json() as { analysis?: { publication_state?: string; publication_gates_passed?: boolean; provenance_complete?: boolean; score_0_100?: number; reviewed_claims?: number; eligible_claims?: number; analysis_url?: string } };
        const analysis = envelope.analysis;
        if (analysis?.publication_state === 'active' && analysis.publication_gates_passed && analysis.provenance_complete && Number.isFinite(analysis.score_0_100)) {
          setResult({ identity, state: 'published', score: analysis.score_0_100, reviewedClaims: analysis.reviewed_claims, eligibleClaims: analysis.eligible_claims, analysisUrl: analysis.analysis_url });
          return;
        }
      }

      const requestLookup = await fetch(`${apiPath('/api/v1/analysis-requests')}?entity_key=${encodeURIComponent(identity.entityKey)}`, { headers: { accept: 'application/json' }, cache: 'no-store' });
      if (requestLookup.ok) {
        const envelope = await requestLookup.json() as { analysis_request: { state: 'queued' | 'in_review'; request_id: string } };
        const request = envelope.analysis_request;
        const state = identity.reviewUrl && request.state === 'queued' ? 'in_review' : request.state;
        setResult({ identity, state, requestId: request.request_id });
        return;
      }

      const submission = await fetch(apiPath('/api/v1/analysis-requests'), {
        method: 'POST',
        headers: { accept: 'application/json', 'content-type': 'application/json' },
        body: JSON.stringify({ contract_version: '1.0.0', entity_key: identity.entityKey, canonical_url: identity.canonicalUrl, page_kind: identity.kind }),
      });
      if (!submission.ok) throw new Error('request_failed');
      const envelope = await submission.json() as { analysis_request: { state: 'queued' | 'in_review'; request_id: string } };
      const state = identity.reviewUrl && envelope.analysis_request.state === 'queued' ? 'in_review' : envelope.analysis_request.state;
      setResult({ identity, state, requestId: envelope.analysis_request.request_id });
    } catch {
      setResult({ identity, state: 'failed', message: 'The shared review queue is temporarily unavailable. Please try again.' });
    }
  }

  async function copyStatus() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
  }

  return <main className="min-h-screen bg-[#fbfbfa] text-[#20211f]">
    <header className="border-b border-[#20211f]/10">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5">
        <Link className="text-sm font-black tracking-tight" href="/">AI Claims</Link>
        <a className="text-sm text-[#20211f]/55 hover:text-[#20211f]" href="https://github.com/Rhys-Lindmark/ai-claims" target="_blank" rel="noreferrer">Open source</a>
      </div>
    </header>

    <div className="mx-auto max-w-3xl px-5 py-16 sm:py-24">
      <section className="mx-auto max-w-2xl text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#20211f] text-white"><BookOpen className="h-6 w-6" /></div>
        <h1 className="mt-7 text-4xl font-black leading-tight tracking-[-.045em] sm:text-6xl">How true is this book?</h1>
        <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-[#20211f]/60">Type a title. We’ll show the reviewed claims—or add the book to the queue.</p>

        <form className="mt-9" onSubmit={checkBook}>
          <label className="sr-only" htmlFor="book-query">Book title or Goodreads link</label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input autoComplete="off" className="min-w-0 flex-1 rounded-xl border border-[#20211f]/20 bg-white px-5 py-4 text-base outline-none transition placeholder:text-[#20211f]/35 focus:border-[#20211f] focus:ring-4 focus:ring-[#20211f]/5" id="book-query" onChange={(event) => setQuery(event.target.value)} placeholder="Guns, Germs, and Steel" value={query} />
            <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#20211f] px-6 py-4 font-bold text-white transition hover:bg-black disabled:opacity-40" disabled={!query.trim() || result?.state === 'checking'} type="submit">{result?.state === 'checking' ? 'Checking…' : 'Check'} <ArrowRight className="h-4 w-4" /></button>
          </div>
          <p className="mt-3 text-left text-xs text-[#20211f]/40">A Goodreads link works too.</p>
        </form>
      </section>

      {result ? <section aria-live="polite" className="mx-auto mt-12 max-w-2xl rounded-2xl border border-[#20211f]/15 bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#20211f]/40">{result.identity.author ?? 'Book check'}</p><h2 className="mt-2 text-2xl font-black tracking-[-.025em]">{result.identity.title}</h2></div>
          {result.state === 'published' ? <div className="text-right"><strong className="text-5xl font-black">{result.score}</strong><span className="text-lg text-[#20211f]/45">/100</span></div> : <span className="rounded-full bg-[#f0f1ef] px-3 py-1.5 text-xs font-bold capitalize">{result.state === 'in_review' ? 'In review' : result.state}</span>}
        </div>

        {result.state === 'checking' ? <p className="mt-6 text-sm text-[#20211f]/55">Looking for an existing analysis…</p> : null}
        {result.state === 'queued' ? <div className="mt-6 border-t border-[#20211f]/10 pt-5"><p className="font-bold">No score yet.</p><p className="mt-2 text-sm leading-relaxed text-[#20211f]/60">This book is in the shared review queue. A score will appear only after its major factual and causal claims have been identified, sourced, and reviewed.</p></div> : null}
        {result.state === 'in_review' ? <div className="mt-6 border-t border-[#20211f]/10 pt-5"><p className="font-bold">The claim review is underway.</p><p className="mt-2 text-sm leading-relaxed text-[#20211f]/60">We’re checking the book’s main factual and causal claims. The score stays hidden until the reviewed claim set is complete.</p></div> : null}
        {result.state === 'published' ? <div className="mt-6 border-t border-[#20211f]/10 pt-5"><div className="flex items-center gap-2 text-sm font-bold"><Check className="h-4 w-4" /> Rough AI score · {result.reviewedClaims}/{result.eligibleClaims} central claims assessed</div>{result.analysisUrl ? <a className="mt-4 inline-flex items-center gap-1 text-sm font-bold underline" href={result.analysisUrl}>See the claims and sources <ExternalLink className="h-3 w-3" /></a> : null}</div> : null}
        {result.state === 'failed' ? <p className="mt-6 border-t border-[#20211f]/10 pt-5 text-sm text-[#20211f]/60">{result.message}</p> : null}

        {result.requestId ? <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-[#20211f]/10 pt-5">{result.identity.reviewUrl ? <a className="text-sm font-bold underline" href={result.identity.reviewUrl}>Open claim map</a> : <a className="text-sm font-bold underline" href={`/claims/request?request_id=${encodeURIComponent(result.requestId)}`}>View review status</a>}<button className="inline-flex items-center gap-1 text-sm text-[#20211f]/55 hover:text-[#20211f]" onClick={copyStatus}><Copy className="h-3.5 w-3.5" /> {copied ? 'Copied' : 'Share'}</button></div> : null}
      </section> : null}

      <section className="mx-auto mt-16 max-w-2xl border-t border-[#20211f]/10 pt-8">
        <div className="flex items-end justify-between gap-4"><div><h2 className="text-sm font-black uppercase tracking-[.12em] text-[#20211f]/40">Scored books</h2><p className="mt-2 text-sm text-[#20211f]/50">{rapidBooks.books.length} of {rapidBooks.target_books}</p></div></div>
        <div className="mt-4 divide-y divide-[#20211f]/10 border-y border-[#20211f]/10">
          {starterBooks.map((book) => <a className="flex w-full items-center justify-between gap-4 py-4 text-left" href={book.reviewUrl} key={book.entityKey}><span><strong className="block">{book.title}</strong><span className="mt-1 block text-sm text-[#20211f]/45">{book.author}</span></span><span className="text-xl font-black">{book.rapidScore}<span className="text-xs text-[#20211f]/35">/100</span></span></a>)}
        </div>
        <p className="mt-5 text-sm leading-relaxed text-[#20211f]/45">Rapid reviews use three central claims so the catalog can grow quickly. Each page keeps the reasoning summary, uncertainty, and sources visible.</p>
      </section>

      <footer className="mx-auto mt-16 max-w-2xl border-t border-[#20211f]/10 pt-6 text-xs leading-relaxed text-[#20211f]/40">Scores are not ratings. They summarize reviewed factual and causal claims, with the denominator, method, uncertainty, and sources kept visible.</footer>
    </div>
  </main>;
}
