import attestation from '@/extension/data/deployment-attestation.json';
import { deploymentAttestationEtag, immutableDeploymentAttestationEnvelope } from '@/extension/lib/deployment-attestation-api.js';

const baseHeaders = { 'access-control-allow-origin': '*', 'cache-control': 'public, max-age=31536000, immutable', 'content-type': 'application/json; charset=utf-8' };

export async function GET(request: Request, context: { params: Promise<{ digest: string }> }) {
  const digest = (await context.params).digest?.trim() ?? '';
  if (!/^[0-9a-f]{64}$/.test(digest)) return Response.json({ contract_version: '1.0.0', error: 'A 64-character lowercase SHA-256 digest is required.' }, { status: 400, headers: baseHeaders });
  const envelope = immutableDeploymentAttestationEnvelope(attestation, digest);
  const etag = deploymentAttestationEtag(attestation);
  const headers = { ...baseHeaders, etag };
  if (!envelope.attestation) return Response.json(envelope, { status: 404, headers });
  if (request.headers.get('if-none-match') === etag) return new Response(null, { status: 304, headers });
  return Response.json(envelope, { status: 200, headers });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, OPTIONS', 'access-control-allow-headers': 'accept, if-none-match', 'access-control-expose-headers': 'etag', 'access-control-max-age': '86400' } });
}
