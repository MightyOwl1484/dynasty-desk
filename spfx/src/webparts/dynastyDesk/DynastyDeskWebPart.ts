import * as React from 'react';
import * as ReactDom from 'react-dom';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { DynastyDesk } from './components/DynastyDesk';
import { IAdminSummary, IDynastyDeskProps } from './components/IDynastyDeskProps';

export interface IDynastyDeskWebPartProps { summaryJson: string; }
export default class DynastyDeskWebPart extends BaseClientSideWebPart<IDynastyDeskWebPartProps> {
  public render(): void {
    const summary = JSON.parse(this.properties.summaryJson || '{}') as IAdminSummary;
    const props: IDynastyDeskProps = { summary, onPhaseAction: (action) => this.context.statusRenderer.displayLoadingIndicator(this.domElement, `Preparing to ${action}…`) };
    ReactDom.render(React.createElement(DynastyDesk, props), this.domElement);
  }
  protected onDispose(): void { ReactDom.unmountComponentAtNode(this.domElement); }
}
