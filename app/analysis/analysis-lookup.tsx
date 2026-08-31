'use client';

import { ArrowLeft, ExternalLink, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import registry from '@/extension/data/analyses.json';
import release from '@/releases/extension-v0.2.21.json';

type Analysis = (typeof registry.analyses)[number];
const releaseUrl = `https://github.com/Rhys-Lindmark/ai-claims/releases/tag/v${release.extension_version}`;

export function AnalysisLookup() {
  const [entityKey, setEntityKey] = useState<string | null>(null);
  const [versionId, setVersionId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setEntityKey(params.get('entity_key'));
    setVersionId(params.get('version_id'));
  }, []);

  const analysis = registry.analyses.find((entry) => entry.entity_key === entityKey) as Analysis | undefined;
  const archivedVersion = versionId && analysis?.analysis_version_id !== versionId
    ? analysis?.version_history.find((entry) => entry.analysis_version_id === versionId)
    : null;
  const versionMissing = Boolean(versionId && analysis && analysis.analysis_version_id !== versionId && !archivedVersion);
  const currentVersionSelected = !versionId || analysis?.analysis_version_id === versionId;
  const published = currentVersionSelected && analysis?.status === 'published' && analysis.publication_state === 'active' && analysis.score_0_100 !== null;
  const paused = currentVersionSelected && analysis?.publication_state === 'paused';

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
            <p>{versionId ? `Immutable version ${versionId}` : 'Current-version pointer'}</p>
            <p>Fixture data only</p>
            <p>No real-world judgment</p>
          </div>
        </div>

        {archivedVersion ? (
          <article className="border-2 border-ink bg-white p-6 shadow-[7px_7px_0_#1c1c1a]">
            <p className="font-mono text-[9px] font-bold uppercase text-cobalt">Immutable archived fixture</p>
            <h2 className="mt-4 break-words text-4xl font-black leading-none">{archivedVersion.analysis_version_id}</h2>
            <dl className="mt-7 grid gap-px border-2 border-ink bg-ink font-mono text-[9px] font-bold uppercase">
              <div className="bg-paper p-3"><dt className="text-ink/45">Publication state</dt><dd className="mt-1">{archivedVersion.publication_state}</dd></div>
              <div className="bg-paper p-3"><dt className="text-ink/45">Superseded by</dt><dd className="mt-1">{archivedVersion.superseded_by_version_id}</dd></div>
            </dl>
            <p className="mt-5 text-sm leading-relaxed text-ink/60">This stable URL preserves the version transition without presenting an archived score as current.</p>
          </article>
        ) : published ? (
          <article className="border-2 border-ink bg-acid p-6 shadow-[7px_7px_0_#1c1c1a]">
            <div className="flex items-center gap-2 font-mono text-[9px] font-bold uppercase text-cobalt"><ShieldCheck className="h-4 w-4" /> Published synthetic fixture</div>
            <p className="mt-6 text-xs font-black uppercase">Reviewed truth score</p>
            <p className="mt-1 text-8xl font-black leading-none tracking-[-.09em] text-cobalt">{analysis.score_0_100}<span className="text-2xl tracking-normal">/100</span></p>
            <dl className="mt-7 grid grid-cols-2 gap-px border-2 border-ink bg-ink font-mono text-[9px] font-bold uppercase">
              <div className="bg-paper p-3"><dt className="text-ink/45">Coverage</dt><dd className="mt-1">{analysis.reviewed_claims}/{analysis.eligible_claims} reviewed</dd></div>
              <div className="bg-paper p-3"><dt className="text-ink/45">Unresolved</dt><dd className="mt-1">{analysis.unresolved_claims}</dd></div>
              <div className="bg-paper p-3"><dt className="text-ink/45">Method</dt><dd className="mt-1">{analysis.methodology_version}</dd></div>
              <div className="bg-paper p-3"><dt className="text-ink/45">Reviewed</dt><dd className="mt-1">{analysis.last_reviewed_at}</dd></div>
              <div className="bg-paper p-3"><dt className="text-ink/45">Version</dt><dd className="mt-1">{analysis.analysis_version_id}</dd></div>
              <div className="bg-paper p-3"><dt className="text-ink/45">Lineage</dt><dd className="mt-1">{analysis.superseded_version_ids.length} superseded</dd></div>
            </dl>
            <div className="mt-5 flex flex-wrap gap-3 font-mono text-[9px] font-bold uppercase">
              <a className="text-cobalt underline" href={`?entity_key=${encodeURIComponent(analysis.entity_key)}&version_id=${encodeURIComponent(analysis.analysis_version_id)}`}>Permanent link to this version</a>
              {analysis.version_history.map((version) => <a className="text-ink/60 underline" key={version.analysis_version_id} href={`?entity_key=${encodeURIComponent(analysis.entity_key)}&version_id=${encodeURIComponent(version.analysis_version_id)}`}>{version.analysis_version_id}</a>)}
            </div>
            <a className="mt-5 inline-flex items-center gap-2 font-mono text-[9px] font-bold uppercase text-cobalt underline" href="https://github.com/Rhys-Lindmark/ai-claims/blob/main/docs/TRUTH_SCORE_METHOD.md" target="_blank" rel="noreferrer">Read score method <ExternalLink className="h-3 w-3" /></a>
          </article>
        ) : (
          <article className="border-2 border-ink border-l-[12px] border-l-coral bg-white p-6 shadow-[7px_7px_0_#1c1c1a]">
            <p className="font-mono text-[9px] font-bold uppercase text-coral">Registry state</p>
            <h2 className="mt-4 text-4xl font-black leading-none">{versionMissing ? 'VERSION NOT FOUND' : paused ? 'SCORE PAUSED' : entityKey ? 'NOT ANALYZED YET' : 'OPENED WITHOUT A PAGE'}</h2>
            <p className="mt-4 text-sm leading-relaxed text-ink/60">{versionMissing ? 'This entity exists, but that version identifier is not in its preserved history.' : paused ? `Version ${analysis.analysis_version_id} is preserved, but its score is suppressed while ${analysis.paused_reason?.replaceAll('_', ' ')} is resolved.` : 'No reviewed public score is available for this entity. AI Claims will not substitute a guess or partial percentage.'}</p>
            <a className="mt-6 inline-flex border-2 border-ink bg-acid px-4 py-3 font-mono text-[9px] font-bold uppercase shadow-[3px_3px_0_#1c1c1a]" href={releaseUrl}>Get the extension</a>
          </article>
        )}
      </section>
    </main>
  );
}
