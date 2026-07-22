"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { FAQS } from "@/lib/data";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useIsMobile } from "@/hooks/useMediaQuery";

/* ==================================================================== *
 * The Constellation. A living night sky suspended in darkness. A field
 * of stars already exists, breathing gently. As the visitor drifts
 * through, a pulse of light crosses the sky and the stars themselves
 * travel — slowly, gracefully, pulled as if by an invisible force — and
 * gather into the shape of the question: a luminous, letter-shaped
 * constellation. That formation is the framework. Once it settles, refined
 * typography rises from within it, aligned exactly to the stars, which stay
 * shining in and around the letters — so the words read as though written
 * by the night sky itself. The answer follows in elegant type. When the
 * visitor moves on the type dissolves and the stars drift back into the
 * sky, and the next question forms. The sky is never destroyed.
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
function mulberry(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// how many stars make up the sky — and, when they gather, sketch the letters
const COUNT = 460;

/* ----------------------- the resting constellation ----------------------- */
const HOME = (() => {
  const r = mulberry(1337);
  const arr: THREE.Vector3[] = [];
  for (let i = 0; i < COUNT; i += 1) {
    const cluster = r() < 0.55;
    let x: number, y: number;
    if (cluster) {
      const cx = (r() - 0.5) * 15;
      const cy = (r() - 0.5) * 9;
      x = cx + (r() - 0.5) * 4.2;
      y = cy + (r() - 0.5) * 3.0;
    } else {
      x = (r() - 0.5) * 19;
      y = (r() - 0.5) * 11.5;
    }
    const z = -3 - r() * 9;
    arr.push(new THREE.Vector3(x, y, z));
  }
  return arr;
})();

const LINKS: [number, number][] = (() => {
  const out: [number, number][] = [];
  const used = new Set<string>();
  for (let i = 0; i < COUNT; i += 4) {
    let best = -1;
    let bd = Infinity;
    for (let j = 0; j < COUNT; j += 1) {
      if (j === i) continue;
      const d = HOME[i].distanceToSquared(HOME[j]);
      if (d < bd && d > 0.5) { bd = d; best = j; }
    }
    if (best >= 0 && bd < 9) {
      const key = i < best ? `${i}_${best}` : `${best}_${i}`;
      if (!used.has(key)) { used.add(key); out.push([i, best]); }
    }
  }
  return out.slice(0, 60);
})();

/* ------------------------------ the sequence ------------------------------ */
// each question owns a stretch of scroll; within it a slow ceremony unfolds:
//   0.00–0.14  the sky rests; a pulse of light begins to cross it
//   0.14–0.44  the stars travel, gathering into the letter-shaped framework
//   0.46–0.60  refined type rises from within the constellation
//   0.60–0.76  the question is read; the answer settles in beneath
//   0.74–0.96  the type dissolves; the stars drift back into the sky
function winPos(p: number): { active: number; t: number } {
  const x = clamp(p * N, 0, N - 1e-4);
  const active = Math.floor(x);
  return { active, t: x - active };
}
const formF = (t: number) => smoothstep(0.14, 0.44, t) * (1 - smoothstep(0.74, 0.96, t));
const fieldF = (t: number) => smoothstep(0.05, 0.2, t) * (1 - smoothstep(0.86, 0.99, t));
const readF = (t: number) => smoothstep(0.46, 0.60, t) * (1 - smoothstep(0.76, 0.88, t));
const ansTF = (t: number) => smoothstep(0.6, 0.7, t) * (1 - smoothstep(0.8, 0.88, t));

/* --------- laying out the question: shared by the stars and the type --------- */
const HEAD_FONT = 0.58;  // world units per em — the SAME scale for stars and type
const HEAD_WRAP = 780;   // wrap width in sample px
const HEAD_LH = 1.34;    // line height, shared so the two line up
const SAMPLE_PX = 44;
const SAMPLE_FONT = `700 ${SAMPLE_PX}px 'Syne', system-ui, -apple-system, Segoe UI, sans-serif`;

