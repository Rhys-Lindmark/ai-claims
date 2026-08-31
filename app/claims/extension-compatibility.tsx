import compatibility from '@/extension/data/compatibility.json';

const columns = [
  ['Detection', 'detection'],
  ['Canonical identity', 'identity'],
  ['Acquisition', 'acquisition'],
  ['Score states', 'score_states'],
  ['Evidence', 'evidence_destination'],
  ['Current proof', 'proof'],
] as const;

export function ExtensionCompatibility() {
  return <section className="border-b-2 border-ink bg-paper"><div className="mx-auto max-w-6xl px-5 py-10 md:px-10"><p className="font-mono text-[9px] font-bold uppercase text-coral">Page compatibility · schema 1.0.0</p><h2 className="mt-3 text-4xl font-black leading-[.94] tracking-[-.045em]">SAME GATE. DIFFERENT SOURCE RULES.</h2><p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink/60">Recognition is not permission to acquire content. Every surface shares canonical lookup and score suppression, while its source and evidence path remain explicit.</p><div className="mt-7 overflow-x-auto border-2 border-ink"><table className="min-w-[1050px] border-collapse text-left"><thead><tr className="bg-ink text-paper"><th className="p-3 font-mono text-[8px] uppercase">Surface</th>{columns.map(([label]) => <th className="border-l border-paper/30 p-3 font-mono text-[8px] uppercase" key={label}>{label}</th>)}</tr></thead><tbody>{compatibility.surfaces.map((surface) => <tr className="border-t-2 border-ink align-top" key={surface.kind}><th className="bg-white p-3 text-xl font-black">{surface.label}<span className="mt-2 block font-mono text-[7px] uppercase text-cobalt">{surface.proof_level.replaceAll('_', ' ')}</span></th>{columns.map(([, key]) => <td className="border-l border-ink/25 p-3 text-[11px] leading-relaxed" key={key}>{surface[key]}</td>)}</tr>)}</tbody></table></div><p className="mt-3 font-mono text-[8px] font-bold uppercase text-ink/45">Resolver behavior for all three: {compatibility.surfaces[0].resolver}.</p></div></section>;
}
