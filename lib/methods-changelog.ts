import type { MethodologyStage } from './methodology-manifest';
export type MethodChangeKind = 'breaking_scoring_change' | 'non_breaking_clarification' | 'editorial_correction';
export interface MethodChange { change_id: string; from_manifest_version: string; to_manifest_version: string; effective_at: string; kind: MethodChangeKind; affected_stages: MethodologyStage[]; summary: string; rationale: string; affected_analysis_ids: string[]; recomputation_state: 'not_required' | 'queued' | 'completed'; public_notice: string; }
export function affectedAnalysisCount(changes: MethodChange[]) { return new Set(changes.flatMap((change) => change.affected_analysis_ids)).size; }
