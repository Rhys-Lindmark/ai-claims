export function correctionLinkForState(state) {
  if (!state.latestCorrectionUrl) return null;
  if (state.state === 'paused') return { url: state.latestCorrectionUrl, label: 'Open latest pause transition' };
  if (state.state === 'published' && state.resumedFromVersionId) return { url: state.latestCorrectionUrl, label: 'Open latest resumption transition' };
  if (state.state === 'published' && state.supersededVersionIds?.length) return { url: state.latestCorrectionUrl, label: 'Open latest correction transition' };
  return { url: state.latestCorrectionUrl, label: 'Open latest transition' };
}

export function correctionPreviewForState(state) {
  if (!state.latestCorrectionSummary) return null;
  const summary = state.latestCorrectionSummary.trim().slice(0, 220);
  const lineage = state.latestCorrectionFromVersionId && state.latestCorrectionToVersionId
    ? `${state.latestCorrectionFromVersionId} → ${state.latestCorrectionToVersionId}`
    : state.latestCorrectionEventId ?? 'Latest transition';
  return { lineage, summary };
}

export function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}
