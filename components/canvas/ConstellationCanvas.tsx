"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { FAQS } from "@/lib/data";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useIsMobile } from "@/hooks/useMediaQuery";

/* ==================================================================== *
 * The Constellation. The final chapter is a quiet night sky suspended in
 * darkness. Every question is a single star that always exists, placed
 * naturally — no grid, no sphere, no symmetry. Almost nothing moves.
 *
 * As the visitor drifts through, one star at a time becomes the focus:
 * the surrounding stars dim a little, the chosen star grows bright, then
 * it — and only it — breaks briefly into delicate particles that travel
 * into place and assemble its question. Once the words have formed the
 * particles disappear, the answer settles in beneath, and the sky returns
 * to stillness. The beauty is in the restraint; the stars carry it.
 * ==================================================================== */

const N = FAQS.length;
const FB = process.env.NEXT_PUBLIC_BASE_PATH || "";
const FONT_BOLD = `${FB}/fonts/syne-700.ttf`;
const FONT_REG = `${FB}/fonts/syne-400.ttf`;

function clamp(x: number, a: number, b: number) { return x < a ? a : x > b ? b : x; }
const clamp01 = (x: number) => clamp(x, 0, 1);
function smoothstep(a: number, b: number, x: number) {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}

// Each star's deliberate place in the sky — winding gently through depth,
// scattered left and right, high and low. Naturally positioned, never a
// pattern. The camera drifts forward (−z) and each becomes the focus in turn.
const STARS: [number, number, number][] = [
  [-3.4, 1.3, 1.0],
  [2.9, 2.1, -3.6],
  [-1.5, -2.0, -8.2],
  [3.4, -0.5, -13.2],
  [-3.3, 1.4, -18.6],
  [1.1, 2.6, -24.1],
  [-2.5, -1.7, -29.6],
  [2.7, 0.3, -35.0],
];
const STAR_V = STARS.map((s) => new THREE.Vector3(s[0], s[1], s[2]));

// a sparse, elegant set of faint links — a constellation figure, not a mesh
const LINKS: [number, number][] = [
  [0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 6], [5, 7], [6, 7],
];
function incidentLinks(i: number): [number, number][] {
  return LINKS.filter(([a, b]) => a === i || b === i);
}

// each star owns a stretch of the scroll. Within it the selection rises,
// holds (the words are read), then falls — between stretches the sky rests.
const HALF = 0.5 / N;
const EDGE = 0.56 * HALF;
const centerP = (i: number) => (i + 0.5) / N;
function selectAt(p: number, i: number): number {
  const c = centerP(i);
  const up = smoothstep(c - HALF, c - HALF + EDGE, p);
  const down = 1 - smoothstep(c + HALF - EDGE, c + HALF, p);
  return up * down;
}

/* ------------------------- soft light sprite ------------------------- */
function glowTexture(): THREE.Texture | null {
  if (typeof document === "undefined") return null;
  const s = 128;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.22, "rgba(255,255,255,0.75)");
  g.addColorStop(0.5, "rgba(255,255,255,0.16)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const t = new THREE.CanvasTexture(c);
  t.needsUpdate = true;
  return t;
}
const GLOW = glowTexture();

