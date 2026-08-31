export const METRIC_EVENT_TYPES = ['page_checked', 'score_published', 'score_pending', 'analysis_requested'];
const STORAGE_KEY = 'privacy-metrics:v1';
const NEGOTIATION_STORAGE_KEY = 'privacy-negotiation-metrics:v1';
export const NEGOTIATION_OUTCOMES = ['supported_1_1', 'legacy_1_0', 'unsupported', 'not_advertised'];
const MAX_EVENTS = 500;
const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

export function createMetricsStore({ storageArea, now = () => new Date().toISOString() }) {
  return {
    async record(type, dimensions = {}) {
      if (!METRIC_EVENT_TYPES.includes(type)) throw new Error(`Unknown metric event: ${type}`);
      const timestamp = now();
      const cutoff = Date.parse(timestamp) - RETENTION_MS;
      const stored = await storageArea.get(STORAGE_KEY);
      const previous = Array.isArray(stored[STORAGE_KEY]) ? stored[STORAGE_KEY] : [];
      const event = {
        type,
        timestamp,
        kind: ['youtube', 'goodreads', 'web'].includes(dimensions.kind) ? dimensions.kind : 'other',
      };
      const events = [...previous.filter((item) => Date.parse(item.timestamp) >= cutoff), event].slice(-MAX_EVENTS);
      await storageArea.set({ [STORAGE_KEY]: events });
      return event;
    },

    async summary(days = 7) {
      const stored = await storageArea.get(STORAGE_KEY);
      const events = Array.isArray(stored[STORAGE_KEY]) ? stored[STORAGE_KEY] : [];
      const cutoff = Date.parse(now()) - days * 24 * 60 * 60 * 1000;
      const recent = events.filter((event) => Date.parse(event.timestamp) >= cutoff);
      const counts = Object.fromEntries(METRIC_EVENT_TYPES.map((type) => [type, recent.filter((event) => event.type === type).length]));
      return { days, total: recent.length, counts };
    },

    async recordNegotiation(outcome) {
      if (!NEGOTIATION_OUTCOMES.includes(outcome)) throw new Error(`Unknown negotiation outcome: ${outcome}`);
      const date = now().slice(0, 10);
      const stored = await storageArea.get(NEGOTIATION_STORAGE_KEY);
      const buckets = Array.isArray(stored[NEGOTIATION_STORAGE_KEY]) ? stored[NEGOTIATION_STORAGE_KEY] : [];
      const existing = buckets.find((bucket) => bucket.date === date);
      if (existing) existing.counts[outcome] = (existing.counts[outcome] ?? 0) + 1;
      else buckets.push({ date, counts: { [outcome]: 1 } });
      const retained = buckets.filter((bucket) => Date.parse(`${bucket.date}T00:00:00.000Z`) >= Date.parse(`${date}T00:00:00.000Z`) - RETENTION_MS).slice(-30);
      await storageArea.set({ [NEGOTIATION_STORAGE_KEY]: retained });
      return { date, outcome };
    },

    async negotiationSummary(days = 7) {
      const stored = await storageArea.get(NEGOTIATION_STORAGE_KEY);
      const buckets = Array.isArray(stored[NEGOTIATION_STORAGE_KEY]) ? stored[NEGOTIATION_STORAGE_KEY] : [];
      const cutoff = Date.parse(now()) - days * 24 * 60 * 60 * 1000;
      const recent = buckets.filter((bucket) => Date.parse(`${bucket.date}T00:00:00.000Z`) >= cutoff);
      const counts = Object.fromEntries(NEGOTIATION_OUTCOMES.map((outcome) => [outcome, recent.reduce((sum, bucket) => sum + (bucket.counts[outcome] ?? 0), 0)]));
      return { days, counts };
    },
  };
}
