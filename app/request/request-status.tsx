'use client';

import { ArrowLeft, ExternalLink } from 'lucide-react';
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
  queued: 'This page is in the shared queue. No score exists yet.',
  in_review: 'The claim review is underway. The score stays hidden until every publication gate passes.',
  published: 'A reviewed public analysis is available.',
  failed: 'This attempt stopped without publishing a score.',
};

const activeReviews: Record<string, string> = {
  'goodreads:1842': '/claims/book?entity_key=goodreads%3A1842',
};

export function RequestStatus() {
  const [requestId, setRequestId] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [message, setMessage] = useState('Open this page from the book checker.');
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
  const activeReviewUrl = record ? activeReviews[record.entity_key] : undefined;
  const displayState: RequestRecord['state'] | undefined = record && activeReviewUrl && record.state === 'queued' ? 'in_review' : record?.state;

  return <main className="min-h-screen bg-[#fbfbfa] text-[#20211f]">
    <header className="border-b border-[#20211f]/10">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5">
        <a className="inline-flex items-center gap-2 text-sm font-bold" href="https://ai.rhyslindmark.com/claims"><ArrowLeft className="h-4 w-4" /> AI Claims</a>
        <span className="text-xs text-[#20211f]/45">Review status</span>
      </div>
    </header>

    <div className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
      <h1 className="text-4xl font-black tracking-[-.04em] sm:text-6xl">Review status</h1>

      {status !== 'ready' || !record || !displayState ? <section className="mt-8 rounded-2xl border border-[#20211f]/15 bg-white p-6">
        <p className="text-sm font-bold">{status === 'loading' ? 'Checking…' : status === 'error' ? 'Status unavailable' : 'Request ID needed'}</p>
        <p className="mt-2 break-all text-sm leading-relaxed text-[#20211f]/55">{status === 'loading' ? requestId : message}</p>
      </section> : <>
        <section className="mt-8 rounded-2xl border border-[#20211f]/15 bg-white p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-[#20211f]/40">Current state</p>
          <h2 className="mt-2 text-3xl font-black capitalize">{displayState.replaceAll('_', ' ')}</h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#20211f]/60">{stateCopy[displayState]}</p>
          <dl className="mt-7 grid gap-4 border-t border-[#20211f]/10 pt-6 text-sm sm:grid-cols-2">
            <div><dt className="text-xs text-[#20211f]/40">Page</dt><dd className="mt-1 break-all font-semibold">{record.entity_key}</dd></div>
            <div><dt className="text-xs text-[#20211f]/40">Attempt</dt><dd className="mt-1 font-semibold">{record.attempt}</dd></div>
          </dl>
          <div className="mt-7 flex flex-wrap gap-4 border-t border-[#20211f]/10 pt-5 text-sm font-bold">
            {activeReviewUrl ? <a className="underline" href={activeReviewUrl}>Open claim map</a> : null}
            <a className="inline-flex items-center gap-1 underline" href={record.canonical_url} target="_blank" rel="noreferrer">Open source page <ExternalLink className="h-3 w-3" /></a>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-black">History</h2>
          <ol className="mt-5 divide-y divide-[#20211f]/10 border-y border-[#20211f]/10">
            {envelope.lifecycle_events.map((event) => <li className="py-5" key={event.event_id}>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#20211f]/40"><span className="font-semibold capitalize">{event.to_state.replaceAll('_', ' ')}</span><time>{event.occurred_at}</time></div>
              <p className="mt-2 text-sm leading-relaxed text-[#20211f]/60">{event.public_summary}</p>
            </li>)}
            {activeReviewUrl && record.state === 'queued' ? <li className="py-5"><div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#20211f]/40"><span className="font-semibold">Public claim map started</span><span>Current</span></div><p className="mt-2 text-sm leading-relaxed text-[#20211f]/60">Candidate claims and evidence notes are public. No claim is passage-confirmed and no score is available.</p></li> : null}
          </ol>
        </section>
      </>}
    </div>
  </main>;
}
