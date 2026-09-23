import { lockMatchWeek, publishMatchWeek } from './league-workflow.js';

/** Create an explicit lock mutation plan without performing tenant writes. */
export function createLockPlan({ league, actions, leagueRecord, actionRecords, actorId, lockedAt }) {
  const result = lockMatchWeek(league, actions, lockedAt, { actorId });
  const actionUpdates = result.actions.map((action) => {
    const record = actionRecords.find((candidate) => candidate.clubId === action.clubId);
    if (!record) throw new Error(`No SharePoint action record found for club ${action.clubId}.`);
    return { ...record, action };
  });
  return { ...result, leagueRecord, actionUpdates };
}

/** Persist the plan in a predictable order: league state, club actions, then audit events. */
export async function persistLockPlan(store, plan) {
  await store.updateLeague(plan.leagueRecord.itemId, plan.league, { etag: plan.leagueRecord.etag });
  await Promise.all(plan.actionUpdates.map(({ itemId, etag, action }) => store.saveClubActions(action, { itemId, etag })));
  await Promise.all(plan.auditEvents.map((event) => store.appendLeagueEvent(event)));
  return plan;
}

export function createPublishPlan({ league, results, leagueRecord, actorId, publishedAt }) {
  const { league: nextLeague, results: publishedResults, auditEvents } = publishMatchWeek(league, results, publishedAt, { actorId });
  return { league: nextLeague, results: publishedResults, auditEvents, leagueRecord };
}

export async function persistPublishPlan(store, plan) {
  await store.updateLeague(plan.leagueRecord.itemId, plan.league, { etag: plan.leagueRecord.etag });
  await Promise.all(plan.results.map((result) => store.appendMatchResult(result)));
  await Promise.all(plan.auditEvents.map((event) => store.appendLeagueEvent(event)));
  return plan;
}
