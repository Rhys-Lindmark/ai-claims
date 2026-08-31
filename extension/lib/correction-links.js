export function correctionLinkForState(state) {
  if (!state.latestCorrectionUrl) return null;
  if (state.state === 'paused') return { url: state.latestCorrectionUrl, label: 'Open latest pause transition' };
  if (state.state === 'published' && state.resumedFromVersionId) return { url: state.latestCorrectionUrl, label: 'Open latest resumption transition' };
  if (state.state === 'published' && state.supersededVersionIds?.length) return { url: state.latestCorrectionUrl, label: 'Open latest correction transition' };
  return { url: state.latestCorrectionUrl, label: 'Open latest transition' };
}
