export type AnalysisChangeKind = 'transcript' | 'speaker_attribution' | 'claim_split' | 'canonical_grouping' | 'evidence' | 'finding' | 'editorial_note';

export interface AnalysisVersionRecord {
  version_id: string;
  analysis_id: string;
  version_number: number;
  parent_version_id: string | null;
  created_at: string;
  created_by: string;
  review_state: 'draft' | 'editor_approved' | 'published';
  change_kinds: AnalysisChangeKind[];
  change_summary: string;
  changed_record_ids: string[];
  supersedes_public_version: boolean;
}

export function validateAnalysisHistory(records: AnalysisVersionRecord[]): string[] {
  const errors: string[] = [];
  const ordered = [...records].sort((a, b) => a.version_number - b.version_number);
  if (new Set(records.map((record) => record.version_id)).size !== records.length) errors.push('Version IDs must be unique.');
  for (const [index, record] of ordered.entries()) {
    if (record.version_number !== index + 1) errors.push(`Expected version ${index + 1}, found ${record.version_number}.`);
    const expectedParent = index === 0 ? null : ordered[index - 1].version_id;
    if (record.parent_version_id !== expectedParent) errors.push(`${record.version_id} must point to ${expectedParent ?? 'no parent'}.`);
    if (!record.change_summary.trim()) errors.push(`${record.version_id} needs a change summary.`);
    if (record.version_number > 1 && record.change_kinds.length === 0) errors.push(`${record.version_id} needs at least one change kind.`);
    if (record.review_state === 'published' && !record.created_by.trim()) errors.push(`${record.version_id} needs publisher attribution.`);
  }
  return errors;
}

export function currentPublishedVersion(records: AnalysisVersionRecord[]) {
  return records.filter((record) => record.review_state === 'published').sort((a, b) => b.version_number - a.version_number)[0] ?? null;
}

