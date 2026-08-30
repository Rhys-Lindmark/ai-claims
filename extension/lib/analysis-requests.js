export const REQUEST_STATES = ['queued', 'in_review', 'published', 'failed'];

const ALLOWED_TRANSITIONS = {
  queued: ['in_review', 'failed'],
  in_review: ['published', 'failed'],
  published: [],
  failed: ['queued'],
};

function storageKey(entityKey) {
  return `analysis-request:${entityKey}`;
}

export function createRequestStore({ storageArea, now = () => new Date().toISOString(), createId = () => crypto.randomUUID() }) {
  return {
    async get(entityKey) {
      const key = storageKey(entityKey);
      const values = await storageArea.get(key);
      return values[key] ?? null;
    },

    async submit(identity) {
      if (!identity.entityKey || !identity.canonicalUrl) throw new Error('A canonical page identity is required.');
      const key = storageKey(identity.entityKey);
      const values = await storageArea.get(key);
      if (values[key]) return { created: false, record: values[key] };

      const timestamp = now();
      const record = {
        request_id: createId(),
        entity_key: identity.entityKey,
        canonical_url: identity.canonicalUrl,
        page_kind: identity.kind,
        state: 'queued',
        created_at: timestamp,
        updated_at: timestamp,
        attempt: 1,
      };
      await storageArea.set({ [key]: record });
      return { created: true, record };
    },

    async transition(entityKey, nextState) {
      if (!REQUEST_STATES.includes(nextState)) throw new Error(`Unknown request state: ${nextState}`);
      const key = storageKey(entityKey);
      const values = await storageArea.get(key);
      const current = values[key];
      if (!current) throw new Error('Analysis request does not exist.');
      if (!ALLOWED_TRANSITIONS[current.state]?.includes(nextState)) throw new Error(`Cannot transition ${current.state} to ${nextState}.`);
      const record = {
        ...current,
        state: nextState,
        updated_at: now(),
        attempt: current.state === 'failed' && nextState === 'queued' ? current.attempt + 1 : current.attempt,
      };
      await storageArea.set({ [key]: record });
      return record;
    },
  };
}
