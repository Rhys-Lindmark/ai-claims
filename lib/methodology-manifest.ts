export type MethodologyStage = 'claim_selection' | 'canonical_grouping' | 'evidence_review' | 'verdict_assignment' | 'aggregation';
export interface MethodologyRule { stage: MethodologyStage; rule_id: string; version: string; summary: string; }
export interface MethodologyManifest { manifest_id: string; version: string; effective_at: string; rules: MethodologyRule[]; content_digest: string; }
