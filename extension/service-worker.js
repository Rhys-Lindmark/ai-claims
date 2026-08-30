import { actionBadgeForState } from './lib/action-badge.js';
import { createConfiguredResolver } from './lib/analysis-resolver.js';
import { identifyPage } from './lib/page-identity.js';

async function configureAction() {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
}

async function loadResolver() {
  const response = await fetch(chrome.runtime.getURL('data/resolver-config.json'));
  const config = await response.json();
  if (config.mode === 'local') config.registry_url = chrome.runtime.getURL(config.registry_url);
  return createConfiguredResolver(config);
}

async function paintBadge(tab) {
  const tabId = tab?.id;
  if (!tabId) return;
  let badge = actionBadgeForState(null);
  try {
    const identity = identifyPage(tab.url ?? '', tab.title ?? 'Current page');
    if (!identity.entityKey) throw new Error('Unsupported page.');
    const origin = new URL(identity.canonicalUrl).origin;
    const optedIn = await chrome.permissions.contains({ origins: [`${origin}/*`] });
    if (!optedIn) throw new Error('Origin is not opted in.');
    const resolver = await loadResolver();
    badge = actionBadgeForState(await resolver.resolve(identity.entityKey));
  } catch {
    // No badge is safer than implying that an unreadable or unavailable page was reviewed.
  }
  await chrome.action.setBadgeBackgroundColor({ tabId, color: badge.color });
  await chrome.action.setBadgeText({ tabId, text: badge.text });
  await chrome.action.setTitle({ tabId, title: badge.title });
}

chrome.runtime.onInstalled.addListener(configureAction);
chrome.runtime.onStartup.addListener(configureAction);

chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' || changeInfo.url) paintBadge(tab);
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    paintBadge(await chrome.tabs.get(tabId));
  } catch {
    // Tabs can close between activation and lookup.
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'refresh-badge' || !Number.isInteger(message.tabId)) return false;
  chrome.tabs.get(message.tabId).then(paintBadge).then(() => sendResponse({ ok: true })).catch(() => sendResponse({ ok: false }));
  return true;
});
