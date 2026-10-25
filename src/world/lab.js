// The design lab's stage (design/lab.html, phase 0 of the design plan): paper and ink from material.js, and a lit
// sphere standing in for the globe, so the materials can be judged and measured before they reach a chapter.
import { WebGLRenderer, Scene, PerspectiveCamera, Mesh, SphereGeometry, ShaderMaterial, Color, Vector3 } from 'three';
import { createSheet } from './material.js';

const SPHERE_V = 'varying vec3 vN; varying vec3 vW; void main(){ vN = normalize(normalMatrix * normal); vec4 w = modelViewMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * w; }';
const SPHERE_F = /* glsl */`
  uniform vec3 uCol, uLight; varying vec3 vN; varying vec3 vW;
  void main(){
    vec3 n = normalize(vN), v = normalize(-vW), l = normalize(uLight);
    float d = max(0., dot(n, l)), rim = pow(1. - max(0., dot(n, v)), 3.);
    vec3 c = uCol * (.18 + .9 * d) + pow(max(0., dot(reflect(-l, n), v)), 48.) * .7 + uCol * rim * .5;
    gl_FragColor = vec4(c, 1.);
  }`;

export function createLab(host, { dark = false, ink = '#6d3fd0' } = {}) {
  const canvas = document.createElement('canvas'); host.appendChild(canvas);
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.autoClear = false;
  const sheet = createSheet(renderer, { dark });
  sheet.ink = ink;
  const scene = new Scene(), camera = new PerspectiveCamera(30, 1, 0.1, 100);
  const light = new Vector3(-.55, .65, .9);
  const mat = new ShaderMaterial({ vertexShader: SPHERE_V, fragmentShader: SPHERE_F, uniforms: { uCol: { value: new Color(ink).convertLinearToSRGB() }, uLight: { value: light } } });
  const ball = new Mesh(new SphereGeometry(1, 96, 64), mat); scene.add(ball);
  let W = 0, H = 0, obj = null, dirty = true;
  const stats = { drawMs: [], frames: 0 };

  // the sphere at (x, y) CSS px with radius r: the camera is placed so that it covers exactly that disc
  function place() {
    const { x, y, r } = obj;
    const dist = 1 / Math.sin(Math.atan(Math.tan(camera.fov / 2 * Math.PI / 180) * r / (H / 2)));
    camera.aspect = W / H; camera.position.set(0, 0, dist); camera.updateProjectionMatrix();
    camera.setViewOffset(W, H, -(x - W / 2), -(y - H / 2), W, H);
  }
  function resize() {
    W = host.clientWidth; H = host.clientHeight;
    renderer.setPixelRatio(Math.min(2, devicePixelRatio)); renderer.setSize(W, H, false);
    sheet.resize(W, H);
    if (obj) { place(); sheet.source(obj.x, obj.y, obj.r); }
    dirty = true;
  }
  function frame() {
    requestAnimationFrame(frame);
    if (!dirty) return;
    dirty = false;
    const t = performance.now();
    renderer.clear(); sheet.draw();
    if (obj) renderer.render(scene, camera);
    stats.drawMs.push(performance.now() - t); stats.frames++;
  }
  new ResizeObserver(resize).observe(host);
  resize(); requestAnimationFrame(frame);

  return {
    object(x, y, r) { obj = { x, y, r }; place(); sheet.source(x, y, r); dirty = true; },
    set bloom(k) { sheet.bloom = k; dirty = true; },
    set flood(f) { sheet.flood = f; dirty = true; },
    set ink(hex) { sheet.ink = hex; mat.uniforms.uCol.value.set(hex).convertLinearToSRGB(); dirty = true; },
    set dark(on) { sheet.dark = on; dirty = true; },
    stats, sheet, renderer,
  };
}
