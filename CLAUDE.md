# Biosic Studios: Website

## Start here

- Project notes (goal, state, decisions, open questions, session log) are
  **private**: `projects/website/HANDOFF.md` in `Biosic-Studios/test`.
  Read it first if that repo is attached; update it (not this repo) at the
  end of a session.
- This repo is **public**. Keep it lean: only what the site needs to run.
  No planning notes, secrets, personal names/emails, DNS details or drafts.

## Rules

- The playable Hungerhold build is hosted on **itch.io**, never in this repo:
  its licensed music and art must not be redistributed as raw files in a
  public repo. Link to the itch.io page instead.
- Static HTML + one stylesheet (`site/assets/site.css`) + one script
  (`site/assets/site.js`). Reuse existing tokens and classes before adding new ones.
- Every page sets `--accent` (default logo blue; Hungerhold
  `style="--accent: var(--ember)"`, Larry `class="theme-sun"`).
- Header and footer are duplicated in every page and in
  `tools/game-page.template.html`; the checker fails if they drift.
- The header's "Levitating Larry" dropdown is a `<details class="menu">`
  (Levitating Larry, Levitating Larry Encore). It works without JS.
- New game: `node tools/new-game.mjs …` (see README). It relies on the
  `games:cards:end`, `games:list:end` (on `/games/`) and `footer:games:end`
  comment markers; keep them.
- Hungerhold copy leads with "Every life teaches the next." and calls the
  genre a kinlike / hand-me-down survival. It describes only what the live
  build does, with no dates for future things. Say "make"/"know-how" and
  "life", not "craft", "recipe" or "a run". No em or en dashes in visible
  text. The checker fails on retired lines and dashes (see `RETIRED` in
  `tools/check-site.mjs`).
- The v3.0 trailer plays from YouTube (`a.video[data-yt]`, click to play,
  youtube-nocookie) on `/hungerhold/#trailer`, with its required credits
  under it; keep them together. The MP4 in `site/hungerhold/media/` stays
  for the press-kit download.
- Screenshots and headers use only real captures from the game.
- Keep Hungerhold family-friendly: the 420 games stay off its page.
- Visit counts: GoatCounter, switched on by `STATS_CODE` in `site/assets/site.js`
  (no cookies, no personal data; also counts clicks to itch.io). If what we
  count ever changes, update `/privacy/` in the same PR.
- Contact is `partners@biosicstudios.com` via `mailto:` links with a
  subject. `/contact/?topic=<partner|business|ai|press|playtest|art>` preselects a topic
  (`playtest` is now "Hungerhold feedback"; the key stays so old links work).
- Before pushing: `node tools/check-site.mjs`, and preview at desktop and
  ~390px width with no horizontal scroll. Merging to `main` deploys.
