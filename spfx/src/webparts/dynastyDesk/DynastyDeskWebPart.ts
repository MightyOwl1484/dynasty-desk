import * as React from 'react';
import * as ReactDom from 'react-dom';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { SPHttpClient } from '@microsoft/sp-http';
import { DynastyDesk } from './components/DynastyDesk';
import { IAdminSummary, IDynastyDeskProps } from './components/IDynastyDeskProps';
import { loadAdminContext } from '../../../../src/application/admin-service';
import { createLockPlan, persistLockPlan, persistResolutionPlan } from '../../../../src/application/admin-commands';
import { createResolutionPlan } from '../../../../src/application/match-week-resolver';
import { createSharePointGameStore } from '../../../../src/stores/sharepoint';
import { createSpfxListClient } from '../../../../src/stores/spfx-client';
import { ROLES } from '../../../../src/domain/permissions';

export interface IDynastyDeskWebPartProps { leagueId: string; }
export default class DynastyDeskWebPart extends BaseClientSideWebPart<IDynastyDeskWebPartProps> {
  private summary?: IAdminSummary;
  private adminContext?: any;
  private store?: any;
  private loadingError?: string;

  public async onInit(): Promise<void> {
    await super.onInit();
    await this.refreshSummary();
  }

  private async refreshSummary(): Promise<void> {
    this.loadingError = undefined;
    try {
      const client = createSpfxListClient({
        spHttpClient: this.context.spHttpClient,
        configuration: SPHttpClient.configurations.v1,
        webAbsoluteUrl: this.context.pageContext.web.absoluteUrl
      });
      const store = createSharePointGameStore(client, this.properties.leagueId);
      this.store = store;
      this.adminContext = await loadAdminContext(store, ROLES.COMMISSIONER);
      this.summary = this.adminContext?.summary as IAdminSummary;
    } catch (error) {
      this.loadingError = error instanceof Error ? error.message : 'Unknown SharePoint error.';
    }
    this.render();
  }

  public render(): void {
    const props: IDynastyDeskProps = { summary: this.summary, loadingError: this.loadingError, onPhaseAction: async (action) => {
      if (!this.adminContext || !this.store) throw new Error('League context is not loaded.');
      const actionLabel = action === 'lock' ? 'Locking submissions…' : action === 'resolve' ? 'Resolving fixtures…' : 'Preparing publication…';
      this.context.statusRenderer.displayLoadingIndicator(this.domElement, actionLabel);
      if (action === 'lock') {
        const plan = createLockPlan({ league: this.adminContext.league, actions: this.adminContext.actions, leagueRecord: this.adminContext.leagueRecord, actionRecords: this.adminContext.actionRecords, actorId: this.context.pageContext.user.loginName, lockedAt: new Date().toISOString() });
        await persistLockPlan(this.store, plan);
      } else if (action === 'resolve') {
        const plan = createResolutionPlan({ league: this.adminContext.league, fixtures: this.adminContext.fixtures, clubsById: this.adminContext.clubsById, actions: this.adminContext.actions, actorId: this.context.pageContext.user.loginName, resolvedAt: new Date().toISOString() });
        await persistResolutionPlan(this.store, { ...plan, leagueRecord: this.adminContext.leagueRecord });
      } else {
        throw new Error('Publish awaits durable pending-result storage so a page reload cannot lose the resolved payload.');
      }
      await this.refreshSummary();
    } };
    ReactDom.render(React.createElement(DynastyDesk, props), this.domElement);
  }
  protected onDispose(): void { ReactDom.unmountComponentAtNode(this.domElement); }
}
