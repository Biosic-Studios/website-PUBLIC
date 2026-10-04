# biosicstudios.com

Source for the Biosic Studios website: plain HTML and CSS, no build step.
Every push to `main` is checked and published to GitHub Pages.

```
site/        everything the public sees (pages, styles, images)
tools/       check-site.mjs · new-game.mjs · game-page.template.html
.github/     deploy.yml (check + publish) · check.yml (runs on pull requests)
```

## Edit, preview, publish

```sh
python3 -m http.server 8000 -d site   # preview at http://localhost:8000
node tools/check-site.mjs             # broken links, page basics, sitemap, header/footer sync, retired lines
```

Open a pull request; merging to `main` publishes in about a minute.

## Add a game

```sh
node tools/new-game.mjs star-farm "Star Farm" "A cozy farming game on a drifting space station." --status dev --accent water
```

This creates `site/<slug>/index.html` and adds a card to the home page ("More from Biosic"), a section to the All games page (`/games/`), a link to every footer and an entry to the sitemap. Then:

1. Add the cover image at `site/<slug>/img/cover.png` (16:9, about 1280×720).
2. Fill in the remaining `{{PLACEHOLDERS}}` it lists. The checker won't pass until they're done.
3. Use `--status play` only once the game is **publicly** playable.

`--status` is `dev`, `play`, `classic` or `soon`. `--accent` is `ember`, `sun`, `leaf`, `water` or `sky-hi`.

A new **Levitating Larry** game also goes in the header's Larry dropdown (`<details class="menu">`). The header is copied into every page and the template, so change it everywhere; the checker fails until they match.

## Home page

1. **Flagship hero:** Hungerhold, the current version (`v2.2.1 · out now`) and what's next (`v3.0 · in the works`). Update the badges when a version ships.
2. **New in / Coming in** (`#new`): the latest Hungerhold update and the next one.
3. **More from Biosic** (`#games`): one card per game.
4. **Studio trailer** (`#trailer`) and **Work with us** (`#contact`).

`/games/` lists every game with its details (genre, where to play, price). Keep it in step with the home cards; the checker fails if a home card has no section there.

## Brand

- **Logo:** `site/assets/brand/`. The site uses the `.webp` files; the `.png` files are the press-kit downloads.
- **Colors:** space black (`#0E1116`) with logo blue (`#0084C4` / `#3FA9E6`) for the studio.
- **Game accents:** each page sets `--accent` (Hungerhold `var(--ember)`, Levitating Larry `theme-sun`), and links, buttons and highlights follow it.
- **Fonts:** Pixelify Sans for headings and buttons, Atkinson Hyperlegible Next for everything else.
- **Levitating Larry:** `site/levitating-larry/img/larry.png` is a tiny 22×29 sprite. Show it with the `.sprite` class (inside a `.frame.space-frame.warm`) so it scales up pixel-sharp.
- **Studio trailer:** `site/assets/video/` (MP4 + poster). It plays on the home page (`#trailer`, click to load) and is downloadable from the press kit.
- **Hungerhold:** the lead line is "Every life teaches the next.", then "Hand-me-down survival: one short life, one family that remembers." Say "make" and "know-how", not "craft"; no Maslow, and no "a world that reacts" or "breaks" as a headline. Screenshots are in `site/hungerhold/img/` (full size + `-640` thumbnails); `hero-*.webp` are the same shots cropped without the interface, for the big headers. The playable build lives on itch.io, not here.
- **Levitating Larry Encore:** `site/levitating-larry/encore/`, a coming-soon page. `encore-og.png` is its share card.

## Contact

partners@biosicstudios.com · https://biosicstudios.com/contact/
