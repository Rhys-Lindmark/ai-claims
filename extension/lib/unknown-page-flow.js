export function unknownPageFlow(identity, requestRecord = null) {
  if (!identity?.entityKey) return null;
  const requestState = requestRecord?.state ?? 'not_requested';
  return {
    entityKey: identity.entityKey,
    requestState,
    requestLabel: requestRecord ? `Request ${requestState.replaceAll('_', ' ')}` : 'Request ready',
    steps: [
      { state: 'complete', label: 'Shared registry checked', detail: identity.entityKey },
      { state: requestRecord ? 'complete' : 'ready', label: requestRecord ? 'Request reused' : 'Request analysis', detail: requestRecord ? `ID ${requestRecord.request_id} · duplicate visits reuse this record` : 'One request per canonical page key' },
      { state: 'locked', label: 'Claims reviewed', detail: 'Sources, eligible claims, and unresolved findings must be checked' },
      { state: 'locked', label: '0–100 score', detail: 'Hidden until every publication and provenance gate passes' },
    ],
  };
}
