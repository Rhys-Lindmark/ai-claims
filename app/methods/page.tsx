import type { Metadata } from 'next';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import audit from '@/data/audits/rapid-books-source-audit.json';
import calibration from '@/data/audits/rapid-book-calibration-sample.json';
import catalog from '@/data/rapid-books.json';

export const metadata: Metadata = {
  title: 'How the book scores work — AI Claims',
  description: 'Method, source-health audit, calibration sample, and limits for the rapid 100-book catalog.',
};

const books = new Map(catalog.books.map((book) => [book.slug, book]));
const stateCopy: Record<string, string> = {
  reachable: 'Reached',
  access_blocked: 'Publisher blocked the checker',
  broken: 'Confirmed broken',
  transient: 'Timed out or server error',
  network_error: 'Network error',
  other_http: 'Other response',
};

export default function MethodsPage() {
  const states = audit.summary.states as Record<string, number>;
  return <main className="min-h-screen bg-[#fbfbfa] text-[#20211f]">
    <header className="border-b border-[#20211f]/10"><div className="mx-auto max-w-2xl px-5 py-5"><a className="inline-flex items-center gap-2 text-sm font-bold" href="https://ai.rhyslindmark.com/claims"><ArrowLeft className="h-4 w-4" /> AI Claims</a></div></header>
    <div className="mx-auto max-w-2xl px-5 py-14 sm:py-20">
      <p className="text-xs font-bold uppercase tracking-[.14em] text-[#20211f]/40">Rapid book catalog</p>
      <h1 className="mt-3 text-4xl font-black tracking-[-.045em] sm:text-6xl">How the scores work</h1>
      <p className="mt-5 max-w-xl text-base leading-relaxed text-[#20211f]/60">A fast, inspectable first pass—not an expert verdict on an entire book.</p>

      <section className="mt-12 border-y border-[#20211f]/15 py-8">
        <h2 className="text-xl font-black">Three claims, equal weight</h2>
        <p className="mt-3 text-sm leading-relaxed text-[#20211f]/65">Each book gets exactly three central factual or causal claims. A rough AI assessment assigns 100% for supported, 75% for mostly supported, 50% for mixed, or 25% for weak. The displayed score is their average, rounded to the nearest whole number.</p>
        <p className="mt-3 text-sm leading-relaxed text-[#20211f]/65">The selection of those three claims is itself a judgment. A different defensible selection could change the score, and this rapid layer does not confirm the exact wording against a specific edition.</p>
        <p className="mt-4 text-xs text-[#20211f]/45">Method {catalog.method_version} · {catalog.books.length} books · {catalog.books.length * 3} assessed claims · checked {catalog.last_updated}</p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-black">Source-health snapshot</h2>
        <p className="mt-3 text-sm leading-relaxed text-[#20211f]/65">The automated audit followed every unique citation. It tests whether a URL responds; it cannot tell whether the source is strong enough for the claim.</p>
        <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5 border-y border-[#20211f]/10 py-6 sm:grid-cols-3">
          <div><strong className="text-3xl">{audit.summary.unique_urls}</strong><span className="mt-1 block text-xs text-[#20211f]/45">unique URLs</span></div>
          <div><strong className="text-3xl">{audit.summary.citations}</strong><span className="mt-1 block text-xs text-[#20211f]/45">citations</span></div>
          <div><strong className="text-3xl">{audit.summary.redirected_urls}</strong><span className="mt-1 block text-xs text-[#20211f]/45">moved URLs</span></div>
          {Object.entries(stateCopy).map(([state, label]) => <div key={state}><strong className="text-3xl">{states[state] ?? 0}</strong><span className="mt-1 block text-xs text-[#20211f]/45">{label}</span></div>)}
        </div>
        <p className="mt-4 text-xs leading-relaxed text-[#20211f]/45">Publisher anti-bot responses are deliberately separate from confirmed broken links. Timeouts and network failures remain unresolved rather than being called good or bad. Snapshot {audit.checked_at.slice(0, 10)} using {audit.checker.version}.</p>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-black">Calibration sample</h2>
        <p className="mt-3 text-sm leading-relaxed text-[#20211f]/65">Fifteen books were sampled across five domains to look for obviously implausible score behavior. This is a rough audit, not an independent fact-check.</p>
        <div className="mt-5 divide-y divide-[#20211f]/10 border-y border-[#20211f]/10">
          {calibration.domains.map((domain) => {
            const sampled = domain.slugs.map((slug) => books.get(slug)).filter(Boolean);
            const average = Math.round(sampled.reduce((sum, book) => sum + (book?.score ?? 0), 0) / sampled.length);
            return <article className="py-6" key={domain.domain}>
              <div className="flex items-baseline justify-between gap-4"><h3 className="font-bold">{domain.domain}</h3><strong className="text-xl">{average}<span className="text-xs text-[#20211f]/35"> avg</span></strong></div>
              <p className="mt-2 text-xs text-[#20211f]/45">{sampled.map((book) => `${book?.title} ${book?.score}`).join(' · ')}</p>
              <p className="mt-3 text-sm leading-relaxed text-[#20211f]/65">{domain.observation}</p>
            </article>;
          })}
        </div>
      </section>

      <section className="mt-12 border-t border-[#20211f]/10 pt-8">
        <h2 className="text-xl font-black">Known limits</h2>
        <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-relaxed text-[#20211f]/65">
          <li>These are rough AI judgments, not human-reviewed or passage-confirmed verdicts.</li>
          <li>Three selected claims cannot represent every assertion, omission, or framing choice in a book.</li>
          <li>{audit.summary.repeated_citations} citations reuse a URL already used elsewhere; reuse can be appropriate, but it reduces evidence independence when the same source carries several claims.</li>
          <li>The score says how the selected claims fared under this rubric—not whether the book is worth reading.</li>
        </ul>
        <a className="mt-6 inline-flex items-center gap-1 text-sm font-bold underline underline-offset-2" href="https://github.com/Rhys-Lindmark/ai-claims" rel="noreferrer" target="_blank">Inspect the data and audit code <ExternalLink className="h-3 w-3" /></a>
      </section>
    </div>
  </main>;
}
