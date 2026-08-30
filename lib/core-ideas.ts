export interface CoreIdeaMembership {
  canonical_claim_id: string;
  role: 'central' | 'supporting' | 'counterpoint';
  review_state: 'unreviewed' | 'in_review' | 'editor_reviewed';
}

export interface CoreIdeaCluster {
  idea_id: string;
  label: string;
  summary: string;
  memberships: CoreIdeaMembership[];
  review_state: 'machine_draft' | 'editor_reviewed';
}

export function ideaCoverage(cluster: CoreIdeaCluster) {
  const total = new Set(cluster.memberships.map((membership) => membership.canonical_claim_id)).size;
  const reviewed = new Set(cluster.memberships.filter((membership) => membership.review_state === 'editor_reviewed').map((membership) => membership.canonical_claim_id)).size;
  return { total, reviewed, rate: total ? reviewed / total : 0 };
}

export function validateCoreIdeas(clusters: CoreIdeaCluster[]): string[] {
  const errors: string[] = [];
  if (new Set(clusters.map((cluster) => cluster.idea_id)).size !== clusters.length) errors.push('Idea IDs must be unique.');
  for (const cluster of clusters) {
    if (!cluster.label.trim() || !cluster.summary.trim()) errors.push(`${cluster.idea_id} needs a label and summary.`);
    if (!cluster.memberships.length) errors.push(`${cluster.idea_id} needs at least one canonical claim.`);
    if (new Set(cluster.memberships.map((membership) => membership.canonical_claim_id)).size !== cluster.memberships.length) errors.push(`${cluster.idea_id} cannot contain the same canonical claim twice.`);
  }
  return errors;
}
