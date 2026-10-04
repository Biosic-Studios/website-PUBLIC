#!/usr/bin/env node
// Adds a new game to the site in one step. No dependencies.
//
//   node tools/new-game.mjs <slug> "<Name>" "<one-line pitch>" [--status dev|play|classic|soon] [--accent ember|sun|leaf|water|sky-hi]
//   node tools/new-game.mjs star-farm "Star Farm" "A cozy farming game on a drifting space station." --status dev --accent water
//
// It creates site/<slug>/index.html from tools/game-page.template.html, then adds a
// card to the home page's "More from Biosic" grid, a link to every footer, and an
// entry to sitemap.xml. Anything it can't know (cover art, features, links) is left as a
// {{PLACEHOLDER}} that tools/check-site.mjs flags until you fill it in.
import fs from 'node:fs';
import path from 'node:path';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SITE = path.join(REPO, 'site');
const TEMPLATE = path.join(REPO, 'tools', 'game-page.template.html');

const STATUS = {
  dev: '<span class="badge dev">In development</span>',
  play: '<span class="badge live">Play free</span>',
  classic: '<span class="badge classic">Classic</span>',
  soon: '<span class="badge soon">Coming soon</span>',
};
const ACCENTS = ['ember', 'sun', 'leaf', 'water', 'sky-hi'];

function fail(msg) {
  console.error(`✗ ${msg}\n\nUsage: node tools/new-game.mjs <slug> "<Name>" "<one-line pitch>" [--status ${Object.keys(STATUS).join('|')}] [--accent ${ACCENTS.join('|')}]`);
  process.exit(1);
}

// ---- Arguments
const args = process.argv.slice(2);
const opts = { status: 'dev', accent: 'ember' };
const positional = [];
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) opts[args[i].slice(2)] = args[++i];
  else positional.push(args[i]);
}
const [slug, name, pitch] = positional;
if (!slug || !name || !pitch) fail('Need a slug, a name and a one-line pitch.');
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) fail(`Slug "${slug}" must be lowercase letters/numbers with dashes, e.g. star-farm.`);
if (!STATUS[opts.status]) fail(`Unknown --status "${opts.status}".`);
if (!ACCENTS.includes(opts.accent)) fail(`Unknown --accent "${opts.accent}".`);
if (fs.existsSync(path.join(SITE, slug))) fail(`site/${slug}/ already exists.`);
if (pitch.length < 20) fail('Make the pitch at least 20 characters; it doubles as the Google description.');

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const NAME = esc(name);
const CAPS = esc(name.toUpperCase());
const PITCH = esc(pitch);
const accent = `var(--${opts.accent})`;
const badge = STATUS[opts.status];
const cover = `/${slug}/img/cover.png`;

// Insert `block` on its own line just above the line containing `marker`.
function insertAbove(file, marker, block) {
  const text = fs.readFileSync(file, 'utf8');
  const at = text.indexOf(marker);
  if (at === -1) fail(`Marker "${marker}" not found in ${path.relative(REPO, file)}.`);
  const lineStart = text.lastIndexOf('\n', at) + 1;
  const indent = text.slice(lineStart, at).match(/^\s*/)[0];
  const lines = block.split('\n').map((l) => (l ? indent + l : l)).join('\n');
  fs.writeFileSync(file, text.slice(0, lineStart) + lines + '\n' + text.slice(lineStart));
}

// ---- 1. The page
let page = fs.readFileSync(TEMPLATE, 'utf8')
  .replace(/<!--\s*NEW GAME PAGE TEMPLATE[\s\S]*?-->\n/, '')
  .replaceAll('{{SLUG}}', slug)
  .replaceAll('{{GAME_NAME_IN_CAPS}}', CAPS)
  .replaceAll('{{GAME_NAME}}', NAME)
  .replaceAll('{{SHORT_PITCH}}', PITCH.length > 60 ? PITCH.slice(0, 57).trimEnd() + '…' : PITCH)
  .replaceAll('{{ONE_OR_TWO_SENTENCES_FOR_GOOGLE}}', `${NAME}: ${PITCH}`)
  .replaceAll('{{SHARE_CARD_TEXT}}', PITCH)
  .replaceAll('{{ONE_LINE_HOOK}}', PITCH)
  .replaceAll('{{COVER_FILE}}', 'cover.png')
  .replaceAll('{{ACCENT}}', accent);
fs.mkdirSync(path.join(SITE, slug, 'img'), { recursive: true });
fs.writeFileSync(path.join(SITE, slug, 'index.html'), page);

// ---- 2. Home: a card in the "More from Biosic" grid
const home = path.join(SITE, 'index.html');
insertAbove(home, '<!-- games:cards:end', `<article class="game-card" data-game="${slug}" style="--accent: ${accent}">
  <a class="frame-link" href="/${slug}/" tabindex="-1" aria-hidden="true">
    <div class="frame">
      <span class="fallback">${CAPS}</span>
      <img src="${cover}" loading="lazy" decoding="async" alt="">
    </div>
  </a>
  <div class="body">
    <div class="badges">${badge}</div>
    <h3>${NAME}</h3>
    <p class="muted">${PITCH}</p>
    <div class="links"><a href="/${slug}/">See ${NAME} →</a></div>
  </div>
</article>
`);

// ---- 3. Footers (every page + the template)
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const footerFiles = [...walk(SITE).filter((f) => f.endsWith('.html')), TEMPLATE]
  .filter((f) => fs.readFileSync(f, 'utf8').includes('<!-- footer:games:end -->'));
for (const f of footerFiles) insertAbove(f, '<!-- footer:games:end -->', `<li><a href="/${slug}/">${NAME}</a></li>`);

// ---- 4. Sitemap
const sitemap = path.join(SITE, 'sitemap.xml');
fs.writeFileSync(sitemap, fs.readFileSync(sitemap, 'utf8')
  .replace('</urlset>', `  <url><loc>https://biosicstudios.com/${slug}/</loc></url>\n</urlset>`));

// ---- 5. What's left
const left = [...new Set(page.match(/\{\{[^}]+\}\}/g) || [])];
console.log(`✓ Added ${name}:
  • site/${slug}/index.html (new page)
  • a card on the home page (More from Biosic)
  • footer link on ${footerFiles.length} files, sitemap entry

Next:
  1. Put the cover image at site/${slug}/img/cover.png (16:9, ~1280×720).
  2. Fill in the ${left.length} remaining placeholders in site/${slug}/index.html:
     ${left.join(', ')}
     (delete the trailer section if there's no video yet)
  3. Point the home card's link at a store or play link if it has one.
  4. node tools/check-site.mjs, then preview: python3 -m http.server 8000 -d site`);
