'use client';

import { ArrowLeft, CheckCircle2, FileKey2, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { resolveTranscriptIntake, type TranscriptAccessRoute } from '@/lib/transcript-intake';
import { createUserTranscriptFixture, type TranscriptCaptionType, type TranscriptProvenanceRecord } from '@/lib/transcript-provenance';
import { parseYouTubeUrl } from '@/lib/youtube';

export function TranscriptIntakeForm() {
  const [url, setUrl] = useState('');
  const [route, setRoute] = useState<TranscriptAccessRoute>('user_supplied');
  const [transcript, setTranscript] = useState('');
  const [language, setLanguage] = useState('en');
  const [captionType, setCaptionType] = useState<TranscriptCaptionType>('unknown');
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [record, setRecord] = useState<TranscriptProvenanceRecord | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setUrl(new URLSearchParams(window.location.search).get('url') ?? '');
  }, []);

  const parsed = useMemo(() => parseYouTubeUrl(url), [url]);
  const decision = resolveTranscriptIntake(route);

  async function stageRecord() {
    setRecord(null);
    if (!parsed.ok) return setError(parsed.error);
    if (route !== 'user_supplied') return setError('This prototype stages user-supplied text only. Creator OAuth and licensed-source adapters are not connected yet.');
    const result = createUserTranscriptFixture({ canonicalVideoUrl: parsed.canonicalUrl, transcript, language, captionType, rightsConfirmed, suppliedAt: new Date().toISOString() });
    if (!result.ok) return setError(result.error);
    setError('');
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(transcript.trim()));
    const checksum = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
    setRecord({ ...result.record, content_checksum: `sha256:${checksum}` });
  }

  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="border-b-2 border-ink px-5 py-5 md:px-10"><div className="mx-auto flex max-w-5xl items-center justify-between"><a className="inline-flex items-center gap-2 font-mono text-[9px] font-bold uppercase" href="https://ai.rhyslindmark.com/claims"><ArrowLeft className="h-4 w-4" /> AI Claims</a><span className="font-mono text-[9px] font-bold uppercase text-cobalt">Permitted source intake</span></div></header>
      <section className="border-b-2 border-ink bg-ink text-paper"><div className="mx-auto max-w-5xl px-5 py-10 md:px-10"><div className="inline-flex items-center gap-2 border border-acid px-3 py-2 font-mono text-[9px] font-bold uppercase text-acid"><ShieldCheck className="h-4 w-4" /> Browser memory only</div><h1 className="mt-5 max-w-4xl text-5xl font-black leading-[.9] tracking-[-.06em] md:text-7xl">SUPPLY THE SOURCE.<br /><span className="text-acid">KEEP THE RIGHTS.</span></h1><p className="mt-5 max-w-2xl text-sm leading-relaxed text-paper/60">Stage transcript provenance without scraping YouTube or sending the transcript anywhere. Refreshing this tab clears the text and record.</p></div></section>
      <section className="mx-auto grid max-w-5xl gap-8 px-5 py-10 md:px-10 lg:grid-cols-[1.15fr_.85fr]">
        <div className="space-y-6">
          <label className="block"><span className="font-mono text-[9px] font-bold uppercase text-coral">1 · Canonical YouTube page</span><input className="mt-2 w-full border-2 border-ink bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-cobalt/25" value={url} onChange={(event) => { setUrl(event.target.value); setRecord(null); }} placeholder="https://www.youtube.com/watch?v=…" /></label>
          <div className="border-2 border-ink bg-white p-5"><p className="font-mono text-[9px] font-bold uppercase text-coral">2 · Permitted acquisition route</p><div className="mt-4 grid gap-2">{(['user_supplied', 'creator_authorized', 'licensed_provider'] as TranscriptAccessRoute[]).map((item) => <label className={`flex cursor-pointer items-start gap-3 border-2 p-3 ${route === item ? 'border-cobalt bg-cobalt/5' : 'border-ink/20'}`} key={item}><input className="mt-1 accent-[#214de8]" type="radio" checked={route === item} onChange={() => { setRoute(item); setRecord(null); setError(''); }} /><span><strong className="block text-sm">{item.replaceAll('_', ' ')}</strong><span className="mt-1 block text-xs leading-relaxed text-ink/55">{resolveTranscriptIntake(item).detail}</span></span></label>)}</div></div>
          {route === 'user_supplied' ? <div className="border-2 border-ink bg-white p-5"><p className="font-mono text-[9px] font-bold uppercase text-coral">3 · Transcript + provenance</p><textarea className="mt-4 min-h-48 w-full resize-y border-2 border-ink p-3 text-sm leading-relaxed outline-none focus:ring-4 focus:ring-cobalt/25" value={transcript} onChange={(event) => { setTranscript(event.target.value); setRecord(null); }} placeholder="Paste at least 80 characters of transcript text…" /><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold">Language<input className="mt-1 w-full border-2 border-ink p-2" value={language} onChange={(event) => setLanguage(event.target.value)} /></label><label className="text-xs font-bold">Caption type<select className="mt-1 w-full border-2 border-ink bg-white p-2" value={captionType} onChange={(event) => setCaptionType(event.target.value as TranscriptCaptionType)}><option value="unknown">Unknown</option><option value="creator_authored">Creator authored</option><option value="professional">Professional</option><option value="automatic">Automatic</option></select></label></div><label className="mt-4 flex items-start gap-3 border-2 border-ink/20 p-3 text-xs leading-relaxed"><input className="mt-0.5 accent-[#214de8]" type="checkbox" checked={rightsConfirmed} onChange={(event) => { setRightsConfirmed(event.target.checked); setRecord(null); }} /><span>I confirm that I may submit this transcript for analysis. The prototype keeps it only in this tab's memory.</span></label></div> : null}
          <button className="w-full border-2 border-ink bg-acid px-5 py-4 font-mono text-[10px] font-bold uppercase shadow-[4px_4px_0_#1c1c1a] disabled:cursor-not-allowed disabled:opacity-40" disabled={route === 'user_supplied' && (!rightsConfirmed || transcript.trim().length < 80)} onClick={stageRecord}>Stage provenance record</button>
          {error ? <p className="border-l-4 border-coral bg-white p-3 text-sm font-semibold" role="alert">{error}</p> : null}
        </div>
        <aside>
          <div className="sticky top-5 border-2 border-ink bg-white p-5 shadow-[6px_6px_0_#1c1c1a]">
            <div className="flex items-center justify-between"><FileKey2 className="h-5 w-5 text-cobalt" /><span className="font-mono text-[8px] font-bold uppercase">Provenance preview</span></div>
            <h2 className="mt-5 text-3xl font-black leading-none">{record ? 'READY FOR REVIEW' : decision.title.toUpperCase()}</h2>
            {record ? <><div className="mt-5 flex items-center gap-2 font-mono text-[9px] font-bold uppercase text-cobalt"><CheckCircle2 className="h-4 w-4" /> Rights confirmed</div><dl className="mt-4 space-y-3 break-words font-mono text-[9px]"><div><dt className="font-bold uppercase text-ink/45">Video</dt><dd>{record.canonical_video_url}</dd></div><div><dt className="font-bold uppercase text-ink/45">Text</dt><dd>{record.word_count} words · {record.character_count} characters</dd></div><div><dt className="font-bold uppercase text-ink/45">Digest</dt><dd>{record.content_checksum}</dd></div><div><dt className="font-bold uppercase text-ink/45">Retention</dt><dd>{record.persistence.replaceAll('_', ' ')}</dd></div><div><dt className="font-bold uppercase text-ink/45">State</dt><dd>{record.review_state.replaceAll('_', ' ')}</dd></div></dl></> : <p className="mt-4 text-sm leading-relaxed text-ink/55">{decision.detail}</p>}
            <p className="mt-6 border-t-2 border-ink pt-4 text-[10px] leading-relaxed text-ink/45">Staging this record computes a local SHA-256 digest. It does not publish, persist, upload, analyze, or score the transcript.</p>
          </div>
        </aside>
      </section>
    </main>
  );
}
