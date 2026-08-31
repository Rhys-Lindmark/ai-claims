import { ArrowLeft, ExternalLink } from 'lucide-react';

type EvidenceRecord = {
  evidence_id: string;
  direction: string;
  review_state?: string;
  evidence_basis?: string;
  confidence?: string;
  last_verified_at?: string;
  finding: string;
  scope_and_limits: string;
};
type CandidateBookPacket = {
  evidence_method_version: string;
  author: string;
  title: string;
  subtitle: string;
  score_hidden_reason: string;
  scope_note: string;
  coverage: { candidate_claims: number; eligible_claims: number; reviewed_claims: number };
  claims: Array<{ claim_id: string; claim_type: string; text: string; source_ids: string[]; evidence_record_ids: string[] }>;
  sources: Array<{ source_id: string; title: string; url: string; assessment_state: string }>;
  evidence_records: EvidenceRecord[];
};

const claimTypeLabel: Record<string, string> = { factual: 'Factual claim', causal: 'Causal claim', comparative: 'Comparative claim' };

export function CandidateBookReview({ packet }: { packet: CandidateBookPacket }) {
  return <main className="min-h-screen bg-[#fbfbfa] text-[#20211f]">
    <header className="border-b border-[#20211f]/10"><div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5"><a className="inline-flex items-center gap-2 text-sm font-bold" href="https://ai.rhyslindmark.com/claims"><ArrowLeft className="h-4 w-4" /> AI Claims</a><span className="text-xs text-[#20211f]/45">In review</span></div></header>
    <div className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
      <section>
        <p className="text-sm font-semibold text-[#20211f]/45">{packet.author}</p>
        <h1 className="mt-2 text-4xl font-black leading-tight tracking-[-.04em] sm:text-6xl">{packet.title}</h1>
        <p className="mt-2 text-lg text-[#20211f]/55">{packet.subtitle}</p>
        <div className="mt-8 rounded-2xl border border-[#20211f]/15 bg-white p-6 sm:flex sm:items-center sm:justify-between sm:gap-8"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#20211f]/40">Truth score</p><p className="mt-2 text-3xl font-black">Not ready</p></div><p className="mt-4 max-w-md text-sm leading-relaxed text-[#20211f]/60 sm:mt-0">{packet.score_hidden_reason}</p></div>
        <div className="mt-8 flex items-center justify-between text-sm"><span>{packet.coverage.candidate_claims} candidate claims</span><span>{packet.coverage.eligible_claims} passage-confirmed</span></div>
        <div aria-label={`Zero of ${packet.coverage.candidate_claims} candidate claims passage-confirmed`} className="mt-3 h-px bg-[#20211f]/15" />
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-[#20211f]/55">{packet.scope_note}</p>
      </section>
      <section className="mt-14">
        <h2 className="text-xl font-black">Candidate claims</h2>
        <div className="mt-5 divide-y divide-[#20211f]/10 border-y border-[#20211f]/10">
          {packet.claims.map((claim, index) => <article className="py-6" key={claim.claim_id}>
            <div className="flex items-center justify-between gap-4 text-xs text-[#20211f]/40"><span>{String(index + 1).padStart(2, '0')} · {claimTypeLabel[claim.claim_type] ?? claim.claim_type}</span><span>Passage needed</span></div>
            <h3 className="mt-3 text-xl font-bold leading-snug tracking-[-.015em]">{claim.text}</h3>
            <details className="mt-4 text-sm"><summary className="cursor-pointer font-semibold text-[#20211f]/55">{claim.source_ids.length} source {claim.source_ids.length === 1 ? 'lead' : 'leads'}</summary><ul className="mt-3 space-y-2">{claim.source_ids.map((sourceId) => { const source = packet.sources.find((item) => item.source_id === sourceId)!; return <li key={sourceId}><a className="inline-flex items-start gap-1 font-semibold underline" href={source.url} target="_blank" rel="noreferrer">{source.title} <ExternalLink className="mt-0.5 h-3 w-3 shrink-0" /></a><span className="ml-2 text-[#20211f]/40">{source.assessment_state.replaceAll('_', ' ')}</span></li>; })}</ul></details>
            {claim.evidence_record_ids.length > 0 ? <details className="mt-3 text-sm"><summary className="cursor-pointer font-semibold text-[#20211f]/55">Evidence notes</summary><div className="mt-3 space-y-4">{claim.evidence_record_ids.map((evidenceId) => { const evidence = packet.evidence_records.find((item) => item.evidence_id === evidenceId)!; return <div className="border-l border-[#20211f]/20 pl-4" key={evidenceId}><p className="text-xs font-semibold capitalize text-[#20211f]/40">{evidence.direction}</p><p className="mt-1 leading-relaxed text-[#20211f]/70">{evidence.finding}</p><p className="mt-2 text-xs leading-relaxed text-[#20211f]/45">{evidence.scope_and_limits}</p>{evidence.review_state ? <p className="mt-2 text-[11px] text-[#20211f]/35">Machine draft · {evidence.evidence_basis} · {evidence.confidence} confidence · checked {evidence.last_verified_at}</p> : null}</div>; })}</div></details> : null}
          </article>)}
        </div>
      </section>
      <section className="mt-14 border-t border-[#20211f]/10 pt-8"><h2 className="text-xl font-black">Method</h2><ol className="mt-5 grid gap-4 text-sm leading-relaxed text-[#20211f]/60 sm:grid-cols-3"><li><strong className="block text-[#20211f]">1. Find the claims</strong>Confirm the book&apos;s passages and define the eligible denominator.</li><li><strong className="block text-[#20211f]">2. Check the evidence</strong>Log independent support, counterevidence, alternatives, and scope.</li><li><strong className="block text-[#20211f]">3. Publish carefully</strong>Show a score only after every eligible claim passes review gates.</li></ol></section>
      <footer className="mt-14 border-t border-[#20211f]/10 pt-6 text-xs leading-relaxed text-[#20211f]/40">This is a public research receipt, not a verdict. Author-aligned sources establish what the book argues; they do not independently prove it. Evidence-note method: {packet.evidence_method_version}.</footer>
    </div>
  </main>;
}
