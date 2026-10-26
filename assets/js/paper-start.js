// The paper first screen shared by the home and the subject hubs (design plan §6.3, after Cartier's home; the chapters'
// overture and frame, so every page opens the way the chapters do). One sheet of paper, the frame on its edges, a title
// in the lower third and, in the middle, chapters as small globes drawn in their subject's ink, as Cartier lays out its
// stones. With several subjects (the home) scrolling holds each subject's row, then the next one comes up; with one
// (a hub) its row holds alone. Then the ink floods the paper into the stage's night and the page's own sections follow.
//   overture  the paper loader's mark draws its ring; the title is born in the middle at 1.5×, its words sharpen, and
//             at 1.75 s it glides home while the wordmark settles; once the title has passed, the globes come in
//             (a short version within 12 hours, or always on a hub; reduced motion gets no blur, glide or slide)
//   a globe   a hover (or focus) blooms its ink round it and names it above the title; a click glides it to where
//             the chapter's paper globe stands and opens the chapter
// The page's HTML (tools/pages.py, paper_screen) has the loader, the stage, the rows, the "Discover" line and the
// lock-up; this module fills and moves them.
import { $, gsap, lenis, reduced, store, esc } from './core.js';
import { words, blurIn, blurOut, hold, DUR } from './motion.js';
import { createFrame } from './frame.js';

