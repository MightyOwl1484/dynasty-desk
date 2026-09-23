/**
 * Shared-league workflow rules.
 *
 * These transitions are intentionally explicit so a SharePoint commissioner
 * view and a future server-side resolver can use the same rules as solo tests.
 */

export const LEAGUE_PHASES = Object.freeze(['setup', 'open', 'locked', 'resolving', 'published', 'complete']);

const ALLOWED_TRANSITIONS = Object.freeze({
  setup: ['open'],
  open: ['locked'],
  locked: ['open', 'resolving'],
  resolving: ['published'],
  published: ['open', 'complete'],
  complete: []
});

export function canTransition(from, to) {
  return LEAGUE_PHASES.includes(from) && ALLOWED_TRANSITIONS[from].includes(to);
}

export function transitionLeague(league, to) {
  if (!canTransition(league.phase, to)) {
    throw new Error(`Cannot transition league from ${league.phase} to ${to}.`);
  }
  return { ...league, phase: to, phaseVersion: (league.phaseVersion ?? 0) + 1 };
}

export function createClubActions(input) {
  if (!input?.leagueId || !input?.clubId || !input?.managerId) {
    throw new Error('Club actions require a league, club, and manager.');
  }

  return {
    id: input.id ?? `${input.leagueId}:${input.clubId}:${input.matchWeek}`,
    leagueId: input.leagueId,
    clubId: input.clubId,
    managerId: input.managerId,
    matchWeek: input.matchWeek ?? 1,
    lineup: [...(input.lineup ?? [])],
    formation: input.formation ?? '4-4-2',
    tactic: input.tactic ?? 'balanced',
    trainingFocus: input.trainingFocus ?? 'recovery',
    status: input.status ?? 'draft',
    submittedAt: input.submittedAt ?? null,
    lockedAt: input.lockedAt ?? null
  };
}

export function submitClubActions(actions, submittedAt = new Date().toISOString()) {
  if (actions.status === 'locked') {
    throw new Error('Locked club actions cannot be edited.');
  }
  return { ...actions, status: 'submitted', submittedAt };
}

export function lockClubActions(actions, lockedAt = new Date().toISOString()) {
  if (actions.status !== 'submitted') {
    throw new Error('Only submitted club actions can be locked.');
  }
  return { ...actions, status: 'locked', lockedAt };
}

export function defaultClubActions(input) {
  return createClubActions({ ...input, status: 'auto', tactic: 'balanced', trainingFocus: 'recovery' });
}
