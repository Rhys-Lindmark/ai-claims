import { ArrowLeft, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import rapidBookCovers from '@/data/rapid-book-covers.json';

type RapidBook = {
  slug: string;
  title: string;
  subtitle: string;
  author: string;
  year: number;
  score: number;
  confidence: string;
  summary: string;
  claims: Array<{
    claim: string;
    assessment: string;
    credit: number;
    rationale: string;
    sources: Array<{ title: string; url: string }>;
  }>;
  other_claims: string[];
};

const assessmentCopy: Record<string, string> = {
  supported: 'Supported',
  'mostly supported': 'Mostly supported',
  mixed: 'Mixed',
  weak: 'Weak',
};

export function RapidBookReview({ book, methodVersion, checkedAt }: { book: RapidBook; methodVersion: string; checkedAt: string }) {
  const cover = rapidBookCovers.covers.find((candidate) => candidate.slug === book.slug);
  const coverUrl = cover?.match_state === 'exact_title_author' && 'cover_url' in cover && typeof cover.cover_url === 'string' ? cover.cover_url : null;
  const coverSourceUrl = cover?.match_state === 'exact_title_author' && 'source_url' in cover && typeof cover.source_url === 'string' ? cover.source_url : null;
  const hasCover = coverUrl && coverSourceUrl;
  return <main className="min-h-screen bg-[#fbfbfa] text-[#20211f]">
    <header className="border-b border-[#20211f]/10"><div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-5"><a className="inline-flex items-center gap-2 text-sm font-bold" href="https://ai.rhyslindmark.com/claims"><ArrowLeft className="h-4 w-4" /> AI Claims</a><span className="text-xs text-[#20211f]/45">Rapid review</span></div></header>
    <div className="mx-auto max-w-2xl px-5 py-14 sm:py-20">
      <div className="flex items-start gap-5 sm:gap-8">
        {hasCover ? <a aria-label={`View ${book.title} on Open Library`} className="shrink-0" href={coverSourceUrl} rel="noreferrer" target="_blank"><Image alt="" className="h-[132px] w-[88px] rounded-sm bg-[#efefed] object-cover shadow-sm sm:h-[168px] sm:w-28" height={168} priority src={coverUrl} unoptimized width={112} /></a> : null}
        <div className="min-w-0 pt-1"><p className="text-sm text-[#20211f]/50">{book.author} · {book.year}</p><h1 className="mt-2 text-4xl font-black leading-tight tracking-[-.04em] sm:text-6xl">{book.title}</h1>{book.subtitle ? <p className="mt-2 text-lg text-[#20211f]/50">{book.subtitle}</p> : null}{hasCover ? <a className="mt-3 inline-flex items-center gap-1 text-xs text-[#20211f]/45 underline underline-offset-2" href={coverSourceUrl} rel="noreferrer" target="_blank">Cover via Open Library <ExternalLink className="h-3 w-3" /></a> : null}</div>
      </div>

      <section className="mt-10 border-y border-[#20211f]/15 py-8 sm:flex sm:items-end sm:justify-between sm:gap-8">
        <div><p className="text-xs font-bold uppercase tracking-[.12em] text-[#20211f]/40">Rough AI truth score</p><p className="mt-2 text-7xl font-black tracking-[-.07em]">{book.score}<span className="text-2xl text-[#20211f]/35">/100</span></p></div>
        <div className="mt-5 max-w-sm sm:mt-0"><p className="text-sm leading-relaxed">{book.summary}</p><p className="mt-3 text-xs text-[#20211f]/45">Based on three central claims · {book.confidence} confidence</p></div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-black">The three claims</h2>
        <div className="mt-5 divide-y divide-[#20211f]/10 border-y border-[#20211f]/10">
          {book.claims.map((claim, index) => <article className="py-7" key={claim.claim}>
            <div className="flex items-center justify-between gap-4 text-xs text-[#20211f]/45"><span>{String(index + 1).padStart(2, '0')}</span><strong>{assessmentCopy[claim.assessment] ?? claim.assessment}</strong></div>
            <h3 className="mt-3 text-xl font-bold leading-snug tracking-[-.015em]">{claim.claim}</h3>
            <p className="mt-3 text-sm leading-relaxed text-[#20211f]/65">{claim.rationale}</p>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">{claim.sources.map((source) => <a className="inline-flex items-center gap-1 text-xs font-semibold underline underline-offset-2" href={source.url} key={source.url} rel="noreferrer" target="_blank">{source.title} <ExternalLink className="h-3 w-3" /></a>)}</div>
          </article>)}
        </div>
      </section>

      <details className="mt-9 border-b border-[#20211f]/10 pb-6"><summary className="cursor-pointer text-sm font-bold">Other claims worth checking</summary><ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-[#20211f]/60">{book.other_claims.map((claim) => <li key={claim}>{claim}</li>)}</ul></details>

      <section className="mt-10 text-xs leading-relaxed text-[#20211f]/45"><p><strong className="text-[#20211f]/70">What this number means.</strong> It is an AI-generated first-pass judgment of three central factual or causal claims—not a rating, exhaustive fact-check, or human peer review. Claim credits are 100% for supported, 75% for mostly supported, 50% for mixed, and 25% for weak, then averaged and rounded. Lower confidence means the score should move more as better evidence arrives.</p><p className="mt-3">Method {methodVersion} · checked {checkedAt} · 3/3 selected claims assessed · <a className="font-semibold underline underline-offset-2" href="https://ai.rhyslindmark.com/claims/methods">method and source audit</a></p></section>
    </div>
  </main>;
}