// subjects: rows of globes (site.js subjects); rings: [{ name }] on the right with onRing(k) and ringAt(y, flood) for
// the lit one; label(k): the line under the title for subject k ({ text, href }); key: the store key for the short
// version; short: always the short version; hint(): where "Scroll to begin" goes; flood: the flood's length and rise: how
// far into the next screen the page's sections already stand when it ends (both in screen heights)
export function paperStart({ subjects: SUBJ, rings, onRing, ringAt, label: labelOf, key = 'overture-home', short: alwaysShort = false, hint: onHint, flood: FLOOD = 0.8, rise = 0.55 }) {
  const root = document.documentElement;
  root.dataset.theme = 'dark'; // paper, then the dark stage, as the chapters are
  root.classList.add('has-ov', 'is-paper', 'has-paper');
  const fr = createFrame({ data: { lockup: { sub: 'I&S revision' }, ink: '#2b2d33' }, parts: rings, goTo: k => onRing(k), base: '', home: true });
  const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const BLOOM = 0.55;         // a hovered globe's ink, in globe radii beyond its edge (clear of its neighbour)
  const HOLD = 0.35, MOVE = 0.8; // per subject, in screen heights: the row holds, then the next one comes up


  // ── the rows: one link per chapter, laid over its globe (the canvas draws the globe; the link is what is pressed) ──
  const rowsEl = $('[data-home-rows]'), discover = $('[data-home-discover]'), label = $('[data-home-label]');
  const lock = $('[data-ov-lock]'), title = $('[data-ov-title]'), wordsEl = $('[data-home-words]');
  const objs = [];
  rowsEl.innerHTML = SUBJ.map((s, k) => `<div class="hm__row" data-row="${k}" role="group" aria-label="${esc(s.name)} chapters">${s.chapters.map((c, i) =>
    `<a class="hm__obj" href="${c.href}" data-key="${k}-${i}" style="--ink:${s.ink}"><span class="hm__t">${esc(c.title)}</span><span class="hm__n fr-ui">${esc(s.name)} · ${esc(c.note)}</span></a>`).join('')}</div>`).join('');
  SUBJ.forEach((s, k) => s.chapters.forEach((c, i) => objs.push({ key: `${k}-${i}`, k, i, s, c, el: $(`[data-key="${k}-${i}"]`), x: 0, y: 0, r: 0, a: 0, exit: null })));

  // the title's size: Cartier's rule, never wider than 40% of a landscape screen (86% of a portrait one)
  const fit = () => {
    lock.style.removeProperty('--t');
    const w = title.getBoundingClientRect().width, max = innerWidth * (innerWidth < innerHeight ? 0.86 : 0.4);
    lock.style.setProperty('--t', parseFloat(getComputedStyle(title).fontSize) * Math.min(1, max / w) + 'px');
    $('[data-home]').style.setProperty('--lock-h', lock.offsetHeight + 'px');
  };
  fit(); document.fonts?.ready.then(fit);

  // ── where things are ──
  let W = innerWidth, Hh = innerHeight, phone = W <= 760;
  const total = () => (SUBJ.length - 1) * (HOLD + MOVE) + HOLD + FLOOD;
  function size() {
    W = innerWidth; Hh = innerHeight; phone = W <= 760;
    $('[data-home]').style.height = `${(total() + rise) * Hh}px`; // the page's sections rise while the flood ends
    fit();
  }
  size();
  // a subject's row at rest: its globes side by side, a little above the middle (Cartier's stones sit at 42%)
  function rest(k) {
    const n = SUBJ[k].chapters.length;
    const r = phone ? Math.min(W * 0.17, Hh * 0.1) * (n === 1 ? 1.25 : 1) : Math.min(Hh * 0.115, W * 0.08) * (n === 1 ? 1.2 : 1);
    const gap = r * 2 * 1.4, y = Hh * (phone ? 0.41 : 0.4);
    return SUBJ[k].chapters.map((_, i) => ({ x: W / 2 + (i - (n - 1) / 2) * gap, y, r }));
  }
  // scroll → s (0 … subjects − 1, eased between holds) and the flood (0 … 1)
  function stateAt(y) {
    const u = y / Hh, step = HOLD + MOVE, last = SUBJ.length - 1;
    let s = last, flood = 0;
    if (u < last * step + HOLD) {
      const k = Math.floor(u / step), t = (u - k * step - HOLD) / MOVE;
      s = Math.min(last, k + (t <= 0 ? 0 : smooth(0, 1, t)));
    } else flood = smooth(0, 1, (u - last * step - HOLD) / FLOOD);
    return { s, flood };
  }
  const holdY = k => (k * (HOLD + MOVE) + HOLD * 0.5) * Hh;
  function goSubject(k) {
    if (lenis) lenis.scrollTo(holdY(k), { duration: 1.6, easing: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2) });
    else scrollTo({ top: holdY(k), behavior: reduced ? 'auto' : 'smooth' });
  }

  // ── the stage ──
  let home = null;
  const intro = { a: reduced ? 1 : 0, r: reduced ? 1 : 0.9 };
  const ring = $('[data-ov-ring]'), loader = $('[data-loader]');
  const progress = v => { if (ring) ring.style.strokeDashoffset = String(1 - v); };
  progress(0.15);
  const stageReady = import('./home-world.js').then(({ createHome }) => {
    progress(0.6);
    home = createHome($('[data-home-stage]'), { phone, reduced });
    if (!home) { root.classList.add('no-webgl'); return; }
    objs.forEach(o => { const g = o.c.globe || { lat: 20, lon: 10 }; home.add({ key: o.key, lat: g.lat, lon: g.lon, focus: g.focus, zoom: g.zoom, ink: o.s.ink }); });
    window.__meridianHome = home;
  }).catch(() => root.classList.add('no-webgl'));

  // ── each frame: rows, links, label, flood ──
  let cur = -1, litRing = -2, hoverKey = null, leaving = false, floodSrc = false;
  const prepared = new Set();
  const bl = { k: 0 };
  function frame() {
    const y = lenis ? lenis.scroll : scrollY;
    const { s, flood } = stateAt(y);
    const atRest = Math.abs(s - Math.round(s)) < 0.004 && flood === 0;
    for (const o of objs) {
      const p = rest(o.k)[o.i], d = o.k - s, ad = Math.abs(d);
      // the rows slide a fifth of the screen and are gone half way, so a globe never crosses the title or the frame
      let x = p.x, yy = p.y + (reduced ? 0 : d * Hh * 0.2), r = p.r * (1 - 0.08 * Math.min(1, ad));
      let a = (1 - smooth(0.12, 0.6, ad)) * intro.a * (1 - smooth(0.08, 0.45, flood));
      r *= intro.r; // the overture brings them in a little small
      if (o.exit) ({ x, y: yy, r, a } = o.exit);
      o.x = x; o.y = yy; o.r = r; o.a = a;
      home?.place(o.key, x, yy, r, a);
      o.el.style.transform = `translate3d(${(x - r).toFixed(1)}px, ${(yy - r).toFixed(1)}px, 0)`;
      o.el.style.width = o.el.style.height = `${(2 * r).toFixed(1)}px`;
      o.el.classList.toggle('is-off', a < 0.5 || leaving);
    }
    if (home) {
      // the first hover never waits: each globe's bloom is worked out once its row has come to rest
      if (atRest && !leaving) for (const o of objs) if (o.k === Math.round(s) && !prepared.has(o.key)) { prepared.add(o.key); (window.requestIdleCallback || setTimeout)(() => home.prepare(o.key)); }
      if (flood > 0 && !floodSrc) { floodSrc = true; home.bloom(objs.find(o => o.k === SUBJ.length - 1).key, 0); }
      home.setFlood(flood);
    }
    if (hoverKey && !atRest) unhover();
    const k = Math.round(s);
    if (k !== cur) setSubject(k, cur < 0);
    const lit = ringAt ? ringAt(y, flood) : k;
    if (lit !== litRing) { litRing = lit; fr.setPart(lit); }
    fr.tone(flood);
    root.classList.toggle('is-paper', flood < 0.97);
    const wa = 1 - smooth(0, 0.35, flood); // the title and its line leave as the page floods
    wordsEl.style.opacity = wa < 1 ? String(wa) : ''; wordsEl.style.visibility = wa <= 0 ? 'hidden' : '';
  }

  // the label under the title is the subject's (Cartier's "CHAPTER II"), and it swaps with a blur
  function setSubject(k, first) {
    cur = k;
    const { text, href } = labelOf(k);
    const put = () => { label.textContent = text; if (href) label.href = href; };
    if (first || reduced || SUBJ.length === 1) return put();
    gsap.killTweensOf(label);
    gsap.to(label, { opacity: 0, filter: 'blur(5px)', duration: DUR.ui, ease: 'm.in', onComplete: () => {
      put();
      gsap.to(label, { opacity: 1, filter: 'blur(0px)', duration: DUR.fade, ease: 'none', clearProps: 'filter' });
    } });
  }

  // ── a globe: hover, focus, click ──
  function hoverOn(o) {
    if (leaving || !home || o.k !== cur || Math.abs(stateAt(lenis ? lenis.scroll : scrollY).s - cur) > 0.004) return;
    hoverKey = o.key;
    home.bloom(o.key, bl.k);
    gsap.to(bl, { k: BLOOM, duration: 1.1, ease: 'm.expo', overwrite: true, onUpdate: () => home.bloom(hoverKey, bl.k) });
    discover.textContent = `Discover · ${o.c.title}`;
    gsap.killTweensOf(discover); blurIn(discover, { dur: DUR.fade, shuffle: false });
  }
  function unhover() {
    if (!hoverKey) return;
    const key = hoverKey; hoverKey = null;
    gsap.to(bl, { k: 0, duration: DUR.ui2, ease: 'm.in', overwrite: true, onUpdate: () => home?.bloom(key, bl.k) });
    gsap.killTweensOf(discover); blurOut(discover, { dur: DUR.ui });
  }
  objs.forEach(o => {
    o.el.addEventListener('pointerenter', () => hoverOn(o));
    o.el.addEventListener('pointerleave', unhover);
    o.el.addEventListener('focus', () => hoverOn(o));
    o.el.addEventListener('blur', unhover);
    o.el.addEventListener('click', e => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || !home || reduced) return;
      e.preventDefault(); open(o);
    });
  });
  // into a chapter: the others and the words leave, the globe glides to where the chapter's paper globe stands
  function open(o) {
    if (leaving) return; leaving = true; lenis?.stop();
    unhover();
    const wide = W > 900, to = { x: W / 2, y: Hh * (wide ? 0.34 : 0.3), r: wide ? Math.min(W, Hh) * 0.19 : W * 0.34 };
    for (const p of objs) p.exit = { x: p.x, y: p.y, r: p.r, a: p.a };
    objs.filter(p => p !== o).forEach(p => gsap.to(p.exit, { a: 0, duration: DUR.ui2, ease: 'm.in' }));
    gsap.to(o.exit, { ...to, duration: 1.2, ease: 'm.smooth' });
    blurOut([wordsEl, fr.el], { dur: DUR.ui2 });
    setTimeout(() => { location.href = o.c.href; }, 1250);
  }
  // back from a chapter (the page restored from the back/forward cache): start again from rest
  addEventListener('pageshow', e => { if (e.persisted && leaving) location.reload(); });

  // ── sound: the corner switches it; it can only start on a tap, so a remembered "on" waits for the first one ──
  let snd = null, soundOn = store.get('sound', true);
  const loadSound = () => (snd ||= import('./sound.js').then(m => { m.bindUI(); return m; }));
  fr.showSound(soundOn);
  fr.soundBtn.addEventListener('click', async () => { soundOn = !soundOn; fr.showSound(soundOn); (await loadSound()).start(soundOn); });
  addEventListener('pointerdown', async () => { if (soundOn) (await loadSound()).start(true); }, { once: true });
  fr.hint.addEventListener('click', () => (onHint ? onHint() : goSubject(Math.min(SUBJ.length - 1, cur + 1))));

  // ── the overture ──
  function overture() {
    const ws = words(title).filter(w => !w.closest('.sr-only'));
    const short = alwaysShort || (() => { const last = store.get(key, 0), now = Date.now(); store.set(key, now); return now - last < 12 * 3600e3; })();
    const { word, sub, hint, edges } = fr;
    const tl = gsap.timeline();
    if (lenis) lenis.stop();
    const done = () => lenis?.start();
    tl.to(loader, { opacity: 0, duration: DUR.ui, ease: 'none', onComplete: () => loader.classList.add('is-done') }, 0.1);
    if (reduced) {
      Object.assign(intro, { a: 1, r: 1 });
      gsap.set([...ws, label, word, hint, ...edges], { opacity: 1 }); gsap.set(sub, { opacity: 0 });
      done(); return;
    }
    gsap.set([...ws, label], { opacity: 0, filter: 'blur(5px)' });
    gsap.set([word, hint, ...edges, fr.soundBtn], { opacity: 0 });
    if (short) {
      tl.add(blurIn(ws, { dur: 0.8, stagger: 0.06 }), 0.2)
        .to(intro, { a: 1, r: 1, duration: 1.0, ease: 'm.smooth' }, 0.35)
        .add(blurIn(label, { dur: 0.6, shuffle: false }), 0.6)
        .set(sub, { opacity: 0 }, 0)
        .add(blurIn([word, ...edges, fr.soundBtn, hint], { dur: 0.6, stagger: 0.1, shuffle: false }), 0.7)
        .call(done, null, 0.5);
      return;
    }
    const g = hold(lock, { scale: 1.5 });
    tl.add(blurIn(ws), 0.5)
      .fromTo(word, { opacity: 0, scale: 2, y: 18 }, { opacity: 1, duration: 0.6, ease: 'm.sine' }, 0.9)
      .to(word, { scale: 1, y: 0, duration: DUR.stage, ease: 'm.smooth' }, 1.75)
      .to(sub, { opacity: 0, duration: 0.3, ease: 'none' }, 1.75)
      .add(() => g.play(), 1.75)
      .add(blurIn(label, { dur: 0.8, shuffle: false }), 1.8)
      .add(blurIn([...edges, fr.soundBtn], { dur: 0.6, stagger: 0.15, shuffle: false }), 2.2)
      // the globes wait until the gliding title has passed their place (as the chapter's globe does)
      .to(intro, { a: 1, r: 1, duration: 1.2, ease: 'm.smooth' }, 2.6)
      .add(blurIn(hint, { dur: 0.8, shuffle: false }), 3.7)
      .call(done, null, 1.75);
  }

  // ── start: the stage, the fonts, then the overture ──
  gsap.ticker.add(frame);
  addEventListener('resize', () => { size(); prepared.clear(); });
  Promise.all([stageReady, document.fonts?.ready]).then(() => { progress(1); fit(); requestAnimationFrame(() => setTimeout(overture, 250)); });

  // where the paper screen ends (the page's own sections start), and scrolling to a subject's row
  return { fr, goSubject, get end() { return (total() + rise) * Hh; } };
}