function wrapLines(text: string): string[] {
  if (typeof document === "undefined") return [text];
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return [text];
  ctx.font = SAMPLE_FONT;
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > HEAD_WRAP && line) { lines.push(line); line = w; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

// sketch the wrapped lines as star targets, in the same world units and layout
// the crisp type will use — so the stars sit inside and around the letters
function sampleFromLines(lines: string[]): Float32Array {
  const out = new Float32Array(COUNT * 2);
  if (typeof document === "undefined") return out;
  const lh = SAMPLE_PX * HEAD_LH;
  const cv = document.createElement("canvas");
  const ctx = cv.getContext("2d");
  if (!ctx) return out;
  const width = HEAD_WRAP + 48;
  const height = Math.ceil(lines.length * lh + 40);
  cv.width = width;
  cv.height = height;
  ctx.font = SAMPLE_FONT;
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
  const worldScale = HEAD_FONT / SAMPLE_PX;
  const cx = width / 2;
  const cy = height / 2;
  for (let i = 0; i < COUNT; i += 1) {
    let k: number;
    if (found > 0) {
      const j = Math.floor(((i * 0.61803398875) % 1) * found + (i % Math.max(1, Math.floor(found / COUNT) + 1)));
      k = (j % found) * 2;
    } else k = 0;
    const px = pts[k] ?? cx;
    const py = pts[k + 1] ?? cy;
    out[i * 2] = (px - cx) * worldScale;
    out[i * 2 + 1] = (cy - py) * worldScale;
  }
  return out;
}

type Glyphs = { lines: string[]; pts: Float32Array };

/* ----------------------------- shared bus ----------------------------- */
type Shared = {
  p: number;
  active: number;
  t: number;
  form: number;
  field: number;
  read: number;     // the crisp type rising from within the constellation
  pulsePos: number;
  pulseAmt: number;
  anchor: THREE.Vector3;
  right: THREE.Vector3;
  up: THREE.Vector3;
  forward: THREE.Vector3;
  appear: number;
};

/* ------------------------- ambient backdrop sky ------------------------- */
function BackdropStars() {
  const geo = useMemo(() => {
    const count = 220;
    const r = mulberry(97);
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    const sz = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      pos[i * 3] = (r() - 0.5) * 52;
      pos[i * 3 + 1] = (r() - 0.5) * 34;
      pos[i * 3 + 2] = -12 - r() * 46;
      seed[i] = r();
      sz[i] = 0.45 + r() * 0.8;
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
          uniform float uTime; varying float vTw;
          void main(){
            vTw = 0.68 + 0.32 * sin(uTime * 0.3 + aSeed * 6.2831);
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = aSize * (240.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: `
          uniform float uAppear; varying float vTw;
          void main(){
            vec2 uv = gl_PointCoord - 0.5;
            float d = length(uv);
            float g = exp(-d * 7.0) * 0.7 + pow(clamp(1.0 - d / 0.16, 0.0, 1.0), 1.5) * 0.5;
            g *= smoothstep(0.5, 0.4, d);
            gl_FragColor = vec4(vec3(0.76, 0.84, 1.0), g * vTw * 0.2 * uAppear);
          }`,
      }),
    [],
  );
  useFrame((s) => { mat.uniforms.uTime.value = s.clock.elapsedTime; });
  return <points geometry={geo} material={mat} />;
}

/* --------------------------- constellation links --------------------------- */
function Links({ shared }: { shared: Shared }) {
  const geo = useMemo(() => {
    const pos: number[] = [];
    for (const [a, b] of LINKS) pos.push(HOME[a].x, HOME[a].y, HOME[a].z, HOME[b].x, HOME[b].y, HOME[b].z);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    return g;
  }, []);
  const mat = useMemo(
    () => new THREE.LineBasicMaterial({ color: new THREE.Color(0.52, 0.62, 0.9), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
    [],
  );
  useFrame(() => {
    mat.opacity = (0.05 + 0.06 * shared.field) * (1 - smoothstep(0.0, 0.22, shared.form)) * shared.appear;
  });
  return <lineSegments geometry={geo} material={mat} />;
}

/* --------------------- the star field — the letter framework --------------------- */
function StarField({ shared, glyphs }: { shared: Shared; glyphs: Glyphs[] }) {
  const geo = useMemo(() => {
    const r = mulberry(4242);
    const position = new Float32Array(COUNT * 3);
    const aHome = new Float32Array(COUNT * 3);
    const aGlyph = new Float32Array(COUNT * 2);
    const aZ = new Float32Array(COUNT);
    const aSeed = new Float32Array(COUNT);
    const aSize = new Float32Array(COUNT);
    const aTemp = new Float32Array(COUNT);
    const aRnd = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i += 1) {
      aHome[i * 3] = HOME[i].x; aHome[i * 3 + 1] = HOME[i].y; aHome[i * 3 + 2] = HOME[i].z;
      aGlyph[i * 2] = glyphs[0].pts[i * 2];
      aGlyph[i * 2 + 1] = glyphs[0].pts[i * 2 + 1];
      aZ[i] = (r() - 0.5) * 0.7;
      aSeed[i] = r();
      aSize[i] = 0.55 + r() * 0.7;
      aTemp[i] = r();
      aRnd[i] = r();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(position, 3));
    g.setAttribute("aHome", new THREE.Float32BufferAttribute(aHome, 3));
    g.setAttribute("aGlyph", new THREE.Float32BufferAttribute(aGlyph, 2));
    g.setAttribute("aZ", new THREE.Float32BufferAttribute(aZ, 1));
    g.setAttribute("aSeed", new THREE.Float32BufferAttribute(aSeed, 1));
    g.setAttribute("aSize", new THREE.Float32BufferAttribute(aSize, 1));
    g.setAttribute("aTemp", new THREE.Float32BufferAttribute(aTemp, 1));
    g.setAttribute("aRnd", new THREE.Float32BufferAttribute(aRnd, 1));
    return g;
  }, [glyphs]);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 }, uForm: { value: 0 }, uField: { value: 0 }, uRead: { value: 0 }, uAppear: { value: 0 },
          uPulsePos: { value: 0 }, uPulseAmt: { value: 0 },
          uAnchor: { value: new THREE.Vector3() }, uRight: { value: new THREE.Vector3(1, 0, 0) },
          uUp: { value: new THREE.Vector3(0, 1, 0) }, uForward: { value: new THREE.Vector3(0, 0, -1) },
        },
        vertexShader: `
          attribute vec3 aHome; attribute vec2 aGlyph; attribute float aZ, aSeed, aSize, aTemp, aRnd;
          uniform float uTime, uForm, uField, uRead, uPulsePos, uPulseAmt;
          uniform vec3 uAnchor, uRight, uUp, uForward;
          varying float vB; varying float vTemp; varying float vForm;
          void main(){
            vec3 br = vec3(sin(uTime * 0.28 + aSeed * 11.0), sin(uTime * 0.23 + aSeed * 7.0), sin(uTime * 0.18 + aSeed * 5.0));
            float restAmt = mix(0.2, 0.035, uForm);
            vec3 homeW = aHome + br * restAmt;
            vec3 glyphW = uAnchor + uRight * aGlyph.x + uUp * aGlyph.y + uForward * aZ;
            float e = clamp((uForm - aRnd * 0.22) / 0.78, 0.0, 1.0);
            e = e * e * (3.0 - 2.0 * e);
            vec3 p = mix(homeW, glyphW, e);
            float arc = sin(e * 3.14159265);
            p += (uRight * (aSeed - 0.5) + uUp * (aRnd - 0.5)) * arc * 0.5;
            float pulse = uPulseAmt * exp(-pow((aHome.x - uPulsePos) * 0.7, 2.0));
            float tw = 0.9 + 0.1 * sin(uTime * 0.4 + aSeed * 6.2831);
            // the stars never fade — as the type is forged around them they lift a
            // touch, becoming the luminous nodes and highlights inside the letters
            vB = (0.62 + 0.5 * uField + pulse) * tw * (1.0 + 0.35 * uRead);
            vTemp = aTemp; vForm = uForm;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_PointSize = aSize * mix(1.0, 0.56, uForm) * (300.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: `
          precision highp float;
          uniform float uAppear; varying float vB; varying float vTemp; varying float vForm;
          void main(){
            vec2 uv = gl_PointCoord - 0.5;
            float d = length(uv);
            float core  = pow(clamp(1.0 - d / mix(0.11, 0.08, vForm), 0.0, 1.0), 1.6);
            float inner = exp(-d * 10.0) * (1.0 - 0.35 * vForm);
            float halo  = exp(-d * 4.0) * (1.0 - 0.82 * vForm);
            float cross = (exp(-abs(uv.x) * 26.0) + exp(-abs(uv.y) * 26.0)) * exp(-d * 3.0) * (1.0 - 0.7 * vForm);
            float inten = core * 1.25 + inner * 0.55 + halo * 0.5 + cross * 0.2;
            inten *= smoothstep(0.5, 0.4, d);
            inten *= vB;
            vec3 warm = vec3(1.0, 0.93, 0.82);
            vec3 cool = vec3(0.72, 0.82, 1.0);
            vec3 col = mix(warm, cool, clamp(vTemp * 0.5 + smoothstep(0.0, 0.4, d) * 0.6, 0.0, 1.0));
            gl_FragColor = vec4(col, inten * uAppear);
          }`,
      }),
    [],
  );
  const lastActive = useRef(-1);
  useFrame((s) => {
    mat.uniforms.uTime.value = s.clock.elapsedTime;
    mat.uniforms.uForm.value = shared.form;
    mat.uniforms.uField.value = shared.field;
    mat.uniforms.uRead.value = shared.read;
    mat.uniforms.uAppear.value = shared.appear;
    mat.uniforms.uPulsePos.value = shared.pulsePos;
    mat.uniforms.uPulseAmt.value = shared.pulseAmt;
    mat.uniforms.uAnchor.value.copy(shared.anchor);
    mat.uniforms.uRight.value.copy(shared.right);
    mat.uniforms.uUp.value.copy(shared.up);
    mat.uniforms.uForward.value.copy(shared.forward);
    if (lastActive.current !== shared.active) {
      lastActive.current = shared.active;
      const attr = geo.attributes.aGlyph as THREE.BufferAttribute;
      (attr.array as Float32Array).set(glyphs[shared.active].pts);
      attr.needsUpdate = true;
    }
  });
  // drawn over the type so the stars remain luminous nodes within the letters
  return <points geometry={geo} material={mat} renderOrder={30} />;
}

/* ------------- the refined typography, risen from the constellation ------------- */
function Words({ shared, glyphs }: { shared: Shared; glyphs: Glyphs[] }) {
  const { camera } = useThree();
  const grp = useRef<THREE.Group>(null);
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const qRef = useRef<any>(null);
  const idxRef = useRef<any>(null);
  const ansRef = useRef<any>(null);
  const qV = useRef(0);
  const idxV = useRef(0);
  const ansV = useRef(0);
  const [active, setActive] = useState(0);
  useFrame(() => {
    if (grp.current) {
      grp.current.position.copy(shared.anchor);
      grp.current.quaternion.copy(camera.quaternion);
    }
    if (shared.active !== active) setActive(shared.active);
    const ap = shared.appear;
    const qT = shared.read * ap;
    const ansT = ansTF(shared.t) * ap;
    // the type rises slowly from within the stars, and eases away slowly
    qV.current += (qT - qV.current) * 0.08;
    idxV.current += (ansT - idxV.current) * 0.06;
    ansV.current += (ansT - ansV.current) * 0.05;
    const q = qRef.current;
    const ix = idxRef.current;
    const a = ansRef.current;
    for (const o of [q, ix, a]) {
      if (o && !o.__init) { o.material.depthTest = false; o.material.depthWrite = false; o.renderOrder = 22; o.__init = true; }
    }
    if (q && Math.abs((q.__op ?? -1) - qV.current) > 0.008) {
      q.fillOpacity = qV.current;
      q.outlineOpacity = qV.current * 0.4;
      q.__op = qV.current; q.sync?.();
    }
    if (ix && Math.abs((ix.__op ?? -1) - idxV.current) > 0.01) { ix.fillOpacity = idxV.current * 0.8; ix.__op = idxV.current; ix.sync?.(); }
    if (a) {
      a.position.y = -2.1 - (1 - ansV.current) * 0.12;
      if (Math.abs((a.__op ?? -1) - ansV.current) > 0.01) { a.fillOpacity = ansV.current; a.__op = ansV.current; a.sync?.(); }
    }
  });
  /* eslint-enable @typescript-eslint/no-explicit-any */
  const faq = FAQS[active];
  const question = glyphs[active].lines.join("\n");
  return (
    <group ref={grp}>
      {/* the question — crisp type, aligned exactly to the star framework */}
      <Text ref={qRef} font={FONT_BOLD} fontSize={HEAD_FONT} color="#f2f5ff" anchorX="center" anchorY="middle"
        textAlign="center" lineHeight={HEAD_LH} letterSpacing={-0.005}
        outlineWidth={0} outlineBlur="7%" outlineColor="#6f86dc" outlineOpacity={0}
        position={[0, 0, 0]} fillOpacity={0}>
        {question}
      </Text>
      <Text ref={idxRef} font={FONT_BOLD} fontSize={0.11} color="#9fb2e8" anchorX="center" anchorY="middle"
        letterSpacing={0.35} position={[0, -1.75, 0]} fillOpacity={0}>
        {`0${active + 1}  /  0${N}`}
      </Text>
      <Text ref={ansRef} font={FONT_REG} fontSize={0.14} color="#cdd6ea" anchorX="center" anchorY="top"
        textAlign="center" maxWidth={5.8} lineHeight={1.55} position={[0, -2.1, 0]} fillOpacity={0}>
        {faq.a}
      </Text>
    </group>
  );
}

/* ------------------------------- camera ------------------------------- */
function Rig({ scroll, shared }: { scroll?: { get: () => number }; shared: Shared }) {
  const { camera } = useThree();
  const eased = useRef(0);
  const t0 = useRef(-1);
  const pos = useRef(new THREE.Vector3(0, 0, 7.2));
  const lookS = useRef(new THREE.Vector3());
  const inited = useRef(false);
  const dir = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());
  const upv = useRef(new THREE.Vector3());
  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (t0.current < 0) t0.current = t;
    const target = scroll ? scroll.get() : 0;
    eased.current += (target - eased.current) * Math.min(1, delta * 0.9);
    const p = eased.current;
    shared.p = p;
    shared.appear = smoothstep(0.3, 3.2, t - t0.current);

    const { active, t: lt } = winPos(p);
    shared.active = active;
    shared.t = lt;
    shared.form = formF(lt);
    shared.field = fieldF(lt);
    shared.read = readF(lt);
    const pw = smoothstep(0.06, 0.32, lt);
    shared.pulsePos = -12 + 24 * pw;
    shared.pulseAmt = 0.5 * Math.sin(Math.PI * clamp01((lt - 0.06) / 0.26)) * (1 - shared.form * 0.4);

    const camTarget = new THREE.Vector3(
      Math.sin(t * 0.05) * 0.5,
      0.2 + Math.sin(t * 0.04) * 0.3,
      7.2 + Math.sin(t * 0.03) * 0.35,
    );
    if (!inited.current) { pos.current.copy(camTarget); inited.current = true; }
    pos.current.lerp(camTarget, Math.min(1, delta * 0.6));
    camera.position.copy(pos.current);
    camera.up.set(0, 1, 0);
    lookS.current.lerp(new THREE.Vector3(Math.sin(t * 0.03) * 0.3, Math.sin(t * 0.025) * 0.2, -2), Math.min(1, delta * 0.8));
    camera.lookAt(lookS.current);

    dir.current.copy(lookS.current).sub(camera.position).normalize();
    right.current.setFromMatrixColumn(camera.matrixWorld, 0).normalize();
    upv.current.setFromMatrixColumn(camera.matrixWorld, 1).normalize();
    shared.anchor.copy(camera.position).addScaledVector(dir.current, 9.0);
    shared.right.copy(right.current);
    shared.up.copy(upv.current);
    shared.forward.copy(dir.current);
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
    p: 0, active: 0, t: 0, form: 0, field: 0, read: 0, pulsePos: 0, pulseAmt: 0,
    anchor: new THREE.Vector3(), right: new THREE.Vector3(1, 0, 0),
    up: new THREE.Vector3(0, 1, 0), forward: new THREE.Vector3(0, 0, -1), appear: 0,
  }).current;

  // lay out every question once — the stars and the type share this layout
  const glyphs = useMemo<Glyphs[]>(() => FAQS.map((f) => {
    const lines = wrapLines(f.q);
    return { lines, pts: sampleFromLines(lines) };
  }), []);

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
        camera={{ position: [0, 0, 7.2], fov: 55 }}
        frameloop={active ? "always" : "never"}
        eventSource={eventSource as unknown as RefObject<HTMLElement>}
        eventPrefix="client"
        onCreated={({ scene }) => {
          scene.fog = new THREE.FogExp2(0x03040a, 0.012);
        }}
      >
        <Rig scroll={scroll} shared={shared} />
        <BackdropStars />
        <Links shared={shared} />
        <StarField shared={shared} glyphs={glyphs} />
        <Words shared={shared} glyphs={glyphs} />
      </Canvas>
    </div>
  );
}
