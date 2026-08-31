import currentRelease from '@/releases/extension-v0.2.21.json';
import release020 from '@/releases/extension-v0.2.20.json';
import release019 from '@/releases/extension-v0.2.19.json';
import release018 from '@/releases/extension-v0.2.18.json';
import release017 from '@/releases/extension-v0.2.17.json';
import release016 from '@/releases/extension-v0.2.16.json';
import { extensionReleaseEtag, immutableExtensionReleaseEnvelope } from '@/extension/lib/extension-release-api.js';

const baseHeaders = { 'access-control-allow-origin': '*', 'cache-control': 'public, max-age=31536000, immutable', 'content-type': 'application/json; charset=utf-8' };

export async function GET(request: Request, context: { params: Promise<{ version: string }> }) {
  const version = (await context.params).version?.trim() ?? '';
  if (!/^\d+\.\d+\.\d+$/.test(version)) return Response.json({ contract_version: '1.0.0', error: 'A semantic extension version is required.' }, { status: 400, headers: baseHeaders });
  const release = [currentRelease, release020, release019, release018, release017, release016].find((entry) => entry.extension_version === version) ?? currentRelease;
  const envelope = immutableExtensionReleaseEnvelope(release, version);
  const etag = extensionReleaseEtag(release);
  const headers = { ...baseHeaders, etag };
  if (!envelope.release) return Response.json(envelope, { status: 404, headers });
  if (request.headers.get('if-none-match') === etag) return new Response(null, { status: 304, headers });
  return Response.json(envelope, { status: 200, headers });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, OPTIONS', 'access-control-allow-headers': 'accept, if-none-match', 'access-control-expose-headers': 'etag', 'access-control-max-age': '86400' } });
}
