export type PublicationGateKind = 'transcript_provenance' | 'speaker_attribution' | 'canonical_grouping' | 'evidence_review' | 'editorial_review';
export interface PublicationGate { kind: PublicationGateKind; state: 'ready' | 'blocked' | 'not_applicable'; reviewed_by: string | null; reviewed_at: string | null; rationale: string; next_action: string | null; }
export interface PublicationReadiness { analysis_id: string; gates: PublicationGate[]; unresolved_finding_count: number; }
const requiredKinds: PublicationGateKind[] = ['transcript_provenance', 'speaker_attribution', 'canonical_grouping', 'evidence_review', 'editorial_review'];
export function publicationDecision(record: PublicationReadiness) {
  const blocked = record.gates.filter((gate) => gate.state === 'blocked');
  const missing = requiredKinds.filter((kind) => !record.gates.some((gate) => gate.kind === kind));
  const canPublishFindings = blocked.length === 0 && missing.length === 0;
  return { can_publish_findings: canPublishFindings, can_show_aggregate_score: canPublishFindings && record.unresolved_finding_count === 0, blocked_gate_kinds: blocked.map((gate) => gate.kind), missing_gate_kinds: missing };
}
