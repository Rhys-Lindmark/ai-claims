import { identifyPage } from './lib/page-identity.js';
import { createConfiguredResolver } from './lib/analysis-resolver.js';
import { createRequestStore } from './lib/analysis-requests.js';
import { sourceNotice } from './lib/source-policy.js';
import { createMetricsStore } from './lib/local-metrics.js';
import { createOriginOptInStore } from './lib/origin-opt-in.js';
import { correctionLinkForState, correctionPreviewForState, escapeHtml } from './lib/correction-links.js';

const kind = document.querySelector('#page-kind');
const title = document.querySelector('#page-title');
const pageUrl = document.querySelector('#page-url');
const result = document.querySelector('#result');
const permissionButton = document.querySelector('#permission');
const localMetrics = document.querySelector('#local-metrics');
let currentTab;
let currentIdentity;
let currentAutoCheck = false;
const requestStore = createRequestStore({ storageArea: chrome.storage.local });
const metricsStore = createMetricsStore({ storageArea: chrome.storage.local });
const originOptIns = createOriginOptInStore({ storageArea: chrome.storage.local });
const checkedThisSession = new Set();

async function refreshMetrics() {
  const summary = await metricsStore.summary(7);
  localMetrics.textContent = `7D CHECKS: ${summary.counts.page_checked}`;
}

async function loadResolver() {
  const response = await fetch(chrome.runtime.getURL('data/resolver-config.json'));
  const config = await response.json();
  if (config.mode === 'local') config.registry_url = chrome.runtime.getURL(config.registry_url);
  return createConfiguredResolver(config);
}

function renderResult(state, identity, requestRecord = null) {
  const correctionLink = correctionLinkForState(state);
  const correctionPreview = correctionPreviewForState(state);
  if (state.state === 'published') {
    result.className = 'result';
    result.innerHTML = `
      <p class="score-label">Reviewed truth score</p>
      <p class="score">${state.score}<span>/100</span></p>
      <p class="meta">${state.reviewedClaims}/${state.eligibleClaims} eligible claims reviewed<br>Version ${state.analysisVersionId}${state.resumedFromVersionId ? ` · resumed from ${state.resumedFromVersionId}` : ''}<br>Method ${state.methodologyVersion}<br>Reviewed ${state.lastReviewedAt}</p>
      ${correctionPreview ? `<p class="meta"><strong>${escapeHtml(correctionPreview.lineage)}</strong><br>${escapeHtml(correctionPreview.summary)}</p>` : ''}
      <a class="request" href="${state.analysisUrl}" target="_blank" rel="noreferrer">Open evidence trail ↗</a>
      ${correctionLink ? `<a class="request" href="${escapeHtml(correctionLink.url)}" target="_blank" rel="noreferrer">${escapeHtml(correctionLink.label)} ↗</a>` : ''}`;
    return;
  }

  const heading = requestRecord ? `ANALYSIS ${requestRecord.state.replaceAll('_', ' ').toUpperCase()}` : state.state === 'not_analyzed' ? 'NOT ANALYZED YET' : state.state === 'paused' ? 'SCORE PAUSED' : 'SCORE PENDING';
  const explanation = requestRecord ? `Request ${requestRecord.request_id} is stored for this canonical page. Duplicate visits reuse it. ${sourceNotice(identity.kind)}` : `${state.reason} AI Claims never invents a score from partial review. ${sourceNotice(identity.kind)}`;
  result.className = 'result pending';
  result.innerHTML = `
    <h3>${heading}</h3>
    <p>${explanation}</p>
    ${correctionPreview ? `<p class="meta"><strong>${escapeHtml(correctionPreview.lineage)}</strong><br>${escapeHtml(correctionPreview.summary)}</p>` : ''}
    ${state.state === 'paused' && state.analysisUrl ? `<a class="request" href="${state.analysisUrl}" target="_blank" rel="noreferrer">Open pause context ↗</a>${correctionLink ? `<a class="request" href="${escapeHtml(correctionLink.url)}" target="_blank" rel="noreferrer">${escapeHtml(correctionLink.label)} ↗</a>` : ''}` : requestRecord ? identity.kind === 'youtube' ? `<a class="request" href="https://ai.rhyslindmark.com/claims/intake?url=${encodeURIComponent(identity.canonicalUrl)}" target="_blank" rel="noreferrer">Supply permitted transcript ↗</a>` : identity.kind === 'goodreads' ? `<a class="request" href="https://ai.rhyslindmark.com/claims/book-intake?url=${encodeURIComponent(identity.canonicalUrl)}" target="_blank" rel="noreferrer">Confirm book edition ↗</a>` : '' : '<button class="request" id="request-analysis">Request analysis</button>'}`;
}

