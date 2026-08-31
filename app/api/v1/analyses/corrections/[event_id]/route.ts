import { correctionEventEtag, resolveCorrectionEventEnvelope } from '@/lib/correction-feed-api';

const baseHeaders = {
  'access-control-allow-origin': '*',
  'cache-control': 'public, max-age=31536000, immutable',
  'content-type': 'application/json; charset=utf-8',
};

export async function GET(request: Request, context: { params: Promise<{ event_id: string }> }) {
  const entityKey = new URL(request.url).searchParams.get('entity_key')?.trim() ?? '';
  const eventId = (await context.params).event_id?.trim() ?? '';
  if (!entityKey || entityKey.length > 500 || !eventId || eventId.length > 200) {
    return Response.json({ contract_version: '1.1.0', error: 'Valid entity_key and event_id values are required.' }, { status: 400, headers: baseHeaders });
  }
  const envelope = resolveCorrectionEventEnvelope(entityKey, eventId);
  const etag = correctionEventEtag(entityKey, eventId);
  const headers = { ...baseHeaders, etag };
  if (request.headers.get('if-none-match') === etag) return new Response(null, { status: 304, headers });
  if (!envelope.event) return Response.json(envelope, { status: 404, headers });
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
