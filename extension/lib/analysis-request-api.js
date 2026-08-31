export const ANALYSIS_REQUEST_CONTRACT_VERSION = '1.0.0';

function requestEndpoint(endpoint) {
  const base = new URL(endpoint.endsWith('/') ? endpoint : `${endpoint}/`);
  return new URL('v1/analysis-requests', base);
}

function serviceError(message, recoverable) {
  const error = new Error(message);
  error.recoverable = recoverable;
  return error;
}

function sharedRecord(envelope, expectedEntityKey = null) {
  if (envelope?.contract_version !== ANALYSIS_REQUEST_CONTRACT_VERSION) throw serviceError('Unsupported analysis request contract.', false);
  const record = envelope.analysis_request;
  if (!record || typeof record !== 'object') throw serviceError('Analysis request response is missing its record.', false);
  if (!/^req_[0-9a-f]{64}$/.test(record.request_id ?? '') || record.contract_version !== ANALYSIS_REQUEST_CONTRACT_VERSION) throw serviceError('Analysis request response is malformed.', false);
  if (expectedEntityKey && record.entity_key !== expectedEntityKey) throw serviceError('Analysis request response changed the canonical page key.', false);
  if (!['youtube', 'goodreads', 'web'].includes(record.page_kind) || !['queued', 'in_review', 'published', 'failed'].includes(record.state)) throw serviceError('Analysis request response has an unsupported state.', false);
  return { ...record, sync_scope: 'shared' };
}

export function createRequestApiStore({ endpoint, fetchImpl = fetch }) {
  const url = requestEndpoint(endpoint);
  return {
    async get(entityKey) {
      const response = await fetchImpl(`${url.href}?entity_key=${encodeURIComponent(entityKey)}`, { headers: { accept: 'application/json' }, cache: 'no-store' });
      if (response.status === 404) return null;
      if (!response.ok) throw serviceError(`Analysis request lookup failed with ${response.status}.`, response.status >= 500 || response.status === 429);
      return sharedRecord(await response.json(), entityKey);
    },

    async submit(identity) {
      if (!identity?.entityKey || !identity?.canonicalUrl || !['youtube', 'goodreads', 'web'].includes(identity.kind)) throw serviceError('A canonical page identity is required.', false);
      const response = await fetchImpl(url.href, {
        method: 'POST',
        headers: { accept: 'application/json', 'content-type': 'application/json' },
        body: JSON.stringify({ contract_version: ANALYSIS_REQUEST_CONTRACT_VERSION, entity_key: identity.entityKey, canonical_url: identity.canonicalUrl, page_kind: identity.kind }),
      });
      if (!response.ok) throw serviceError(`Analysis request submission failed with ${response.status}.`, response.status >= 500 || response.status === 429);
      const envelope = await response.json();
      return { created: envelope.created === true, record: sharedRecord(envelope, identity.entityKey) };
    },
  };
}

function deviceRecord(record) {
  return record ? { ...record, contract_version: ANALYSIS_REQUEST_CONTRACT_VERSION, sync_scope: 'device_only' } : null;
}

export function createResilientRequestStore({ remoteStore, localStore }) {
  return {
    async get(entityKey) {
      try { return await remoteStore.get(entityKey); } catch (error) {
        if (error?.recoverable === false) throw error;
        return deviceRecord(await localStore.get(entityKey));
      }
    },

    async submit(identity) {
      try { return await remoteStore.submit(identity); } catch (error) {
        if (error?.recoverable === false) throw error;
        const local = await localStore.submit(identity);
        return { ...local, record: deviceRecord(local.record) };
      }
    },

    transition(entityKey, nextState) { return localStore.transition(entityKey, nextState); },
  };
}
