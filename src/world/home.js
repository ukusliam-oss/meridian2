// The home's stage (design plan §6.3, after Cartier's home): one sheet of paper and, in the middle, a row of small globes
// drawn in ink, one per chapter, as Cartier lays out its stones. Each globe is the chapter's paper globe in miniature:
// the same ink map as the chapter's threshold (src/world/engine.js, uInkMap), turned to the chapter's region and drawn
// in its subject's ink. A hover blooms ink round a globe (material.js, one kept field per globe); scrolling past the
// subjects floods the page into the stage's night. The page (assets/js/home.js) says where each globe is every frame.
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, SphereGeometry, ShaderMaterial, CanvasTexture, Vector3, Color,
  LinearMipmapLinearFilter,
} from 'three';
import { feature } from 'topojson-client';
import land110 from 'world-atlas/land-110m.json';
import { createSheet } from './material.js';

const DEG = Math.PI / 180;
const VERT = /* glsl */`
  varying vec3 vN; varying vec3 vW; varying vec2 vUv;
  void main() {
    vUv = uv; vN = normalize(mat3(modelMatrix) * normal);
    vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }`;
// the chapter's paper globe (engine.js, uInkMap) without the real globe under it: the sea is the paper, the land a
// watercolour wash of the ink, a 15° graticule with a stronger equator, the coasts and the limb fine ink lines; a ring
// marks a chapter's place (uFocus); uDye soaks the drawing into the night as the page floods
const FRAG = /* glsl */`
  uniform sampler2D uLandM; uniform vec3 uInkCol, uLight, uFocus, uDisc; uniform float uAlpha, uDye, uZoom;
  varying vec3 vN; varying vec3 vW; varying vec2 vUv;
  void main() {
    vec3 n = normalize(vN), v = normalize(cameraPosition - vW);
    float sun = smoothstep(-0.45, 0.65, dot(n, normalize(uLight)));
    float lm = texture2D(uLandM, vUv).r, aw = clamp(fwidth(lm), 1e-4, 0.05); // capped: near the poles u's derivative explodes and the coast would smear into a ring
    float landM = smoothstep(0.5 - aw, 0.5 + aw, lm);
    float coast = 1.0 - smoothstep(0.0, aw * 1.3, abs(lm - 0.5));
    float g2 = 0.5 + 0.25 * sin(vUv.x * 900.0 + sin(vUv.y * 700.0) * 3.0) * sin(vUv.y * 820.0 + vUv.x * 160.0);
    vec3 paperC = vec3(0.94) * (0.9 + 0.1 * sun);
    float dens = 0.61 * (0.88 + 0.24 * g2);
    vec3 ink = paperC * pow(clamp(uInkCol + 0.04, 0.02, 1.0), vec3(dens * landM));
    vec2 ll = vec2(vUv.x * 360.0 - 180.0, vUv.y * 180.0 - 90.0);
    vec2 gd = abs(fract(ll / 15.0 + 0.5) - 0.5) * 15.0, fw = max(fwidth(ll), vec2(1e-4));
    float grat = max(1.0 - smoothstep(0.0, fw.x * 1.1, gd.x), 1.0 - smoothstep(0.0, fw.y * 1.1, gd.y));
    float eq = 1.0 - smoothstep(0.0, fw.y * 1.5, abs(ll.y));
    float ndv = max(dot(n, v), 0.0), limb = 1.0 - smoothstep(0.0, fwidth(ndv) * 2.2, ndv - 0.002);
    // a close-up (uZoom > 1) is a lens on the globe: the sphere drawn larger and cut to the disc, its rim an ink line
    float cut = 1.0;
    if (uZoom > 1.0) {
      float dd = length(gl_FragCoord.xy - uDisc.xy), px = 1.0;
      cut = 1.0 - smoothstep(uDisc.z - px, uDisc.z, dd);
      limb = max(limb * 0.0, 1.0 - smoothstep(0.0, 1.6 * px, abs(dd - uDisc.z + 1.2 * px)));
    }
    // the chapter's place: a fine ring of ink about 4° across, and a dot at its centre
    float ring = 0.0;
    if (uFocus.z > 0.5) {
      vec2 d = (ll - uFocus.xy) * vec2(cos(uFocus.y * 0.01745), 1.0); float r = length(d), fr = max(fwidth(r), 1e-4);
      ring = (1.0 - smoothstep(0.0, fr * 1.4, abs(r - 4.2))) + (1.0 - smoothstep(0.6, 0.6 + fr * 1.4, r));
    }
    ink = mix(ink, uInkCol * 0.7, clamp(coast * 0.75 + grat * 0.15 + eq * 0.25 + limb * 0.8 + ring * 0.9, 0.0, 1.0));
    vec3 soaked = ink * pow(clamp(uInkCol + 0.04, 0.02, 1.0), vec3(uDye * 2.6));
    vec3 night = uInkCol * 0.2 + 0.015;
    ink = mix(soaked, mix(night, night * 1.9 + 0.01, landM * 0.8), smoothstep(0.55, 1.0, uDye));
    gl_FragColor = vec4(ink, uAlpha * cut);
  }`;

