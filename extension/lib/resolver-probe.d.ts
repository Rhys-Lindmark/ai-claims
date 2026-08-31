export interface ResolverProbeIdentity { kind: string; entityKey: string | null; canonicalUrl: string | null; title: string; }
export type ResolverProbeResult =
  | { state: 'invalid' | 'pending' | 'error'; reason: string; identity: ResolverProbeIdentity; analysisUrl?: string | null }
  | { state: 'not_analyzed'; reason: string; identity: ResolverProbeIdentity; analysisUrl?: string | null; nextAction: { label: string; url: string } }
  | { state: 'reviewed'; identity: ResolverProbeIdentity; score: number; reviewedClaims: number; eligibleClaims: number; methodologyVersion: string; analysisUrl: string };
export function probeResolverUrl(rawUrl: string, options?: { endpoint?: string; fetchImpl?: typeof fetch }): Promise<ResolverProbeResult>;