/* --------- sampling a question into a delicate cloud of points --------- */
// The particles genuinely spell the words: we lay the question out, read the
// lit pixels, and keep a fixed, sparse set of them mapped to world units that
// match the drei heading. Precomputed once per question — no runtime cost.
const PCOUNT = 300;
const HEAD_FONT = 0.17; // world units, must match the heading <Text> fontSize
const HEAD_WRAP = 560;  // sampler wrap width in px (heading maxWidth = this * scale)
const HEAD_Y = 0.28;    // heading sits a little above the anchor
function sampleText(text: string): Float32Array {
  const out = new Float32Array(PCOUNT * 2);
  if (typeof document === "undefined") return out;
  const fontPx = 46;
  const maxW = HEAD_WRAP;
  const lh = fontPx * 1.16;
  const font = `700 ${fontPx}px 'Syne', system-ui, -apple-system, Segoe UI, sans-serif`;
  const cv = document.createElement("canvas");
  const ctx = cv.getContext("2d");
  if (!ctx) return out;

  // wrap into lines
  ctx.font = font;
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);

  const width = maxW + 48;
  const height = Math.ceil(lines.length * lh + 40);
  cv.width = width;
  cv.height = height;
  ctx.font = font; // context resets when the canvas is resized
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  lines.forEach((ln, i) => ctx.fillText(ln, width / 2, 20 + i * lh));

  const data = ctx.getImageData(0, 0, width, height).data;
  const pts: number[] = [];
  const step = 2;
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      if (data[(y * width + x) * 4 + 3] > 130) pts.push(x, y);
    }
  }
  const found = pts.length / 2;
  const worldScale = HEAD_FONT / fontPx;
  const cx = width / 2;
  const cy = height / 2;
  for (let i = 0; i < PCOUNT; i += 1) {
    // even, shuffled coverage of the lit pixels (repeat if the text is short)
    let k: number;
    if (found > 0) {
      const j = Math.floor(((i * 0.61803398875) % 1) * found + (i % Math.max(1, Math.floor(found / PCOUNT) + 1)));
      k = (j % found) * 2;
    } else {
      k = 0;
    }
    const px = pts[k] ?? cx;
    const py = pts[k + 1] ?? cy;
    out[i * 2] = (px - cx) * worldScale;
    out[i * 2 + 1] = (cy - py) * worldScale;
  }
  return out;
}

/* ----------------------------- shared bus ----------------------------- */
type Shared = {
  p: number;                 // scroll 0..1
  active: number;            // focused star index
  m: number;                 // its selection 0..1 (rise → hold → fall)
  globalSel: number;         // strongest selection anywhere (for gentle dimming)
  anchor: THREE.Vector3;     // where the words form, in front of the camera
  right: THREE.Vector3;
  up: THREE.Vector3;
  appear: number;            // opening fade 0..1
};