// Natural Earth land (1:110m, world-atlas) filled at 2048 × 1024 and blurred, so its 0.5 contour is a smooth coast
function landMap(phone) {
  const Wm = phone ? 1024 : 2048, Hm = Wm / 2;
  const c = document.createElement('canvas'); c.width = Wm; c.height = Hm;
  const g = c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, Wm, Hm); g.fillStyle = '#fff';
  const X = lon => (lon + 180) / 360 * Wm, Y = lat => (90 - lat) / 180 * Hm;
  for (const f of feature(land110, land110.objects.land).features) {
    const geo = f.geometry; if (!geo) continue;
    const polys = geo.type === 'Polygon' ? [geo.coordinates] : geo.coordinates;
    const path = new Path2D();
    for (const poly of polys) for (const ring of poly) { ring.forEach(([x, y], k) => (k ? path.lineTo(X(x), Y(y)) : path.moveTo(X(x), Y(y)))); path.closePath(); }
    g.fill(path, 'evenodd');
  }
  const out = document.createElement('canvas'); out.width = Wm; out.height = Hm;
  const o = out.getContext('2d');
  if ('filter' in o) { o.filter = 'blur(1.5px)'; o.drawImage(c, 0, 0); } else o.drawImage(c, 0, 0);
  const t = new CanvasTexture(out); t.minFilter = LinearMipmapLinearFilter; t.anisotropy = 8;
  return t;
}

