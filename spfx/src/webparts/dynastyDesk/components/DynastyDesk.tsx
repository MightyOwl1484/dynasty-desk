import * as React from 'react';
import { IDynastyDeskProps } from './IDynastyDeskProps';

export const DynastyDesk: React.FC<IDynastyDeskProps> = ({ summary, loadingError, onPhaseAction }) => {
  if (loadingError) return <main aria-labelledby="dynasty-desk-title"><h1 id="dynasty-desk-title">Commissioner console</h1><p role="alert">The league could not be loaded. {loadingError}</p></main>;
  if (!summary) return <main aria-labelledby="dynasty-desk-title"><h1 id="dynasty-desk-title">Commissioner console</h1><p role="status" aria-live="polite">Loading league status…</p></main>;
  return (
  <main aria-labelledby="dynasty-desk-title">
    <p>Organization play</p><h1 id="dynasty-desk-title">Commissioner console</h1>
    <p role="status" aria-live="polite">League phase: {summary.phase}</p>
    <p>Week {summary.matchWeek} · Deadline: {summary.deadline ?? 'not set'} · Resolver {summary.resolverVersion}</p>
    <section aria-labelledby="club-actions-title"><h2 id="club-actions-title">Club actions</h2><table><caption>Manager submission status</caption><thead><tr><th scope="col">Club</th><th scope="col">Manager</th><th scope="col">Status</th></tr></thead><tbody>{summary.clubs.map((club) => <tr key={club.clubId}><th scope="row">{club.clubId}</th><td>{club.managerName}</td><td>{club.status}</td></tr>)}</tbody></table></section>
    <section aria-labelledby="phase-actions-title"><h2 id="phase-actions-title">Advance the week</h2><button disabled={!summary.canManage || summary.phase !== 'open'} onClick={() => onPhaseAction('lock')}>Lock submissions</button><button disabled={!summary.canResolve} onClick={() => onPhaseAction('resolve')}>Resolve fixtures</button><button disabled={!summary.canManage || summary.phase !== 'resolving'} onClick={() => onPhaseAction('publish')}>Publish results</button></section>
    <section aria-labelledby="audit-title"><h2 id="audit-title">Recent events</h2><ol>{summary.auditEvents.map((event) => <li key={event.id}><strong>{event.type}</strong> — {event.message}</li>)}</ol></section>
  </main>
  );
};
