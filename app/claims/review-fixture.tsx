'use client';

import { ArrowLeft, Scissors, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import fixture from '@/data/claim-review-fixture.json';
import type { ClaimType } from '@/lib/claim-types';
import { CanonicalGroupDemo } from './canonical-group-demo';
import { EvidenceLedgerDemo } from './evidence-ledger-demo';
import { ReviewedFindingsDemo } from './reviewed-findings-demo';
import { VersionHistoryDemo } from './version-history-demo';
import { RightOfReplyDemo } from './right-of-reply-demo';
import { ConsequenceQueueDemo } from './consequence-queue-demo';
import { EpisodeCoverageDemo } from './episode-coverage-demo';
import { CoreIdeaDemo } from './core-idea-demo';
import { SpeakerAttributionDemo } from './speaker-attribution-demo';
import { ClaimTraceDemo } from './claim-trace-demo';
import { PublicationReadinessDemo } from './publication-readiness-demo';
import { EpisodeSelectionDemo } from './episode-selection-demo';
import { MethodologyManifestDemo } from './methodology-manifest-demo';
import { MethodsChangelogDemo } from './methods-changelog-demo';
import { SourceStatusDemo } from './source-status-demo';
import { ReviewerDisclosuresDemo } from './reviewer-disclosures-demo';
import { ReviewAdjudicationDemo } from './review-adjudication-demo';
import { EvidenceSearchDemo } from './evidence-search-demo';
import { LimitationsRegisterDemo } from './limitations-register-demo';
import { ClaimFreshnessDemo } from './claim-freshness-demo';
import { CitationSnapshotsDemo } from './citation-snapshots-demo';

const labels: Record<ClaimType, string> = { factual: 'Factual', causal: 'Causal', quantitative: 'Quantitative', prediction: 'Prediction', opinion_value: 'Opinion / value', rhetorical_hypothetical: 'Rhetorical / hypothetical', anecdote_personal: 'Anecdote / personal' };
const tones: Record<ClaimType, string> = { factual: 'bg-acid', causal: 'bg-coral', quantitative: 'bg-cobalt text-white', prediction: 'bg-[#ffd76a]', opinion_value: 'bg-ink/10', rhetorical_hypothetical: 'bg-[#ded8ca]', anecdote_personal: 'bg-white' };

export function ClaimReviewFixture() {
  const [active, setActive] = useState<ClaimType | 'all'>('all');
  const candidates = fixture.candidates.filter((candidate) => active === 'all' || candidate.type === active);
  return <main className="min-h-screen bg-paper text-ink"><header className="border-b-2 border-ink"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 md:px-10"><a className="inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase" href="/#podcasts"><ArrowLeft className="h-4 w-4" /> Accelerator</a><span className="font-mono text-[9px] font-bold uppercase text-cobalt">Podcast checker / claim review</span></div></header><section className="border-b-2 border-ink bg-ink text-paper"><div className="mx-auto max-w-6xl px-5 py-12 md:px-10"><div className="inline-flex items-center gap-2 border border-acid px-3 py-2 font-mono text-[9px] font-bold uppercase text-acid"><ShieldCheck className="h-4 w-4" /> Synthetic fixture · no verdicts</div><h1 className="mt-5 text-5xl font-black leading-[.9] tracking-[-0.065em] md:text-8xl">SPLIT THE<br /><span className="text-acid">STATEMENT.</span></h1><p className="mt-5 max-w-2xl leading-relaxed text-paper/60">Separate factual, causal, quantitative, predictive, value, rhetorical, and anecdotal speech before anyone asks whether it is true.</p></div></section><section className="mx-auto grid max-w-6xl gap-8 px-5 py-10 md:px-10 lg:grid-cols-[.8fr_1.2fr]"><div><p className="font-mono text-[9px] font-bold uppercase text-coral">Original synthetic segment</p><blockquote className="mt-3 border-l-4 border-cobalt bg-white p-5 text-lg font-semibold leading-relaxed">{fixture.transcript}</blockquote><div className="mt-6 flex flex-wrap gap-2"><button className={`border-2 border-ink px-3 py-2 font-mono text-[8px] font-bold uppercase ${active === 'all' ? 'bg-ink text-paper' : 'bg-white'}`} onClick={() => setActive('all')}>All candidates</button>{Object.entries(labels).map(([type, label]) => <button className={`border-2 border-ink px-3 py-2 font-mono text-[8px] font-bold uppercase ${active === type ? tones[type as ClaimType] : 'bg-white'}`} key={type} onClick={() => setActive(type as ClaimType)}>{label}</button>)}</div></div><div><div className="flex items-end justify-between border-b-2 border-ink pb-3"><div><p className="font-mono text-[9px] font-bold uppercase text-coral">Review candidates</p><h2 className="mt-1 text-3xl font-black">{candidates.length} atomic units</h2></div><Scissors className="h-6 w-6 text-cobalt" /></div><div className="space-y-3 pt-4">{candidates.map((candidate) => <article className="border-2 border-ink bg-white p-5" key={candidate.id}><div className="flex flex-wrap items-center justify-between gap-2"><span className={`px-2 py-1 font-mono text-[8px] font-bold uppercase ${tones[candidate.type as ClaimType]}`}>{labels[candidate.type as ClaimType]}</span><span className="font-mono text-[8px] font-bold uppercase text-ink/40">{candidate.checkability.replaceAll('_', ' ')}</span></div><h3 className="mt-4 text-xl font-black leading-tight">{candidate.text}</h3><p className="mt-3 text-xs leading-relaxed text-ink/55">{candidate.reviewer_note}</p><div className="mt-4 flex flex-wrap gap-2 font-mono text-[8px] font-bold uppercase text-ink/45">{candidate.split_from_compound ? <span className="border border-ink/20 px-2 py-1">Split from compound</span> : null}{candidate.embedded_factual_premise ? <span className="border border-ink/20 px-2 py-1">Embedded premise</span> : null}<span className="border border-ink/20 px-2 py-1">No verdict</span></div></article>)}</div></div></section><CanonicalGroupDemo /><EvidenceLedgerDemo /><ReviewedFindingsDemo /><VersionHistoryDemo /><RightOfReplyDemo /><ConsequenceQueueDemo /><EpisodeCoverageDemo /><CoreIdeaDemo /><SpeakerAttributionDemo /><ClaimTraceDemo />
<PublicationReadinessDemo />
<EpisodeSelectionDemo />
<MethodologyManifestDemo />
<MethodsChangelogDemo />
<SourceStatusDemo />
<ReviewerDisclosuresDemo />
<ReviewAdjudicationDemo />
<EvidenceSearchDemo />
<LimitationsRegisterDemo />
<ClaimFreshnessDemo /><CitationSnapshotsDemo /></main>;
}
