import { getD1 } from '@/db';
import { ANALYSIS_REQUEST_CONTRACT_VERSION, getAnalysisRequestByEntity, submitAnalysisRequest, validateAnalysisRequestInput } from '@/lib/analysis-request-store';

const headers = { 'access-control-allow-origin': '*', 'cache-control': 'no-store', 'content-type': 'application/json; charset=utf-8', 'x-ai-claims-contract': ANALYSIS_REQUEST_CONTRACT_VERSION };

export async function GET(request: Request) {
  const entityKey = new URL(request.url).searchParams.get('entity_key')?.trim() ?? '';
  if (!entityKey || entityKey.length > 2048) return Response.json({ contract_version: ANALYSIS_REQUEST_CONTRACT_VERSION, error: 'A bounded entity_key query is required.' }, { status: 400, headers });
  const record = await getAnalysisRequestByEntity(getD1(), entityKey);
  if (!record) return Response.json({ contract_version: ANALYSIS_REQUEST_CONTRACT_VERSION, entity_key: entityKey, analysis_request: null }, { status: 404, headers });
  return Response.json({ contract_version: ANALYSIS_REQUEST_CONTRACT_VERSION, entity_key: entityKey, analysis_request: record }, { status: 200, headers });
}

export async function POST(request: Request) {
  const length = Number(request.headers.get('content-length') ?? '0');
  if (length > 4096) return Response.json({ contract_version: ANALYSIS_REQUEST_CONTRACT_VERSION, error: 'Request bodies are limited to canonical page identity.' }, { status: 413, headers });
  const text = await request.text();
  if (text.length > 4096) return Response.json({ contract_version: ANALYSIS_REQUEST_CONTRACT_VERSION, error: 'Request bodies are limited to canonical page identity.' }, { status: 413, headers });
  let value: unknown;
  try { value = JSON.parse(text); } catch { return Response.json({ contract_version: ANALYSIS_REQUEST_CONTRACT_VERSION, error: 'Valid JSON is required.' }, { status: 400, headers }); }
  const validated = validateAnalysisRequestInput(value);
  if (!validated.ok) return Response.json({ contract_version: ANALYSIS_REQUEST_CONTRACT_VERSION, error: validated.error }, { status: 400, headers });
  const submission = await submitAnalysisRequest(getD1(), validated.input);
  return Response.json({ contract_version: ANALYSIS_REQUEST_CONTRACT_VERSION, created: submission.created, analysis_request: submission.record }, { status: submission.created ? 201 : 200, headers });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, POST, OPTIONS', 'access-control-allow-headers': 'content-type', 'access-control-expose-headers': 'x-ai-claims-contract', 'access-control-max-age': '86400' } });
}
