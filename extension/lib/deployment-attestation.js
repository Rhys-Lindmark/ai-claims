export function validateDeploymentAttestation(attestation, compatibility) {
  const errors = [];
  if (attestation.schema_version !== 'ai-claims.deployment-attestation/1.0.0') errors.push('Unsupported attestation schema.');
  if (!/^\d{4}-\d{2}-\d{2}T/.test(attestation.verified_at ?? '')) errors.push('Verification timestamp is missing.');
  if (!Number.isInteger(attestation.tested_site_version) || attestation.tested_site_version < 1) errors.push('Tested site version is invalid.');
  if (!/^[0-9a-f]{40}$/.test(attestation.tested_commit_sha ?? '')) errors.push('Tested commit SHA is invalid.');
  if (attestation.privacy?.visitor_data_collected !== false || attestation.privacy?.retained_visitor_fields?.length !== 0) errors.push('Attestation privacy contract is invalid.');
  if (attestation.all_passed !== true) errors.push('Attestation does not report a passing proof set.');
  const surfaces = new Map(compatibility.surfaces.map((surface) => [surface.kind, surface]));
  if (attestation.results?.length !== surfaces.size) errors.push('Attestation surface count does not match compatibility manifest.');
  for (const result of attestation.results ?? []) {
    const surface = surfaces.get(result.kind);
    if (!surface) errors.push(`${result.kind} is not a declared compatibility surface.`);
    else if (result.entity_key !== surface.proof_entity_key || result.expected_score !== surface.proof_score || result.observed_score !== surface.proof_score) errors.push(`${result.kind} proof metadata does not match the compatibility manifest.`);
    if (result.verified !== true || result.resolver_status !== 200 || result.route_status !== 200 || result.reviewed_claims !== result.eligible_claims || result.unresolved_claims !== 0) errors.push(`${result.kind} did not pass every deployed gate.`);
  }
  return errors;
}
