'use client';

import { ArrowLeft, ExternalLink, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import registry from '@/extension/data/analyses.json';

type Analysis = (typeof registry.analyses)[number];

export function AnalysisLookup() {
  const [entityKey, setEntityKey] = useState<string | null>(null);

  useEffect(() => {
    setEntityKey(new URLSearchParams(window.location.search).get('entity_key'));
  }, []);

  const analysis = registry.analyses.find((entry) => entry.entity_key === entityKey) as Analysis | undefined;
  const published = analysis?.status === 'published' && analysis.score_0_100 !== null;

  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="border-b-2 border-ink px-5 py-5 md:px-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <a className="inline-flex items-center gap-2 font-mono text-[9px] font-bold uppercase" href="https://ai.rhyslindmark.com/claims"><ArrowLeft className="h-4 w-4" /> AI Claims</a>
          <span className="font-mono text-[9px] font-bold uppercase text-cobalt">Canonical analysis route</span>
        </div>
      </header>
      <section className="mx-auto grid max-w-5xl gap-8 px-5 py-12 md:px-10 lg:grid-cols-[.8fr_1.2fr]">
        <div>
          <p className="font-mono text-[9px] font-bold uppercase text-coral">Page identity</p>
          <h1 className="mt-3 break-words text-4xl font-black leading-[.94] tracking-[-.045em]">{entityKey ?? 'NO ENTITY SELECTED'}</h1>
          <p className="mt-5 text-sm leading-relaxed text-ink/60">One canonical entity key connects the browser page, request queue, current public analysis, and correction history.</p>
          <div className="mt-6 border-2 border-ink bg-white p-4 font-mono text-[9px] font-bold uppercase leading-relaxed shadow-[4px_4px_0_#1c1c1a]">
            <p>Registry contract 1.0.0</p>
            <p>Fixture data only</p>
            <p>No real-world judgment</p>
          </div>
        </div>

        {published ? (
          <article className="border-2 border-ink bg-acid p-6 shadow-[7px_7px_0_#1c1c1a]">
            <div className="flex items-center gap-2 font-mono text-[9px] font-bold uppercase text-cobalt"><ShieldCheck className="h-4 w-4" /> Published synthetic fixture</div>
            <p className="mt-6 text-xs font-black uppercase">Reviewed truth score</p>
            <p className="mt-1 text-8xl font-black leading-none tracking-[-.09em] text-cobalt">{analysis.score_0_100}<span className="text-2xl tracking-normal">/100</span></p>
            <dl className="mt-7 grid grid-cols-2 gap-px border-2 border-ink bg-ink font-mono text-[9px] font-bold uppercase">
              <div className="bg-paper p-3"><dt className="text-ink/45">Coverage</dt><dd className="mt-1">{analysis.reviewed_claims}/{analysis.eligible_claims} reviewed</dd></div>
              <div className="bg-paper p-3"><dt className="text-ink/45">Unresolved</dt><dd className="mt-1">{analysis.unresolved_claims}</dd></div>
              <div className="bg-paper p-3"><dt className="text-ink/45">Method</dt><dd className="mt-1">{analysis.methodology_version}</dd></div>
              <div className="bg-paper p-3"><dt className="text-ink/45">Reviewed</dt><dd className="mt-1">{analysis.last_reviewed_at}</dd></div>
            </dl>
            <a className="mt-5 inline-flex items-center gap-2 font-mono text-[9px] font-bold uppercase text-cobalt underline" href="https://github.com/Rhys-Lindmark/ai-claims/blob/main/docs/TRUTH_SCORE_METHOD.md" target="_blank" rel="noreferrer">Read score method <ExternalLink className="h-3 w-3" /></a>
          </article>
        ) : (
          <article className="border-2 border-ink border-l-[12px] border-l-coral bg-white p-6 shadow-[7px_7px_0_#1c1c1a]">
            <p className="font-mono text-[9px] font-bold uppercase text-coral">Registry state</p>
            <h2 className="mt-4 text-4xl font-black leading-none">{entityKey ? 'NOT ANALYZED YET' : 'OPENED WITHOUT A PAGE'}</h2>
            <p className="mt-4 text-sm leading-relaxed text-ink/60">No reviewed public score is available for this entity. AI Claims will not substitute a guess or partial percentage.</p>
            <a className="mt-6 inline-flex border-2 border-ink bg-acid px-4 py-3 font-mono text-[9px] font-bold uppercase shadow-[3px_3px_0_#1c1c1a]" href="https://github.com/Rhys-Lindmark/ai-claims/releases/tag/extension-v0.2.1">Get the extension</a>
          </article>
        )}
      </section>
    </main>
  );
}
