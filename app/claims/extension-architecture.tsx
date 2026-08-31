import { ArrowRight, ExternalLink } from 'lucide-react';

const repository = 'https://github.com/Rhys-Lindmark/ai-claims/blob/main';
const stages = [
  { number: '01', title: 'Detect', detail: 'Recognize YouTube, Goodreads, or an ordinary public page after a user action.', file: 'extension/lib/page-identity.js', privacy: 'URL and title stay in the browser.' },
  { number: '02', title: 'Canonicalize', detail: 'Reduce the page to one stable source key and strip tracking parameters.', file: 'extension/lib/page-identity.js', privacy: 'Page text, cookies, and account data never enter the key.' },
  { number: '03', title: 'Resolve', detail: 'Ask the public read-only API whether a matching analysis version exists.', file: 'extension/lib/analysis-resolver.js', privacy: 'Only the canonical entity key is sent.' },
  { number: '04', title: 'Gate', detail: 'Suppress scores until every eligible claim is reviewed and provenance is complete.', file: 'extension/lib/analysis-registry.js', privacy: 'Pending and partial work cannot leak a number.' },
  { number: '05', title: 'Show', detail: 'Render a badge and a link to the versioned evidence trail, or a no-score state.', file: 'extension/service-worker.js', privacy: 'Local metrics retain category counts, never page identity.' },
] as const;

export function ExtensionArchitecture() {
  return <section className="border-b-2 border-ink bg-cobalt text-white">
    <div className="mx-auto max-w-6xl px-5 py-10 md:px-10">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="font-mono text-[9px] font-bold uppercase text-acid">Open-source extension architecture</p><h2 className="mt-3 max-w-3xl text-4xl font-black leading-[.94] tracking-[-.045em] md:text-5xl">ONE PAGE. FIVE AUDITABLE BOUNDARIES.</h2></div><a className="inline-flex items-center gap-2 font-mono text-[9px] font-bold uppercase text-acid underline" href="https://github.com/Rhys-Lindmark/ai-claims/tree/main/extension">Browse extension source <ExternalLink className="h-3 w-3" /></a></div>
      <ol className="mt-8 grid border-l-2 border-t-2 border-white md:grid-cols-5">{stages.map((stage, index) => <li className="border-b-2 border-r-2 border-white p-4" key={stage.number}><div className="flex items-center justify-between font-mono text-[8px] font-bold uppercase text-acid"><span>{stage.number}</span>{index < stages.length - 1 ? <ArrowRight className="h-3 w-3" /> : null}</div><h3 className="mt-4 text-2xl font-black uppercase">{stage.title}</h3><p className="mt-3 text-xs leading-relaxed text-white/70">{stage.detail}</p><p className="mt-4 border-l-2 border-acid pl-2 text-[11px] leading-relaxed text-white/80">{stage.privacy}</p><a className="mt-4 inline-flex break-all font-mono text-[8px] font-bold uppercase text-acid underline" href={`${repository}/${stage.file}`}>{stage.file}</a></li>)}</ol>
      <p className="mt-5 font-mono text-[9px] font-bold uppercase text-white/60">Contract: no reviewed evidence → no score.</p>
    </div>
  </section>;
}
