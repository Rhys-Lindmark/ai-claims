import fixture from '../data/correction-event-feed-fixture.json' with { type: 'json' };

export const CORRECTION_FEED_CONTRACT = '1.1.0';

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

export function correctionEventForEntity(entityKey: string, eventId: string) {
  return correctionFeedForEntity(entityKey)?.events.find((event) => event.event_id === eventId) ?? null;
}

export function resolveCorrectionFeedEnvelope(entityKey: string, cursor: string | null = null, limit = 20) {
  const feed = correctionFeedForEntity(entityKey);
  const cursorIndex = cursor && feed ? feed.events.findIndex((event) => event.event_id === cursor) : -1;
  const cursorValid = !cursor || cursorIndex >= 0;
  const start = cursor ? cursorIndex + 1 : 0;
  const events = feed && cursorValid ? feed.events.slice(start, start + limit) : null;
  const hasMore = Boolean(feed && events && start + events.length < feed.events.length);
  return {
    contract_version: CORRECTION_FEED_CONTRACT,
    entity_key: entityKey,
    fixture_notice: fixture.fixture_notice,
    cursor,
    cursor_valid: cursorValid,
    limit,
    events,
    next_cursor: hasMore ? events?.at(-1)?.event_id ?? null : null,
    latest_event: feed?.events.at(-1) ?? null,
  };
}

export function resolveCorrectionEventEnvelope(entityKey: string, eventId: string) {
  return {
    contract_version: CORRECTION_FEED_CONTRACT,
    entity_key: entityKey,
    fixture_notice: fixture.fixture_notice,
    event: correctionEventForEntity(entityKey, eventId),
  };
}

export function correctionFeedEtag(entityKey: string, cursor: string | null = null, limit = 20) {
  const latest = latestCorrectionForEntity(entityKey);
  return `\"claims-corrections-${stableHash(`${entityKey}:${cursor ?? 'start'}:${limit}:${latest?.event_id ?? 'missing'}`)}\"`;
}

export function correctionEventEtag(entityKey: string, eventId: string) {
  return `\"claims-correction-${stableHash(`${entityKey}:${eventId}`)}\"`;
}
