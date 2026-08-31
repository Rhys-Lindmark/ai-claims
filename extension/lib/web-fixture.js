export function validateSyntheticWebFixture(fixture) {
  const errors = [];
  if (!fixture.fixture_notice?.toLowerCase().includes('synthetic')) errors.push('Fixture notice must explicitly say synthetic.');
  if (!fixture.canonical_url?.startsWith('https://example.invalid/')) errors.push('Fixture must use the reserved .invalid domain.');
  const expectedKey = `web:${new URL(fixture.canonical_url).hostname}${new URL(fixture.canonical_url).pathname}`;
  if (fixture.entity_key !== expectedKey) errors.push('Entity key must match the synthetic canonical URL.');
  const passages = new Set(fixture.passages.map((passage) => passage.passage_id));
  const evidence = new Set(fixture.evidence_records.map((record) => record.evidence_id));
  for (const claim of fixture.claims) {
    if (!passages.has(claim.passage_id)) errors.push(`${claim.claim_id} references an unknown passage.`);
    if (!claim.evidence_ids.length || claim.evidence_ids.some((id) => !evidence.has(id))) errors.push(`${claim.claim_id} lacks valid evidence.`);
    if (!(claim.truth_credit >= 0 && claim.truth_credit <= 1)) errors.push(`${claim.claim_id} has invalid truth credit.`);
  }
  return errors;
}

export function syntheticWebScore(fixture) {
  if (!fixture.claims.length) return null;
  return Math.round((fixture.claims.reduce((sum, claim) => sum + claim.truth_credit, 0) / fixture.claims.length) * 100);
}
