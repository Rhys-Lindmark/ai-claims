import { ExternalLink, FlaskConical, PanelRightOpen, ShieldCheck } from 'lucide-react';
import channelPolicy from '@/releases/channel-policy.json';
import release016 from '@/releases/extension-v0.2.16.json';
import release017 from '@/releases/extension-v0.2.17.json';
import release018 from '@/releases/extension-v0.2.18.json';
import release from '@/releases/extension-v0.2.19.json';
import { releaseDownloadUrls } from '@/extension/lib/extension-release-api.js';

const retainedReleases = [release, release018, release017, release016].filter((item) =>
  channelPolicy.retained_versions.includes(item.extension_version),
);

export function ExtensionNorthStarDemo() {
  const releaseUrls = releaseDownloadUrls(release.extension_version);
  const releasePageUrl = `https://github.com/Rhys-Lindmark/ai-claims/releases/tag/v${release.extension_version}`;
  return (
    <section className="border-b-2 border-ink bg-acid">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 md:px-10 lg:grid-cols-[1.2fr_.8fr] lg:items-center">
        <div>
          <p className="font-mono text-[9px] font-bold uppercase text-cobalt">North star · open-source Chrome extension</p>
          <h2 className="mt-3 max-w-3xl text-4xl font-black leading-[.92] tracking-[-0.045em] md:text-6xl">THE TRUTH LAYER BESIDE THE PAGE.</h2>
          <p className="mt-5 max-w-2xl text-base font-semibold leading-relaxed text-ink/70">Open a YouTube video, Goodreads book, or ordinary page. AI Claims resolves it to a reviewed analysis and shows a 0–100 score—with the claim denominator, coverage, method version, and evidence trail still attached.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a className="inline-flex items-center gap-2 border-2 border-ink bg-ink px-4 py-3 font-mono text-[9px] font-bold uppercase text-paper shadow-[4px_4px_0_#214de8]" href={releasePageUrl} target="_blank" rel="noreferrer"><PanelRightOpen className="h-4 w-4" /> Download prototype <ExternalLink className="h-3 w-3" /></a>
            <a className="inline-flex items-center gap-2 border-2 border-ink bg-white px-4 py-3 font-mono text-[9px] font-bold uppercase" href="https://ai.rhyslindmark.com/claims/analysis?entity_key=web%3Aexample.invalid%2Freviewed-fixture">Open synthetic analysis <ExternalLink className="h-3 w-3" /></a>
            <a className="inline-flex items-center gap-2 border-2 border-ink bg-coral px-4 py-3 font-mono text-[9px] font-bold uppercase" href="https://ai.rhyslindmark.com/claims/episode?entity_key=youtube%3Aai-claims-synthetic-001"><FlaskConical className="h-4 w-4" /> Open YouTube pipeline <ExternalLink className="h-3 w-3" /></a>
            <a className="inline-flex items-center gap-2 border-2 border-ink bg-[#ffd76a] px-4 py-3 font-mono text-[9px] font-bold uppercase" href="https://ai.rhyslindmark.com/claims/book?entity_key=goodreads%3A999999999999"><FlaskConical className="h-4 w-4" /> Open Goodreads pipeline <ExternalLink className="h-3 w-3" /></a>
            <a className="inline-flex items-center gap-2 border-2 border-ink bg-white px-4 py-3 font-mono text-[9px] font-bold uppercase" href="https://ai.rhyslindmark.com/claims/web?entity_key=web%3Aexample.invalid%2Fai-claims-synthetic-page"><FlaskConical className="h-4 w-4" /> Open web pipeline <ExternalLink className="h-3 w-3" /></a>
            <a className="inline-flex items-center gap-2 border-2 border-ink bg-white px-4 py-3 font-mono text-[9px] font-bold uppercase" href="https://ai.rhyslindmark.com/claims/intake">Supply a transcript <ExternalLink className="h-3 w-3" /></a>
            <a className="inline-flex items-center gap-2 border-2 border-ink bg-white px-4 py-3 font-mono text-[9px] font-bold uppercase" href="https://ai.rhyslindmark.com/claims/book-intake">Confirm a book edition <ExternalLink className="h-3 w-3" /></a>
            <span className="inline-flex items-center gap-2 border-2 border-ink bg-white px-4 py-3 font-mono text-[9px] font-bold uppercase"><ShieldCheck className="h-4 w-4 text-cobalt" /> Score gates stay on</span>
          </div>
          <div className="mt-7 border-2 border-ink bg-white p-4 shadow-[4px_4px_0_#214de8]">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-mono text-[8px] font-bold uppercase text-cobalt">Verified prototype release</p><h3 className="mt-1 text-2xl font-black">EXTENSION {release.extension_version}</h3></div><span className="border border-ink px-2 py-1 font-mono text-[7px] font-bold uppercase">Manifest V{release.manifest_version}</span></div>
            <div className="mt-4 grid gap-2 font-mono text-[8px] font-bold uppercase text-ink/55 sm:grid-cols-2"><p>ZIP · {release.package.bytes.toLocaleString()} bytes<br />SHA-256 {release.package.integrity.digest_hex.slice(0, 16)}…</p><p>Source {release.source_commit_sha.slice(0, 7)}<br />Proof {release.contracts.deployment_attestation_digest.slice(0, 16)}…</p></div>
            <p className="mt-3 border-t border-ink/20 pt-3 font-mono text-[7px] font-bold uppercase leading-relaxed text-coral">Prototype · not Chrome Web Store reviewed · not publisher-signed · installation telemetry: none</p>
            <div className="mt-3 flex flex-wrap gap-3 font-mono text-[8px] font-bold uppercase"><a className="text-cobalt underline" href={releaseUrls.package_url}>Download ZIP →</a><a className="text-cobalt underline" href={releaseUrls.manifest_url}>Integrity manifest →</a><a className="text-cobalt underline" href={`https://github.com/Rhys-Lindmark/ai-claims/commit/${release.source_commit_sha}`}>Source commit →</a></div>
          </div>
          <div className="mt-5 border-2 border-ink bg-paper p-4" aria-label="Retained extension releases">
            <div className="flex flex-wrap items-end justify-between gap-2 border-b border-ink/25 pb-3">
              <div><p className="font-mono text-[8px] font-bold uppercase text-cobalt">Open release channel</p><h3 className="mt-1 text-xl font-black">RETAINED, HASHED, REVERSIBLE.</h3></div>
              <span className="font-mono text-[7px] font-bold uppercase text-ink/50">Policy {channelPolicy.policy_revision} · {channelPolicy.channel}</span>
            </div>
            <div className="divide-y divide-ink/20">
              {retainedReleases.map((item) => {
                const isCurrent = item.extension_version === channelPolicy.current_version;
                const isMinimum = item.extension_version === channelPolicy.minimum_supported_version;
                return <div className="grid gap-2 py-3 sm:grid-cols-[.55fr_1fr_auto] sm:items-center" key={item.extension_version}>
                  <div className="flex flex-wrap items-center gap-2"><strong className="font-mono text-[10px]">V{item.extension_version}</strong>{isCurrent ? <span className="bg-cobalt px-2 py-1 font-mono text-[6px] font-bold uppercase text-white">Current</span> : null}{isMinimum ? <span className="border border-ink px-2 py-1 font-mono text-[6px] font-bold uppercase">Minimum</span> : null}</div>
                  <p className="font-mono text-[7px] font-bold uppercase text-ink/55">{item.package.bytes.toLocaleString()} bytes · SHA-256 {item.package.integrity.digest_hex.slice(0, 16)}…</p>
                  <a className="font-mono text-[7px] font-bold uppercase text-cobalt underline" href={`https://ai.rhyslindmark.com/claims/api/v1/extension-releases/${item.extension_version}`}>Immutable API →</a>
                </div>;
              })}
            </div>
            <p className="border-t border-ink/25 pt-3 font-mono text-[7px] font-bold uppercase leading-relaxed text-ink/50">Manual prototype distribution · no install identity · rollback only to retained, integrity-verified releases</p>
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
