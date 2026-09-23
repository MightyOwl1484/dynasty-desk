import test from 'node:test';
import assert from 'node:assert/strict';
import { createLocalGameStore, parseSaveText, SAVE_SCHEMA_VERSION } from '../src/stores/local.js';

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
    raw: (key) => values.get(key)
  };
}

test('local store saves versioned state and loads a separate object', () => {
  const storage = memoryStorage();
  const store = createLocalGameStore(storage, 'save');
  const state = { week: 2, clubs: [{ id: 'northport' }] };
  store.save(state);
  const envelope = JSON.parse(storage.raw('save'));
  assert.equal(envelope.schemaVersion, SAVE_SCHEMA_VERSION);
  assert.deepEqual(store.load(), state);
});

test('local store migrates the prototype raw save format', () => {
  const state = { week: 4, seed: 12 };
  const storage = memoryStorage({ save: JSON.stringify(state) });
  assert.deepEqual(createLocalGameStore(storage, 'save').load(), state);
});

test('local store treats corrupt data as an empty save and can clear it', () => {
  const storage = memoryStorage({ save: '{not-json' });
  const store = createLocalGameStore(storage, 'save');
  assert.equal(store.load(), null);
  store.save({ week: 1 });
  store.clear();
  assert.equal(store.load(), null);
});

test('local store imports exported envelopes and rejects empty JSON values', () => {
  const store = createLocalGameStore(memoryStorage(), 'save');
  const state = { week: 7, season: 1 };
  assert.deepEqual(parseSaveText(JSON.stringify({ schemaVersion: 1, data: state })), state);
  assert.deepEqual(store.importText(JSON.stringify({ schemaVersion: 1, data: state })), state);
  assert.deepEqual(store.load(), state);
  assert.throws(() => store.importText('null'), /game state/);
});
