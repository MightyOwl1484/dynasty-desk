import { canManageLeague, canResolveWeek, ROLES } from '../domain/permissions.js';

/** Build the small, accessible summary a commissioner shell needs to render. */
export function createAdminSummary({ league, members = [], actions = [], auditEvents = [], viewerRole = ROLES.VIEWER }) {
  if (!league?.id || !league.phase) throw new TypeError('A league with id and phase is required.');
  const managers = members.filter((member) => member.role === ROLES.MANAGER);
  const actionByClub = new Map(actions.map((action) => [action.clubId, action]));
  const clubs = managers.map((member) => {
    const action = actionByClub.get(member.clubId);
    return {
      clubId: member.clubId,
      managerId: member.userId,
      managerName: member.displayName ?? member.userId,
      status: action?.status ?? 'missing',
      submittedAt: action?.submittedAt ?? null,
      lockedAt: action?.lockedAt ?? null
    };
  });
  return {
    leagueId: league.id,
    phase: league.phase,
    matchWeek: league.matchWeek ?? 1,
    deadline: league.deadline ?? null,
    resolverVersion: league.resolverVersion ?? 'unknown',
    canManage: canManageLeague(viewerRole),
    canResolve: canResolveWeek(viewerRole, league.phase),
    clubs,
    submittedCount: clubs.filter((club) => club.status === 'submitted' || club.status === 'locked').length,
    auditEvents: [...auditEvents].sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  };
}