/* ------------------------------- the sky ------------------------------ */
// A very sparse scatter of faint far stars, so the dark has depth. Static,
// barely twinkling — the night sky behind the constellation.
function BackdropStars() {
  const geo = useMemo(() => {
    const count = 130;
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    const sz = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      pos[i * 3] = (Math.random() - 0.5) * 46;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 2] = -6 - Math.random() * 46;
      seed[i] = Math.random();
      sz[i] = 0.4 + Math.random() * 0.7;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.Float32BufferAttribute(seed, 1));
    g.setAttribute("aSize", new THREE.Float32BufferAttribute(sz, 1));
    return g;
  }, []);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uTex: { value: GLOW }, uAppear: { value: 0 } },
        vertexShader: `
          attribute float aSeed; attribute float aSize;
          uniform float uTime; varying float vA;
          void main(){
            float tw = 0.75 + 0.25 * sin(uTime * 0.4 + aSeed * 6.2831);
            vA = tw;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = aSize * (220.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: `
          uniform sampler2D uTex; uniform float uAppear; varying float vA;
          void main(){
            vec4 t = texture2D(uTex, gl_PointCoord);
            gl_FragColor = vec4(vec3(0.8, 0.86, 1.0), t.a * vA * 0.22 * uAppear);
          }`,
      }),
    [],
  );
  useFrame((s) => {
    mat.uniforms.uTime.value = s.clock.elapsedTime;
  });
  return <points geometry={geo} material={mat} />;
}

/* --------------------------- constellation lines --------------------------- */
function Links({ shared }: { shared: Shared }) {
  const baseGeo = useMemo(() => {
    const pos: number[] = [];
    for (const [a, b] of LINKS) {
      pos.push(STAR_V[a].x, STAR_V[a].y, STAR_V[a].z, STAR_V[b].x, STAR_V[b].y, STAR_V[b].z);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    return g;
  }, []);
  const baseMat = useMemo(
    () => new THREE.LineBasicMaterial({ color: new THREE.Color(0.5, 0.6, 0.85), transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false }),
    [],
  );
  // the active star's own links brighten a touch when it is selected
  const hiGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(4 * 2 * 3), 3));
    return g;
  }, []);
  const hiMat = useMemo(
    () => new THREE.LineBasicMaterial({ color: new THREE.Color(0.62, 0.72, 1.0), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
    [],
  );
  useFrame(() => {
    baseMat.opacity = 0.03 + 0.03 * shared.appear;
    const edges = incidentLinks(shared.active);
    const arr = hiGeo.attributes.position.array as Float32Array;
    let n = 0;
    for (const [a, b] of edges) {
      arr[n++] = STAR_V[a].x; arr[n++] = STAR_V[a].y; arr[n++] = STAR_V[a].z;
      arr[n++] = STAR_V[b].x; arr[n++] = STAR_V[b].y; arr[n++] = STAR_V[b].z;
    }
    hiGeo.setDrawRange(0, edges.length * 2);
    hiGeo.attributes.position.needsUpdate = true;
    hiMat.opacity = 0.12 * shared.globalSel * shared.appear;
  });
  return (
    <group>
      <lineSegments geometry={baseGeo} material={baseMat} />
      <lineSegments geometry={hiGeo} material={hiMat} />
    </group>
  );
}

/* ------------------------------ the stars ------------------------------ */
function Stars({ shared }: { shared: Shared }) {
  const geo = useMemo(() => {
    const pos = new Float32Array(N * 3);
    const seed = new Float32Array(N);
    const bright = new Float32Array(N);
    for (let i = 0; i < N; i += 1) {
      pos[i * 3] = STAR_V[i].x; pos[i * 3 + 1] = STAR_V[i].y; pos[i * 3 + 2] = STAR_V[i].z;
      seed[i] = Math.random();
      bright[i] = 1;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.Float32BufferAttribute(seed, 1));
    g.setAttribute("aBright", new THREE.Float32BufferAttribute(bright, 1));
    return g;
  }, []);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uTex: { value: GLOW }, uAppear: { value: 0 } },
        vertexShader: `
          attribute float aSeed; attribute float aBright;
          uniform float uTime; varying float vB;
          void main(){
            float tw = 0.9 + 0.1 * sin(uTime * 0.5 + aSeed * 6.2831);
            vB = aBright * tw;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = (0.5 + 1.1 * aBright) * (300.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: `
          uniform sampler2D uTex; uniform float uAppear; varying float vB;
          void main(){
            vec4 t = texture2D(uTex, gl_PointCoord);
            // a warm-white core inside a soft cool halo
            float d = distance(gl_PointCoord, vec2(0.5));
            vec3 core = vec3(1.0, 0.97, 0.9);
            vec3 halo = vec3(0.72, 0.82, 1.0);
            vec3 col = mix(core, halo, smoothstep(0.0, 0.42, d));
            gl_FragColor = vec4(col, t.a * vB * 0.95 * uAppear);
          }`,
      }),
    [],
  );
  useFrame((s) => {
    mat.uniforms.uTime.value = s.clock.elapsedTime;
    mat.uniforms.uAppear.value = shared.appear;
    const attr = geo.attributes.aBright as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    const dissolve = smoothstep(0.1, 0.32, shared.m); // the active star breaks apart
    for (let i = 0; i < N; i += 1) {
      arr[i] = i === shared.active ? 1 - dissolve : 1 - 0.5 * shared.globalSel;
    }
    attr.needsUpdate = true;
  });
  return <points geometry={geo} material={mat} />;
}

