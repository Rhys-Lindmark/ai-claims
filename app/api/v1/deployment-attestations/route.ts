import attestation from '@/extension/data/deployment-attestation.json';
import { currentDeploymentAttestationEnvelope, deploymentAttestationEtag } from '@/extension/lib/deployment-attestation-api.js';

const baseHeaders = { 'access-control-allow-origin': '*', 'cache-control': 'public, max-age=60, stale-while-revalidate=300', 'content-type': 'application/json; charset=utf-8' };

export async function GET(request: Request) {
  const url = new URL(request.url);
  const immutableUrl = `${url.origin}${url.pathname}/${attestation.integrity.digest_hex}`;
  const etag = deploymentAttestationEtag(attestation);
  const headers = { ...baseHeaders, etag };
  if (request.headers.get('if-none-match') === etag) return new Response(null, { status: 304, headers });
  return Response.json(currentDeploymentAttestationEnvelope(attestation, immutableUrl), { status: 200, headers });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, OPTIONS', 'access-control-allow-headers': 'accept, if-none-match', 'access-control-expose-headers': 'etag', 'access-control-max-age': '86400' } });
}
