"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { FAQS } from "@/lib/data";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useIsMobile } from "@/hooks/useMediaQuery";

/* ==================================================================== *
 * The Constellation. A living night sky suspended in darkness. The stars
 * are not the words — they are celestial guides. As the visitor drifts
 * through, one region awakens: a pulse crosses the sky and the stars glide
 * into an elegant composition AROUND the question — a ring, an underline, a
 * crown, corner accents — a frame that orbits and emphasises the space where
 * the question lives. Then, from the centre of that arrangement, the
 * question is revealed: crisp typography the constellation has uncovered —
 * not become, not replaced. The stars remain exactly where they are,
 * glowing around the words, presenting them. Reading holds all three — the
 * constellation, the stars, the typography — the type the hero, the sky its
 * frame. Leaving, the words fade and the stars drift back into the night.
 * Like spotlights revealing a sculpture: they reveal it, they never become it.
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

/* ------------------- the celestial frame around the question ------------------- */
// Not letters — a composition the stars settle into AROUND the words: an
// elliptical ring, an understroke beneath, a light crown above, corner accents,
// and a sparse outer halo. The centre is left clear for the typography.
const FRAME_A = 5.0;   // ring semi-axes
const FRAME_B = 2.6;
const FRAME = (() => {
  const r = mulberry(20240);
  const out = new Float32Array(COUNT * 2);
  let idx = 0;
  const put = (x: number, y: number) => { if (idx < COUNT) { out[idx * 2] = x; out[idx * 2 + 1] = y; idx += 1; } };
  // the ring
  const ring = 210;
  for (let i = 0; i < ring; i += 1) {
    const ang = (i / ring) * Math.PI * 2 + (r() - 0.5) * 0.14;
    const rad = 1 + (r() - 0.5) * 0.1;
    put(Math.cos(ang) * FRAME_A * rad + (r() - 0.5) * 0.3, Math.sin(ang) * FRAME_B * rad + (r() - 0.5) * 0.3);
  }
  // the understroke — a line of stars emphasising the question
  const und = 72;
  for (let i = 0; i < und; i += 1) {
    const x = (r() * 2 - 1) * 3.3;
    const dip = 0.12 * (x / 3.3) * (x / 3.3);
    put(x, -1.72 - dip + (r() - 0.5) * 0.22);
  }
  // a light crown above
  const top = 40;
  for (let i = 0; i < top; i += 1) {
    const x = (r() * 2 - 1) * 2.5;
    const lift = 0.14 * (x / 2.5) * (x / 2.5);
    put(x, 1.72 + lift + (r() - 0.5) * 0.2);
  }
  // corner accents — framing brackets
  const corners: [number, number][] = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
  const per = 18;
  for (const [sx, sy] of corners) {
    for (let i = 0; i < per; i += 1) put(sx * (3.6 + (r() - 0.5) * 0.7), sy * (2.05 + (r() - 0.5) * 0.6));
  }
  // a sparse outer halo, blending the frame back into the sky
  while (idx < COUNT) {
    const ang = r() * Math.PI * 2;
    const rad = 1.32 + r() * 0.5;
    put(Math.cos(ang) * FRAME_A * rad, Math.sin(ang) * FRAME_B * rad);
  }
  return out;
})();

/* ------------------------------ the sequence ------------------------------ */
//   0.00–0.14  the sky rests; a pulse of light begins to cross it
//   0.14–0.44  the stars glide into the celestial frame around the question
//   0.48–0.62  the question is revealed from the centre of the frame
//   0.62–0.76  reading — the type is the hero, framed by the glowing stars
//   0.74–0.96  the words fade; the stars drift back into the constellation
function winPos(p: number): { active: number; t: number } {
  const x = clamp(p * N, 0, N - 1e-4);
  const active = Math.floor(x);
  return { active, t: x - active };
}
const formF = (t: number) => smoothstep(0.14, 0.44, t) * (1 - smoothstep(0.74, 0.96, t));
const fieldF = (t: number) => smoothstep(0.05, 0.2, t) * (1 - smoothstep(0.86, 0.99, t));
const readF = (t: number) => smoothstep(0.48, 0.62, t) * (1 - smoothstep(0.76, 0.88, t));
const ansTF = (t: number) => smoothstep(0.62, 0.72, t) * (1 - smoothstep(0.8, 0.88, t));

