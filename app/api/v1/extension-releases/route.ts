import release from '@/releases/extension-v0.2.20.json';
import release019 from '@/releases/extension-v0.2.19.json';
import release018 from '@/releases/extension-v0.2.18.json';
import release017 from '@/releases/extension-v0.2.17.json';
import release016 from '@/releases/extension-v0.2.16.json';
import channelPolicy from '@/releases/channel-policy.json';
import { currentExtensionReleaseEnvelope, extensionReleaseEtag } from '@/extension/lib/extension-release-api.js';

const baseHeaders = { 'access-control-allow-origin': '*', 'cache-control': 'public, max-age=60, stale-while-revalidate=300', 'content-type': 'application/json; charset=utf-8' };

export async function GET(request: Request) {
  const url = new URL(request.url);
  const immutableUrl = `${url.origin}${url.pathname}/${release.extension_version}`;
  const etag = `"release-${release.package.integrity.digest_hex}-policy-${channelPolicy.policy_revision}"`;
  const headers = { ...baseHeaders, etag };
  if (request.headers.get('if-none-match') === etag) return new Response(null, { status: 304, headers });
  const envelope = currentExtensionReleaseEnvelope(release, immutableUrl);
  const versionBaseUrl = immutableUrl.slice(0, immutableUrl.lastIndexOf('/'));
  const availableVersions = [release, release019, release018, release017, release016].map((entry) => ({ version: entry.extension_version, immutable_url: `${versionBaseUrl}/${entry.extension_version}`, package_digest: entry.package.integrity.digest_hex }));
  return Response.json({ ...envelope, available_versions: availableVersions, channel_policy: channelPolicy }, { status: 200, headers });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, OPTIONS', 'access-control-allow-headers': 'accept, if-none-match', 'access-control-expose-headers': 'etag', 'access-control-max-age': '86400' } });
}
