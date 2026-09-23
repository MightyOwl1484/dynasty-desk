import * as React from 'react';
import * as ReactDom from 'react-dom';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { SPHttpClient } from '@microsoft/sp-http';
import { DynastyDesk } from './components/DynastyDesk';
import { IAdminSummary, IDynastyDeskProps } from './components/IDynastyDeskProps';
import { loadAdminContext } from '../../../../src/application/admin-service';
import { createLockPlan, persistLockPlan } from '../../../../src/application/admin-commands';
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
      if (action !== 'lock') throw new Error('Resolve and publish commands require the result payload service.');
      if (!this.adminContext || !this.store) throw new Error('League context is not loaded.');
      this.context.statusRenderer.displayLoadingIndicator(this.domElement, 'Locking submissions…');
      const plan = createLockPlan({ league: this.adminContext.league, actions: this.adminContext.actions, leagueRecord: this.adminContext.leagueRecord, actionRecords: this.adminContext.actionRecords, actorId: this.context.pageContext.user.loginName, lockedAt: new Date().toISOString() });
      await persistLockPlan(this.store, plan);
      await this.refreshSummary();
    } };
    ReactDom.render(React.createElement(DynastyDesk, props), this.domElement);
  }
  protected onDispose(): void { ReactDom.unmountComponentAtNode(this.domElement); }
}
