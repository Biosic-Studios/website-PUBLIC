# Biosic Studios: Website

## Start here

- Project notes (goal, state, decisions, open questions, session log) are
  **private**: `projects/website/HANDOFF.md` in `Biosic-Studios/test`.
  Read it first if that repo is attached; update it (not this repo) at the
  end of a session.
- This repo is **public**. Keep it lean: only what the site needs to run.
  No planning notes, secrets, personal names/emails, DNS details or drafts.

## Rules

- The Hungerhold prototype is **gated**. Never publish a playable build here
  without the owner's explicit OK; link "request playtest access" emails
  instead.
- Static HTML + one stylesheet (`site/assets/site.css`) + one script
  (`site/assets/site.js`). Reuse existing tokens and classes before adding new ones.
- Every page sets `--accent` (default logo blue; Hungerhold
  `style="--accent: var(--ember)"`, Larry `class="theme-sun"`).
- Header and footer are duplicated in every page and in
  `tools/game-page.template.html`; the checker fails if they drift.
- New game: `node tools/new-game.mjs …` (see README). It relies on the
  `showcase:slides:end`, `showcase:tabs:end`, `games:cards:end` and
  `footer:games:end` comment markers; keep them.
- Contact is `partners@biosicstudios.com` via `mailto:` links with a
  subject. `/contact/?topic=<partner|business|ai|press|playtest|art>` preselects a topic.
- Before pushing: `node tools/check-site.mjs`, and preview at desktop and
  ~390px width with no horizontal scroll. Merging to `main` deploys.
