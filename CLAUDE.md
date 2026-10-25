# Meridian

A motion-heavy revision site for the I&S prefect: Cambridge IGCSE History 0470, Economics 0455 and
Geography 0460 for the 2027 exams. A calmer sibling built in a parallel session lives in `../is-desk`
(its CLAUDE.md lists the syllabus facts both sites rely on). Constraints shared with it: the school
is in mainland China, so nothing loads from a CDN (fonts and libraries are vendored); nothing needs
an account or typed input; ask before deploying.

Plain HTML/CSS/JS, no runtime framework. Preview: the `meridian` entry in `../.claude/launch.json`
(python http.server on :5183).

```
npm run build          # bake land dots + bundle the three.js globe → assets/js/globe.js
python3 tools/pages.py # regenerate index/history/economics/geography.html from one shell
```

## Map
- `assets/css/site.css` — the whole design system, shared by hubs and chapters: tokens (dark default, light via
  `data-theme`, `data-tone="dark"` forces dark inside light pages), nav + phone tab bar, home, subject, labs.
  One type system everywhere: `.display/.h1/.h2` are light serif capitals whose `<em>` lead phrase sits on its own
  line in grey italic (only chapter openings, part titles and the Paper 2 title colour it); `.mono`/`.eyebrow`/`.tag` are Plex Mono capitals; Inter for reading.
  The nav bar, tab bar and sub-nav are grey glass; the chapter pill and scene menu are violet glass (`--brand`, the
  pill with `glass.js`'s pointer-lit `.stroke-border` rim); `--accent`/`--accent-deep` is the subject colour for
  content. Small labels (eyebrows, mono headings, "Step 0n", panel labels, table heads, practice part letters) are one
  grey, `--text-3`, never the subject colour: colour is kept for headings' accents, links, tags and data, so the eye
  is not pulled around. Reading floor: labels 12px (`--fs-label`), notes 13px, nothing below 11px; small accent
  labels on light paper use `--accent-deep` for 4.5:1.
- `assets/js/core.js` — motion core (the design plan's tokens and moves are in `assets/js/motion.js`; the chapters' overture and frame in
  `overture.js` and `frame.js`, below): Lenis on GSAP's ticker, reveals, SplitText headlines,
  counters (`data-count`), magnetic buttons, nav tone, theme toggle (view-transition circle),
  sub-nav scroll spy, `store` (localStorage, try/catch).
- `assets/js/ui.js` — exam anatomy, Paper 2 topic finder, topic map, examples tracker, technique
  blocks, command words, flashcards, quiz.
- `assets/js/data/*.js` — all content. `subject.js` renders a page from one of these as a path in four steps
  (`STEPS`: know the exam, learn the content, answer questions, test yourself): step cards under the hero, section
  labels "Step 0n · …", a sub-nav grouped by step, and a "Next · step" link after each step's last section.
- `assets/js/practice.js` — written practice: one set of exam-style structured questions at a time,
  a mark-scheme reveal per part, a Level 2 and a stronger example answer side by side for the long
  part, data tables, a year-scaled line chart and a labelled S&D diagram. It injects
  `assets/css/practice.css` itself. Content: `assets/js/data/practice-{history,economics,geography}.js`
  (8, 7 and 6 sets). `subject.js` mounts it in step 3, after Exam technique and Command words.
  Nothing is typed or saved.
- `assets/js/labs/` — `timeline.js` (History), `supply-demand.js` (Economics), `dtm.js` (Geography).
- `assets/js/visuals.js` — subject hero art: year ribbon, live S&D, canvas contour map. History's years and the S&D
  diagram never sit behind the title: `heroArt` measures the box beside the title word and the box above the title
  block on every resize and puts the art in whichever lets it draw larger (`--art-l/t/w/h` on `.s-hero`).
- `src/globe.js` → `assets/js/globe.js` — the home globe (three 0.186, custom shaders), driven by
  `setProgress(f)`: 0 hero, 1 History, 2 Economics, 3 Geography.

## History scroll chapters (plan: `../Meridian History 설계 계획서.md`)
- `history/kq6.html` — KQ6 chapter: 33 scenes over one globe. `assets/js/chapter.js` renders the scenes from
  `assets/js/data/history/kq6.js` and turns scroll into globe progress (a scene holds while its panel is on the reading
  line; the camera flies in the gaps). `assets/css/chapter.css` adds the globe layer, scene panels, pill navigator and
  scene menu on top of site.css's type system (`--acc` = `--accent`). History is amber on the home page, the globe and its hub
  (`--hist`) and fully violet inside its chapters and on the hub cards that open them (`--brand`), with no
  blended amber-to-violet crossing (tried and dropped). Economics is green, Geography blue, inside and out. The pill ends in their progress ring (a 10% lilac disc, a
  faint track, a white bar filling from the top as the chapter is read, an arrow icon in the middle).
- `history/kq6-paper2.html` + `assets/js/paper2.js` — Paper 2 room from `kq6-paper2.js` (sources on paper cards).
  The History hub links both through `CHAPTERS` in `tools/pages.py`.
- `src/world/engine.js` → `assets/js/world.js` (`npm run world`). Per scene: a 2048 world texture plus a sharp detail
  texture around the camera target, cross-faded in the shader; relief from `assets/data/relief-{world,europe}.jpg`;
  borders, arrows, the iron curtain (real FRG/AUT vs GDR/CSK/HUN borders, via topojson mesh) and the Wall as tubes.
  `city: 'berlin'` paints the four sectors and the border strip; `kind: 'wall'` draws the real 1989 route.
- `tools/build-maps.mjs` (`npm run maps`) → `assets/data/borders.json`. Inputs go in `tools/.cache/` (gitignored):
  CShapes 2.0 (`icr.ethz.ch/data/cshapes/CShapes-2.0.geojson`, CC BY-NC-SA 4.0), and from `gdi.berlin.de` the WFS
  layers `berlinermauer:a_grenzmauer|b_hinterlandmauer|d_grenzstreifen` and `alkis_ortsteile:ortsteile`
  (both Datenlizenz Deutschland Zero 2.0). It keeps only state versions valid on a scene date of some
  `assets/js/data/history/kq*.js`, so rerun it after adding a chapter. Relief: Natural Earth SR_50M via `sips`.

## Economics scroll chapter (Topic 4.1–4.4)
- `economics/macro-policy.html` reuses `chapter.js`: `<body data-chapter>` names the data file
  (`assets/js/data/economics/macro-policy.js`, 41 scenes, reviewed by an Economics teacher on 2026-10-25); anything a chapter leaves out falls back to KQ6's
  values. Linked from the Economics hub through `ECON_CHAPTERS` in `tools/pages.py`. Case notes and URLs:
  `../Meridian Economics research notes.md` (outside the repo).
- Scene maps can colour countries by an indicator (`map.data`), raise needles (`map.spikes`), step through years in one
  panel (`years: [...]`, all engine scenes of a panel share `panel` and every texture), and show focus outlines with live
  value labels. Panels add line charts (`chart.series` items may be `{ label, ind, iso, from, to }`, read from econ.json),
  chains (`chain.steps`, `chain.globe` = the step that sends the map's flows), `evaluation`, `judgement`, `compare`, `cascade`.
- Toolkit adds `definitions` and `practiceSets` (rendered by `practice.js` with the schemes of `practice-economics.js`).
- Policy lab: `assets/js/policy-lab.js` + `assets/css/policy-lab.css` read `data/economics/policy-lab.js`; mounted in
  `#lab` when the chapter names `lab`. Classes are `plab__*` because site.css already owns `.lab`.
- `economics/engine-test.html` (unlinked, noindex) runs `engine-test.js`, one scene per engine feature.
- `tools/build-econ.mjs` → `countries-modern.json` (Natural Earth 50m, ISO3 keys, IMF names shortened for labels) and
  `econ.json` (IMF WEO October 2026, BIS policy rates, OWID Gini and CO₂). Axes are stored as ranges:
  `years: [first, last]`, `months: ['YYYY-MM', 'YYYY-MM']`.
- Checks before committing: `node tools/check-econ.mjs` (fields, sources, indicators and ISO3 codes, syllabus coverage,
  no em dashes; it also runs `tools/check-lab.mjs`, which checks every model effect against the direction table).

## Geography scroll chapters (plan: `../Meridian Geography 설계 계획서.md`)
- `geography/tectonics.html`: Topic 4 Tectonic hazards, 26 scenes from `assets/js/data/geography/tectonics.js` (status
  draft), linked from the Geography hub through `GEO_CHAPTERS` in `tools/pages.py`. Its toolkit reuses the Earthquakes
  set of `practice-geography.js` and adds a Volcanoes set; `chapter.js` loads `practice-{subject}.js` for the schemes.
  Test page: `geography/engine-test.html` (unlinked, noindex), one scene per engine feature.
- Checks before committing: `node tools/check-geo.mjs` (fields, sources, layers and landscapes exist, sections and
  markers inside their landscape, raised heights said in the text, syllabus 4.1.1–4.4.4 complete, toolkit, no em dashes).
- A Geography chapter sets `borders: 'none'` (a natural globe: no states, lighter land; `chapter.js` then loads
  `assets/data/geo/natural.json`) and `light: 'camera'` (the light rides with the camera, from the upper left; History and
  Economics keep the fixed light over the Atlantic, which leaves the Pacific dark).
- `tools/build-geo.mjs` → `assets/data/geo/`: `quakes.json` (USGS ComCat, M5.5+, 2000–2025, 12,850; lon, lat, depth,
  mag, decimal year flat), `volcanoes.json` (Smithsonian GVP Holocene list, 1,214), `plates.json` (PB2002 steps chained
  by kind: divergent, convergent, collision, transform, with mean relative speed), `natural.json` (Natural Earth 1:10m
  land, lakes and rivers up to rank 7, 200 m bathymetry; 10% of points kept, 60% inside the footprint of any Geography
  scene below 400 km), `shake/{event}.json` (USGS ShakeMap intensity isolines by MMI level), and `dem/{site}.png|json`
  (Copernicus GLO-30 heights packed in RGB, whole metres + 1000; only each site's window is read from the 1° COGs, cached
  per site in `tools/.cache/geo/`). Sites are listed in `SITES` in the build; `SITES=a,b` rebuilds just those.
- Scene map fields (engine in `src/world/layers.js`): `points: [{ id: 'quakes', minMag, years, play }, { id: 'volcanoes',
  types }]` (GPU points; quakes coloured by depth and sized by magnitude, `play` runs a clock through the years),
  `plates: true | [kinds]`, `relief3d: { site, exag, topo (0 landscape … 1 map), contours (m) }`, `section: { from, to,
  label }` (a white line over the landscape; the panel draws the profile from the same heights through
  `world.profile`), `cutaway: { lon }` (the northern octant from that longitude removed, layers on its faces; the earth
  shader discards it through `uCut`), `isolines: { id }` (ShakeMap intensity lines coloured IV to X). The legend
  switches to depth, volcano, boundary or intensity keys for these scenes. Markers on a landscape stand on its heights.

## Design and motion (plan: `../Meridian 디자인·모션 설계 계획서.md`, v2; phases 0–3 done 2026-10-25)
- The plan measures Cartier's "Le Chœur des Pierres" (opening timeline, proportions, curves, its title face, paper and
  ink) and translates it: an overture where the chapter title is born mid-screen at 1.5× and glides home in 2 s, a
  frame UI instead of bars, three speeds, light and material on the globe, Noto Serif Display, paper at the thresholds
  and the dark stage for scenes, joined by ink. Phases 4–5 (hubs and home, wrap-up) are not built.
- The frame (phase 2, `assets/js/frame.js`), on chapters with `lockup`: no nav bar and no phone tab bar, only 12 px
  capitals on the edges at `--frame` (32 px at 1440; text 5 px inside it, top and bottom alike, as Cartier's 37 px):
  MENU (a drawer with the whole site from `assets/js/data/site.js`; add a chapter there and in `tools/pages.py`),
  the wordmark (home), the subject with × (its hub), the parts as numerals in 32 px rings on the right (the part being
  read is lit, a hover names it, a click goes to its first scene; inactive rings fade but their numerals keep 0.65
  for 4.5:1), SOUND on/off, and the overture's "Scroll to begin". Its ink follows the flood (`tone`): dark on paper,
  light on the stage, where soft shades sit in the corners and behind the rings. The pill waits for the first scene
  (`.is-pre`) and, on screens 1000 px and wider, is centred under the date ribbon (in the middle it covered the
  panel's text); the legend moves clear of the frame. Phones: no rings and no subject link (both in the menu), the sound
  icon top right, the pill on the bottom edge. The edges speak in Archivo Expanded 500 (`.fr-ui`, chosen over Plex
  Mono); a hover on an edge control blooms a drop of ink behind it (an SVG disc frayed by feTurbulence; pigment with
  `multiply` on the paper, white light with `screen` on the stage).
- Scene motion (phase 3, framed chapters, in `chapter.js`): a panel's title words sharpen out of the blur when it
  reaches the reading line (35% from the bottom), the date follows, its paragraphs and blocks rise 12 px, once each;
  reading text is never blurred or tied to the scroll. A part opens with a statement screen (`.part--st`: the numeral
  in a ring, the part's name in 84 px serif, its focus points), during which the ribbon, legend and labels step aside
  (`.is-part`); scrolling on, its lines leave one by one (a blur and a fade as each line's top passes 190 → 70 px)
  before they reach the wordmark. Between parts the subject's colour washes the screen as light (`world.setLook({ wash })`, a screen
  blend from the globe outwards, peak 0.75, rising over the first 30% of the gap and gone by 60%); while a panel holds,
  the reading grade dims the panel's half by up to 12%, bloom to 30% and the sea's glint to 40% (`setLook({ dim })`).
  Panels drop the part tag and the scene number (the rings and the pill carry them) and get a finer glass with a top
  light and the paper's 2% grain. Map labels flip left 76 px before the right edge (`edge`), clear of the rings.
- The overture (phase 1, `assets/js/overture.js`), for chapters that set `lockup` and `ink` (all three do): the loader
  is a sheet of paper with the Meridian mark drawing its ring as the map loads; the whole screen is the gate ("Tap
  anywhere to enter", Enter or Space; the Sound corner switches the remembered choice and stays as the paper's sound
  switch). Then the title lock-up (Noto Serif Display 330, Cartier's proportions: italic 0.7em centred on the capitals,
  second line flush right, the label below) is born mid-screen at 1.5×, its words sharpen in a random order, and at
  1.75 s it glides home over 2 s while the globe arrives from 2.4× further away and the sun comes round
  (`world.setIntro`), all on `m.smooth`; the globe fades in only from 2.6 s and the ink blooms round it from 2.9 s
  (`world.setPaper({ bloom })`, 1.5 s), once the gliding title has passed their place (earlier, they sat behind it). Scrolling floods the
  paper (`flood`, from 8% to 85% of the first screen): the ink spreads from the globe and deepens into the stage, the
  stars come in, and only then the nav bar, pill, legend and labels (`.is-paper` hides them). The hero's question
  becomes a statement screen (`.ch-q`, 84 px serif, words sharpen when its top passes 60% of the screen). Returning
  within 12 hours (`store` 'overture'): a 1.2 s version in place; reduced motion: no blur or glide; a link to a scene
  skips it. Chapters without `lockup` (the engine tests) keep the old loader.
- On the paper the globe is an object of a set size (`paperAlt`: radius 19% of the shorter side, 34% of a phone's
  width), centred and a little high (`heroView`), with the scenes' panel offset blended in as the camera leaves the
  hero. The sheet is drawn at CSS size only when it changes and laid under the globe in the post target; bloom, grade
  and shoulder are off on paper so it keeps its measured values. Chapters now draw with `look` on (`?look=0` off).
- The paper's globe is an ink map (earth shader `uInkMap`, on while there is paper): the sea is the paper, the land a
  watercolour wash of the chapter's ink (granulated in longitude and latitude), a 15° graticule with a stronger
  equator, the coasts and the limb as fine ink lines; no air, borders or points, and the sheet lends it no coloured
  light (`sheet.glow = 0`). The coast is the 0.5 contour of `landMap`, Natural Earth land (lakes cut out) filled at
  4096 × 2048 (2048 on phones) and blurred 2.5 texels on a canvas (25 ms once; older Safari without canvas filters
  blurs by scaling down and up): the painted state textures stair-stepped at ~2 screen px per texel and dotted the
  coast with their glaze bands. The hand-over follows the scroll in two even steps, tied to `flood`: the first fifth
  dyes the drawing as paper takes ink (`uDye`, Beer–Lambert layers, so the middle is a deep violet rather than a grey,
  ending in the stage's night), then from 10% to 32% the real globe's light comes up through it (`uReal`; it follows the dye closely, since a fully dyed globe waiting for its light read as a murky ghost), and its air,
  borders and points with it (`realG`). A front that soaked in from the limb was tried and dropped: frayed and cheap.
  Paper hero at DPR 2: 13.9 ms GPU (KQ6), 13.1 ms (Geography).
- `chapter.css` sets `--serif` to Noto Serif Display 330 inside chapters (the hubs and home still use Instrument Serif).
- `assets/js/motion.js`: tokens (`EASE` smooth/expo/quint/io/sine/in registered as `m.*`, `DUR` ui .3, text 1, stage 2),
  `words`, `blurIn` (5 px, 1 s linear, 0.1 s apart, random order), `blurOut`, `lineOut`, `glide`/`hold` (FLIP from
  the centre, CLS 0), `director`, `returning`. The same tokens are CSS variables in site.css (`--ease-smooth`, `--dur-*`,
  `--frame`). core.js's `m.out`/`m.io` stay as they were.
- Fonts: `tools/build-fonts.py` (fontTools + brotli; inputs from google/fonts in `tools/.cache/font-eval/`) makes
  `noto-serif-display-{330,350,400}[-italic].woff2` (62.5% width, Latin + Œ, 12–13 KB each) and
  `archivo-expanded-500.woff2` (UI candidate). Only the lab uses them so far; keep one weight after phase 1.
- `src/world/material.js` (`createSheet`): paper baked once per size into two half-float textures (folds, bands,
  fibres, the folds lit, granulation, pooling) and ink as an arrival-time field (8-neighbour relaxation on a 3 px grid,
  ~650 sweeps, 17 ms once per source), played by a threshold: `bloom` (multiples of the object's radius) and `flood`
  (0..1, the ink deepening into the stage colour) can run backwards with the scroll. Pigment is a Beer–Lambert filter
  (thin ink keeps its hue). `src/world/lab.js` → `assets/js/design-lab.js` (`npm run lab`, three bundled) for
  `design/lab.html` (unlinked, noindex): `?font=330|350|400|inst&ui=plex|archivo&subject=…&dark=1&bloom=&flood=&clean=1`,
  `__overture()` plays the overture on paper.
- `src/world/post.js` (`createPost`): half-float MSAA target, bloom (threshold .84, 5 levels, 3 on phones), exposure,
  a brightness-only shoulder, a grade that skips coloured pixels, optional vignette (0: chapter.css already has one),
  grain. The engine uses it, plus sun glints on water and a scattering atmosphere, only with `look` (chapter pages:
  `?look=2`). Without it the frame is the same as before (KQ6 Berlin: 3 of 1.3 M pixels differ by 1).
- Measured (2026-10-25, dev Mac M5, headless, 1440 × 900, DPR 1): paper + ink 0.66 ms GPU (EXT timer query);
  `look` adds 1.0–2.4 ms GPU per drawn frame (KQ6 hero 7.4 → 8.4, Berlin 4.3 → 6.7, Economics 8.3 → 9.4) and
  0.25–0.4 ms CPU; map colours under `look` differ from the plain frame by ΔE2000 0.04–0.32 (fill-weighted mean,
  worst data fill 1.8; only the sea's glint moves more). Lab overture: 16.7 ms median and p95 frames, CLS 0, no long
  task; the very first run has one 233 ms frame (first blur and filter set-up), later runs none. Ink against Cartier's
  emerald (radial profile): extent 2.05 vs 2.0 radii, lopsided 1.39 vs 1.55, edge saturation 88 vs 84. Paper:
  mean 236–244 (Cartier 238–244), mid grain σ 1.2–1.5 (0.93), fibres' direction 0.69–0.73 (0.45–0.68).
- Measured, phase 1 (2026-10-25, M5, headless): tap → title fully sharp 1.79 s, title home 3.74 s (short version
  1.18 s), 60 fps (median and p95 16.7 ms, worst 16.8), CLS 0, no long task, 0.49 ms CPU per frame. GPU per drawn
  frame at DPR 2: paper hero 14.1 ms, Berlin 10.3 ms with `look` (6.9 without); 4× MSAA had made the hero 21.4 ms,
  so the post target takes 2 samples from DPR 1.5. The ink's arrival field: 15 ms once (16-neighbour relaxation;
  8 neighbours drew octagons).
- Measured, phase 2: frame text 13.1:1 on paper and 15.7:1 on the plain stage; over Þingvellir's bright terrain the
  shaded background behind the edges gives 5.9–6.8:1 at the median and 4.2–5.4:1 against its brightest tenth.
  Left and right margins equal at 1440 × 900, 1280 × 720, 768 × 1024 and 390 × 844; top and bottom text within 2 px.
- Measured, phase 3 (headless, 1440 × 900): scrolling KQ6 scenes 1→12 (two part changes) in 14 s: median and p95
  16.7–16.8 ms, no long task, 0.42 ms CPU per frame; Economics 2→12: the same, 0.64 ms. Map colours with the grade
  and wash against `?look=0`, map half: ΔE2000 0.33 (Economics) and 0.37 (Geography) weighted (worst fill 2.2, the
  sea's glint 6.7).
- Inks are matched by measurement, not by eye: drawn on the paper, each ink's band should sit near L* 40 and chroma
  35–45 (Economics #0f7a58: 44 / 33, Geography #1f5fae: 40 / 42, History #67519f: 39 / 41). History's interface violet
  #6d3fd0 drew at chroma 74 and read as a highlighter, so the chapter's `ink` is its own colour. `world.setPaper({ ink })`
  switches it live for comparisons.
- Traps: three encodes its own materials (LineMaterial, MeshBasicMaterial) to sRGB only on the screen, never into a
  render target, while the engine's raw shaders write display values either way; post.js patches those materials to
  encode in the target too (without it the plate lines came out ΔE 13 darker). `Color.set('#hex')` stores linear
  values: in raw shaders call `.convertLinearToSRGB()` (the paper's ink went grey without it). A GLSL ternary that mixes
  int and float fails to compile silently in the relaxation pass and the ink then covers the page: use a `const vec2[]`.
  An "off" ink front must be far below zero (−1e4), not −10: the soft edge reaches tens of cells.

## Sound
- `assets/js/sound.js`, synthesised with Web Audio (no audio files), modelled on measurements of Cartier's "Le Chœur
  des Pierres" (one looped music bed, a hover sound, a click sound; nothing reacts to the scroll). Measured there: music
  −41 to −49 dB RMS, peaks −26 dB; 81% of the energy in 80–320 Hz, almost nothing above 1 kHz; a still E major
  pentatonic (E, F♯, B, C♯, G♯); stereo wider than mono (side/mid 1.2). Hover: B3 E5 G♯5 over ~5 s, 20 dB under the
  music. Click: a high shimmer near A6.
- Ours: eight voices (two detuned triangles and a soft sawtooth each) on three voicings of the same chord, every voice
  panned hard to one side with its own slow swell, low-passed near 900 Hz, a quiet low root, a generated 6 s warm hall;
  the voicing glides every 18–26 s. `bindUI()` chimes on hover of anything pressable and sparkles on clicks.
  Measured on a recording (2026-10-25): −41 to −47 dB, peaks −26.6 dB, side/mid 1.09, centroid 165–265 Hz by voicing.
- Every chapter has `sound: true`: its loader waits with "Enter with sound" (the default) and "Enter quietly", because
  browsers start audio only from a tap; the choice is kept (`store` 'sound') and a speaker in the nav bar switches it.
  Suspended while the tab is hidden.
- Tried and dropped: one voice per earthquake (cheap, too busy), and a loud dark noise bed with whooshes and booms
  (−12 to −17 dB, sub-heavy). Keep levels measured, not guessed: record the real output in the headless browser (tee
  every connection to the destination into a ScriptProcessor), then measure loudness, width and bands in the page.

## World engine
- `src/world/engine.js` → `assets/js/world.js`, `src/world/paint-worker.js` → `assets/js/world-paint.js` (`npm run world`
  builds both); `src/world/paint.js` is shared. Painting runs in the worker (OffscreenCanvas), else in idle time.
  Textures are stored bottom-up and uploaded with flipY off.
- Data maps are coloured in the shader: an id texture (country index + 1, scanline-filled, no antialiasing) and a float
  value texture (one row per engine scene). Four taps are coloured then filtered, so borders stay smooth. Years in one
  panel blend the values themselves. KQ6's painted fills are unchanged.
- A frame is drawn only when progress, size, a texture or a dashed line can change. `world.stats` holds paint times and
  frame CPU; `window.__meridianWorld` exposes it in the preview. `prepare(i)` paints and builds overlays in idle time.
- `chapter.js` keys its ticker on the scroll position, not the scene index (a held panel keeps the same index while its
  years, chain steps and chart move).
- Sharpness. `src/world/view.js` holds the camera (`placeCamera`, `setViewport`) and `footprint`: the screen
  corners cast onto the globe for a scene's held camera. Each detail texture covers that footprint (+14%) with square
  texels on the ground of ~0.55 CSS px (0.5 on phones, never finer than 3 m), up to 4096 px a side (2048 on phones), for the screen the page
  opened on; a big resize re-keys the states. Painted textures have mipmaps and are evicted by GPU bytes (320 MB, phones
  96 MB). `node tools/check-texels.mjs [chapter]` prints each scene's texture and relief density and fails if a detail
  texture is coarser than 1 CSS px per texel; its terrain column says which terrain level shows and its CSS px per texel.
- State fills are a glaze (alpha 0.62–0.85 over the land, `GLAZE` in paint.js) with a lighter band inside each edge;
  the focus glow is clipped inside its country. The Natural Earth relief fades to its mean where a texel would cover
  more than ~2–4 px (a blurred relief reads as a smudge). Land has a one-pixel film grain.
- Terrain and water. `node tools/build-terrain.mjs` reads Copernicus DEM GLO-90 tiles from AWS by range
  requests (cached in `tools/.cache/dem/`, ~390 KB/s from here: a full rebuild takes ~30 min) and writes 512 px shaded
  tiles to `assets/data/terrain/{z}/{x}_{y}.jpg` plus `index.json`: z0 (64 px/°, ~1.7 km, the 370 m data halved)
  wherever a scene below 2500 km looks, z1 (256 px/°, ~430 m) where a screen pixel is under ~1 km, z2 (512 px/°,
  ~215 m) where it is under 0.45 km; footprints from view.js on four reference screens, so rebuild after moving a
  camera (`ONLY=0,1` rebuilds just those levels). Flat ground is 0.75. The engine (`terrainOf`) composes a state's
  tiles over its detail box (at most 2048 px) on the main thread, coarse level first, and never waits for them: the
  base relief shows until they arrive. Tiles are JPEG quality 62 (the shading is soft; 78 was a quarter larger). `composeTiles` draws with high-quality smoothing and leaves out a level more
  than 3× finer than its canvas, so a continent-wide view never downloads z1. Attribution is in each chapter's note.
- `borders.json` now uses Natural Earth 1:10m land, rivers (+ Europe), lakes (+ Europe) and the 200 m bathymetry
  (`tools/.cache/ne/`, from naciscdn.org), keeps 80% of points in a central-European CORE box, and is quantized at 1e6.
  Border lines are only lines between two states (`mesh`), so the CShapes coast is never drawn beside the 1:10m one;
  fills are clipped to the land. Water is painted opaque with alpha 254 (`SHELF`, `WATERC`): the shader reads alpha
  254 as water (lit, never terrain-shaded), because partly transparent paint comes out of the upload darkened by its own
  alpha. Polygons from Natural Earth are filled even-odd, so holes stay holes whatever their winding. The shelf is a
  neutral slate just above the ocean's black, painted over the part of a box the bathymetry covers: a blue shelf
  matched the Western bloc's navy and Britain and France sank into it. Rivers thin out by rank as texels grow.
- Berlin. `city: 'berlin'` lays each sector's occupying power's flag over it (`FLAGS` in paint.js, drawn in code: the
  Stars and Stripes with 48, 49 or 50 stars by date, the Union Flag, the Tricolore, the Soviet flag) at 72% over a dark
  ground, on every Berlin scene from 1945 to 1989. Each flag is the smallest that covers its sector's bounds, slid so its
  canton or emblem comes near a chosen point (`at`); rivers and lakes are painted on top. The sector names are lettered
  in the map itself (Plex Mono capitals up to ~12 CSS px at the held camera, shrunk to fit a sector that is narrow on
  screen; detail textures only; the worker loads the font), then comes the border strip after August 1961. West
  Staaken (`staaken` in borders.json: the Staaken Ortsteil west of the 1989 front wall, cut with `polygon-clipping` in
  build-maps) leaves the British flag from 1 February 1951, when the GDR's police took it over. The Wall stands as a ribbon (`wallMesh`); a scene camera may set `tilt` (KQ6 13, 14
  and 30 look across the centre from 26–28 km at 32°). The June 1953 aerial photographs were tried as a base layer
  and dropped: the official mosaic is a patchwork of differently exposed frames and read as unsteady.
- Borders and focus outlines are `LineSegments2` (1.25 px and 2 px on screen, antialiased) at radius 1, scaled per frame
  to sit `alt / R_KM × 0.002` above the ground; the sphere is 512 × 256 (384 × 192 on phones) so its facets sag at most
  ~120 m and city lines stay on their fills in tilted views.

## Measured facts
- Map sharpness, phase 1 (2026-10-24, dev Mac, preview): KQ6 and the Economics chapter have every detail texture at
  0.55–0.84 CSS px per texel (desktop) and 0.52–0.70 (phone); before, Berlin was 2–5× and Budapest ~2× coarser than the
  screen. Scrolling KQ6: 16.7 ms median frame, 17.7 ms p95, 0.35 ms CPU per frame; the chapter loads in 2.1 s with the
  preview pane visible (a hidden pane pauses rAF, and the loader waits for frames).
- History chapter (2026-10-23): borders.json 414 KB (315 state versions, Europe detailed, rest coarse, Berlin layers);
  relief 174 + 366 KB; world.js 582 KB. Painting one scene's textures takes 55–120 ms on the dev Mac (Berlin about
  265 ms), so neighbours are painted in idle time while the reader reads. Checked in the preview at desktop and 375 px.
- Geography engine test (2026-10-25, dev Mac, headless): geo layers 180 KB compressed (quakes 114, plates 47,
  volcanoes 18) plus `natural.json` 408 KB; Fuji patch 386 KB. Drawing a frame 1.7 ms CPU on average (worst 5.6 ms).
  History and Economics checked after the change: same look, no errors.
- KQ6 on the live site (2026-10-25, empty cache, dev Mac): first load 891 KB in 21 files (borders.json 456 KB and
  world.js 171 KB compressed), globe ready in 2.6 s. Reading the whole chapter adds 4.7 MB of terrain tiles on desktop
  and 4.2 MB on a phone (counted with the engine's rules), all in the background.
- Globe bundle 595 KB, 163 KB gzipped; 5,748 land dots from Natural Earth 110m.
- Engine (2026-10-23, dev Mac, preview): id rasters 17–59 ms and Economics paints 160–207 ms, all in the worker; KQ6
  paints 9–19 ms in the worker. A scripted scroll through the engine test drew 202 frames at 0.88 ms CPU on average
  (worst 16 ms) and skipped 73 unchanged frames. The preview pane throttles rAF, so fps itself was not measured.
- Vendored: GSAP 3.15 (+ScrollTrigger, SplitText, Flip, DrawSVG, CustomEase), Lenis 1.3.27,
  Inter (48 KB) and Instrument Serif (2 × 21 KB).
- Contrast (2026-10-24, `tools/contrast.js`, folded content opened): home and the three hubs in both themes and the
  three chapter pages pass WCAG AA; KQ6 checked 1,105 text elements, the Economics chapter 1,158. Light theme tokens
  were darkened for it (`--hist` #995700, `--econ` #087a50, `--good`/`--bad`, `--text-2` .76).
- Checked in the preview on 2026-10-22: home lenses, all three labs and every mode, flashcards,
  quiz, light theme, 375 px phone layout (no horizontal scroll). No console errors.
- Where practice marks come from (checked 2026-10-22; each data file's `source` shows it on the
  page): History P1 4/6/10 and the (b)/(c) levels are from the published 0470/11 June 2025 mark
  scheme, because the 2027–28 syllabus states only parts (a), (b), (c). Economics follows the 2027
  specimen Paper 2 mark scheme v3 (Section B 2/4/6/8, point-marked (a)–(c), Table A for (d)).
  Geography follows the 2027 specimen P1/P2 mark schemes: Questions 2–4 run 1·2·3·4·3·5·7, 5-mark
  items keep 1 mark for evaluation, and the 7-mark (c) uses Table B (named example). The syllabus
  gives no per-part marks. Geography case-study figures in example answers are flagged on the
  page as not checked against official documents.

## Traps
- **Map colours stay the engine's own**: KQ6's focus fills, halos and marker glows are violet (`PALETTE.focus`
  `#a084ee`), not History amber. A chapter can name `accent` (Economics does); the engine sends it to the paint
  worker in its `init` message.
- **The preview pane throttles requestAnimationFrame** while nothing drives it, so the globe can
  look dim or mid-zoom in screenshots. Run a short rAF loop in the page before screenshotting.
- **Headless checks beat the pane** when the user hides it (rAF stops): `agent-browser --session kq6` (Chrome for
  Testing from the Playwright cache, `--executable-path` on first launch). To land on a scene's hold, scroll Lenis so
  the panel's top sits at `innerHeight / 2` (`lenis.scrollTo(y, { immediate: true, force: true })`), wait ~10 s, then
  hide `.sc__panel`, `.pillnav`, `.nav` before the screenshot. Reload changed modules and tiles with
  `fetch(url, { cache: 'reload' })` first. `performance` keeps only 250 resource entries unless raised.
- **Markers sit on the ground** (radius 1.000002): a lift of 6 km (the old 1.001) put labels ~300 px off their place
  on tilted city views.
- Painted canvases are bottom-up (`setTransform(1, 0, 0, -1, 0, H)`): row 0 is the south edge, so a pixel sampled at
  the top of the canvas is the south of the box. Colours reach the screen close to linear: `SHELF` (44, 52, 70) shows
  as about (5, 7, 12), so judge map colours from screenshots, not from the numbers.
- **Module cache**: python's http.server lets the browser cache JS modules; a `?v=` on the page
  does not refresh them. `fetch(url, { cache: 'reload' })` each changed module, then reload.
- `data-count` is global: core.js animates every element with it. Use another attribute for
  labels that only look like numbers (the timeline uses `data-pos`).
- Globe progress is read from the ticker each frame, not from ScrollTrigger `onUpdate` — that
  callback is skipped when a jump lands outside the trigger range.
- `[hidden]` needs `display: none !important`, or `.btn`'s display shows hidden buttons.
- **Lenis undoes `window.scrollTo`** in the preview. To reach a section, click its sub-nav link
  and wheel-scroll, or clone the node into a fixed overlay for a screenshot.

- **Polygon winding**: d3 fills a counter-clockwise ring as "the whole world except this". CShapes and the Berlin WFS
  use GeoJSON order, so the build rewinds and the engine checks again (`upright`); a flooded one-colour globe means this.
- **Downloads from here are slow** (ETH ran at about 20 KB/s). Keep the inputs in `tools/.cache/` and rebuild offline.
- **Jumping to a scene in the preview**: the browser restores the old scroll after reload and Lenis animates slowly in a
  hidden pane. Use `(await import('../assets/js/core.js')).lenis.scrollTo(y, { immediate: true })`, then nudge the wheel.
- Mono labels are upper-case; wrap "c." in `<span class="lc">` so "c.1989" stays lower-case.

## Not done
- Deployed 2026-10-22 with GitHub Pages from `main` (root): https://ukusliam-oss.github.io/meridian/
  The repo is public. Every push to `main` redeploys the live site.
- No automated browser tests; the data checks are `tools/check-econ.mjs` and `tools/check-lab.mjs`. For colour
  contrast, run `tools/contrast.js` in the preview (`const T = await import('/tools/contrast.js'); T.unfold(); T.audit()`):
  it lists text under WCAG AA. Load the theme fresh (localStorage `meridian:theme`) and turn transitions off first: a
  hidden preview pane never runs colour transitions, so switching theme in place gives false failures. Glass bars are
  measured against the page colour, not what is behind them.
- Economics: the chapter and the lab were reviewed by an Economics teacher on 2026-10-25. The Section A data room
  (`economics/data-room.html`) from the plan is not built. The chapter is live (pushing `main` deploys everything) and
  linked from the Economics hub with a "draft, not yet reviewed by a teacher" label; `engine-test.html` is reachable
  but unlinked and noindex.
- Geography: Tectonic hazards is a draft, not yet reviewed by a Geography teacher. Other topics are not started.
  `tools/build-terrain.mjs` reads the Geography chapters too: rerun it after adding scenes (slow: it downloads DEM).
- History chapters: only KQ6 exists (with its Paper 2 room, reviewed by a History teacher on 2026-10-25). Scenes have no field yet for the plan's
  "exam link" layer.
