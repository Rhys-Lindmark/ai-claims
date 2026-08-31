export interface ResolverProbeIdentity { kind: string; entityKey: string | null; canonicalUrl: string | null; title: string; }
export type ResolverProbeResult =
  | { state: 'invalid' | 'not_analyzed' | 'pending' | 'error'; reason: string; identity: ResolverProbeIdentity; analysisUrl?: string | null }
  | { state: 'reviewed'; identity: ResolverProbeIdentity; score: number; reviewedClaims: number; eligibleClaims: number; methodologyVersion: string; analysisUrl: string };
export function probeResolverUrl(rawUrl: string, options?: { endpoint?: string; fetchImpl?: typeof fetch }): Promise<ResolverProbeResult>;
