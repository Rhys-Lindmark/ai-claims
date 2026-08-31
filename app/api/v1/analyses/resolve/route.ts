import { analysisEtag, resolveAnalysisEnvelope } from '@/lib/analysis-resolver-api';

const baseHeaders = {
  'access-control-allow-origin': '*',
  'content-type': 'application/json; charset=utf-8',
  'vary': 'x-ai-claims-correction-feed-accept',
};

export async function GET(request: Request) {
  const entityKey = new URL(request.url).searchParams.get('entity_key')?.trim() ?? '';
  const versionId = new URL(request.url).searchParams.get('version_id')?.trim() || null;
  const acceptedCorrectionContractsHeader = request.headers.get('x-ai-claims-correction-feed-accept');
  const acceptedCorrectionContracts = acceptedCorrectionContractsHeader === null ? null : acceptedCorrectionContractsHeader.split(',').map((value) => value.trim()).filter(Boolean);
  const headers = { ...baseHeaders, 'cache-control': versionId ? 'public, max-age=31536000, immutable' : 'public, max-age=60, stale-while-revalidate=300' };
  if (!entityKey || entityKey.length > 500) {
    return Response.json({ contract_version: '1.0.0', error: 'A valid entity_key query parameter is required.' }, { status: 400, headers });
  }

  if (versionId && versionId.length > 200) return Response.json({ contract_version: '1.0.0', error: 'A valid version_id is required.' }, { status: 400, headers });
  const envelope = resolveAnalysisEnvelope(entityKey, versionId, acceptedCorrectionContracts);
  const etag = analysisEtag(envelope);
  const responseHeaders = { ...headers, etag, 'x-ai-claims-correction-feed-contract': envelope.correction_feed_discovery.contract_version ?? 'none' };
  if (request.headers.get('if-none-match') === etag) return new Response(null, { status: 304, headers: responseHeaders });
  if (!envelope.analysis) return Response.json(envelope, { status: 404, headers: responseHeaders });
  return Response.json(envelope, { status: 200, headers: responseHeaders });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, OPTIONS',
      'access-control-allow-headers': 'accept, if-none-match, x-ai-claims-correction-feed-accept',
      'access-control-expose-headers': 'etag, x-ai-claims-correction-feed-contract',
      'access-control-max-age': '86400',
    },
  });
}
