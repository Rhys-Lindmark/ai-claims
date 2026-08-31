'use client';

import { ArrowRight, ExternalLink, SearchCheck } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { probeResolverUrl, type ResolverProbeResult } from '@/extension/lib/resolver-probe.js';

const fixtureUrl = 'https://www.youtube.com/watch?v=ai-claims-synthetic-001';

export function ResolverProbe() {
  const [url, setUrl] = useState(fixtureUrl);
  const [result, setResult] = useState<ResolverProbeResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setResult(await probeResolverUrl(url));
    setLoading(false);
  }

  return <section className="border-b-2 border-ink bg-[#ffd76a]">
    <div className="mx-auto grid max-w-6xl gap-7 px-5 py-10 md:px-10 lg:grid-cols-[1.05fr_.95fr]">
      <div>
        <p className="font-mono text-[9px] font-bold uppercase text-cobalt">Live resolver probe · YouTube / Goodreads / web</p>
        <h2 className="mt-3 text-4xl font-black leading-[.94] tracking-[-.045em]">PASTE A PAGE URL. SEE THE GATE.</h2>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink/60">The page becomes one canonical entity key. Only that key reaches the public resolver; page text, title, and account data do not.</p>
        <form className="mt-6" onSubmit={submit}>
          <label className="font-mono text-[8px] font-bold uppercase" htmlFor="resolver-probe-url">YouTube, Goodreads, or webpage URL</label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row"><input className="min-w-0 flex-1 border-2 border-ink bg-white px-4 py-3 text-sm outline-none focus:shadow-[3px_3px_0_#214de8]" id="resolver-probe-url" onChange={(event) => setUrl(event.target.value)} spellCheck={false} value={url} /><button className="inline-flex items-center justify-center gap-2 border-2 border-ink bg-ink px-5 py-3 font-mono text-[9px] font-bold uppercase text-paper shadow-[3px_3px_0_#214de8] disabled:opacity-60" disabled={loading} type="submit">{loading ? 'Checking…' : 'Check resolver'} <ArrowRight className="h-4 w-4" /></button></div>
        </form>
      </div>
      <article className="border-2 border-ink bg-paper p-5 shadow-[6px_6px_0_#1c1c1a]" aria-live="polite">
        <div className="flex items-center justify-between gap-3 border-b-2 border-ink pb-3 font-mono text-[8px] font-bold uppercase"><span className="inline-flex items-center gap-2 text-cobalt"><SearchCheck className="h-4 w-4" /> Resolver result</span><span>{result?.state.replaceAll('_', ' ') ?? 'Ready'}</span></div>
        {!result ? <><p className="mt-7 text-3xl font-black">Synthetic fixture loaded.</p><p className="mt-3 text-xs leading-relaxed text-ink/55">Press “Check resolver” to run the same canonical identity and publication gate used by the extension.</p></> : <>
          <p className="mt-5 break-all font-mono text-[9px] font-bold uppercase text-ink/45">{result.identity.entityKey ?? 'No canonical entity'}</p>
          {result.state === 'reviewed' ? <><p className="mt-4 text-xs font-black uppercase">Reviewed fixture score</p><p className="text-7xl font-black leading-none tracking-[-.08em] text-cobalt">{result.score}<span className="text-xl tracking-normal">/100</span></p><p className="mt-4 font-mono text-[8px] font-bold uppercase">{result.reviewedClaims}/{result.eligibleClaims} reviewed · {result.methodologyVersion}</p><a className="mt-5 inline-flex items-center gap-2 font-mono text-[9px] font-bold uppercase text-cobalt underline" href={result.analysisUrl}>Open evidence trail <ExternalLink className="h-3 w-3" /></a></> : <><h3 className="mt-5 text-3xl font-black uppercase">{result.state.replaceAll('_', ' ')}</h3><p className="mt-3 text-sm leading-relaxed text-ink/60">{result.reason}</p>{result.state === 'not_analyzed' ? <a className="mt-5 inline-flex items-center gap-2 font-mono text-[9px] font-bold uppercase text-cobalt underline" href={result.nextAction.url}>{result.nextAction.label} <ExternalLink className="h-3 w-3" /></a> : null}</>}
        </>}
      </article>
    </div>
  </section>;
}
