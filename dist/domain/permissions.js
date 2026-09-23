/** Product-level authorization helpers shared by all hosts. */
export const ROLES = Object.freeze({ COMMISSIONER: 'commissioner', MANAGER: 'manager', VIEWER: 'viewer' });

export function canReadLeague() { return true; }
export function canManageLeague(role) { return role === ROLES.COMMISSIONER; }
export function canResolveWeek(role, phase) { return role === ROLES.COMMISSIONER && phase === 'locked'; }
export function canEditClubActions({ role, clubId, assignedClubId, phase }) {
  return role === ROLES.MANAGER && clubId === assignedClubId && (phase === 'preparation' || phase === 'open');
}
