'use client';

import { ArrowLeft, CheckCircle2, CircleDashed, ExternalLink, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

type RequestRecord = {
  request_id: string;
  entity_key: string;
  canonical_url: string;
  page_kind: 'youtube' | 'goodreads' | 'web';
  state: 'queued' | 'in_review' | 'published' | 'failed';
  attempt: number;
  created_at: string;
  updated_at: string;
};

type LifecycleEvent = {
  event_id: string;
  contract_version: string;
  sequence: number;
  from_state: RequestRecord['state'] | null;
  to_state: RequestRecord['state'];
  attempt: number;
  public_summary: string;
  occurred_at: string;
};

type Envelope = { contract_version: string; analysis_request: RequestRecord; lifecycle_events: LifecycleEvent[] };

const stateCopy = {
  queued: 'The canonical page is in the shared queue. No score exists yet.',
  in_review: 'Evidence review is underway. A score stays hidden until every publication gate passes.',
  published: 'A reviewed public analysis is available for this canonical page.',
  failed: 'This attempt stopped without publishing a score. A later retry will be recorded as a new event.',
};

export function RequestStatus() {
  const [requestId, setRequestId] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [message, setMessage] = useState('Open this page from the extension or enter a public request ID.');
  const [envelope, setEnvelope] = useState<Envelope | null>(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('request_id')?.trim() ?? '';
    setRequestId(id);
    if (!id) return;
    if (!/^req_[0-9a-f]{64}$/.test(id)) { setStatus('error'); setMessage('That request ID is not valid.'); return; }
    setStatus('loading');
    fetch(`/claims/api/v1/analysis-requests/${id}`, { headers: { accept: 'application/json' }, cache: 'no-store' })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(response.status === 404 ? 'No shared request has that ID.' : body.error ?? `Status lookup failed with ${response.status}.`);
        if (body.contract_version !== '1.0.0' || !Array.isArray(body.lifecycle_events)) throw new Error('The request status contract is unsupported.');
        setEnvelope(body);
        setStatus('ready');
      })
      .catch((error) => { setStatus('error'); setMessage(error instanceof Error ? error.message : 'Status lookup failed.'); });
  }, []);

  const record = envelope?.analysis_request;
  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="border-b-2 border-ink px-5 py-5 md:px-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <a className="inline-flex items-center gap-2 font-mono text-[9px] font-bold uppercase" href="https://ai.rhyslindmark.com/claims"><ArrowLeft className="h-4 w-4" /> AI Claims</a>
          <span className="font-mono text-[9px] font-bold uppercase text-cobalt">Public request lifecycle · contract 1.0.0</span>
        </div>
      </header>
      <section className="mx-auto max-w-5xl px-5 py-12 md:px-10">
        <p className="font-mono text-[9px] font-bold uppercase text-coral">Shared queue status</p>
        <h1 className="mt-3 max-w-4xl text-5xl font-black leading-[.92] tracking-[-.05em] md:text-7xl">A RECEIPT, NOT A PROMISE.</h1>
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-ink/60">Every canonical page gets one reusable request ID and an append-only public lifecycle. The receipt stores page identity—not visitor identity, page text, account data, or a guessed score.</p>

        {status !== 'ready' || !record ? (
          <div className="mt-9 border-2 border-ink border-l-[12px] border-l-coral bg-white p-6 shadow-[7px_7px_0_#1c1c1a]">
            <p className="font-mono text-[9px] font-bold uppercase text-coral">{status === 'loading' ? 'Checking shared queue' : status === 'error' ? 'Status unavailable' : 'Request ID required'}</p>
            <p className="mt-4 break-all font-mono text-xs leading-relaxed text-ink/60">{status === 'loading' ? requestId : message}</p>
          </div>
        ) : (
          <div className="mt-9 grid gap-8 lg:grid-cols-[.8fr_1.2fr]">
            <article className="border-2 border-ink bg-acid p-6 shadow-[7px_7px_0_#1c1c1a]">
              <div className="flex items-center gap-2 font-mono text-[9px] font-bold uppercase text-cobalt"><ShieldCheck className="h-4 w-4" /> Shared · identity-free</div>
              <p className="mt-7 text-xs font-black uppercase">Current state</p>
              <h2 className="mt-1 text-5xl font-black leading-none tracking-[-.05em] text-cobalt">{record.state.replaceAll('_', ' ').toUpperCase()}</h2>
              <p className="mt-5 text-sm font-semibold leading-relaxed text-ink/65">{stateCopy[record.state]}</p>
              <dl className="mt-7 grid gap-px border-2 border-ink bg-ink font-mono text-[8px] font-bold uppercase">
                <div className="bg-paper p-3"><dt className="text-ink/45">Request</dt><dd className="mt-1 break-all normal-case">{record.request_id}</dd></div>
                <div className="bg-paper p-3"><dt className="text-ink/45">Canonical entity</dt><dd className="mt-1 break-all normal-case">{record.entity_key}</dd></div>
                <div className="grid grid-cols-2 gap-px bg-ink"><div className="bg-paper p-3"><dt className="text-ink/45">Surface</dt><dd className="mt-1">{record.page_kind}</dd></div><div className="bg-paper p-3"><dt className="text-ink/45">Attempt</dt><dd className="mt-1">{record.attempt}</dd></div></div>
              </dl>
              <div className="mt-5 flex flex-wrap gap-4 font-mono text-[8px] font-bold uppercase">
                <a className="inline-flex items-center gap-1 text-cobalt underline" href={record.canonical_url} target="_blank" rel="noreferrer">Open canonical page <ExternalLink className="h-3 w-3" /></a>
                {record.state === 'published' ? <a className="inline-flex items-center gap-1 text-cobalt underline" href={`/claims/analysis?entity_key=${encodeURIComponent(record.entity_key)}`}>Open analysis <ExternalLink className="h-3 w-3" /></a> : null}
              </div>
            </article>

            <article className="border-2 border-ink bg-white p-6 shadow-[7px_7px_0_#214de8]">
              <p className="font-mono text-[9px] font-bold uppercase text-cobalt">Append-only lifecycle</p>
              <h2 className="mt-3 text-3xl font-black leading-none">WHAT HAPPENED, IN ORDER.</h2>
              <ol className="mt-7 space-y-4">
                {envelope.lifecycle_events.map((event, index) => (
                  <li className="grid grid-cols-[auto_1fr] gap-4" key={event.event_id}>
                    <div className="pt-1 text-cobalt">{index === envelope.lifecycle_events.length - 1 ? <CheckCircle2 className="h-5 w-5" /> : <CircleDashed className="h-5 w-5" />}</div>
                    <div className="border-b border-ink/20 pb-4">
                      <div className="flex flex-wrap justify-between gap-2 font-mono text-[8px] font-bold uppercase"><span>{event.sequence}. {event.to_state.replaceAll('_', ' ')}</span><time className="text-ink/45">{event.occurred_at}</time></div>
                      <p className="mt-2 text-sm leading-relaxed text-ink/65">{event.public_summary}</p>
                      <p className="mt-2 font-mono text-[7px] font-bold uppercase text-ink/40">Attempt {event.attempt} · event contract {event.contract_version}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-6 border-t-2 border-ink pt-4 font-mono text-[8px] font-bold uppercase leading-relaxed text-ink/45">Public read only · reviewer controls remain separate · duplicate visits reuse this lifecycle</p>
            </article>
          </div>
        )}
      </section>
    </main>
  );
}
