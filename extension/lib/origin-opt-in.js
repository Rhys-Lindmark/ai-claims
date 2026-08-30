const STORAGE_KEY = 'auto-check-origins:v1';

export function createOriginOptInStore({ storageArea }) {
  async function list() {
    const stored = await storageArea.get(STORAGE_KEY);
    return Array.isArray(stored[STORAGE_KEY]) ? stored[STORAGE_KEY] : [];
  }

  return {
    async has(origin) {
      return (await list()).includes(origin);
    },
    async grant(origin) {
      const origins = await list();
      if (!origins.includes(origin)) origins.push(origin);
      origins.sort();
      await storageArea.set({ [STORAGE_KEY]: origins });
      return origins;
    },
    async revoke(origin) {
      const origins = (await list()).filter((entry) => entry !== origin);
      await storageArea.set({ [STORAGE_KEY]: origins });
      return origins;
    },
  };
}
