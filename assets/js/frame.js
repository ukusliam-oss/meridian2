// The chapter's frame (design plan §6.1): no bars, only small capitals on the four edges at one margin (--frame).
//   top left     MENU, a drawer with the whole site (home, the three subjects, their chapters)
//   top centre   the wordmark, home
//   top right    the subject, back to its hub (Cartier's close)
//   right middle the parts as numerals in rings; the part being read is lit, a hover names it, a click goes there
//   bottom right SOUND on or off
//   bottom left  the overture's "Scroll to begin" (paper only)
// The frame's ink follows the page: dark on the paper, light on the stage (tone), with a soft shade in the corners
// on the stage so the capitals stay legible over the globe.
import { $, $$, gsap, lenis, reduced, esc } from './core.js';
import { blurIn, DUR } from './motion.js';
import site from './data/site.js';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const SPEAKER = on => `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/>${on ? '<path d="M15.5 9a4 4 0 0 1 0 6"/><path d="M18 6.5a7.5 7.5 0 0 1 0 11"/>' : '<path d="m16 9.5 5 5M21 9.5l-5 5"/>'}</svg>`;
const ARROW = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6"/></svg>';
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export function createFrame({ data, parts, goTo }) {
  const root = document.documentElement;
  root.classList.add('has-frame');
  const subj = site.subjects.find(s => s.id === (data.subject || 'history')) || site.subjects[0];
  const here = location.pathname.split('/').slice(-2).join('/');
  const el = document.createElement('div');
  el.className = 'fr'; el.setAttribute('data-frame', '');
  el.innerHTML = `
    <button class="fr__menu fr-ui" type="button" aria-expanded="false" aria-controls="fr-drawer"><span class="fr__lines" aria-hidden="true"><i></i><i></i></span><span>Menu</span></button>
    <a class="fr__word" href="../${site.home}" aria-label="Meridian, home"><span class="fr__name">Meridian</span><span class="fr__sub fr-ui">${esc(data.lockup?.sub || subj.name)}</span></a>
    <a class="fr__subj fr-ui" href="../${subj.href}">${esc(subj.name)}<span class="fr__x" aria-hidden="true">×</span></a>
    <nav class="fr__parts" aria-label="Parts of this chapter">${parts.map((p, k) => `<button class="fr__part" type="button" data-part="${k}" aria-label="Part ${k + 1}: ${esc(p.name)}"><span class="fr__num">${ROMAN[k] || k + 1}</span><span class="fr__pname fr-ui">${esc(p.name)}</span></button>`).join('')}</nav>
    <button class="fr__sound fr-ui" type="button" aria-pressed="true"></button>
    <span class="fr__hint"><span class="fr__hint-in fr-ui"><span class="fr__ring">${ARROW}</span>Scroll to begin</span></span>`;
  document.body.appendChild(el);

  // the drawer: the whole site, the subjects as large serif capitals, their chapters under them
  const drawer = document.createElement('div');
  drawer.className = 'fr-drawer'; drawer.id = 'fr-drawer'; drawer.hidden = true;
  drawer.setAttribute('role', 'dialog'); drawer.setAttribute('aria-modal', 'true'); drawer.setAttribute('aria-label', 'Site menu');
  drawer.setAttribute('data-lenis-prevent', '');
  drawer.innerHTML = `<div class="fr-drawer__veil" data-close></div>
    <div class="fr-drawer__panel">
      <button class="fr-drawer__close fr-ui" type="button" data-close><span aria-hidden="true">×</span> Close</button>
      <nav class="fr-drawer__nav" aria-label="Site">
        <a class="fr-drawer__home fr-ui" href="../${site.home}">Home</a>
        ${site.subjects.map(s => `<section class="fr-drawer__subj" style="--c:var(--${s.id === 'history' ? 'hist' : s.id === 'economics' ? 'econ' : 'geo'})">
          <a class="fr-drawer__name" href="../${s.href}"><span>${esc(s.name)}</span><span class="fr-ui">${s.code}</span></a>
          <ul>${s.chapters.map(c => `<li><a href="../${c.href}"${c.href === here ? ' aria-current="page"' : ''}><span class="fr-drawer__ch">${esc(c.title)}</span><span class="fr-ui">${esc(c.note)}</span></a></li>`).join('')}</ul>
        </section>`).join('')}
      </nav>
    </div>`;
  document.body.appendChild(drawer);

  const menuBtn = $('.fr__menu', el), word = $('.fr__word', el), sub = $('.fr__sub', el), subjLink = $('.fr__subj', el);
  const partsEl = $('.fr__parts', el), partBtns = $$('.fr__part', el), soundBtn = $('.fr__sound', el), hintOuter = $('.fr__hint', el), hint = $('.fr__hint-in', el);
  partBtns.forEach(b => b.addEventListener('click', () => goTo(parts[+b.dataset.part].first)));

  let open = false, lastFocus = null;
  const items = () => $$('a, button', drawer);
  function setDrawer(on) {
    if (on === open) return; open = on;
    menuBtn.setAttribute('aria-expanded', String(on));
    if (on) {
      lastFocus = document.activeElement; drawer.hidden = false; lenis?.stop();
      const panel = $('.fr-drawer__panel', drawer), veil = $('.fr-drawer__veil', drawer);
      if (reduced) gsap.set([panel, veil], { opacity: 1, xPercent: 0 });
      else {
        gsap.fromTo(veil, { opacity: 0 }, { opacity: 1, duration: DUR.ui2, ease: 'm.sine' });
        gsap.fromTo(panel, { xPercent: -100 }, { xPercent: 0, duration: 0.75, ease: 'm.expo' });
        blurIn($$('.fr-drawer__home, .fr-drawer__name, .fr-drawer__subj li', drawer), { dur: 0.6, stagger: 0.05, shuffle: false, delay: 0.15 });
      }
      requestAnimationFrame(() => $('.fr-drawer__close', drawer).focus({ preventScroll: true }));
    } else {
      const panel = $('.fr-drawer__panel', drawer), veil = $('.fr-drawer__veil', drawer);
      const done = () => { drawer.hidden = true; lenis?.start(); lastFocus?.focus?.({ preventScroll: true }); };
      if (reduced) return done();
      gsap.to(veil, { opacity: 0, duration: DUR.ui, ease: 'm.in' });
      gsap.to(panel, { xPercent: -100, duration: DUR.ui2, ease: 'm.in', onComplete: done });
    }
  }
  menuBtn.addEventListener('click', () => setDrawer(!open));
  drawer.addEventListener('click', e => { if (e.target.closest('[data-close]')) setDrawer(false); });
  document.addEventListener('keydown', e => {
    if (!open) return;
    if (e.key === 'Escape') { e.preventDefault(); setDrawer(false); return; }
    if (e.key === 'Tab') { // keep the focus inside the drawer
      const list = items(), k = list.indexOf(document.activeElement);
      if (e.shiftKey && k <= 0) { e.preventDefault(); list.at(-1).focus(); } else if (!e.shiftKey && k === list.length - 1) { e.preventDefault(); list[0].focus(); }
    }
  });

  let part = -2, lastTone = -1;
  return {
    el, menuBtn, word, sub, subjLink, partsEl, soundBtn, hint,
    // the corner capitals and the part rings, for the overture's entrance
    edges: [menuBtn, subjLink, partsEl],
    showSound(on) { soundBtn.innerHTML = `${SPEAKER(on)}<span>Sound ${on ? 'on' : 'off'}</span>`; soundBtn.setAttribute('aria-pressed', String(on)); soundBtn.setAttribute('aria-label', on ? 'Sound on: turn it off' : 'Sound off: turn it on'); },
    // the part being read (k), lit among the rings
    setPart(k) { if (k === part) return; part = k; partBtns.forEach((b, n) => { b.classList.toggle('is-on', n === k); b.setAttribute('aria-current', String(n === k)); }); },
    // 0 the paper (dark ink) … 1 the stage (light ink); the hint belongs to the paper
    tone(f) {
      const t = Math.round(smooth(0.2, 0.55, f) * 100);
      if (t === lastTone) return; lastTone = t;
      el.style.setProperty('--fr-mix', t + '%');
      el.style.setProperty('--fr-shade', (t / 100).toFixed(2));
      hintOuter.style.opacity = String(1 - t / 100); hintOuter.style.visibility = t > 98 ? 'hidden' : '';
    },
  };
}
