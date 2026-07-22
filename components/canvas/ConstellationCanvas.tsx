"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { FAQS } from "@/lib/data";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useIsMobile } from "@/hooks/useMediaQuery";

/* ==================================================================== *
 * The Constellation. A quiet night sky suspended in darkness. Every
 * question is a celestial object — a concentrated sun, a diamond hung in
 * the black — that always exists, placed naturally with no grid and no
 * symmetry, joined by faint lines. Almost nothing moves.
 *
 * The visitor drifts through, and one star at a time is discovered. The
 * camera settles, the star brightens, its neighbours answer and the lines
 * strengthen — a held moment of anticipation. Only then does the star
 * release its energy: the core fractures, fragments of light drift out,
 * hesitate, and gather to write the question. The answer fades in after
 * the words have formed. Then it all returns, the star reforms, and the
 * sky is still again. Discover → focus → anticipation → transformation →
 * reading. Every transformation is worth watching.
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

// Each star's deliberate place in the sky — winding through depth, side to
// side, high and low. The camera drifts forward (−z) and discovers each in turn.
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
// each star its own character — size, colour temperature (0 warm → 1 cool),
// core sharpness, and a twinkle seed. A distinct object, not a uniform dot.
const STAR_SIZE = [1.35, 0.98, 1.14, 0.86, 1.28, 1.02, 1.18, 0.92];
const STAR_TEMP = [0.12, 0.82, 0.5, 0.95, 0.3, 0.66, 0.42, 0.86];
const STAR_BASE = [0.95, 0.86, 0.9, 0.82, 0.94, 0.88, 0.9, 0.84];

// a sparse, elegant figure of faint links — not a mesh
const LINKS: [number, number][] = [
  [0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 6], [5, 7], [6, 7],
];
const NEIGH: number[][] = STARS.map((_, i) =>
  LINKS.filter(([a, b]) => a === i || b === i).map(([a, b]) => (a === i ? b : a)),
);
function incidentLinks(i: number): [number, number][] {
  return LINKS.filter(([a, b]) => a === i || b === i);
}

/* ------------------------- the staged sequence ------------------------- */
// Each star owns a stretch of scroll [active, active+1). Within it, a local
// progress q ∈ [0,1] runs the whole ceremony with generous, deliberate pauses.
//   0.00–0.10  discover — the camera is still arriving
//   0.10–0.30  focus    — the star brightens, neighbours answer, lines lift
//   0.30–0.44  anticipation — a held pause; the visitor feels it is special
//   0.44–0.66  transformation — core fractures, fragments drift, then gather
//   0.66–0.86  reading  — the question stands; the answer settles beneath
//   0.86–1.00  release  — the words dissolve, fragments reform the star
function winPos(p: number): { active: number; q: number } {
  const x = clamp(p * N, 0, N - 1e-4);
  const active = Math.floor(x);
  return { active, q: x - active };
}
const focusF = (q: number) => smoothstep(0.10, 0.30, q) * (1 - smoothstep(0.88, 1.0, q));
const engageF = (q: number) => smoothstep(0.05, 0.18, q) * (1 - smoothstep(0.90, 1.0, q));
// transformation progress: 0 through focus & anticipation, rises across the
// transform band, holds through reading, falls on release. Monotone in / out.
const xformF = (q: number) => Math.min(smoothstep(0.44, 0.66, q), 1 - smoothstep(0.86, 1.0, q));
const idxTF = (q: number) => smoothstep(0.30, 0.44, q) * (1 - smoothstep(0.88, 0.94, q));
const headTF = (q: number) => smoothstep(0.60, 0.665, q) * (1 - smoothstep(0.86, 0.905, q));
const ansTF = (q: number) => smoothstep(0.70, 0.80, q) * (1 - smoothstep(0.84, 0.885, q));

/* --------- sampling a question into a delicate cloud of points --------- */
const PCOUNT = 300;
const HEAD_FONT = 0.17;
const HEAD_WRAP = 560;
const HEAD_Y = 0.28;
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

  ctx.font = font;
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; }
    else line = test;
  }
  if (line) lines.push(line);

  const width = maxW + 48;
  const height = Math.ceil(lines.length * lh + 40);
  cv.width = width;
  cv.height = height;
  ctx.font = font;
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
    let k: number;
    if (found > 0) {
      const j = Math.floor(((i * 0.61803398875) % 1) * found + (i % Math.max(1, Math.floor(found / PCOUNT) + 1)));
      k = (j % found) * 2;
    } else k = 0;
    const px = pts[k] ?? cx;
    const py = pts[k + 1] ?? cy;
    out[i * 2] = (px - cx) * worldScale;
    out[i * 2 + 1] = (cy - py) * worldScale;
  }
  return out;
}

