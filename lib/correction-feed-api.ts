import fixture from '@/data/correction-event-feed-fixture.json';

export const CORRECTION_FEED_CONTRACT = '1.0.0';

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function correctionFeedForEntity(entityKey: string) {
  return fixture.feeds.find((feed) => feed.entity_key === entityKey) ?? null;
}

export function latestCorrectionForEntity(entityKey: string) {
  return correctionFeedForEntity(entityKey)?.events.at(-1) ?? null;
}

export function resolveCorrectionFeedEnvelope(entityKey: string) {
  const feed = correctionFeedForEntity(entityKey);
  return {
    contract_version: CORRECTION_FEED_CONTRACT,
    entity_key: entityKey,
    fixture_notice: fixture.fixture_notice,
    events: feed?.events ?? null,
    latest_event: feed?.events.at(-1) ?? null,
  };
}

export function correctionFeedEtag(entityKey: string) {
  const latest = latestCorrectionForEntity(entityKey);
  return `\"claims-corrections-${stableHash(`${entityKey}:${latest?.event_id ?? 'missing'}`)}\"`;
}
