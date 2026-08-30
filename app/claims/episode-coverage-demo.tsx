import fixture from '@/data/episode-coverage-fixture.json';
import { coverageRates, type EpisodeCoverageRecord } from '@/lib/episode-coverage';

export function EpisodeCoverageDemo() {
  const coverage = fixture.coverage as EpisodeCoverageRecord;
  const rates = coverageRates(coverage);
  const funnel = [
    ['Transcript segments', coverage.transcript_segments, 'All timestamped units'],
    ['Candidate claims', coverage.candidate_claims, `${Math.round(rates.selection * 100)}% selected`],
    ['Canonical claims', coverage.canonical_claims, 'Repeats collapsed'],
    ['Checkable claims', coverage.checkable_claims, `${Math.round(rates.checkability * 100)}% checkable`],
    ['Editor reviewed', coverage.editor_reviewed_claims, `${Math.round(rates.review * 100)}% coverage`],
    ['Unresolved', coverage.unresolved_claims, `${Math.round(rates.resolution * 100)}% resolved`],
  ] as const;
  return <section className="border-t-2 border-ink bg-white"><div className="mx-auto max-w-6xl px-5 py-12 md:px-10"><p className="font-mono text-[9px] font-bold uppercase text-coral">Episode coverage · synthetic</p><h2 className="mt-2 text-4xl font-black tracking-[-0.05em]">Show the denominator changing.</h2><p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/60">An episode is not “38% true.” It is 38% reviewed among currently checkable canonical claims, with two reviewed claims still unresolved. Every funnel step stays visible.</p><div className="mt-7 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">{funnel.map(([label, value, note], index) => <article className={`border-2 border-ink p-4 ${index === 4 ? 'bg-acid' : index === 5 ? 'bg-coral' : 'bg-paper'}`} key={label}><span className="font-mono text-[8px] font-bold uppercase text-ink/45">0{index + 1}</span><strong className="mt-6 block text-4xl">{value}</strong><h3 className="mt-2 text-sm font-black">{label}</h3><p className="mt-1 font-mono text-[7px] uppercase text-ink/45">{note}</p></article>)}</div><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="border border-ink/20 p-4"><span className="font-mono text-[8px] uppercase text-ink/40">Episode duration</span><strong className="mt-1 block text-xl">{Math.floor(coverage.transcript_duration_seconds / 60)} minutes</strong></div><div className="border border-ink/20 p-4"><span className="font-mono text-[8px] uppercase text-ink/40">Review coverage</span><strong className="mt-1 block text-xl">{Math.round(rates.review * 100)}%</strong></div><div className="border border-ink/20 p-4"><span className="font-mono text-[8px] uppercase text-ink/40">Aggregate score</span><strong className="mt-1 block text-xl text-coral">Hidden</strong></div></div><p className="mt-4 font-mono text-[8px] font-bold uppercase text-ink/40">Fixture only · counts update when splitting, grouping, checkability, or review changes</p></div></section>;
}