const QFONT = 0.5;   // hero question, world units per em
const QWRAP = 6.4;   // wrap width in world units

/* ----------------------------- shared bus ----------------------------- */
type Shared = {
  p: number;
  active: number;
  t: number;
  form: number;
  field: number;
  read: number;
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

/* --------------------- the stars — celestial guides / spotlights --------------------- */
function StarField({ shared }: { shared: Shared }) {
  const geo = useMemo(() => {
    const r = mulberry(4242);
    const position = new Float32Array(COUNT * 3);
    const aHome = new Float32Array(COUNT * 3);
    const aFrame = new Float32Array(COUNT * 2);
    const aZ = new Float32Array(COUNT);
    const aSeed = new Float32Array(COUNT);
    const aSize = new Float32Array(COUNT);
    const aTemp = new Float32Array(COUNT);
    const aRnd = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i += 1) {
      aHome[i * 3] = HOME[i].x; aHome[i * 3 + 1] = HOME[i].y; aHome[i * 3 + 2] = HOME[i].z;
      aFrame[i * 2] = FRAME[i * 2];
      aFrame[i * 2 + 1] = FRAME[i * 2 + 1];
      aZ[i] = (r() - 0.5) * 0.7;
      aSeed[i] = r();
      aSize[i] = 0.6 + r() * 0.75;
      aTemp[i] = r();
      aRnd[i] = r();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(position, 3));
    g.setAttribute("aHome", new THREE.Float32BufferAttribute(aHome, 3));
    g.setAttribute("aFrame", new THREE.Float32BufferAttribute(aFrame, 2));
    g.setAttribute("aZ", new THREE.Float32BufferAttribute(aZ, 1));
    g.setAttribute("aSeed", new THREE.Float32BufferAttribute(aSeed, 1));
    g.setAttribute("aSize", new THREE.Float32BufferAttribute(aSize, 1));
    g.setAttribute("aTemp", new THREE.Float32BufferAttribute(aTemp, 1));
    g.setAttribute("aRnd", new THREE.Float32BufferAttribute(aRnd, 1));
    return g;
  }, []);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 }, uForm: { value: 0 }, uField: { value: 0 }, uRead: { value: 0 }, uAppear: { value: 0 },
          uOrbit: { value: 0 }, uPulsePos: { value: 0 }, uPulseAmt: { value: 0 },
          uAnchor: { value: new THREE.Vector3() }, uRight: { value: new THREE.Vector3(1, 0, 0) },
          uUp: { value: new THREE.Vector3(0, 1, 0) }, uForward: { value: new THREE.Vector3(0, 0, -1) },
        },
        vertexShader: `
          attribute vec3 aHome; attribute vec2 aFrame; attribute float aZ, aSeed, aSize, aTemp, aRnd;
          uniform float uTime, uForm, uField, uRead, uOrbit, uPulsePos, uPulseAmt;
          uniform vec3 uAnchor, uRight, uUp, uForward;
          varying float vB; varying float vTemp;
          void main(){
            vec3 br = vec3(sin(uTime * 0.28 + aSeed * 11.0), sin(uTime * 0.23 + aSeed * 7.0), sin(uTime * 0.18 + aSeed * 5.0));
            vec3 homeW = aHome + br * 0.2;
            // the frame gently orbits, so the composition feels alive
            float ca = cos(uOrbit), sa = sin(uOrbit);
            vec2 fr = vec2(aFrame.x * ca - aFrame.y * sa, aFrame.x * sa + aFrame.y * ca);
            vec3 frameW = uAnchor + uRight * fr.x + uUp * fr.y + uForward * aZ;
            float e = clamp((uForm - aRnd * 0.22) / 0.78, 0.0, 1.0);
            e = e * e * (3.0 - 2.0 * e);
            vec3 p = mix(homeW, frameW, e);
            float arc = sin(e * 3.14159265);
            p += (uRight * (aSeed - 0.5) + uUp * (aRnd - 0.5)) * arc * 0.5;
            float pulse = uPulseAmt * exp(-pow((aHome.x - uPulsePos) * 0.7, 2.0));
            float tw = 0.88 + 0.12 * sin(uTime * 0.4 + aSeed * 6.2831);
            // the stars stay full and celestial, and lift a touch as they present
            // the question — spotlights brightening on the sculpture
            vB = (0.62 + 0.5 * uField + pulse) * tw * (1.0 + 0.3 * uRead);
            vTemp = aTemp;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_PointSize = aSize * mix(1.0, 0.86, uForm) * (300.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: `
          precision highp float;
          uniform float uAppear; varying float vB; varying float vTemp;
          void main(){
            vec2 uv = gl_PointCoord - 0.5;
            float d = length(uv);
            float core  = pow(clamp(1.0 - d / 0.10, 0.0, 1.0), 1.6);
            float inner = exp(-d * 10.0);
            float halo  = exp(-d * 4.0);
            float cross = (exp(-abs(uv.x) * 26.0) + exp(-abs(uv.y) * 26.0)) * exp(-d * 3.0);
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
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    mat.uniforms.uTime.value = t;
    mat.uniforms.uForm.value = shared.form;
    mat.uniforms.uField.value = shared.field;
    mat.uniforms.uRead.value = shared.read;
    mat.uniforms.uAppear.value = shared.appear;
    mat.uniforms.uOrbit.value = 0.055 * Math.sin(t * 0.13) * shared.form;
    mat.uniforms.uPulsePos.value = shared.pulsePos;
    mat.uniforms.uPulseAmt.value = shared.pulseAmt;
    mat.uniforms.uAnchor.value.copy(shared.anchor);
    mat.uniforms.uRight.value.copy(shared.right);
    mat.uniforms.uUp.value.copy(shared.up);
    mat.uniforms.uForward.value.copy(shared.forward);
  });
  return <points geometry={geo} material={mat} />;
}