/* ----------------------------- shared bus ----------------------------- */
type Shared = {
  p: number;
  active: number;
  q: number;
  focus: number;   // star focus 0..1 (brighten / neighbours respond / lines lift)
  engage: number;  // overall engagement (dims the rest of the sky)
  xform: number;   // transformation 0..1 (fragments + words)
  anchor: THREE.Vector3;
  right: THREE.Vector3;
  up: THREE.Vector3;
  appear: number;
};

/* ------------------------------- the sky ------------------------------ */
function BackdropStars() {
  const geo = useMemo(() => {
    const count = 120;
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    const sz = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      pos[i * 3] = (Math.random() - 0.5) * 48;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 32;
      pos[i * 3 + 2] = -6 - Math.random() * 48;
      seed[i] = Math.random();
      sz[i] = 0.5 + Math.random() * 0.9;
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
        uniforms: { uTime: { value: 0 }, uAppear: { value: 0 } },
        vertexShader: `
          attribute float aSeed; attribute float aSize;
          uniform float uTime; varying float vTw; varying float vSeed;
          void main(){
            vSeed = aSeed;
            vTw = 0.7 + 0.3 * sin(uTime * 0.35 + aSeed * 6.2831);
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = aSize * (240.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: `
          uniform float uAppear; varying float vTw; varying float vSeed;
          void main(){
            vec2 uv = gl_PointCoord - 0.5;
            float d = length(uv);
            float g = exp(-d * 7.0) * 0.7 + pow(clamp(1.0 - d / 0.16, 0.0, 1.0), 1.5) * 0.5;
            g *= smoothstep(0.5, 0.4, d);
            gl_FragColor = vec4(vec3(0.78, 0.85, 1.0), g * vTw * 0.24 * uAppear);
          }`,
      }),
    [],
  );
  useFrame((s) => { mat.uniforms.uTime.value = s.clock.elapsedTime; });
  return <points geometry={geo} material={mat} />;
}

/* --------------------------- constellation lines --------------------------- */
function Links({ shared }: { shared: Shared }) {
  const baseGeo = useMemo(() => {
    const pos: number[] = [];
    for (const [a, b] of LINKS) pos.push(STAR_V[a].x, STAR_V[a].y, STAR_V[a].z, STAR_V[b].x, STAR_V[b].y, STAR_V[b].z);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    return g;
  }, []);
  const baseMat = useMemo(
    () => new THREE.LineBasicMaterial({ color: new THREE.Color(0.5, 0.6, 0.85), transparent: true, opacity: 0.045, blending: THREE.AdditiveBlending, depthWrite: false }),
    [],
  );
  const hiGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(4 * 2 * 3), 3));
    return g;
  }, []);
  const hiMat = useMemo(
    () => new THREE.LineBasicMaterial({ color: new THREE.Color(0.66, 0.76, 1.0), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
    [],
  );
  useFrame(() => {
    baseMat.opacity = (0.03 + 0.045 * shared.engage) * shared.appear;
    const edges = incidentLinks(shared.active);
    const arr = hiGeo.attributes.position.array as Float32Array;
    let n = 0;
    for (const [a, b] of edges) {
      arr[n++] = STAR_V[a].x; arr[n++] = STAR_V[a].y; arr[n++] = STAR_V[a].z;
      arr[n++] = STAR_V[b].x; arr[n++] = STAR_V[b].y; arr[n++] = STAR_V[b].z;
    }
    hiGeo.setDrawRange(0, edges.length * 2);
    hiGeo.attributes.position.needsUpdate = true;
    // the lines strengthen as the star is focused, then quiet as it transforms
    hiMat.opacity = 0.18 * shared.focus * (1 - 0.5 * shared.xform) * shared.appear;
  });
  return (
    <group>
      <lineSegments geometry={baseGeo} material={baseMat} />
      <lineSegments geometry={hiGeo} material={hiMat} />
    </group>
  );
}

/* ------------------------------ the stars ------------------------------ */
// Each rendered as a real celestial object: a tight, hot core inside a soft
// cool halo, with a whisper of diffraction and a slow twinkle. Warm suns and
// cool diamonds, near and far — something to enjoy before anything happens.
function Stars({ shared }: { shared: Shared }) {
  const geo = useMemo(() => {
    const pos = new Float32Array(N * 3);
    const seed = new Float32Array(N);
    const size = new Float32Array(N);
    const temp = new Float32Array(N);
    const bright = new Float32Array(N);
    for (let i = 0; i < N; i += 1) {
      pos[i * 3] = STAR_V[i].x; pos[i * 3 + 1] = STAR_V[i].y; pos[i * 3 + 2] = STAR_V[i].z;
      seed[i] = (i * 0.732) % 1;
      size[i] = STAR_SIZE[i];
      temp[i] = STAR_TEMP[i];
      bright[i] = STAR_BASE[i];
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.Float32BufferAttribute(seed, 1));
    g.setAttribute("aSize", new THREE.Float32BufferAttribute(size, 1));
    g.setAttribute("aTemp", new THREE.Float32BufferAttribute(temp, 1));
    g.setAttribute("aBright", new THREE.Float32BufferAttribute(bright, 1));
    return g;
  }, []);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uAppear: { value: 0 } },
        vertexShader: `
          attribute float aSeed; attribute float aSize; attribute float aTemp; attribute float aBright;
          uniform float uTime;
          varying float vSeed; varying float vTemp; varying float vBright;
          void main(){
            vSeed = aSeed; vTemp = aTemp; vBright = aBright;
            // a gentle breathing of scale, unique per star
            float breathe = 1.0 + 0.05 * sin(uTime * 0.5 + aSeed * 6.2831);
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = aSize * breathe * (430.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: `
          precision highp float;
          uniform float uTime, uAppear;
          varying float vSeed; varying float vTemp; varying float vBright;
          void main(){
            vec2 uv = gl_PointCoord - 0.5;
            float d = length(uv);
            float tw = 0.86 + 0.14 * sin(uTime * 0.4 + vSeed * 6.2831);
            // layered profile — hot pinpoint core, inner glow, broad halo
            float core  = pow(clamp(1.0 - d / 0.10, 0.0, 1.0), 1.6);
            float inner = exp(-d * 10.0);
            float halo  = exp(-d * 4.0);
            // a whisper of diffraction spikes, breathing with the twinkle
            float cross = (exp(-abs(uv.x) * 26.0) + exp(-abs(uv.y) * 26.0)) * exp(-d * 3.0);
            float inten = core * 1.25 + inner * 0.55 + halo * 0.5 + cross * 0.22 * tw;
            inten *= smoothstep(0.5, 0.4, d);   // fade to nothing at the sprite edge
            inten *= vBright * tw;
            // warm core → cool halo, biased by the star's own temperature
            vec3 warm = vec3(1.0, 0.93, 0.82);
            vec3 cool = vec3(0.72, 0.82, 1.0);
            vec3 col = mix(warm, cool, clamp(vTemp * 0.55 + smoothstep(0.0, 0.4, d) * 0.6, 0.0, 1.0));
            gl_FragColor = vec4(col, inten * uAppear);
          }`,
      }),
    [],
  );
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    mat.uniforms.uTime.value = t;
    mat.uniforms.uAppear.value = shared.appear;
    const attr = geo.attributes.aBright as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    const { active, q, focus, engage, xform } = shared;
    // the active star releases its energy — its own glow fades as it fractures
    const fracture = smoothstep(0.05, 0.42, xform);
    // a soft pulse of building energy through the anticipation pause
    const pulse = 1 + 0.1 * Math.sin(t * 2.1) * smoothstep(0.30, 0.44, q) * (1 - xform);
    const neigh = NEIGH[active] || [];
    for (let i = 0; i < N; i += 1) {
      const base = STAR_BASE[i];
      if (i === active) {
        arr[i] = base * (0.85 + 0.95 * focus) * pulse * (1 - fracture);
      } else {
        const respond = neigh.includes(i) ? 0.2 * focus : 0;
        arr[i] = base * (1 - 0.5 * engage) + respond;
      }
    }
    attr.needsUpdate = true;
  });
  return <points geometry={geo} material={mat} />;
}

