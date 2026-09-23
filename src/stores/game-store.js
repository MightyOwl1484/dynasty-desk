/**
 * Persistence contract used by application code.
 *
 * This is a documentation-only base class for now. Concrete stores can be
 * local, SharePoint-backed, or API-backed as long as they preserve these
 * operations and return plain serializable game state.
 */
export class GameStore {
  load() { throw new Error('GameStore.load() must be implemented.'); }
  save() { throw new Error('GameStore.save() must be implemented.'); }
  clear() { throw new Error('GameStore.clear() must be implemented.'); }
}
