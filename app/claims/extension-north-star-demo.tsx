import { ExternalLink, PanelRightOpen, ShieldCheck } from 'lucide-react';

export function ExtensionNorthStarDemo() {
  return (
    <section className="border-b-2 border-ink bg-acid">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 md:px-10 lg:grid-cols-[1.2fr_.8fr] lg:items-center">
        <div>
          <p className="font-mono text-[9px] font-bold uppercase text-cobalt">North star · open-source Chrome extension</p>
          <h2 className="mt-3 max-w-3xl text-4xl font-black leading-[.92] tracking-[-0.045em] md:text-6xl">THE TRUTH LAYER BESIDE THE PAGE.</h2>
          <p className="mt-5 max-w-2xl text-base font-semibold leading-relaxed text-ink/70">Open a YouTube video, Goodreads book, or ordinary page. AI Claims resolves it to a reviewed analysis and shows a 0–100 score—with the claim denominator, coverage, method version, and evidence trail still attached.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a className="inline-flex items-center gap-2 border-2 border-ink bg-ink px-4 py-3 font-mono text-[9px] font-bold uppercase text-paper shadow-[4px_4px_0_#214de8]" href="https://github.com/Rhys-Lindmark/ai-claims/releases/tag/extension-v0.1.5" target="_blank" rel="noreferrer"><PanelRightOpen className="h-4 w-4" /> Download prototype <ExternalLink className="h-3 w-3" /></a>
            <a className="inline-flex items-center gap-2 border-2 border-ink bg-white px-4 py-3 font-mono text-[9px] font-bold uppercase" href="https://ai.rhyslindmark.com/claims/analysis?entity_key=web%3Aexample.invalid%2Freviewed-fixture">Open synthetic analysis <ExternalLink className="h-3 w-3" /></a>
            <a className="inline-flex items-center gap-2 border-2 border-ink bg-white px-4 py-3 font-mono text-[9px] font-bold uppercase" href="https://ai.rhyslindmark.com/claims/intake">Supply a transcript <ExternalLink className="h-3 w-3" /></a>
            <a className="inline-flex items-center gap-2 border-2 border-ink bg-white px-4 py-3 font-mono text-[9px] font-bold uppercase" href="https://ai.rhyslindmark.com/claims/book-intake">Confirm a book edition <ExternalLink className="h-3 w-3" /></a>
            <span className="inline-flex items-center gap-2 border-2 border-ink bg-white px-4 py-3 font-mono text-[9px] font-bold uppercase"><ShieldCheck className="h-4 w-4 text-cobalt" /> Score gates stay on</span>
          </div>
        </div>
        <aside className="border-2 border-ink bg-paper p-4 shadow-[7px_7px_0_#1c1c1a]" aria-label="Synthetic extension preview">
          <div className="flex items-center justify-between border-b-2 border-ink pb-3 font-mono text-[8px] font-bold uppercase"><span className="text-cobalt">Synthetic preview</span><span>Rough draft 0.1</span></div>
          <p className="mt-5 text-xs font-black uppercase">Reviewed truth score</p>
          <p className="mt-1 text-7xl font-black leading-none tracking-[-.08em] text-cobalt">84<span className="text-2xl tracking-normal">/100</span></p>
          <p className="mt-5 border-t-2 border-ink pt-3 font-mono text-[9px] font-bold uppercase leading-relaxed">25/25 eligible claims reviewed<br />0 unresolved · method 0.4.0</p>
          <p className="mt-3 text-[10px] leading-relaxed text-ink/55">Fixture only. Real scores remain hidden until review, publication, and provenance gates pass.</p>
        </aside>
      </div>
    </section>
  );
}
