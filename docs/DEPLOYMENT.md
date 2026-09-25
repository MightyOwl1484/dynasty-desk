# Web deployment

Dynasty Desk: Arena targets Godot 4.7.2's single-threaded Web Compatibility export for desktop browsers. The browser build is static and can be hosted without a game server. Mobile texture compression remains disabled until a later mobile-browser validation pass enables the matching ETC2/ASTC imports.

## Continuous integration artifact

Every validation run installs the matching Godot export templates, runs the headless tests, creates `build/web`, verifies the core export files, and uploads a `dynasty-desk-arena-web` artifact. This gives reviewers a downloadable build before a branch reaches `main`.

Generated WebAssembly and package files remain under the ignored `build/` directory and must not be committed.

After downloading and extracting the artifact, serve it over HTTP rather than opening `index.html` directly:

```powershell
python -m http.server 8000 --directory build/web
```

Then open `http://localhost:8000`.

## GitHub Pages

The `Deploy Godot game to GitHub Pages` workflow builds and publishes the game when relevant files reach `main`. It can also be started manually from the Actions tab.

One repository setting is required before the first deployment:

1. Open **Settings → Pages** in GitHub.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Run the deployment workflow or merge a game change into `main`.

The workflow uses GitHub's short-lived Pages identity token. It does not require a personal access token or a committed secret.

## Local release build

Install Godot 4.7.2 and its export templates, then run from the repository root:

```powershell
New-Item -ItemType Directory -Force build/web
godot --headless --path game --export-release Web ../build/web/index.html
New-Item -ItemType File -Force build/web/.nojekyll
python -m http.server 8000 --directory build/web
```

## Release check

Before advertising a build:

- Confirm the House, opponent, and lineup controls work with keyboard only.
- Play, pause, speed up, skip, and replay one bout.
- Check reduced-motion and text-only presentation.
- Complete a week, refresh the page, and confirm the next-week briefing, competitor condition, and standings resume correctly.
- Reset the career and confirm a fresh House can be selected.
- Test current Chrome, Edge, and Firefox releases at desktop width.
- Record browser-specific failures in a GitHub issue before release.
