// Paper and ink, drawn with three.js so the world engine can host them (plan §9.2–9.4). Nothing is downloaded: the
// paper is made in code, and the ink is a simulation run once, then played by a threshold (so scroll can rewind it).
//
// Paper (measured on Cartier's page: neutral, 92–99% bright, broad folds 2.5–7%, mid grain σ ≈ 0.4%, fibres along the
// folds): a height field of folds stretched along one diagonal, broad bright and dull bands, fibres, baked once per
// size into a texture; each frame reads it once and lights it, and adds a one-pixel grain.
//
// Ink (measured there: about twice the stone's width, an irregular front pushed to one side, a dark dull body, darkest
// just inside the front, a feathered edge that follows the paper, coloured light beside the stone): water spreading
// through paper is modelled by its arrival time. T(x) = the earliest time the wet front reaches x, found by relaxing
// T(x) = min over neighbours (T(n) + step / speed(x, direction)) on a coarse grid, where the speed comes from the
// paper (faster along its fibres, slower in its dense patches) and a slight drift. The front at time p is T = p. The
// pigment is densest where the front has only just arrived (it dries and settles there), so when the growth stops
// the edge stays dark, as in watercolour.
import {
  WebGLRenderTarget, HalfFloatType, RGBAFormat, LinearFilter, ShaderMaterial, Mesh, PlaneGeometry,
  Scene, OrthographicCamera, Vector2, Vector3, Color, NoBlending,
} from 'three';

const NOISE = /* glsl */`
  float h1(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    return mix(mix(h1(i), h1(i + vec2(1, 0)), f.x), mix(h1(i + vec2(0, 1)), h1(i + vec2(1, 1)), f.x), f.y); }
  float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 5; i++) { s += a * n2(p); p = p * 2.03 + 17.1; a *= .5; } return s; }
  mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }`;
const VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }';

// ── paper bake, two textures at one texel per CSS pixel, so a frame reads them and does no noise of its own:
//    A: r folds height, g broad bands, b fibres, a the ink edge's jitter; B: r the folds lit, g granulation, b pooling
const BAKE = /* glsl */`
  uniform vec2 uSize; uniform float uSeed; varying vec2 vUv; ${NOISE}
  const float ANG = -.42;
  float folds(vec2 p){ vec2 q = rot(ANG) * p; vec2 w = vec2(fbm(q * .0016 + uSeed), fbm(q * .0016 + 9.3 + uSeed));
    return fbm(q * vec2(.00045, .0015) + w * 1.2 + uSeed * 3.); }
  void main(){
    vec2 px = vUv * uSize;
    float band = smoothstep(.25, .85, fbm(rot(ANG) * px * vec2(.0004, .0011) + 4. + uSeed));
    vec2 r = rot(ANG) * px;
    float fib = n2(r * vec2(.03, .5)) * .6 + n2(r * vec2(.07, 1.1)) * .4;
    gl_FragColor = vec4(folds(px), band, fib, fbm(px * .05));
  }`;
const BAKE2 = /* glsl */`
  uniform sampler2D uA; uniform vec2 uSize; uniform vec3 uLight; varying vec2 vUv; ${NOISE}
  void main(){
    vec2 px = vUv * uSize, e = 1.5 / uSize;
    float h = texture2D(uA, vUv).r, hx = texture2D(uA, vUv + vec2(e.x, 0)).r - h, hy = texture2D(uA, vUv + vec2(0, e.y)).r - h;
    // a grazing light from the upper left on the folds (the page is y-down when drawn, so the slope's y flips)
    float lit = dot(normalize(vec3(-hx * 260., hy * 260., 1.)), normalize(uLight));
    gl_FragColor = vec4(lit, fbm(px * .09), fbm(px * .006 + 7.), 1.);
  }`;

// ── ink arrival time, relaxed on a grid of uSize cells; r = T (cells), g = the source's own speed noise ───────
const INK_INIT = /* glsl */`
  uniform vec2 uSize, uC; uniform float uR; varying vec2 vUv;
  void main(){ vec2 c = vUv * uSize; gl_FragColor = vec4(length(c - uC) <= uR ? 0. : 1e4, 0., 0., 1.); }`;
