export type LimitationKind = 'transcript' | 'selection' | 'evidence' | 'methodology';
export interface AnalysisLimitation { limitation_id: string; kind: LimitationKind; title: string; description: string; severity: 'material' | 'moderate' | 'minor'; affected_finding_ids: string[]; status: 'open' | 'mitigated' | 'accepted'; mitigation: string; reviewed_by: string; updated_at: string; resulting_analysis_version_id: string | null; }
export function affectedFindings(records: AnalysisLimitation[]) { return new Set(records.flatMap((record) => record.affected_finding_ids)).size; }
