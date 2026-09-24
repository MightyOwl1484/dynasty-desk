# Open-source reference policy

## Purpose

Open-source games help the project identify proven product patterns, avoid predictable architecture mistakes, and understand the expectations of management-game players. They do not automatically provide reusable code or assets.

## 99Managers Futsal Edition

Reference: <https://codeberg.org/dulvui/99managers-futsal-edition>

Useful high-level lessons include:

- Separate management data from match presentation.
- Offer both fast resolution and a visual match experience.
- Model competitors, teams, competitions, contracts, injuries, finances, and saves as distinct responsibilities.
- Use explicit state transitions for visual actors.
- Treat save migration, generated identities, localization, and controller navigation as product features.
- Keep platform export settings in version control.

## License boundary

99Managers source code is AGPL-3.0-or-later. Original assets are generally CC BY-SA 4.0, with additional third-party licenses recorded by that project. Its name is also a registered trademark.

Dynasty Desk remains Apache-2.0. Therefore contributors must not:

- Copy, translate, or mechanically port source code from 99Managers.
- Copy its scenes, UI layouts, text, data files, logos, names, or art.
- Present Dynasty Desk as an edition, fork, or endorsed derivative of 99Managers.
- Use reference code as the starting file and then modify it.

Contributors may independently implement general ideas such as deterministic results, event logs, state machines, inbox narratives, and save migrations. New implementations must use this project's terminology, domain model, tests, and style.

## Review record

When a contribution is materially informed by another project, its pull request should identify the reference, describe the general lesson used, and confirm that no code or assets were copied. This gives reviewers a practical clean-room audit trail.
