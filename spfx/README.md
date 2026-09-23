# Dynasty Desk SPFx shell

This folder is the first React/SPFx host scaffold. It intentionally depends on the host-neutral contracts in `src/application/admin-summary.js` and `src/stores/spfx-client.js`; the web part should not copy league rules or SharePoint REST calls into React components.

## Local setup

The repository's offline HTML build does not install the Microsoft 365 toolchain. To turn this source scaffold into a deployable SPFx solution on a development machine:

1. Generate an SPFx React web part with the supported SharePoint Framework Yeoman generator.
2. Copy the `src/webparts/dynastyDesk` files into the generated solution.
3. Configure the `leagueId` web-part property; the scaffold loads `admin-service.js` through `createSharePointGameStore(createSpfxListClient(...), leagueId)`, renders loading/error states, and wires Lock submissions through `admin-commands.js`. The host-neutral `src/application/match-week-resolver.js` now defines the result-payload boundary; Resolve and Publish remain guarded until the tenant-backed club/fixture read and persistence command are connected.
4. Run the generated solution's normal `gulp build`, `gulp bundle --ship`, and `gulp package-solution --ship` checks.

The scaffold is deliberately checked as source shape in this repository, while the HTML prototype and domain tests remain runnable without a tenant or Microsoft 365 dependencies.
