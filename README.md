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
node tools/check-site.mjs             # broken links, page basics, sitemap, slider/footer consistency
```

Open a pull request; merging to `main` publishes in about a minute.

## Add a game

```sh
node tools/new-game.mjs star-farm "Star Farm" "A cozy farming game on a drifting space station." --status dev --accent water
```

This creates `site/<slug>/index.html` and adds the game to the home slider, the game grid, every footer and the sitemap. Then:

1. Add the cover image at `site/<slug>/img/cover.png` (16:9, about 1280×720).
2. Fill in the remaining `{{PLACEHOLDERS}}` it lists. The checker won't pass until they're done.
3. Tag the card `play` only once the game is **publicly** playable. Gated games get a "request access" email link instead.

`--status` is `dev`, `play`, `classic` or `soon`. `--accent` is `ember`, `sun`, `leaf`, `water` or `sky-hi`.

## Brand

- **Logo:** `site/assets/brand/`. The site uses the `.webp` files; the `.png` files are the press-kit downloads.
- **Colors:** space black (`#0E1116`) with logo blue (`#0084C4` / `#3FA9E6`) for the studio.
- **Game accents:** each page sets `--accent` (Hungerhold `var(--ember)`, Levitating Larry `theme-sun`), and links, buttons and highlights follow it.
- **Fonts:** Pixelify Sans for headings and buttons, Atkinson Hyperlegible Next for everything else.

## Contact

partners@biosicstudios.com · https://biosicstudios.com/contact/
