import { identifyPage } from './lib/page-identity.js';
import { resolveAnalysis } from './lib/analysis-registry.js';

const kind = document.querySelector('#page-kind');
const title = document.querySelector('#page-title');
const pageUrl = document.querySelector('#page-url');
const result = document.querySelector('#result');
const permissionButton = document.querySelector('#permission');
let currentTab;

async function loadRegistry() {
  const response = await fetch(chrome.runtime.getURL('data/analyses.json'));
  return response.json();
}

function renderResult(state, identity) {
  if (state.state === 'published') {
    result.className = 'result';
    result.innerHTML = `
      <p class="score-label">Reviewed truth score</p>
      <p class="score">${state.score}<span>/100</span></p>
      <p class="meta">${state.reviewedClaims}/${state.eligibleClaims} eligible claims reviewed<br>Method ${state.methodologyVersion}<br>Reviewed ${state.lastReviewedAt}</p>
      <a class="request" href="${state.analysisUrl}" target="_blank" rel="noreferrer">Open evidence trail ↗</a>`;
    return;
  }

  const heading = state.state === 'not_analyzed' ? 'NOT ANALYZED YET' : 'SCORE PENDING';
  const requestUrl = new URL('https://ai.rhyslindmark.com/claims');
  if (identity.canonicalUrl) requestUrl.searchParams.set('url', identity.canonicalUrl);
  result.className = 'result pending';
  result.innerHTML = `
    <h3>${heading}</h3>
    <p>${state.reason} AI Claims never invents a score from partial review.</p>
    <a class="request" href="${requestUrl}" target="_blank" rel="noreferrer">Request analysis ↗</a>`;
}

async function refresh() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;
  const identity = identifyPage(tab?.url ?? '', tab?.title ?? 'Current page');
  kind.textContent = identity.kind === 'unsupported' ? 'Permission needed' : identity.kind;
  title.textContent = identity.title || 'Untitled page';
  pageUrl.textContent = identity.canonicalUrl ?? 'Click the extension icon on this page to grant temporary access.';

  if (!identity.entityKey) {
    renderResult({ state: 'pending', reason: 'The extension cannot read this page yet.' }, identity);
    permissionButton.hidden = true;
    return;
  }

  const registry = await loadRegistry();
  renderResult(resolveAnalysis(registry, identity.entityKey), identity);
  const origin = new URL(identity.canonicalUrl).origin;
  const hasAccess = await chrome.permissions.contains({ origins: [`${origin}/*`] });
  permissionButton.hidden = hasAccess;
}

permissionButton.addEventListener('click', async () => {
  if (!currentTab?.url) return;
  const origin = new URL(currentTab.url).origin;
  const granted = await chrome.permissions.request({ origins: [`${origin}/*`] });
  if (granted) permissionButton.hidden = true;
});

chrome.tabs.onActivated.addListener(refresh);
chrome.tabs.onUpdated.addListener((_tabId, changeInfo) => {
  if (changeInfo.status === 'complete' || changeInfo.url) refresh();
});

refresh();
