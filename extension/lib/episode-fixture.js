export function validateSyntheticEpisodeFixture(fixture) {
  const errors = [];
  if (!fixture.fixture_notice?.toLowerCase().includes('synthetic')) errors.push('Fixture notice must explicitly say synthetic.');
  if (fixture.entity_key !== `youtube:${fixture.video_id}`) errors.push('Entity key must match the synthetic video ID.');
  const speakers = new Set(fixture.speakers.map((speaker) => speaker.speaker_id));
  const segments = new Map(fixture.transcript_segments.map((segment) => [segment.segment_id, segment]));
  const evidence = new Set(fixture.evidence_records.map((record) => record.evidence_id));
  for (const segment of fixture.transcript_segments) {
    if (!speakers.has(segment.speaker_id)) errors.push(`${segment.segment_id} references an unknown speaker.`);
    if (!(segment.start_seconds >= 0 && segment.end_seconds > segment.start_seconds && segment.end_seconds <= fixture.duration_seconds)) errors.push(`${segment.segment_id} has an invalid timestamp range.`);
  }
  for (const claim of fixture.claims) {
    if (!segments.has(claim.segment_id)) errors.push(`${claim.claim_id} references an unknown transcript segment.`);
    if (!claim.evidence_ids.length || claim.evidence_ids.some((id) => !evidence.has(id))) errors.push(`${claim.claim_id} lacks valid evidence.`);
    if (!(claim.truth_credit >= 0 && claim.truth_credit <= 1)) errors.push(`${claim.claim_id} has invalid truth credit.`);
  }
  return errors;
}

export function syntheticEpisodeScore(fixture) {
  if (!fixture.claims.length) return null;
  return Math.round((fixture.claims.reduce((sum, claim) => sum + claim.truth_credit, 0) / fixture.claims.length) * 100);
}