// the paper's speed for water, once per source: slow patches (dense paper), fast ones, a slight drift; in grid cells
const INK_SPEED = /* glsl */`
  uniform vec2 uSize, uC, uBias; uniform float uSeed; varying vec2 vUv; ${NOISE}
  void main(){
    vec2 c = vUv * uSize;
    float slow = fbm(c * .035 + uSeed) * .65 + fbm(c * .11 + uSeed * 2.) * .35;
    float speed = mix(.72, 1.28, smoothstep(.2, .8, slow)) / 1.08;
    speed *= 1. + dot(normalize(c - uC + 1e-4), uBias);
    gl_FragColor = vec4(speed, 0., 0., 1.);
  }`;
const INK_STEP = /* glsl */`
  uniform sampler2D uT, uS; uniform vec2 uSize; varying vec2 vUv;
  const vec2 OFF[16] = vec2[16](vec2(1, 0), vec2(-1, 0), vec2(0, 1), vec2(0, -1), vec2(1, 1), vec2(-1, 1), vec2(1, -1), vec2(-1, -1),
    vec2(2, 1), vec2(-2, 1), vec2(2, -1), vec2(-2, -1), vec2(1, 2), vec2(-1, 2), vec2(1, -2), vec2(-1, -2));
  void main(){
    vec2 px = 1. / uSize;
    float speed = texture2D(uS, vUv).r;
    vec2 fibre = vec2(cos(-.42), sin(-.42)); // water runs further along the fibres
    float t = texture2D(uT, vUv).r;
    // sixteen neighbours (the knight's moves too), so a front on even paper is round, not octagonal
    for (int k = 0; k < 16; k++) {
      vec2 o = OFF[k];
      float along = abs(dot(normalize(o), fibre));
      float s = speed * (1. + .25 * along * along);
      t = min(t, texture2D(uT, vUv + o * px).r + length(o) / s);
    }
    gl_FragColor = vec4(t, 0., 0., 1.);
  }`;

// ── composite: paper, its light, the ink, the object's shadow and the light it lets through ────────────────
const COMPOSITE = /* glsl */`
  uniform sampler2D uPaper, uPaper2, uT; uniform vec2 uCss, uInkSize; uniform float uDpr, uDark, uP, uFlood, uR, uTau, uFeather;
  uniform vec3 uInk, uStage, uLight; uniform vec3 uObj; uniform float uShade; // object centre (CSS px, y down) and radius; its presence
  varying vec2 vUv;
  float h1(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  void main(){
    vec2 uv = vec2(vUv.x, 1. - vUv.y), px = uv * uCss; // y down, like the page
    vec4 pp = texture2D(uPaper, uv), qq = texture2D(uPaper2, uv);
    float lit = qq.r;
    float grain = h1(floor(gl_FragCoord.xy)) - .5;
    float base = uDark > .5
      ? .052 + .032 * pp.g + .045 * (lit - .9) + .007 * (pp.b - .5) + .006 * grain
      : .922 + .078 * pp.g + .05 * (lit - .9) + .024 * (pp.b - .5) + .003 * grain;
    vec3 col = vec3(base) * (uDark > .5 ? vec3(.95, .97, 1.07) : vec3(1.));

    // ink: the front at uP (bloom) or uFlood (the whole page), in grid cells; the edge follows the paper's fibres
    vec2 g = uv * uInkSize;
    float T = texture2D(uT, vUv).r + (pp.b - .5) * 1.1 + (pp.a - .5) * 1.8; // the grid is y-up, like vUv; fibres fray the edge
    float p = max(uP, uFlood);
    float age = p - T;
    // a wide soft edge (the wet paper bleeds), a soft dark band a little inside it (the pigment settles as it dries)
    float wet = smoothstep(-uFeather, uFeather * .6, age);
    float ra = (age - uTau) / uTau;
    float rim = exp(-ra * ra);
    float gran = .84 + .22 * (1. - pp.r) + .22 * (qq.g - .5); // more pigment in the paper's valleys, a fine granulation
    // longer wet = more pigment (dense by the object, thinner towards the front), pooled and thin patches
    float body = (.42 + .3 * smoothstep(0., max(1., p * .9), age)) * (1. + .45 * (qq.b - .5));
    float dens = clamp(wet * (body + .5 * rim) * gran, 0., 1.);
    // the flood deepens the ink into the stage colour as it ages
    float deep = smoothstep(uR * .3, uR * 2.2, age) * step(.001, uFlood);
    // pigment as a filter (Beer–Lambert): light through a thinner layer is lighter but keeps its hue
    float il = dot(uInk, vec3(.2126, .7152, .0722));
    vec3 pig = mix(clamp(mix(uInk, vec3(il), .12) + .04, .02, 1.), uStage + .02, deep);
    float dl = clamp(dens + deep, 0., 1.);
    if (uDark > .5) col = mix(col + uInk * dens * .5 * (.6 + .4 * rim), uStage, deep);
    else col *= pow(pig, vec3(dl * 1.15));
    // the object: its soft shadow on the paper (down and right of the light) and the coloured light through it
    vec2 d = px - uObj.xy; float R = uObj.z, dist = length(d) / R; vec2 dir = d / max(1e-3, length(d));
    vec2 away = -normalize(uLight.xy * vec2(1, -1));
    float sh = exp(-max(0., length(d - away * R * .12) / R - .92) * 3.2) * .2 * (1. - deep) * uShade;
    if (dist > 1.) col *= 1. - sh * (1. - dens * .4);
    float glow = exp(-max(0., dist - 1.) * 3.2) * smoothstep(.55, 1., dot(dir, away) * .5 + .5) * smoothstep(0., uR * .5, p);
    col = mix(col, max(col, uInk * 1.15 + .08), glow * .75 * (1. - deep) * uShade); // light through the object, on the paper
    gl_FragColor = vec4(col, 1.);
  }`;

