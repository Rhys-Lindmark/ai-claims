import { resolveAnalysisEnvelope } from '@/lib/analysis-resolver-api';

const headers = {
  'access-control-allow-origin': '*',
  'cache-control': 'public, max-age=60, stale-while-revalidate=300',
  'content-type': 'application/json; charset=utf-8',
};

export async function GET(request: Request) {
  const entityKey = new URL(request.url).searchParams.get('entity_key')?.trim() ?? '';
  if (!entityKey || entityKey.length > 500) {
    return Response.json({ contract_version: '1.0.0', error: 'A valid entity_key query parameter is required.' }, { status: 400, headers });
  }

  const envelope = resolveAnalysisEnvelope(entityKey);
  if (!envelope.analysis) return Response.json(envelope, { status: 404, headers });
  return Response.json(envelope, { status: 200, headers });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, OPTIONS',
      'access-control-allow-headers': 'accept',
      'access-control-max-age': '86400',
    },
  });
}
