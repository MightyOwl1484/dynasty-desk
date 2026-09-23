import { createAdminSummary } from './application/admin-summary.js';
import { ROLES } from './domain/permissions.js';

const state = {
  league: { id: 'harbor-league', phase: 'open', matchWeek: 3, deadline: '2026-09-24T17:00:00Z', resolverVersion: '0.1.0' },
  members: [
    { role: ROLES.MANAGER, clubId: 'npa', userId: 'u1', displayName: 'Avery' },
    { role: ROLES.MANAGER, clubId: 'ivr', userId: 'u2', displayName: 'Jordan' },
    { role: ROLES.MANAGER, clubId: 'kbf', userId: 'u3', displayName: 'Morgan' },
    { role: ROLES.MANAGER, clubId: 'ash', userId: 'u4', displayName: 'Riley' }
  ],
  actions: [
    { clubId: 'npa', status: 'submitted', submittedAt: '2026-09-23T11:30:00Z' },
    { clubId: 'ivr', status: 'submitted', submittedAt: '2026-09-23T12:10:00Z' },
    { clubId: 'kbf', status: 'draft', submittedAt: null }
  ],
  auditEvents: [{ id: 'e1', timestamp: '2026-09-22T09:00:00Z', message: 'Match week 3 opened.', type: 'week_opened' }]
};

const $ = (id) => document.getElementById(id);
const formatDate = (value) => value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';

function render() {
  const summary = createAdminSummary({ ...state, viewerRole: ROLES.COMMISSIONER });
  $('phaseStatus').textContent = summary.phase.toUpperCase();
  $('matchWeek').textContent = `Week ${summary.matchWeek}`;
  $('deadline').textContent = formatDate(summary.deadline);
  $('submissions').textContent = `${summary.submittedCount} / ${summary.clubs.length}`;
  $('resolver').textContent = summary.resolverVersion;
  $('readinessHelp').textContent = summary.submittedCount === summary.clubs.length ? 'Everyone is ready.' : 'One or more managers need attention.';
  $('clubRows').innerHTML = summary.clubs.map((club) => `<tr><th scope="row">${club.clubId.toUpperCase()}</th><td>${club.managerName}</td><td><span class="status status-${club.status}">${club.status}</span></td><td>${formatDate(club.submittedAt)}</td></tr>`).join('');
  $('auditEvents').innerHTML = summary.auditEvents.map((event) => `<li><strong>${event.type.replaceAll('_', ' ')}</strong><time>${formatDate(event.timestamp)}</time><span>${event.message}</span></li>`).join('');
  $('lockButton').disabled = !summary.canManage || summary.phase !== 'open';
  $('resolveButton').disabled = !summary.canResolve;
  $('publishButton').disabled = summary.phase !== 'resolving' || !summary.canManage;
}

function previewTransition(phase, message) {
  state.league = { ...state.league, phase };
  state.auditEvents = [{ id: `preview-${Date.now()}`, timestamp: new Date().toISOString(), type: `week_${phase}`, message }, ...state.auditEvents];
  $('actionStatus').textContent = `${message} This preview does not write to SharePoint.`;
  render();
}

$('lockButton').onclick = () => previewTransition('locked', 'Submissions locked for review.');
$('resolveButton').onclick = () => previewTransition('resolving', 'Fixtures marked ready for resolution.');
$('publishButton').onclick = () => previewTransition('published', 'Results marked ready to publish.');
render();
