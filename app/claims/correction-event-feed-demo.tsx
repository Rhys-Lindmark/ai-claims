import fixture from '@/data/correction-event-feed-fixture.json';
import type { EntityCorrectionFeed } from '@/lib/correction-event-feed';

export function CorrectionEventFeedDemo() {
  const feeds = fixture.feeds as EntityCorrectionFeed[];
  const eventCount = feeds.reduce((sum, feed) => sum + feed.events.length, 0);
  return <section className="border-t-2 border-ink bg-ink text-paper">
    <div className="mx-auto max-w-6xl px-5 py-12 md:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[9px] font-bold uppercase text-acid">Append-only correction feed · synthetic</p>
          <h2 className="mt-2 max-w-4xl text-4xl font-black tracking-[-0.05em]">Show what changed. Never replay the withdrawn score.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-paper/60">Each entity keeps its own ordered version transitions, naming affected claim, evidence, method, and publication-gate records. Events carry publication state—not a reusable score.</p>
        </div>
        <span className="border border-paper/25 px-3 py-2 font-mono text-[8px] font-bold uppercase text-acid">{eventCount} events · {feeds.length} entities</span>
      </div>
      <div className="mt-8 space-y-8">
        {feeds.map((feed) => <div key={feed.entity_key}>
          <p className="mb-3 break-all font-mono text-[8px] font-bold uppercase text-paper/40">{feed.entity_key}</p>
          <div className="space-y-3">{feed.events.map((event) => <article className="grid scroll-mt-4 gap-4 border-2 border-paper/25 bg-paper/5 p-5 lg:grid-cols-[150px_1fr_auto] lg:items-center" id={event.event_id} key={event.event_id}>
            <div><span className="font-mono text-[8px] uppercase text-paper/40">Sequence {String(event.sequence).padStart(2, '0')}</span><strong className="mt-2 block text-lg">{event.from_version_id} → {event.to_version_id}</strong></div>
            <div><p className="font-semibold leading-relaxed">{event.summary}</p><div className="mt-3 flex flex-wrap gap-2">{event.changed_records.map((record) => <span className="border border-paper/20 px-2 py-1 font-mono text-[7px] font-bold uppercase text-paper/60" key={`${event.event_id}-${record.record_id}`}>{record.kind} · {record.record_id} · {record.change}</span>)}</div></div>
            <span className={`px-3 py-2 text-center font-mono text-[8px] font-bold uppercase text-ink ${event.public_score_state === 'active' ? 'bg-acid' : 'bg-coral'}`}>{event.public_score_state}</span>
          </article>)}</div>
        </div>)}
      </div>
      <p className="mt-4 font-mono text-[8px] font-bold uppercase text-paper/35">Fixture only · append-only order validated · no score field permitted in events</p>
    </div>
  </section>;
}
