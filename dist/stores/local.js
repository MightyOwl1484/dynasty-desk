/**
 * Local persistence adapter.
 *
 * The browser uses this adapter today. SharePoint and a future API should
 * implement the same shape rather than leaking storage details into UI code.
 */

export const SAVE_SCHEMA_VERSION = 1;

export function isGameState(value) {
  return Boolean(value && typeof value === 'object' && Number.isInteger(value.week) && Number.isInteger(value.season)
    && Number.isInteger(value.userClub) && Array.isArray(value.clubs) && Array.isArray(value.fixtures));
}

export function parseSaveText(text) {
  const parsed = JSON.parse(text);
  if (parsed?.schemaVersion === SAVE_SCHEMA_VERSION && parsed.data) return parsed.data;
  return parsed && typeof parsed === 'object' ? parsed : null;
}

export function createLocalGameStore(storage, key = 'dynasty-desk-save-v1') {
  if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') {
    throw new Error('A storage object with getItem and setItem is required.');
  }

  return {
    load() {
      const raw = storage.getItem(key);
      if (!raw) return null;
      try {
        const state = parseSaveText(raw);
        return isGameState(state) ? state : null;
      } catch {
        return null;
      }
    },

    save(state) {
      if (!isGameState(state)) throw new Error('Cannot save an invalid game state.');
      storage.setItem(key, JSON.stringify({
        schemaVersion: SAVE_SCHEMA_VERSION,
        savedAt: new Date().toISOString(),
        data: state
      }));
    },

    importText(text) {
      const state = parseSaveText(text);
      if (!isGameState(state)) throw new Error('The selected file does not contain a valid game state.');
      this.save(state);
      return state;
    },

    clear() {
      storage.removeItem(key);
    }
  };
}
