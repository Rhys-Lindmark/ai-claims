import { CORRECTION_FEED_DEFAULT_PAGE_SIZE, CORRECTION_FEED_MAX_PAGE_SIZE, correctionFeedEtag, resolveCorrectionFeedEnvelope } from '@/lib/correction-feed-api';

const baseHeaders = {
  'access-control-allow-origin': '*',
  'cache-control': 'public, max-age=60, stale-while-revalidate=300',
  'content-type': 'application/json; charset=utf-8',
};

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const entityKey = params.get('entity_key')?.trim() ?? '';
  const cursor = params.get('cursor')?.trim() || null;
  const requestedLimit = Number(params.get('limit') ?? String(CORRECTION_FEED_DEFAULT_PAGE_SIZE));
  if (!entityKey || entityKey.length > 500) {
    return Response.json({ contract_version: '1.1.0', error: 'A valid entity_key query parameter is required.' }, { status: 400, headers: baseHeaders });
  }
  if (!Number.isInteger(requestedLimit) || requestedLimit < 1 || requestedLimit > CORRECTION_FEED_MAX_PAGE_SIZE) {
    return Response.json({ contract_version: '1.1.0', error: `limit must be an integer from 1 to ${CORRECTION_FEED_MAX_PAGE_SIZE}.` }, { status: 400, headers: baseHeaders });
  }
  const envelope = resolveCorrectionFeedEnvelope(entityKey, cursor, requestedLimit);
  const etag = correctionFeedEtag(entityKey, cursor, requestedLimit);
  const headers = { ...baseHeaders, etag };
  if (request.headers.get('if-none-match') === etag) return new Response(null, { status: 304, headers });
  if (!envelope.cursor_valid) return Response.json({ ...envelope, error: 'cursor does not identify an event in this entity feed.' }, { status: 400, headers });
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