/* -------------------- the transformation fragments -------------------- */
// One delicate cloud, reused for whichever star is active. The core fractures;
// fragments drift outward to a released ring, hesitate, then gather to write
// the question — and reverse on the way out. Present only during the ceremony.
function Fragments({ shared }: { shared: Shared }) {
  const samples = useMemo(() => FAQS.map((f) => sampleText(f.q)), []);
  const geo = useMemo(() => {
    const position = new Float32Array(PCOUNT * 3);
    const aText = new Float32Array(PCOUNT * 2);
    const aJit = new Float32Array(PCOUNT * 3);
    const aRel = new Float32Array(PCOUNT * 3);
    const aRnd = new Float32Array(PCOUNT);
    for (let i = 0; i < PCOUNT; i += 1) {
      aText[i * 2] = samples[0][i * 2];
      aText[i * 2 + 1] = samples[0][i * 2 + 1];
      const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      const r = Math.pow(Math.random(), 0.7) * 0.3;
      aJit[i * 3] = dir.x * r; aJit[i * 3 + 1] = dir.y * r; aJit[i * 3 + 2] = dir.z * r;
      // the released ring — outward and a touch upward, a scattered halo of light
      const rr = 0.7 + Math.random() * 0.9;
      aRel[i * 3] = dir.x * rr;
      aRel[i * 3 + 1] = dir.y * rr + 0.25;
      aRel[i * 3 + 2] = dir.z * rr;
      aRnd[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(position, 3));
    g.setAttribute("aText", new THREE.Float32BufferAttribute(aText, 2));
    g.setAttribute("aJit", new THREE.Float32BufferAttribute(aJit, 3));
    g.setAttribute("aRel", new THREE.Float32BufferAttribute(aRel, 3));
    g.setAttribute("aRnd", new THREE.Float32BufferAttribute(aRnd, 1));
    return g;
  }, [samples]);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 }, uA: { value: 0 }, uAlpha: { value: 0 }, uHeadY: { value: HEAD_Y },
          uStar: { value: new THREE.Vector3() }, uAnchor: { value: new THREE.Vector3() },
          uRight: { value: new THREE.Vector3(1, 0, 0) }, uUp: { value: new THREE.Vector3(0, 1, 0) },
        },
        vertexShader: `
          attribute vec2 aText; attribute vec3 aJit; attribute vec3 aRel; attribute float aRnd;
          uniform float uTime, uA, uHeadY;
          uniform vec3 uStar, uAnchor, uRight, uUp;
          varying float vGlow;
          void main(){
            vec3 coreW  = uStar + aJit;
            vec3 relW   = uStar + aRel;
            vec3 textW  = uAnchor + uRight * aText.x + uUp * (aText.y + uHeadY);
            // fracture → release outward (0→0.32), hesitate (0.32→0.44),
            // then gather to the words (0.44→1). Reverses as uA falls.
            float e1 = smoothstep(0.0, 0.32, uA);
            float e2 = smoothstep(0.44, 1.0, uA);
            vec3 pos = mix(mix(coreW, relW, e1), textW, e2);
            // a faint life while they hover, staggered per fragment
            float hover = (1.0 - e2) * e1;
            pos += uUp * sin(uTime * 0.7 + aRnd * 6.2831) * 0.02 * hover;
            pos += uRight * cos(uTime * 0.6 + aRnd * 5.0) * 0.02 * hover;
            vGlow = 0.6 + 0.4 * sin(uTime * 1.8 + aRnd * 24.0);
            vec4 mv = modelViewMatrix * vec4(pos, 1.0);
            gl_PointSize = (0.4 + 0.5 * aRnd) * (1.0 + 0.4 * hover) * (95.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: `
          uniform float uAlpha; varying float vGlow;
          void main(){
            vec2 uv = gl_PointCoord - 0.5;
            float d = length(uv);
            float g = pow(clamp(1.0 - d / 0.5, 0.0, 1.0), 1.7);
            gl_FragColor = vec4(vec3(0.9, 0.93, 1.0), g * vGlow * uAlpha * 0.85);
          }`,
      }),
    [],
  );
  const lastActive = useRef(-1);
  useFrame((s) => {
    const A = shared.xform;
    mat.uniforms.uTime.value = s.clock.elapsedTime;
    mat.uniforms.uA.value = A;
    // visible only through the ceremony: gone at rest and once the words resolve
    mat.uniforms.uAlpha.value = smoothstep(0.03, 0.14, A) * (1 - smoothstep(0.85, 0.99, A)) * shared.appear;
    mat.uniforms.uStar.value.copy(STAR_V[shared.active]);
    mat.uniforms.uAnchor.value.copy(shared.anchor);
    mat.uniforms.uRight.value.copy(shared.right);
    mat.uniforms.uUp.value.copy(shared.up);
    if (lastActive.current !== shared.active) {
      lastActive.current = shared.active;
      const attr = geo.attributes.aText as THREE.BufferAttribute;
      (attr.array as Float32Array).set(samples[shared.active]);
      attr.needsUpdate = true;
    }
  });
  return <points geometry={geo} material={mat} />;
}

/* ------------------------- the assembled words ------------------------- */
function Words({ shared }: { shared: Shared }) {
  const { camera } = useThree();
  const grp = useRef<THREE.Group>(null);
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const idxRef = useRef<any>(null);
  const headRef = useRef<any>(null);
  const ansRef = useRef<any>(null);
  const idxV = useRef(0);
  const headV = useRef(0);
  const ansV = useRef(0);
  const [active, setActive] = useState(0);
  useFrame(() => {
    if (grp.current) {
      grp.current.position.copy(shared.anchor);
      grp.current.quaternion.copy(camera.quaternion);
    }
    if (shared.active !== active) setActive(shared.active);
    const ap = shared.appear;
    const idxT = idxTF(shared.q) * ap;
    const headT = headTF(shared.q) * ap;
    const ansT = ansTF(shared.q) * ap;
    // slow, graceful easing so nothing snaps
    idxV.current += (idxT - idxV.current) * 0.07;
    headV.current += (headT - headV.current) * 0.07;
    ansV.current += (ansT - ansV.current) * 0.06;
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
    if (ix && Math.abs((ix.__op ?? -1) - idxV.current) > 0.01) {
      ix.fillOpacity = idxV.current; ix.__op = idxV.current; ix.sync?.();
    }
    if (h && Math.abs((h.__op ?? -1) - headV.current) > 0.01) {
      h.fillOpacity = headV.current;
      h.outlineOpacity = headV.current * 0.45;
      h.__op = headV.current; h.sync?.();
    }
    if (a) {
      a.position.y = -0.3 - (1 - ansV.current) * 0.12;
      if (Math.abs((a.__op ?? -1) - ansV.current) > 0.01) {
        a.fillOpacity = ansV.current; a.__op = ansV.current; a.sync?.();
      }
    }
  });
  /* eslint-enable @typescript-eslint/no-explicit-any */
  const faq = FAQS[active];
  const headMax = (HEAD_WRAP * HEAD_FONT) / 46;
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
// A quiet, slow drift. The camera settles toward whichever star is being
// discovered and holds still while it is read. No spinning, no fast moves.
function Rig({ scroll, shared }: { scroll?: { get: () => number }; shared: Shared }) {
  const { camera } = useThree();
  const eased = useRef(0);
  const t0 = useRef(-1);
  const pos = useRef(new THREE.Vector3(0, 0.8, 7));
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
    // a slow follow, so when the visitor pauses the camera keeps settling in
    eased.current += (target - eased.current) * Math.min(1, delta * 0.8);
    const p = eased.current;
    shared.p = p;
    shared.appear = smoothstep(0.3, 3.5, t - t0.current);

    const { active, q } = winPos(p);
    shared.active = active;
    shared.q = q;
    shared.focus = focusF(q);
    shared.engage = engageF(q);
    shared.xform = xformF(q);

    // the focus point glides gently from one star to the next
    fp.current.copy(STAR_V[active]);
    const A = shared.xform;
    // sit back and a touch above; the sway calms almost to nothing while reading
    const sway = 1 - 0.8 * A;
    const camTarget = fp.current.clone().add(
      new THREE.Vector3(Math.sin(t * 0.07) * 0.45 * sway, 0.55 + Math.sin(t * 0.05) * 0.18 * sway, 5.7),
    );
    if (!inited.current) { pos.current.copy(camTarget); inited.current = true; }
    pos.current.lerp(camTarget, Math.min(1, delta * 0.7));
    camera.position.copy(pos.current);
    camera.up.set(0, 1, 0);
    lookS.current.lerp(fp.current, Math.min(1, delta * 1.0));
    camera.lookAt(lookS.current);

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
    p: 0, active: 0, q: 0, focus: 0, engage: 0, xform: 0,
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
          scene.fog = new THREE.FogExp2(0x03040a, 0.015);
        }}
      >
        <Rig scroll={scroll} shared={shared} />
        <BackdropStars />
        <Links shared={shared} />
        <Stars shared={shared} />
        <Fragments shared={shared} />
        <Words shared={shared} />
      </Canvas>
    </div>
  );
}
