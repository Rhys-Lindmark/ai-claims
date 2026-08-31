import { correctionFeedEtag, resolveCorrectionFeedEnvelope } from '@/lib/correction-feed-api';

const baseHeaders = {
  'access-control-allow-origin': '*',
  'cache-control': 'public, max-age=60, stale-while-revalidate=300',
  'content-type': 'application/json; charset=utf-8',
};

export async function GET(request: Request) {
  const entityKey = new URL(request.url).searchParams.get('entity_key')?.trim() ?? '';
  if (!entityKey || entityKey.length > 500) {
    return Response.json({ contract_version: '1.0.0', error: 'A valid entity_key query parameter is required.' }, { status: 400, headers: baseHeaders });
  }
  const envelope = resolveCorrectionFeedEnvelope(entityKey);
  const etag = correctionFeedEtag(entityKey);
  const headers = { ...baseHeaders, etag };
  if (request.headers.get('if-none-match') === etag) return new Response(null, { status: 304, headers });
  if (!envelope.events) return Response.json(envelope, { status: 404, headers });
  return Response.json(envelope, { status: 200, headers });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, OPTIONS',
      'access-control-allow-headers': 'accept, if-none-match',
      'access-control-expose-headers': 'etag',
      'access-control-max-age': '86400',
    },
  });
}
