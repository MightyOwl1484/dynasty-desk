export type AdminPhase = 'setup' | 'open' | 'locked' | 'resolving' | 'published' | 'complete';

export interface IAdminClubStatus { clubId: string; managerName: string; status: string; submittedAt: string | null; }
export interface IAdminSummary {
  leagueId: string;
  phase: AdminPhase;
  matchWeek: number;
  deadline: string | null;
  resolverVersion: string;
  canManage: boolean;
  canResolve: boolean;
  clubs: IAdminClubStatus[];
  submittedCount: number;
  auditEvents: Array<{ id: string; type: string; timestamp: string; message: string }>;
}
export interface IDynastyDeskProps { summary?: IAdminSummary; loadingError?: string; onPhaseAction: (action: 'lock' | 'resolve' | 'publish') => Promise<void> | void; }
