#!/usr/bin/env node
// Checks the static site in site/ before it ships. No dependencies.
//   node tools/check-site.mjs
// Fails (exit 1) on: leftover {{PLACEHOLDERS}}, missing page basics (title, description, favicon, ...),
// invalid JSON-LD/speculation rules, headers/footers out of sync, a game missing from the
// home slider/tabs/grid,
// internal links or images that point at nothing, #anchors that don't exist,
// and pages missing from (or dead entries in) sitemap.xml.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'site');
const ORIGIN = 'https://biosicstudios.com';
const isNoindex = (src) => /<meta name="robots" content="noindex/.test(src);

const problems = [];
const report = (file, msg) => problems.push(`${file}: ${msg}`);

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const p = path.join(dir, e.name);
  return e.isDirectory() ? walk(p) : [p];
});
const pages = walk(ROOT).filter((f) => f.endsWith('.html')).map((f) => path.relative(ROOT, f).split(path.sep).join('/'));
const html = Object.fromEntries(pages.map((p) => [p, fs.readFileSync(path.join(ROOT, p), 'utf8')]));

const idsIn = (src) => new Set([...src.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
const has = (src, re) => re.test(src);

// Map a URL path ("/", "/hungerhold/", "/assets/site.css") to a file under site/.
function resolveTarget(fromPage, ref) {
  const clean = ref.split('#')[0].split('?')[0];
  let rel;
  if (clean === '') rel = fromPage;
  else if (clean.startsWith('/')) rel = clean.slice(1);
  else rel = path.posix.normalize(path.posix.join(path.posix.dirname(fromPage), clean));
  if (rel === '' || rel.endsWith('/')) rel += 'index.html';
  else if (!path.posix.extname(rel) && fs.existsSync(path.join(ROOT, rel)) && fs.statSync(path.join(ROOT, rel)).isDirectory()) rel += '/index.html';
  return rel;
}

for (const page of pages) {
  const src = html[page];
  const is404 = page === '404.html';

  // Page basics
  const leftover = src.match(/\{\{[^}]*\}\}/);
  if (leftover) report(page, `unfilled template placeholder: ${leftover[0]}`);
  if (!has(src, /<html[^>]*\slang="/)) report(page, 'missing <html lang>');
  if (!has(src, /<title>[^<]{3,}<\/title>/)) report(page, 'missing <title>');
  if (!has(src, /<meta name="viewport"/)) report(page, 'missing viewport meta');
  if (!has(src, /<meta name="description" content="[^"]{20,}"/)) report(page, 'missing or too-short meta description');
  if (!has(src, /<link rel="icon"/)) report(page, 'missing favicon <link rel="icon">');
  if (!has(src, /href="\/assets\/site\.css"/)) report(page, 'not using /assets/site.css');
  if (!is404) {
    if (!has(src, /<link rel="canonical" href="https:\/\/biosicstudios\.com\/[^"]*"/)) report(page, 'missing canonical link');
    if (!has(src, /<meta property="og:image" content="https:\/\/[^"]+"/)) report(page, 'missing og:image (absolute URL)');
    if (!has(src, /<meta property="og:title"/)) report(page, 'missing og:title');
    if (!has(src, /<h1[\s>]/)) report(page, 'missing <h1>');
  }
  for (const m of src.matchAll(/<img\b[^>]*>/g)) {
    if (!/\salt="/.test(m[0])) report(page, `image without alt: ${m[0].slice(0, 80)}`);
  }
  // Structured data and speculation rules must be valid JSON, or browsers silently ignore them.
  for (const m of src.matchAll(/<script type="(application\/ld\+json|speculationrules)">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(m[2]); } catch (e) { report(page, `invalid JSON in <script type="${m[1]}">: ${e.message}`); }
  }

  // Internal links, assets and anchors
  for (const m of src.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const ref = m[1];
    if (/^(https?:|mailto:|tel:|data:|javascript:)/.test(ref)) continue;
    const target = resolveTarget(page, ref);
    if (!fs.existsSync(path.join(ROOT, target))) { report(page, `broken link: ${ref}`); continue; }
    const hash = ref.includes('#') ? ref.split('#')[1] : '';
    if (hash && target.endsWith('.html') && !idsIn(html[target] ?? '').has(hash)) report(page, `missing anchor: ${ref}`);
  }
}

// Shared header/footer: identical on every page (the header may only differ by aria-current).
const block = (src, re) => (src.match(re) || [''])[0];
const headerOf = (src) => block(src, /<header class="site-header">[\s\S]*?<\/header>/).replace(/ aria-current="page"/g, '');
const footerOf = (src) => block(src, /<footer class="site-footer">[\s\S]*?<\/footer>/);
for (const page of pages) {
  if (headerOf(html[page]) !== headerOf(html['index.html'])) report(page, 'site header differs from the home page (keep headers in sync)');
  if (footerOf(html[page]) !== footerOf(html['index.html'])) report(page, 'site footer differs from the home page (keep footers in sync)');
}

// Home: every game has a slide, a slider tab and a grid card.
const home = html['index.html'];
const setOf = (re) => new Set([...home.matchAll(re)].map((m) => m[1]));
const slides = setOf(/<article class="slide" id="slide-([^"]+)" data-game="\1"/g);
const tabs = setOf(/<a class="sc-tab" href="#slide-([^"]+)"/g);
const cards = setOf(/<article class="game-card[^"]*" data-game="([^"]+)"/g);
for (const g of new Set([...slides, ...tabs, ...cards])) {
  if (!slides.has(g)) report('index.html', `game "${g}" has no slider slide (id="slide-${g}" data-game="${g}")`);
  if (!tabs.has(g)) report('index.html', `game "${g}" has no slider tab (href="#slide-${g}")`);
  if (!cards.has(g)) report('index.html', `game "${g}" has no card in the games grid`);
}

// Sitemap: every public page listed, every entry real.
const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
const listed = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
for (const loc of listed) {
  if (!loc.startsWith(ORIGIN + '/')) { report('sitemap.xml', `not on ${ORIGIN}: ${loc}`); continue; }
  if (!fs.existsSync(path.join(ROOT, resolveTarget('index.html', loc.slice(ORIGIN.length))))) report('sitemap.xml', `dead entry: ${loc}`);
}
for (const page of pages) {
  const url = `${ORIGIN}/${page.replace(/index\.html$/, '')}`;
  if (page === '404.html' || isNoindex(html[page])) {
    if (listed.has(url)) report('sitemap.xml', `noindex page should not be listed: ${url}`);
    continue;
  }
  if (!listed.has(url)) report('sitemap.xml', `page not listed: ${url}`);
}

const unique = [...new Set(problems)];
if (unique.length) {
  console.error(`✗ ${unique.length} problem(s):\n  ` + unique.join('\n  '));
  process.exit(1);
}
console.log(`✓ site/ looks good: ${pages.length} pages checked, ${slides.size} slider games, ${listed.size} sitemap entries.`);
