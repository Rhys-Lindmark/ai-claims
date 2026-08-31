import { ArrowRight, ExternalLink } from 'lucide-react';
import architecture from '@/extension/data/architecture.json';

const repository = 'https://github.com/Rhys-Lindmark/ai-claims/blob/main';
const stages = architecture.boundaries;

export function ExtensionArchitecture() {
  return <section className="border-b-2 border-ink bg-cobalt text-white">
    <div className="mx-auto max-w-6xl px-5 py-10 md:px-10">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="font-mono text-[9px] font-bold uppercase text-acid">Open-source extension architecture</p><h2 className="mt-3 max-w-3xl text-4xl font-black leading-[.94] tracking-[-.045em] md:text-5xl">ONE PAGE. FIVE AUDITABLE BOUNDARIES.</h2></div><a className="inline-flex items-center gap-2 font-mono text-[9px] font-bold uppercase text-acid underline" href="https://github.com/Rhys-Lindmark/ai-claims/tree/main/extension">Browse extension source <ExternalLink className="h-3 w-3" /></a></div>
      <ol className="mt-8 grid border-l-2 border-t-2 border-white md:grid-cols-5">{stages.map((stage, index) => <li className="border-b-2 border-r-2 border-white p-4" key={stage.number}><div className="flex items-center justify-between font-mono text-[8px] font-bold uppercase text-acid"><span>{stage.number}</span>{index < stages.length - 1 ? <ArrowRight className="h-3 w-3" /> : null}</div><h3 className="mt-4 text-2xl font-black uppercase">{stage.title}</h3><p className="mt-3 text-xs leading-relaxed text-white/70">{stage.detail}</p><p className="mt-4 border-l-2 border-acid pl-2 text-[11px] leading-relaxed text-white/80">{stage.privacy}</p><a className="mt-4 inline-flex break-all font-mono text-[8px] font-bold uppercase text-acid underline" href={`${repository}/${stage.file}`}>{stage.file}</a></li>)}</ol>
      <p className="mt-5 font-mono text-[9px] font-bold uppercase text-white/60">Contract: {architecture.contract}</p>
      <div className="mt-8 grid gap-5 border-2 border-white bg-ink p-5 md:grid-cols-[.7fr_1.3fr]"><div><p className="font-mono text-[9px] font-bold uppercase text-acid">Contributor quickstart</p><h3 className="mt-2 text-3xl font-black">CLONE → TEST → LOAD.</h3><p className="mt-3 text-xs leading-relaxed text-white/65">Node 22.13+ and Chrome are enough. The synthetic fixtures and local test suite need no production credentials.</p></div><div className="space-y-2 font-mono text-[10px]"><code className="block overflow-x-auto border border-white/40 bg-white/5 p-3">git clone https://github.com/Rhys-Lindmark/ai-claims.git</code><code className="block overflow-x-auto border border-white/40 bg-white/5 p-3">cd ai-claims &amp;&amp; npm ci &amp;&amp; npm run test:extension</code><code className="block overflow-x-auto border border-white/40 bg-white/5 p-3">npm run package:extension</code><p className="pt-2 text-[9px] leading-relaxed text-white/60">For live iteration, open <strong className="text-white">chrome://extensions</strong>, enable Developer mode, choose Load unpacked, and select the repository’s <strong className="text-white">extension</strong> directory.</p></div></div>
    </div>
  </section>;
}
