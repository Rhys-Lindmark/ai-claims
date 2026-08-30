export type EvidenceSourceKind = 'official_data' | 'primary_research' | 'systematic_review' | 'expert_synthesis' | 'reported_source' | 'other';
export type EvidenceQuality = 'high' | 'medium' | 'low' | 'unrated';
export type EvidenceDirection = 'supports' | 'contradicts' | 'qualifies' | 'context_only';

export interface EvidenceSourceRecord {
  source_id: string;
  title: string;
  publisher: string;
  url: string;
  source_kind: EvidenceSourceKind;
  quality: EvidenceQuality;
  quality_rationale: string;
  published_at: string | null;
  accessed_at: string;
}

export interface ClaimEvidenceLink {
  link_id: string;
  canonical_claim_id: string;
  source_id: string;
  direction: EvidenceDirection;
  quoted_context: string;
  relevance_note: string;
  reviewer_confidence: 'high' | 'medium' | 'low';
  review_state: 'machine_draft' | 'editor_reviewed';
}

export function validateEvidenceLedger(sources: EvidenceSourceRecord[], links: ClaimEvidenceLink[]): string[] {
  const errors: string[] = [];
  const sourceIds = new Set(sources.map((source) => source.source_id));
  if (sourceIds.size !== sources.length) errors.push('Source IDs must be unique.');
  if (new Set(links.map((link) => link.link_id)).size !== links.length) errors.push('Evidence link IDs must be unique.');
  for (const source of sources) {
    if (!source.url.startsWith('https://')) errors.push(`${source.source_id} must use an HTTPS source URL.`);
    if (source.quality !== 'unrated' && !source.quality_rationale.trim()) errors.push(`${source.source_id} needs a quality rationale.`);
  }
  for (const link of links) {
    if (!sourceIds.has(link.source_id)) errors.push(`${link.link_id} references a missing source.`);
    if (!link.quoted_context.trim()) errors.push(`${link.link_id} needs quoted or tightly summarized context.`);
    if (!link.relevance_note.trim()) errors.push(`${link.link_id} needs a relevance note.`);
  }
  return errors;
}

