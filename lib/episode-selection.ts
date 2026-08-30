export interface EpisodeSelection {
  selection_id: string; episode_id: string; canonical_url: string; episode_title: string; selected_at: string; catalog_checked_at: string; latest_episode_id_at_check: string;
  selection_basis: 'latest_at_snapshot' | 'user_requested' | 'editorial_sample'; transcript_status: 'ready_permitted' | 'missing' | 'permission_unconfirmed';
  claim_density: 'high' | 'medium' | 'low' | 'not_assessed'; rationale: string; coverage_limitations: string[];
}
