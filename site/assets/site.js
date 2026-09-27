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

// ---------- Image fallbacks ----------
// If a cover image fails to load, hide it so the styled title panel behind it shows.
document.querySelectorAll('.frame > img, .video > img').forEach((img) => {
  const markBroken = () => img.classList.add('is-broken');
  if (img.complete && img.naturalWidth === 0) markBroken();
  else img.addEventListener('error', markBroken, { once: true });
});

// ---------- Showcase slider (home) ----------
// A native scroll-snap strip (swipe works without JS). This adds tabs, arrows,
// keyboard control and a gentle auto-advance that stops as soon as anyone
// interacts, pauses on hover/focus/hidden tab, and never runs with reduced motion.
document.querySelectorAll('[data-showcase]').forEach((showcase) => {
  const track = showcase.querySelector('.showcase-track');
  const slides = [...track.querySelectorAll('.slide')];
  const tabs = [...showcase.querySelectorAll('.sc-tab')];
  const pauseBtn = showcase.querySelector('.sc-pause');
  const status = showcase.querySelector('.sc-status');
  const interval = parseFloat(getComputedStyle(showcase).getPropertyValue('--sc-interval')) * 1000 || 7000;
  let index = 0;
  let timer = 0;
  let lockUntil = 0; // ignore in-between slides while a button-driven scroll glides past them
  let stopped = reducedMotion.matches; // true once the visitor takes control
  const holds = new Set(); // temporary pauses: hover, focus, hidden tab

  const label = (i) => slides[i].dataset.title || `Slide ${i + 1}`;

  function render() {
    slides.forEach((slide, n) => slide.classList.toggle('is-active', n === index));
    tabs.forEach((tab, n) => tab.setAttribute('aria-current', String(n === index)));
    const playing = !stopped && holds.size === 0;
    showcase.classList.toggle('is-playing', playing);
    if (pauseBtn) {
      pauseBtn.setAttribute('aria-pressed', String(stopped));
      pauseBtn.setAttribute('aria-label', stopped ? 'Play slideshow' : 'Pause slideshow');
    }
    // Restart the tab's progress bar so it lines up with the timer.
    const bar = tabs[index]?.querySelector('.bar');
    if (bar && playing) { bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; }
    clearTimeout(timer);
    if (playing) timer = setTimeout(() => goTo(index + 1), interval);
  }

  function goTo(i, { byUser = false } = {}) {
    const target = (i + slides.length) % slides.length;
    lockUntil = reducedMotion.matches ? 0 : performance.now() + 900;
    track.scrollTo({ left: slides[target].offsetLeft, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    if (byUser) {
      stopped = true;
      if (status) status.textContent = `${label(target)}, ${target + 1} of ${slides.length}`;
    }
    index = target;
    render();
  }

  // Keep the active slide in sync with swipes and native scrolling.
  const observer = new IntersectionObserver((entries) => {
    if (performance.now() < lockUntil) return;
    for (const entry of entries) {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
        const n = slides.indexOf(entry.target);
        if (n !== index) { index = n; render(); }
      }
    }
  }, { root: track, threshold: [0.6] });
  slides.forEach((slide) => observer.observe(slide));

  // A swipe/drag/wheel on the strip means the visitor is in control.
  ['pointerdown', 'wheel', 'touchstart'].forEach((type) =>
    track.addEventListener(type, () => { if (!stopped) { stopped = true; render(); } }, { passive: true }));

  showcase.querySelector('.sc-prev')?.addEventListener('click', () => goTo(index - 1, { byUser: true }));
  showcase.querySelector('.sc-next')?.addEventListener('click', () => goTo(index + 1, { byUser: true }));
  tabs.forEach((tab, n) => tab.addEventListener('click', (event) => { event.preventDefault(); goTo(n, { byUser: true }); }));
  pauseBtn?.addEventListener('click', () => { stopped = !stopped; render(); });

  showcase.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    if (event.target.closest('input, textarea, select')) return;
    event.preventDefault();
    goTo(index + (event.key === 'ArrowRight' ? 1 : -1), { byUser: true });
  });

  const hold = (key, on) => { on ? holds.add(key) : holds.delete(key); render(); };
  showcase.addEventListener('pointerenter', () => hold('hover', true));
  showcase.addEventListener('pointerleave', () => hold('hover', false));
  showcase.addEventListener('focusin', () => hold('focus', true));
  showcase.addEventListener('focusout', (e) => { if (!showcase.contains(e.relatedTarget)) hold('focus', false); });
  document.addEventListener('visibilitychange', () => hold('hidden', document.hidden));
  new IntersectionObserver(([entry]) => hold('offscreen', !entry.isIntersecting), { threshold: 0.35 }).observe(showcase);
  reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) { stopped = true; render(); } });

  // Deep link: /#slide-levitating-larry opens that slide.
  const fromHash = slides.findIndex((s) => `#${s.id}` === location.hash);
  if (fromHash > 0) { track.scrollLeft = slides[fromHash].offsetLeft; index = fromHash; stopped = true; }
  render();
});

// ---------- Game filters ----------
document.querySelectorAll('[data-filters]').forEach((group) => {
  const grid = document.getElementById(group.dataset.filters);
  const cards = [...grid.querySelectorAll('.game-card')];
  const chips = [...group.querySelectorAll('.chip')];
  const count = group.querySelector('.count');
  chips.forEach((chip) => chip.addEventListener('click', () => {
    const want = chip.dataset.filter;
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
    let shown = 0;
    for (const card of cards) {
      const tags = (card.dataset.tags || '').split(/\s+/);
      const show = want === 'all' || tags.includes(want);
      card.hidden = !show;
      if (show && !tags.includes('soon')) shown++;
    }
    if (count) count.textContent = `${shown} game${shown === 1 ? '' : 's'}`;
  }));
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