/* ------------- the typography the constellation reveals (the hero) ------------- */
function Words({ shared }: { shared: Shared }) {
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
    // the question is uncovered slowly from the centre; nothing snaps
    qV.current += (qT - qV.current) * 0.08;
    idxV.current += (qT - idxV.current) * 0.07; // the caption appears with the question
    ansV.current += (ansT - ansV.current) * 0.05;
    const q = qRef.current;
    const ix = idxRef.current;
    const a = ansRef.current;
    for (const o of [q, ix, a]) {
      if (o && !o.__init) { o.material.depthTest = false; o.material.depthWrite = false; o.renderOrder = 24; o.__init = true; }
    }
    if (q) {
      q.scale.setScalar(0.965 + 0.035 * qV.current); // revealed with a gentle settle
      if (Math.abs((q.__op ?? -1) - qV.current) > 0.008) {
        q.fillOpacity = qV.current;
        q.outlineOpacity = qV.current * 0.4;
        q.__op = qV.current; q.sync?.();
      }
    }
    if (ix && Math.abs((ix.__op ?? -1) - idxV.current) > 0.01) { ix.fillOpacity = idxV.current * 0.8; ix.__op = idxV.current; ix.sync?.(); }
    if (a) {
      a.position.y = -3.05 - (1 - ansV.current) * 0.12;
      if (Math.abs((a.__op ?? -1) - ansV.current) > 0.01) { a.fillOpacity = ansV.current; a.__op = ansV.current; a.sync?.(); }
    }
  });
  /* eslint-enable @typescript-eslint/no-explicit-any */
  const faq = FAQS[active];
  return (
    <group ref={grp}>
      {/* the question — crisp type, the hero, revealed at the centre of the frame */}
      <Text ref={qRef} font={FONT_BOLD} fontSize={QFONT} color="#f4f7ff" anchorX="center" anchorY="middle"
        textAlign="center" maxWidth={QWRAP} lineHeight={1.16} letterSpacing={-0.01}
        outlineWidth={0} outlineBlur="6%" outlineColor="#6f86dc" outlineOpacity={0}
        position={[0, 0.12, 0]} fillOpacity={0}>
        {faq.q}
      </Text>
      <Text ref={idxRef} font={FONT_BOLD} fontSize={0.1} color="#9fb2e8" anchorX="center" anchorY="middle"
        letterSpacing={0.35} position={[0, -1.32, 0]} fillOpacity={0}>
        {`0${active + 1}  /  0${N}`}
      </Text>
      <Text ref={ansRef} font={FONT_REG} fontSize={0.14} color="#cdd6ea" anchorX="center" anchorY="top"
        textAlign="center" maxWidth={5.8} lineHeight={1.55} position={[0, -3.05, 0]} fillOpacity={0}>
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
        <StarField shared={shared} />
        <Words shared={shared} />
      </Canvas>
    </div>
  );
}
