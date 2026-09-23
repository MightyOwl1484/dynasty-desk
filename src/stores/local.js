/**
 * Local persistence adapter.
 *
 * The browser uses this adapter today. SharePoint and a future API should
 * implement the same shape rather than leaking storage details into UI code.
 */

export const SAVE_SCHEMA_VERSION = 1;

export function createLocalGameStore(storage, key = 'dynasty-desk-save-v1') {
  if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') {
    throw new Error('A storage object with getItem and setItem is required.');
  }

  return {
    load() {
      const raw = storage.getItem(key);
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.schemaVersion === SAVE_SCHEMA_VERSION && parsed.data) return parsed.data;
        // Accept the prototype's original raw save format during migration.
        return parsed && typeof parsed === 'object' ? parsed : null;
      } catch {
        return null;
      }
    },

    save(state) {
      if (!state || typeof state !== 'object') throw new Error('Cannot save an empty game state.');
      storage.setItem(key, JSON.stringify({
        schemaVersion: SAVE_SCHEMA_VERSION,
        savedAt: new Date().toISOString(),
        data: state
      }));
    },

    clear() {
      storage.removeItem(key);
    }
  };
}
