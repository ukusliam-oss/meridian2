// Meridian motion: one set of curves and lengths for every page, and the few moves the design is made of.
// Measured on Cartier's "Le Chœur des Pierres" (plan: ../Meridian 디자인·모션 설계 계획서.md §1, §10). Three speeds only:
//   UI 0.15–0.5 s · text 1.0 s (blur → sharp) · stage 2.0 s (the title's glide, the camera)
// Two large moves at the same moment share one curve and one length, so they read as one gesture.
import { gsap, reduced } from './core.js';

const { CustomEase, SplitText } = window;

// curves (the same names as the CSS tokens in site.css: --ease-smooth …)
export const EASE = {
  smooth: '.5, 0, 0, 1',      // stage moves: almost still for 0.3 s, half way at 0.6 s, a long tail
  expo: '.14, 1, .34, 1',     // things that appear
  quint: '.22, 1, .36, 1',    // buttons, menus
  io: '.66, 0, .34, 1',       // there and back
  sine: '.445, .05, .55, .95', // fades
  in: '.17, 0, .83, .83',     // things that leave
};
for (const [k, v] of Object.entries(EASE)) CustomEase.create('m.' + k, v);
export const DUR = { ui: 0.3, ui2: 0.5, fade: 0.6, text: 1.0, stage: 2.0 };
export const BLUR = 5; // px, always with opacity
export const STAGGER = { words: 0.1, paras: 0.08, ui: 0.15 };

const shuffled = n => { const a = [...Array(n).keys()]; for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// split an element into word spans once, keeping its <em>, <span class="lc"> and line breaks
export function words(el) {
  if (el.__words) return el.__words;
  el.__words = SplitText.create(el, { type: 'words', wordsClass: 'w', aria: 'auto' }).words;
  return el.__words;
}

// blur → sharp, word by word in a random order (Cartier: 5 px, 1.0 s linear, 0.1 s apart)
export function blurIn(targets, { stagger = STAGGER.words, shuffle = true, dur = DUR.text, blur = BLUR, delay = 0, ease = 'none' } = {}) {
  const els = gsap.utils.toArray(targets);
  if (reduced) { gsap.set(els, { opacity: 1, filter: 'none' }); return gsap.timeline(); }
  const order = shuffle ? shuffled(els.length) : els.map((_, k) => k);
  const tl = gsap.timeline({ delay });
  els.forEach((el, k) => tl.fromTo(el, { opacity: 0, filter: `blur(${blur}px)`, willChange: 'filter, opacity' },
    { opacity: 1, filter: 'blur(0px)', duration: dur, ease, clearProps: 'filter,willChange' }, order[k] * stagger));
  return tl;
}
export function blurOut(targets, { stagger = 0, dur = DUR.ui, blur = BLUR, delay = 0 } = {}) {
  const els = gsap.utils.toArray(targets);
  if (reduced) { gsap.set(els, { opacity: 0 }); return gsap.timeline(); }
  return gsap.timeline({ delay }).to(els, { opacity: 0, filter: `blur(${blur}px)`, duration: dur, stagger, ease: 'm.in' });
}

// lines leave upwards inside their own masks (the loader's words before the overture)
export function lineOut(el, { dur = DUR.ui, stagger = 0.1, delay = 0 } = {}) {
  if (reduced) { gsap.set(el, { opacity: 0 }); return gsap.timeline(); }
  const { lines } = SplitText.create(el, { type: 'lines', mask: 'lines' });
  return gsap.timeline({ delay }).to(lines, { yPercent: -110, duration: dur, stagger, ease: 'm.in' });
}

// the element is laid out where it ends; it starts at the centre of the screen, `scale` times larger, and glides home.
// Nothing reflows (CLS 0): only its transform moves.
export function glide(el, { scale = 1.5, dur = DUR.stage, ease = 'm.smooth', delay = 0, to = null } = {}) {
  const r = el.getBoundingClientRect();
  const cx = (to ? to.x : innerWidth / 2) - (r.left + r.width / 2), cy = (to ? to.y : innerHeight / 2) - (r.top + r.height / 2);
  if (reduced) { gsap.set(el, { clearProps: 'transform' }); return gsap.timeline(); }
  gsap.set(el, { x: cx, y: cy, scale, transformOrigin: '50% 50%' });
  return gsap.timeline({ delay }).to(el, { x: 0, y: 0, scale: 1, duration: dur, ease, clearProps: 'transform' });
}
// put an element at its glide start without playing (the overture holds it there while its words sharpen)
export function hold(el, opts) { const tl = glide(el, opts); tl.pause(0); return tl; }

// a small state machine for a page's opening: boot → loading → gate → overture → reading.
// on(state, fn) runs fn when the state is entered; skip() plays the current timeline three times faster.
export function director(states = ['boot', 'loading', 'gate', 'overture', 'reading']) {
  const fns = new Map(); let state = states[0], tl = null;
  const api = {
    get state() { return state; },
    on(s, fn) { (fns.get(s) || fns.set(s, []).get(s)).push(fn); return api; },
    go(s) { if (!states.includes(s)) throw new Error('motion: no state ' + s); state = s; (fns.get(s) || []).forEach(fn => fn(api)); return api; },
    play(timeline) { tl = timeline; return timeline; },
    skip() { if (tl && tl.isActive()) tl.timeScale(3); },
  };
  return api;
}

// the short overture for a reader who came back within `hours` (store key 'overture')
export function returning(store, hours = 12) {
  const last = store.get('overture', 0), now = Date.now();
  store.set('overture', now);
  return now - last < hours * 3600e3;
}
