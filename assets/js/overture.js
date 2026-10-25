// The chapter's overture (design plan §5 and §9.4), for chapters that set `lockup`:
//   loading  a sheet of paper, the Meridian mark drawing its ring as the map loads, then "Tap anywhere to enter"
//   gate     the whole screen is the button (with the sound the reader chose; the corner switches it)
//   overture the chapter's title is born in the middle at 1.5×, word by word out of a 5 px blur; at 1.75 s it glides
//            home over 2 s while the globe arrives from far away, the sun comes round and ink blooms around the globe,
//            all on the same curve; then the label, the corners and the hint
//   reading  scrolling floods the paper with ink that deepens into the night of the stage, where the scenes are
// A returning reader (within 12 hours) gets a short version; reduced motion gets a fade; a link to a scene skips it.
import { $, $$, gsap, lenis, reduced, store, esc } from './core.js';
import { words, blurIn, blurOut, lineOut, hold, returning, DUR } from './motion.js';

const SPEAKER = on => `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/>${on ? '<path d="M15.5 9a4 4 0 0 1 0 6"/><path d="M18 6.5a7.5 7.5 0 0 1 0 11"/>' : '<path d="m16 9.5 5 5M21 9.5l-5 5"/>'}</svg>`;
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// builds the paper loader, the title lock-up, the statement screen and the corners; returns the overture's controls
export function prepareOverture(data, fr) {
  const root = document.documentElement, L = data.lockup;
  root.classList.add('has-ov', 'is-paper');
  const loader = $('[data-loader]');
  loader.classList.add('loader--paper');
  loader.setAttribute('role', 'button'); loader.setAttribute('tabindex', '0'); loader.setAttribute('aria-label', 'Loading the chapter');
  loader.innerHTML = `<div class="ov-load">
      <svg class="ov-mark" viewBox="0 0 64 64" aria-hidden="true"><circle class="ov-mark__track" cx="32" cy="32" r="27"/><circle class="ov-mark__ring" cx="32" cy="32" r="27" pathLength="1" data-ov-ring/><ellipse class="ov-mark__mer" cx="32" cy="32" rx="11" ry="27"/></svg>
    </div>
    <p class="ov-hint fr-ui" data-ov-hint><span>Loading the map</span></p>`;

  // the hero becomes the lock-up; its question, line and note move to the statement screen that follows it
  const hero = $('.ch-hero'), eye = $('.ch-wrap > .mono', hero), h1 = $('.ch-hero__title', hero), info = $('.ch-hero__row p.mono', hero);
  const q = h1 ? h1.innerHTML.replace(/<em>/g, '').replace(/<\/em>/g, ' ').replace(/\s+/g, ' ').trim() : '';
  const line = l => `<span class="ov-l">${l.it ? `<i>${esc(l.it)}</i>` : ''}${l.caps ? `<span>${esc(l.caps)}</span>` : ''}</span>`;
  hero.className = 'ch-hero ch-hero--ov';
  hero.innerHTML = `<div class="ov-lock" data-ov-lock><p class="ov-lock__t" data-ov-title>${L.lines.map(line).join('')}</p><p class="ov-lock__lab" data-ov-label>${esc(L.label)}</p></div>`;
  hero.insertAdjacentHTML('afterend', `<section class="ch-q" data-ov-q><div class="ch-wrap">
      ${eye ? `<p class="mono ch-q__eye">${eye.innerHTML}</p>` : ''}
      <h1 class="ch-q__t" data-ov-statement>${q}</h1>
      ${info ? `<p class="mono ch-q__info">${info.innerHTML}</p>` : ''}</div></section>`);
  if (data.ink) root.style.setProperty('--ov-ink', data.ink);

  const title = $('[data-ov-title]'), lock = $('[data-ov-lock]'), label = $('[data-ov-label]'), statement = $('[data-ov-statement]');
  // Cartier's size rule, and never wider than 40% of a landscape screen (86% of a portrait one): a longer title is smaller
  const fit = () => {
    lock.style.removeProperty('--t');
    const w = title.getBoundingClientRect().width, max = innerWidth * (innerWidth < innerHeight ? 0.86 : 0.4);
    lock.style.setProperty('--t', parseFloat(getComputedStyle(title).fontSize) * Math.min(1, max / w) + 'px');
  };
  fit(); document.fonts?.ready.then(fit); addEventListener('resize', fit);
  const ws = words(title), sw = words(statement);
  // the start state is set now, under the loader, so the first blur is prepared before anyone sees it
  if (!reduced) gsap.set([...ws, label, ...sw], { opacity: 0, filter: `blur(5px)` });
  // the frame's wordmark, sound and hint take part in the overture; its other edges arrive after the title
  const { sub, word, soundBtn, hint: scroll, edges } = fr, frame = fr.el;
  const corners = [soundBtn, scroll];
  if (!reduced) gsap.set([...corners, word, ...edges], { opacity: 0 });

  let soundOn = store.get('sound', true), snd = null;
  const showSound = () => fr.showSound(soundOn);
  showSound();
  soundBtn.addEventListener('click', e => { e.stopPropagation(); soundOn = !soundOn; store.set('sound', soundOn); showSound(); if (snd && entered) snd.start(soundOn); if (!entered) hintText(); });
  const hint = $('[data-ov-hint]');
  const hintText = () => { if (ready) hint.innerHTML = `<span>${SPEAKER(soundOn)} Tap anywhere to enter${soundOn ? ' with sound' : ''}</span>`; };
  let ready = false, entered = false;

  // the statement screen: its words sharpen once, when its top passes 60% of the screen's height
  if (!reduced) {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); blurIn(sw, { stagger: 0.06 }); } }, { rootMargin: '0px 0px -40% 0px' });
    io.observe(statement);
  }

  return {
    progress(v) { const ring = $('[data-ov-ring]'); if (ring) ring.style.strokeDashoffset = String(1 - v); },
    // wait for a tap anywhere (or Enter), then play the overture; resolves when the reader can scroll
    enter({ world, sound, skip = false }) {
      snd = sound; ready = true; hintText();
      snd?.sound.onChange(on => { soundOn = on; showSound(); }); // the nav's speaker and this corner stay in step
      loader.classList.add('is-gate'); loader.setAttribute('aria-label', 'Enter the chapter');
      frame.classList.add('is-gate');
      gsap.to(soundBtn, { opacity: 1, duration: DUR.ui2 });
      requestAnimationFrame(() => loader.focus({ preventScroll: true }));
      if (world) world.setIntro({ fade: 0, arrive: 0 });
      return new Promise(resolve => {
        const go = () => {
          if (entered) return; entered = true;
          if (snd) snd.start(soundOn);
          if (world?.replay) world.replay();
          play(world, skip).then(resolve);
        };
        loader.addEventListener('click', go);
        loader.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
      });
    },
    // scroll position → the flood (0 paper … 1 stage); the corners belong to the paper and leave with it
    scroll(y, world) {
      const f = smooth(innerHeight * 0.08, innerHeight * 0.85, y);
      if (world) world.setPaper({ flood: f });
      root.classList.toggle('is-paper', f < 0.97);
      lock.style.color = f > 0.02 ? `color-mix(in oklab, var(--paper-ink), #ece9e1 ${Math.round(smooth(0.08, 0.2, f) * 100)}%)` : '';
      fr.tone(f);
    },
  };

  function play(world, skip) {
    const intro = { fade: 0, arrive: 0, bloom: 0 };
    const push = () => world && (world.setIntro({ fade: intro.fade, arrive: intro.arrive }), world.setPaper({ bloom: intro.bloom }));
    const BLOOM = 0.62; // the ink's reach in globe radii beyond its edge (Cartier's ≈ 1.06 round a stone; the globe is larger)
    const tl = gsap.timeline({ onUpdate: push, onComplete: () => { push(); store.set('overture', Date.now()); } });
    const done = new Promise(r => tl.call(r, null, reduced || skip ? 0.4 : 1.75));
    if (lenis) { lenis.stop(); done.then(() => lenis.start()); }
    // any input during the overture plays the rest three times faster
    const hurry = () => { if (tl.isActive()) tl.timeScale(3); };
    ['wheel', 'keydown', 'touchstart'].forEach(ev => addEventListener(ev, hurry, { once: true, passive: true }));

    tl.add(lineOut(hint), 0).to(loader, { opacity: 0, duration: DUR.ui, ease: 'none', onComplete: () => loader.classList.add('is-done') }, 0.3);
    if (reduced || skip) {
      gsap.set([...ws, label, ...corners, word, ...edges], { opacity: 1, filter: 'none' });
      Object.assign(intro, { fade: 1, arrive: 1, bloom: BLOOM });
      push(); frame.classList.remove('is-gate'); return done;
    }
    const short = returning(store);
    if (short) {
      tl.to(intro, { fade: 1, duration: 0.6, ease: 'm.sine' }, 0.2)
        .add(blurIn(ws, { dur: 0.8, stagger: 0.06 }), 0.2)
        .to(intro, { arrive: 1, bloom: BLOOM, duration: 1.2, ease: 'm.smooth' }, 0.3)
        .add(blurIn(label, { dur: 0.6, shuffle: false }), 0.6)
        .add(blurIn([word, ...edges, scroll], { dur: 0.6, stagger: 0.12, shuffle: false }), 0.8)
        .set(sub, { opacity: 0 }, 0);
    } else {
      const g = hold(lock, { scale: 1.5 });
      tl.add(blurIn(ws), 0.5)
        .to(intro, { fade: 1, duration: 0.8, ease: 'm.sine' }, 2.6) // the title has the paper to itself until it has glided past the globe's place
        .fromTo(word, { opacity: 0, scale: 2, y: 18 }, { opacity: 1, duration: 0.6, ease: 'm.sine' }, 0.9)
        .to(word, { scale: 1, y: 0, duration: DUR.stage, ease: 'm.smooth' }, 1.75)
        .to(sub, { opacity: 0, duration: 0.3, ease: 'none' }, 1.75)
        .add(() => g.play(), 1.75)
        .to(intro, { arrive: 1, duration: DUR.stage, ease: 'm.smooth' }, 1.75)
        .to(intro, { bloom: BLOOM, duration: 1.5, ease: 'm.smooth' }, 2.9) // the ink spreads once the title is below it
        .add(blurIn(label, { dur: 0.8, shuffle: false }), 1.8)
        .add(blurIn(edges, { dur: 0.6, stagger: 0.15, shuffle: false }), 2.2) // MENU, the subject, the part rings
        .add(blurIn(scroll, { dur: 0.8, shuffle: false }), 3.7); // the sound corner stays where the gate left it
    }
    tl.call(() => frame.classList.remove('is-gate'), null, 0.3);
    return done;
  }
}