export function createHome(host, { phone = false, reduced = false } = {}) {
  const canvas = document.createElement('canvas');
  let renderer;
  try { renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' }); }
  catch { return null; }
  host.appendChild(canvas);
  renderer.autoClear = false;
  const sheet = createSheet(renderer, { cell: 3 });
  sheet.shade = 0; sheet.glow = 0; // drawings on paper cast no shadow and let no light through
  const camera = new PerspectiveCamera(30, 1, 0.1, 100);
  const light = new Vector3(-0.55, 0.65, 0.9);
  const land = landMap(phone);
  const geo = new SphereGeometry(1, phone ? 96 : 160, phone ? 64 : 112);
  const base = new ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG, transparent: true,
    uniforms: { uLandM: { value: land }, uInkCol: { value: new Vector3() }, uLight: { value: light }, uFocus: { value: new Vector3() }, uDisc: { value: new Vector3() }, uAlpha: { value: 1 }, uDye: { value: 0 }, uZoom: { value: 1 } },
  });
  const globes = new Map(); // key → { scene, group, mat, lon, lat, x, y, r, a }
  let W = 1, H = 1, dirty = true, live = true, flood = 0, bloomKey = null, bloomK = 0, raf = 0;
  const t0 = performance.now();
  const stats = { frames: 0, cpu: 0 };

  // a globe of radius 1 covers the disc (x, y, r) in CSS px: the camera stands back by the distance that makes its
  // silhouette r px, and the view is offset so its centre lands on (x, y)
  function aim(x, y, r) {
    const dist = 1 / Math.sin(Math.atan(Math.tan(camera.fov / 2 * DEG) * r / (H / 2)));
    camera.aspect = W / H; camera.position.set(0, 0, dist);
    camera.setViewOffset(W, H, -(x - W / 2), -(y - H / 2), W, H); camera.updateProjectionMatrix();
  }
  function resize() {
    W = host.clientWidth || innerWidth; H = host.clientHeight || innerHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.setSize(W, H, false);
    sheet.resize(W, H); bloomKey = null; sheet.bloom = 0;
    dirty = true;
  }
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (document.hidden) return;
    const drift = reduced ? 0 : Math.sin((now - t0) / 1000 * 0.07) * 9; // the globes turn a little, all together
    const any = [...globes.values()].some(g => g.a > 0.002);
    if (!dirty && !(live && any && !reduced)) return;
    dirty = false;
    const c0 = performance.now();
    renderer.setRenderTarget(null); renderer.clear(); sheet.draw();
    for (const g of globes.values()) {
      if (g.a <= 0.002 || g.r < 1) continue;
      g.group.rotation.set(g.lat * DEG, -(g.lon + drift) * DEG, 0);
      g.mat.uniforms.uAlpha.value = g.a; g.mat.uniforms.uDye.value = 0; // the drawings fade as the page floods (dyed, they read as stickers)
      const dpr = renderer.getPixelRatio();
      g.mat.uniforms.uZoom.value = g.zoom; g.mat.uniforms.uDisc.value.set(g.x * dpr, (H - g.y) * dpr, g.r * dpr);
      aim(g.x, g.y, g.r * g.zoom); renderer.render(g.scene, camera);
    }
    stats.frames++; stats.cpu = performance.now() - c0;
  }
  new ResizeObserver(resize).observe(host);
  resize(); raf = requestAnimationFrame(frame);

  return {
    // one globe per chapter: { key, lon, lat, ink, focus: [lon, lat], zoom (> 1: a lens on the globe) }
    add({ key, lon, lat, ink, focus, zoom = 1 }) {
      const mat = base.clone();
      const c = new Color(ink).convertLinearToSRGB(); mat.uniforms.uInkCol.value.set(c.r, c.g, c.b);
      mat.uniforms.uLandM.value = land; mat.uniforms.uLight.value = light;
      mat.uniforms.uFocus.value.set(focus ? focus[0] : 0, focus ? focus[1] : 0, focus ? 1 : 0);
      const mesh = new Mesh(geo, mat); mesh.rotation.y = -Math.PI / 2; // equirectangular u = 0 at lon −180, as the engine
      const group = new Group(); group.add(mesh);
      const scene = new Scene(); scene.add(group);
      globes.set(key, { scene, group, mat, lon, lat, ink, zoom, x: 0, y: 0, r: 0, a: 0 });
    },
    // where a globe is now (CSS px) and how present (0 … 1)
    place(key, x, y, r, a) {
      const g = globes.get(key); if (!g) return;
      if (g.x !== x || g.y !== y || g.r !== r || g.a !== a) { g.x = x; g.y = y; g.r = r; g.a = a; dirty = true; }
    },
    // ink round one globe (k: reach in globe radii; 0 none); its field is worked out once per place and kept
    bloom(key, k) {
      const g = key && globes.get(key);
      if (g && key !== bloomKey) { sheet.ink = g.ink; sheet.source(Math.round(g.x), Math.round(g.y), Math.round(g.r), key); bloomKey = key; }
      if (k !== bloomK) { bloomK = k; sheet.bloom = g ? k : 0; dirty = true; }
    },
    // work out a globe's bloom ahead (in idle time), so the first hover does not wait for it
    prepare(key) {
      const g = globes.get(key); if (!g || g.r < 1) return;
      const keep = bloomKey; sheet.source(Math.round(g.x), Math.round(g.y), Math.round(g.r), key);
      const k = keep && globes.get(keep);
      if (k) sheet.source(Math.round(k.x), Math.round(k.y), Math.round(k.r), keep); else bloomKey = null;
      dirty = true;
    },
    // 0 the paper … 1 the stage's night: the ink floods from the last bloom's globe and the drawings soak into the dark
    setFlood(f) { if (f !== flood) { flood = f; sheet.flood = f; dirty = true; } },
    get flood() { return flood; },
    set live(v) { live = v; dirty = true; },
    stats,
    destroy() { cancelAnimationFrame(raf); sheet.dispose(); renderer.dispose(); },
  };
}
