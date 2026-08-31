import { getD1 } from '@/db';
import { ANALYSIS_REQUEST_CONTRACT_VERSION, getAnalysisRequestStatus } from '@/lib/analysis-request-store';

const headers = { 'access-control-allow-origin': '*', 'cache-control': 'no-store', 'content-type': 'application/json; charset=utf-8', 'x-ai-claims-contract': ANALYSIS_REQUEST_CONTRACT_VERSION };

export async function GET(_request: Request, context: { params: Promise<{ request_id: string }> }) {
  const requestId = (await context.params).request_id?.trim() ?? '';
  if (!/^req_[0-9a-f]{64}$/.test(requestId)) return Response.json({ contract_version: ANALYSIS_REQUEST_CONTRACT_VERSION, error: 'A valid analysis request ID is required.' }, { status: 400, headers });
  const status = await getAnalysisRequestStatus(getD1(), requestId);
  if (!status) return Response.json({ contract_version: ANALYSIS_REQUEST_CONTRACT_VERSION, request_id: requestId, analysis_request: null, lifecycle_events: [] }, { status: 404, headers });
  return Response.json({ contract_version: ANALYSIS_REQUEST_CONTRACT_VERSION, request_id: requestId, analysis_request: status.record, lifecycle_events: status.lifecycle_events }, { status: 200, headers });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, OPTIONS', 'access-control-allow-headers': 'accept', 'access-control-expose-headers': 'x-ai-claims-contract', 'access-control-max-age': '86400' } });
}
