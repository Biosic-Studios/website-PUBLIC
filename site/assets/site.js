// Biosic Studios · small progressive enhancements. Every page works without this file.

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

// ---------- Click-to-play YouTube ----------
// The page shows a thumbnail link; the player (and YouTube's scripts) load only on click.
document.querySelectorAll('a.video[data-yt]').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    const frame = document.createElement('iframe');
    frame.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(link.dataset.yt)}?autoplay=1&rel=0`;
    frame.title = link.getAttribute('aria-label') || 'Video';
    frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.allowFullscreen = true;
    link.replaceChildren(frame);
    link.removeAttribute('href');
  });
});

// ---------- Click-to-play self-hosted video ----------
// Same idea for our own MP4s: nothing downloads until someone presses play.
// Without JS the link simply opens the MP4, which every browser can play.
document.querySelectorAll('a.video[data-mp4]').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    const video = document.createElement('video');
    video.src = link.dataset.mp4;
    video.poster = link.querySelector('img')?.currentSrc || '';
    video.controls = true;
    video.playsInline = true;
    video.setAttribute('aria-label', link.getAttribute('aria-label') || 'Video');
    link.replaceChildren(video);
    link.removeAttribute('href');
    video.play().catch(() => {});
    video.focus();
  }, { once: true });
});

// ---------- Image fallbacks ----------
// If a cover image fails to load, hide it so the styled title panel behind it shows.
document.querySelectorAll('.frame > img, .video > img').forEach((img) => {
  const markBroken = () => img.classList.add('is-broken');
  if (img.complete && img.naturalWidth === 0) markBroken();
  else img.addEventListener('error', markBroken, { once: true });
});

// ---------- Header dropdown (Levitating Larry) ----------
// A native <details>, so it opens and closes without JS. This closes it when
// you click or tab away, or press Escape (focus goes back to the button).
document.querySelectorAll('details.menu').forEach((menu) => {
  const summary = menu.querySelector('summary');
  const close = () => { menu.open = false; };
  document.addEventListener('click', (event) => { if (menu.open && !menu.contains(event.target)) close(); });
  menu.addEventListener('focusout', (event) => { if (event.relatedTarget && !menu.contains(event.relatedTarget)) close(); });
  menu.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu.open) { close(); summary.focus(); }
  });
});

// ---------- Copy to clipboard ----------
document.querySelectorAll('button[data-copy]').forEach((button) => {
  const original = button.textContent;
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.copy);
      button.textContent = 'Copied ✓';
    } catch {
      button.textContent = 'Press Ctrl/Cmd+C';
      const range = document.createRange();
      const target = button.previousElementSibling;
      if (target) { range.selectNodeContents(target); getSelection().removeAllRanges(); getSelection().addRange(range); }
    }
    button.classList.add('is-done');
    setTimeout(() => { button.textContent = original; button.classList.remove('is-done'); }, 2000);
  });
});

// ---------- Email composer (contact page) ----------
// Nothing is sent from the site: it builds the email and hands it to the
// visitor's own mail app, Gmail, or the clipboard.
document.querySelectorAll('form[data-composer]').forEach((form) => {
  const to = form.dataset.to;
  const { topic, name, company, message } = form.elements;
  const gmail = form.querySelector('[data-gmail]');
  const copyMessage = form.querySelector('[data-copy-message]');
  const query = (params) => Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');

  function compose() {
    const option = topic.selectedOptions[0];
    const who = name.value.trim();
    const sign = [who, company.value.trim()].filter(Boolean).join(', ');
    return {
      subject: `${option.dataset.subject}${who ? ` – ${who}` : ''}`,
      body: `${message.value.trim()}${sign ? `\n\n— ${sign}` : ''}`,
    };
  }
  function update() {
    const { subject, body } = compose();
    message.placeholder = topic.selectedOptions[0].dataset.prompt || '';
    if (gmail) gmail.href = `https://mail.google.com/mail/?view=cm&fs=1&${query({ to, su: subject, body })}`;
    if (copyMessage) copyMessage.dataset.copy = `To: ${to}\nSubject: ${subject}\n\n${body}`;
  }
  form.addEventListener('input', update);
  form.addEventListener('change', update);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const { subject, body } = compose();
    location.href = `mailto:${to}?${query({ subject, body })}`;
  });

  // "Write it here" on a topic card preselects that topic.
  document.querySelectorAll('[data-pick-topic]').forEach((button) => button.addEventListener('click', () => {
    topic.value = button.dataset.pickTopic;
    update();
    form.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
    message.focus({ preventScroll: true });
  }));

  // Deep link: /contact/?topic=ai
  const wanted = new URLSearchParams(location.search).get('topic');
  if (wanted && [...topic.options].some((o) => o.value === wanted)) topic.value = wanted;
  update();
});

// ---------- Visit counts (GoatCounter) ----------
// Anonymous page counts: no cookies, no personal data (see /privacy/).
// Set STATS_CODE to the GoatCounter site code (https://<code>.goatcounter.com).
// Empty = off. Previews on other hosts are never counted.
const STATS_CODE = 'biosicstudios';
if (STATS_CODE && location.hostname === 'biosicstudios.com') {
  const counter = document.createElement('script');
  counter.async = true;
  counter.src = 'https://gc.zgo.at/count.js';
  counter.dataset.goatcounter = `https://${STATS_CODE}.goatcounter.com/count`;
  document.head.append(counter);
  // Also count clicks out to itch.io (e.g. "itch/hungerhold") as events.
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href*="itch.io"]');
    if (!link || !window.goatcounter?.count) return;
    const slug = new URL(link.href).pathname.replace(/^\/|\/$/g, '') || 'home';
    window.goatcounter.count({ path: `itch/${slug}`, title: link.textContent.trim().slice(0, 60), event: true });
  });
}

// ---------- Back to top ----------
// A little astronaut appears once you've scrolled a bit, and beams you back up.
{
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'to-top';
  button.setAttribute('aria-label', 'Back to top');
  button.innerHTML = '<img src="/assets/brand/astronaut-80.webp" alt="" width="62" height="80">';
  document.body.append(button);
  const toggle = () => {
    const show = scrollY > 700;
    button.classList.toggle('is-visible', show);
    button.tabIndex = show ? 0 : -1;
    button.toggleAttribute('aria-hidden', !show);
  };
  addEventListener('scroll', toggle, { passive: true });
  toggle();
  button.addEventListener('click', () => {
    button.classList.add('is-beaming');
    scrollTo({ top: 0, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    setTimeout(() => button.classList.remove('is-beaming'), 600);
  });
}