const quad = mat => { const m = new Mesh(new PlaneGeometry(2, 2), mat); m.frustumCulled = false; const s = new Scene(); s.add(m); return s; };
const cam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
const rt = (w, h, type) => new WebGLRenderTarget(w, h, { type, format: RGBAFormat, minFilter: LinearFilter, magFilter: LinearFilter, depthBuffer: false });

// a sheet of paper the size of the canvas, with ink that can grow from one object and flood the page
export function createSheet(renderer, { seed = 1.7, cell = 3, dark = false } = {}) {
  const bakeM = new ShaderMaterial({ vertexShader: VERT, fragmentShader: BAKE, uniforms: { uSize: { value: new Vector2() }, uSeed: { value: seed } }, blending: NoBlending });
  const bake2M = new ShaderMaterial({ vertexShader: VERT, fragmentShader: BAKE2, uniforms: { uA: { value: null }, uSize: { value: new Vector2() }, uLight: { value: new Vector3(-.55, .65, .9) } }, blending: NoBlending });
  const initM = new ShaderMaterial({ vertexShader: VERT, fragmentShader: INK_INIT, uniforms: { uSize: { value: new Vector2() }, uC: { value: new Vector2() }, uR: { value: 0 } }, blending: NoBlending });
  const speedM = new ShaderMaterial({ vertexShader: VERT, fragmentShader: INK_SPEED, uniforms: { uSize: { value: new Vector2() }, uC: { value: new Vector2() }, uBias: { value: new Vector2(.14, -.05) }, uSeed: { value: seed * 5 } }, blending: NoBlending });
  const stepM = new ShaderMaterial({ vertexShader: VERT, fragmentShader: INK_STEP, uniforms: { uT: { value: null }, uS: { value: null }, uSize: { value: new Vector2() } }, blending: NoBlending });
  const compM = new ShaderMaterial({
    vertexShader: VERT, fragmentShader: COMPOSITE, blending: NoBlending, depthTest: false,
    uniforms: {
      uShade: { value: 1 }, uPaper: { value: null }, uPaper2: { value: null }, uT: { value: null }, uCss: { value: new Vector2() }, uInkSize: { value: new Vector2() }, uDpr: { value: 1 },
      uDark: { value: dark ? 1 : 0 }, uFeather: { value: 4 }, uP: { value: -1e4 }, uFlood: { value: -1e4 }, uR: { value: 30 }, uTau: { value: 6 },
      uInk: { value: new Color('#6d3fd0') }, uStage: { value: new Color('#05060a').convertLinearToSRGB() }, uLight: { value: new Vector3(-.55, .65, .9) },
      uObj: { value: new Vector3(0, 0, 1) },
    },
  });
  const sBake = quad(bakeM), sBake2 = quad(bake2M), sInit = quad(initM), sSpeed = quad(speedM), sStep = quad(stepM), sComp = quad(compM);
  let paper = null, paper2 = null, tA = null, tB = null, tS = null, css = [0, 0], cells = [0, 0], obj = null;

  const relight = () => {
    bake2M.uniforms.uA.value = paper.texture; bake2M.uniforms.uSize.value.set(...css);
    renderer.setRenderTarget(paper2); renderer.render(sBake2, cam); renderer.setRenderTarget(null);
  };
  const api = {
    // bake the paper for a page of w × h CSS px (call on resize)
    resize(w, h) {
      css = [w, h];
      paper?.dispose(); paper2?.dispose(); paper = rt(w, h, HalfFloatType); paper2 = rt(w, h, HalfFloatType);
      bakeM.uniforms.uSize.value.set(w, h);
      renderer.setRenderTarget(paper); renderer.render(sBake, cam);
      relight();
      compM.uniforms.uPaper.value = paper.texture; compM.uniforms.uPaper2.value = paper2.texture; compM.uniforms.uCss.value.set(w, h);
      if (obj) api.source(...obj);
    },
    // the ink's source: a disc at (x, y) CSS px, radius r. Relaxes the arrival time over the whole page.
    source(x, y, r) {
      obj = [x, y, r];
      cells = [Math.ceil(css[0] / cell), Math.ceil(css[1] / cell)];
      tA?.dispose(); tB?.dispose(); tA = rt(...cells, HalfFloatType); tB = rt(...cells, HalfFloatType);
      const c = new Vector2(x / cell, (css[1] - y) / cell);
      initM.uniforms.uSize.value.set(...cells); initM.uniforms.uC.value.copy(c); initM.uniforms.uR.value = r / cell;
      renderer.setRenderTarget(tA); renderer.render(sInit, cam);
      tS?.dispose(); tS = rt(...cells, HalfFloatType);
      speedM.uniforms.uSize.value.set(...cells); speedM.uniforms.uC.value.copy(c);
      renderer.setRenderTarget(tS); renderer.render(sSpeed, cam);
      stepM.uniforms.uSize.value.set(...cells); stepM.uniforms.uS.value = tS.texture;
      // enough sweeps for the front to cross the page from the disc (each sweep moves it one or two cells)
      const n = Math.ceil(Math.hypot(...cells) * 0.9);
      const t0 = performance.now();
      for (let k = 0; k < n; k++) {
        stepM.uniforms.uT.value = tA.texture; renderer.setRenderTarget(tB); renderer.render(sStep, cam);
        [tA, tB] = [tB, tA];
      }
      renderer.readRenderTargetPixels(tA, 0, 0, 1, 1, new Uint16Array(4)); // wait for the GPU, so the time is real
      renderer.setRenderTarget(null);
      api.stats.inkMs = performance.now() - t0; api.stats.sweeps = n;
      compM.uniforms.uT.value = tA.texture; compM.uniforms.uInkSize.value.set(...cells);
      compM.uniforms.uObj.value.set(x, y, r); compM.uniforms.uR.value = r / cell; compM.uniforms.uTau.value = r / cell * .3; compM.uniforms.uFeather.value = r / cell * .38;
    },
    // how far the bloom has grown, as a multiple of the object's radius beyond its edge (Cartier's ≈ 1.06)
    set bloom(k) { compM.uniforms.uP.value = obj && k > 0 ? k * obj[2] / cell : -1e4; },
    // the flood: 0 none … 1 the whole page is ink, deepened into the stage colour
    set flood(f) { compM.uniforms.uFlood.value = f <= 0 ? -1e4 : f * Math.hypot(...cells) * 1.25; },
    // how present the object is (0 not yet there: no shadow, no light through it)
    set shade(v) { compM.uniforms.uShade.value = v; }, get shade() { return compM.uniforms.uShade.value; },
    // the globe's disc on the screen now (CSS px), for its shadow and the light it lets through
    set object([x, y, r]) { compM.uniforms.uObj.value.set(x, y, r); },
    set ink(hex) { compM.uniforms.uInk.value.set(hex).convertLinearToSRGB(); },
    set dark(on) { compM.uniforms.uDark.value = on ? 1 : 0; },
    set light(v) { compM.uniforms.uLight.value.copy(v); bake2M.uniforms.uLight.value.copy(v); if (paper) relight(); },
    draw(target = null) { renderer.setRenderTarget(target); renderer.render(sComp, cam); },
    stats: { inkMs: 0, sweeps: 0 },
    dispose() { [paper, paper2, tA, tB, tS].forEach(t => t?.dispose()); [bakeM, bake2M, initM, speedM, stepM, compM].forEach(m => m.dispose()); },
  };
  return api;
}
