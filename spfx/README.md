# Dynasty Desk SPFx shell

This folder is the first React/SPFx host scaffold. It intentionally depends on the host-neutral contracts in `src/application/admin-summary.js` and `src/stores/spfx-client.js`; the web part should not copy league rules or SharePoint REST calls into React components.

## Local setup

The repository's offline HTML build does not install the Microsoft 365 toolchain. To turn this source scaffold into a deployable SPFx solution on a development machine:

1. Generate an SPFx React web part with the supported SharePoint Framework Yeoman generator in a separate working directory. Keep the generated package files out of this offline prototype until the tenant's supported toolchain is selected.
2. Copy the `src/webparts/dynastyDesk` files into the generated solution and wire the relative host-neutral imports to the repository source or a package copy.
3. Configure the `leagueId` web-part property; the scaffold loads `admin-service.js` through `createSharePointGameStore(createSpfxListClient(...), leagueId)`, renders loading/error states, and wires Lock, Resolve, and Publish through `admin-commands.js`. Resolve persists a pending `ResolutionRuns` snapshot; Publish appends immutable results and marks that run published.
4. Provision the lists and indexes from [`sharepoint-schema.json`](sharepoint-schema.json), then test with a non-production SharePoint site and least-privilege groups.
5. Run the generated solution's normal `gulp build`, `gulp bundle --ship`, and `gulp package-solution --ship` checks. Run this repository's `node scripts/check-spfx-deployment.mjs` afterward; it will validate the generated package when `spfx/package.json` exists and otherwise confirms the source-only state.

The repository deliberately does not claim to contain a deployable `.sppkg` until these generated-solution and tenant checks have been completed.

The scaffold is deliberately checked as source shape in this repository, while the HTML prototype and domain tests remain runnable without a tenant or Microsoft 365 dependencies.
