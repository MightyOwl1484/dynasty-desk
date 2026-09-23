import * as React from 'react';
import * as ReactDom from 'react-dom';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { SPHttpClient } from '@microsoft/sp-http';
import { DynastyDesk } from './components/DynastyDesk';
import { IAdminSummary, IDynastyDeskProps } from './components/IDynastyDeskProps';
import { loadAdminSummary } from '../../../../src/application/admin-service';
import { createSharePointGameStore } from '../../../../src/stores/sharepoint';
import { createSpfxListClient } from '../../../../src/stores/spfx-client';
import { ROLES } from '../../../../src/domain/permissions';

export interface IDynastyDeskWebPartProps { leagueId: string; }
export default class DynastyDeskWebPart extends BaseClientSideWebPart<IDynastyDeskWebPartProps> {
  private summary?: IAdminSummary;
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
      this.summary = await loadAdminSummary(store, ROLES.COMMISSIONER) as IAdminSummary;
    } catch (error) {
      this.loadingError = error instanceof Error ? error.message : 'Unknown SharePoint error.';
    }
    this.render();
  }

  public render(): void {
    const props: IDynastyDeskProps = { summary: this.summary, loadingError: this.loadingError, onPhaseAction: async (action) => { this.context.statusRenderer.displayLoadingIndicator(this.domElement, `Preparing to ${action}…`); } };
    ReactDom.render(React.createElement(DynastyDesk, props), this.domElement);
  }
  protected onDispose(): void { ReactDom.unmountComponentAtNode(this.domElement); }
}
