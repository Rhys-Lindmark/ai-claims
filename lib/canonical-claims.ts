import type { ClaimType } from './claim-types';

export interface ClaimOccurrence {
  occurrence_id: string;
  canonical_claim_id: string;
  source_segment_id: string;
  timestamp: string;
  speaker: string;
  text: string;
  type: ClaimType;
  relationship: 'canonical_wording' | 'exact_repeat' | 'paraphrase';
  grouping_state: 'editor_reviewed' | 'machine_suggestion';
}

export interface CanonicalClaimGroup {
  canonical_claim_id: string;
  canonical_text: string;
  type: ClaimType;
  occurrences: ClaimOccurrence[];
  denominator_weight: 1;
}

export function groupCanonicalClaims(occurrences: ClaimOccurrence[]): CanonicalClaimGroup[] {
  const groups = new Map<string, ClaimOccurrence[]>();
  for (const occurrence of occurrences) {
    const existing = groups.get(occurrence.canonical_claim_id) ?? [];
    existing.push(occurrence);
    groups.set(occurrence.canonical_claim_id, existing);
  }

  return [...groups.entries()].map(([canonicalClaimId, group]) => {
    const canonical = group.find((occurrence) => occurrence.relationship === 'canonical_wording') ?? group[0];
    return {
      canonical_claim_id: canonicalClaimId,
      canonical_text: canonical.text,
      type: canonical.type,
      occurrences: group,
      denominator_weight: 1,
    };
  });
}