async function refresh() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;
  const identity = identifyPage(tab?.url ?? '', tab?.title ?? 'Current page');
  currentIdentity = identity;
  kind.textContent = identity.kind === 'unsupported' ? 'Permission needed' : identity.kind;
  title.textContent = identity.title || 'Untitled page';
  pageUrl.textContent = identity.canonicalUrl ?? 'Click the extension icon on this page to grant temporary access.';

  if (!identity.entityKey) {
    renderResult({ state: 'pending', reason: 'The extension cannot read this page yet.' }, identity);
    permissionButton.hidden = true;
    return;
  }

  let score;
  try {
    const resolver = await loadResolver();
    score = await resolver.resolve(identity.entityKey);
  } catch {
    score = { state: 'pending', reason: 'The shared analysis service is temporarily unavailable.' };
  }
  if (!checkedThisSession.has(identity.entityKey)) {
    checkedThisSession.add(identity.entityKey);
    await metricsStore.record('page_checked', { kind: identity.kind });
    await metricsStore.record(score.state === 'published' ? 'score_published' : 'score_pending', { kind: identity.kind });
    await refreshMetrics();
  }
  const requestRecord = score.state === 'not_analyzed' ? await requestStore.get(identity.entityKey) : null;
  renderResult(score, identity, requestRecord);
  const origin = new URL(identity.canonicalUrl).origin;
  currentAutoCheck = await originOptIns.has(origin);
  permissionButton.textContent = currentAutoCheck ? 'Stop checking this site' : 'Show scores as I browse this site';
  permissionButton.hidden = false;
}

permissionButton.addEventListener('click', async () => {
  if (!currentTab?.url) return;
  const origin = new URL(currentTab.url).origin;
  if (currentAutoCheck) {
    await originOptIns.revoke(origin);
    await chrome.permissions.remove({ origins: [`${origin}/*`] });
    currentAutoCheck = false;
    permissionButton.textContent = 'Show scores as I browse this site';
    chrome.runtime.sendMessage({ type: 'refresh-badge', tabId: currentTab.id });
    return;
  }
  const granted = await chrome.permissions.request({ origins: [`${origin}/*`] });
  if (granted) {
    await originOptIns.grant(origin);
    currentAutoCheck = true;
    permissionButton.textContent = 'Stop checking this site';
    chrome.runtime.sendMessage({ type: 'refresh-badge', tabId: currentTab.id });
  }
});

result.addEventListener('click', async (event) => {
  if (!(event.target instanceof HTMLElement) || event.target.id !== 'request-analysis' || !currentIdentity?.entityKey) return;
  event.target.setAttribute('disabled', 'true');
  const { record } = await requestStore.submit(currentIdentity);
  await metricsStore.record('analysis_requested', { kind: currentIdentity.kind });
  await refreshMetrics();
  renderResult({ state: 'not_analyzed', reason: 'No shared analysis exists for this page yet.' }, currentIdentity, record);
});

chrome.tabs.onActivated.addListener(refresh);
chrome.tabs.onUpdated.addListener((_tabId, changeInfo) => {
  if (changeInfo.status === 'complete' || changeInfo.url) refresh();
});

refreshMetrics();
refresh();