/* -------------------- the transformation particles -------------------- */
// One delicate cloud, reused for whichever star is active. It emerges from the
// star, travels into place to assemble the question, then vanishes — present
// only during the brief transformation, never as an ambient effect.
function Particles({ shared }: { shared: Shared }) {
  const samples = useMemo(() => FAQS.map((f) => sampleText(f.q)), []);
  const geo = useMemo(() => {
    const position = new Float32Array(PCOUNT * 3);
    const aText = new Float32Array(PCOUNT * 2);
    const aJit = new Float32Array(PCOUNT * 3);
    const aRnd = new Float32Array(PCOUNT);
    for (let i = 0; i < PCOUNT; i += 1) {
      aText[i * 2] = samples[0][i * 2];
      aText[i * 2 + 1] = samples[0][i * 2 + 1];
      // a small, soft spherical cloud where the star was — organic, not boxy,
      // denser at the core so it reads as the star trembling apart
      const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      const r = Math.pow(Math.random(), 0.7) * 0.32;
      aJit[i * 3] = dir.x * r;
      aJit[i * 3 + 1] = dir.y * r;
      aJit[i * 3 + 2] = dir.z * r;
      aRnd[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(position, 3));
    g.setAttribute("aText", new THREE.Float32BufferAttribute(aText, 2));
    g.setAttribute("aJit", new THREE.Float32BufferAttribute(aJit, 3));
    g.setAttribute("aRnd", new THREE.Float32BufferAttribute(aRnd, 1));
    return g;
  }, [samples]);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 }, uTex: { value: GLOW },
          uA: { value: 0 }, uP: { value: 0 }, uHeadY: { value: HEAD_Y },
          uStar: { value: new THREE.Vector3() }, uAnchor: { value: new THREE.Vector3() },
          uRight: { value: new THREE.Vector3(1, 0, 0) }, uUp: { value: new THREE.Vector3(0, 1, 0) },
        },
        vertexShader: `
          attribute vec2 aText; attribute vec3 aJit; attribute float aRnd;
          uniform float uTime, uA, uP, uHeadY;
          uniform vec3 uStar, uAnchor, uRight, uUp;
          varying float vA;
          void main(){
            vec3 starW = uStar + aJit;
            vec3 textW = uAnchor + uRight * aText.x + uUp * (aText.y + uHeadY);
            // staggered so the particles arrive in a graceful wave, not all at once
            float e = clamp((uA - aRnd * 0.3) / 0.7, 0.0, 1.0);
            e = e * e * (3.0 - 2.0 * e);
            vec3 p = mix(starW, textW, e);
            float arc = sin(e * 3.14159265);
            p += uUp * arc * (0.18 + 0.3 * aRnd) + uRight * (aRnd - 0.5) * arc * 0.12;
            vA = uP * (0.7 + 0.3 * sin(uTime * 2.2 + aRnd * 30.0));
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_PointSize = (0.35 + 0.4 * aRnd) * (95.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: `
          uniform sampler2D uTex; varying float vA;
          void main(){
            vec4 t = texture2D(uTex, gl_PointCoord);
            gl_FragColor = vec4(vec3(0.85, 0.9, 1.0), t.a * vA * 0.6);
          }`,
      }),
    [],
  );
  const lastActive = useRef(-1);
  useFrame((s) => {
    const m = shared.m;
    mat.uniforms.uTime.value = s.clock.elapsedTime;
    mat.uniforms.uA.value = smoothstep(0.14, 0.52, m);
    // visible only while assembling / dissolving — gone at rest and at the hold
    mat.uniforms.uP.value = smoothstep(0.1, 0.24, m) * (1 - smoothstep(0.5, 0.64, m)) * shared.appear;
    mat.uniforms.uStar.value.copy(STAR_V[shared.active]);
    mat.uniforms.uAnchor.value.copy(shared.anchor);
    mat.uniforms.uRight.value.copy(shared.right);
    mat.uniforms.uUp.value.copy(shared.up);
    if (lastActive.current !== shared.active) {
      lastActive.current = shared.active;
      const src = samples[shared.active];
      const attr = geo.attributes.aText as THREE.BufferAttribute;
      (attr.array as Float32Array).set(src);
      attr.needsUpdate = true;
    }
  });
  return <points geometry={geo} material={mat} />;
}

/* ------------------------- the assembled words ------------------------- */
// The heading and answer live in the world, billboarded to the camera at the
// same anchor the particles fly to — so the type resolves exactly where the
// light gathered, and carries a soft glow inherited from it.
function Words({ shared }: { shared: Shared }) {
  const { camera } = useThree();
  const grp = useRef<THREE.Group>(null);
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const idxRef = useRef<any>(null);
  const headRef = useRef<any>(null);
  const ansRef = useRef<any>(null);
  const headV = useRef(0);
  const ansV = useRef(0);
  const [active, setActive] = useState(0);
  useFrame(() => {
    if (grp.current) {
      grp.current.position.copy(shared.anchor);
      grp.current.quaternion.copy(camera.quaternion);
    }
    if (shared.active !== active) setActive(shared.active);
    const m = shared.m;
    const headT = smoothstep(0.58, 0.74, m) * shared.appear;
    const ansT = smoothstep(0.66, 0.82, m) * shared.appear;
    headV.current += (headT - headV.current) * 0.16;
    ansV.current += (ansT - ansV.current) * 0.16;
    const h = headRef.current;
    const a = ansRef.current;
    const ix = idxRef.current;
    for (const o of [h, a, ix]) {
      if (o && !o.__init) {
        o.material.depthTest = false;
        o.material.depthWrite = false;
        o.renderOrder = 20;
        o.__init = true;
      }
    }
    if (h && Math.abs((h.__op ?? -1) - headV.current) > 0.01) {
      h.fillOpacity = headV.current;
      h.outlineOpacity = headV.current * 0.45;
      h.__op = headV.current;
      h.sync?.();
    }
    if (ix && Math.abs((ix.__op ?? -1) - headV.current) > 0.01) {
      ix.fillOpacity = headV.current * 0.9;
      ix.__op = headV.current;
      ix.sync?.();
    }
    if (a) {
      // a gentle rise as it settles in
      a.position.y = -0.3 - (1 - ansV.current) * 0.12;
      if (Math.abs((a.__op ?? -1) - ansV.current) > 0.01) {
        a.fillOpacity = ansV.current;
        a.__op = ansV.current;
        a.sync?.();
      }
    }
  });
  /* eslint-enable @typescript-eslint/no-explicit-any */
  const faq = FAQS[active];
  const headMax = (HEAD_WRAP * HEAD_FONT) / 46; // match the sampler's wrap width
  return (
    <group ref={grp}>
      <Text ref={idxRef} font={FONT_BOLD} fontSize={0.072} color="#9fb2e8" anchorX="center" anchorY="middle"
        letterSpacing={0.35} position={[0, HEAD_Y + 0.42, 0]} fillOpacity={0}>
        {`0${active + 1}  /  0${N}`}
      </Text>
      <Text ref={headRef} font={FONT_BOLD} fontSize={HEAD_FONT} color="#eef3ff" anchorX="center" anchorY="middle"
        textAlign="center" maxWidth={headMax} lineHeight={1.12} letterSpacing={-0.01}
        outlineWidth={0} outlineBlur="10%" outlineColor="#5f78d8" outlineOpacity={0}
        position={[0, HEAD_Y, 0]} fillOpacity={0}>
        {faq.q}
      </Text>
      <Text ref={ansRef} font={FONT_REG} fontSize={0.078} color="#cdd6ea" anchorX="center" anchorY="top"
        textAlign="center" maxWidth={3.4} lineHeight={1.5} position={[0, -0.3, 0]} fillOpacity={0}>
        {faq.a}
      </Text>
    </group>
  );
}

/* ------------------------------- camera ------------------------------- */
// A quiet drift: the camera eases toward whichever star is becoming the focus
// and settles, with a slow ambient sway. No spinning, no fast moves.
function Rig({ scroll, shared }: { scroll?: { get: () => number }; shared: Shared }) {
  const { camera } = useThree();
  const eased = useRef(0);
  const t0 = useRef(-1);
  const pos = useRef(new THREE.Vector3(0, 0.8, 7));
  const look = useRef(new THREE.Vector3(STAR_V[0].x, STAR_V[0].y, STAR_V[0].z));
  const lookS = useRef(new THREE.Vector3(STAR_V[0].x, STAR_V[0].y, STAR_V[0].z));
  const inited = useRef(false);
  const fp = useRef(new THREE.Vector3());
  const dir = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());
  const upv = useRef(new THREE.Vector3());
  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (t0.current < 0) t0.current = t;
    const target = scroll ? scroll.get() : 0;
    eased.current += (target - eased.current) * Math.min(1, delta * 1.3);
    const p = eased.current;
    shared.p = p;
    shared.appear = smoothstep(0.2, 2.4, t - t0.current);

    // the smoothly glided focus point — a soft blend of the stars by proximity
    // in scroll, so the camera flows from one to the next and settles on each
    fp.current.set(0, 0, 0);
    let wsum = 0;
    let bestSel = 0;
    let bestI = 0;
    for (let i = 0; i < N; i += 1) {
      const d = (p - centerP(i)) / (HALF * 1.5);
      const w = Math.exp(-d * d);
      fp.current.addScaledVector(STAR_V[i], w);
      wsum += w;
      const sel = selectAt(p, i);
      if (sel > bestSel) { bestSel = sel; bestI = i; }
    }
    fp.current.multiplyScalar(1 / Math.max(1e-4, wsum));
    shared.active = bestI;
    shared.m = selectAt(p, bestI);
    shared.globalSel = bestSel;

    // camera pose: sit back from the focus, a touch above, with a slow sway
    const camTarget = fp.current.clone().add(
      new THREE.Vector3(Math.sin(t * 0.08) * 0.5, 0.55 + Math.sin(t * 0.06) * 0.2, 5.6),
    );
    if (!inited.current) { pos.current.copy(camTarget); inited.current = true; }
    pos.current.lerp(camTarget, Math.min(1, delta * 0.9));
    camera.position.copy(pos.current);
    camera.up.set(0, 1, 0);
    look.current.copy(fp.current);
    lookS.current.lerp(look.current, Math.min(1, delta * 1.4));
    camera.lookAt(lookS.current);

    // the anchor where words form: in front of the camera, toward the focus,
    // with the camera's own right/up so the type stays square to the viewer
    dir.current.copy(lookS.current).sub(camera.position).normalize();
    right.current.setFromMatrixColumn(camera.matrixWorld, 0).normalize();
    upv.current.setFromMatrixColumn(camera.matrixWorld, 1).normalize();
    shared.anchor.copy(camera.position).addScaledVector(dir.current, 4.3);
    shared.right.copy(right.current);
    shared.up.copy(upv.current);
  });
  return null;
}

export default function ConstellationCanvas({
  eventSource,
  scroll,
  active: activeProp,
}: {
  eventSource: RefObject<HTMLElement | null>;
  scroll?: { get: () => number };
  active?: boolean;
}) {
  const reduced = usePrefersReducedMotion();
  const mobile = useIsMobile();
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const shared = useRef<Shared>({
    p: 0, active: 0, m: 0, globalSel: 0,
    anchor: new THREE.Vector3(), right: new THREE.Vector3(1, 0, 0), up: new THREE.Vector3(0, 1, 0),
    appear: 0,
  }).current;

  useEffect(() => {
    if (activeProp !== undefined) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, [activeProp]);

  const active = !reduced && (activeProp !== undefined ? activeProp : visible);

  return (
    <div ref={ref} className="absolute inset-0">
      <Canvas
        className="!absolute inset-0"
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
        dpr={reduced ? 1 : [1, mobile ? 1.3 : 1.8]}
        camera={{ position: [0, 0.8, 7], fov: 55 }}
        frameloop={active ? "always" : "never"}
        eventSource={eventSource as unknown as RefObject<HTMLElement>}
        eventPrefix="client"
        onCreated={({ scene }) => {
          scene.fog = new THREE.FogExp2(0x03040a, 0.017);
        }}
      >
        <Rig scroll={scroll} shared={shared} />
        <BackdropStars />
        <Links shared={shared} />
        <Stars shared={shared} />
        <Particles shared={shared} />
        <Words shared={shared} />
      </Canvas>
    </div>
  );
}
