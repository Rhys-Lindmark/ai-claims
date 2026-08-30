export function actionBadgeForState(state) {
  if (state?.state === 'published') {
    return {
      text: String(state.score),
      color: '#20bf6b',
      title: `AI Claims: ${state.score}/100 reviewed truth score`,
    };
  }
  if (state?.state === 'not_analyzed') {
    return { text: '?', color: '#737373', title: 'AI Claims: not analyzed yet' };
  }
  return { text: '', color: '#737373', title: 'Check this page with AI Claims' };
}
