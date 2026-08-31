import release from '@/releases/extension-v0.2.17.json';
import { currentExtensionReleaseEnvelope, extensionReleaseEtag } from '@/extension/lib/extension-release-api.js';

const baseHeaders = { 'access-control-allow-origin': '*', 'cache-control': 'public, max-age=60, stale-while-revalidate=300', 'content-type': 'application/json; charset=utf-8' };

export async function GET(request: Request) {
  const url = new URL(request.url);
  const immutableUrl = `${url.origin}${url.pathname}/${release.extension_version}`;
  const etag = extensionReleaseEtag(release);
  const headers = { ...baseHeaders, etag };
  if (request.headers.get('if-none-match') === etag) return new Response(null, { status: 304, headers });
  return Response.json(currentExtensionReleaseEnvelope(release, immutableUrl), { status: 200, headers });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, OPTIONS', 'access-control-allow-headers': 'accept, if-none-match', 'access-control-expose-headers': 'etag', 'access-control-max-age': '86400' } });
}
