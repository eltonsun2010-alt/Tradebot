"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { WHY_CARDS } from "@/lib/data";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useIsMobile } from "@/hooks/useMediaQuery";

/* ------------------------------------------------------------------ *
 * The Light Flow — Southpage's signature. A single sculptural ribbon of
 * light travels an infinite black void: a physical object of liquid glass
 * with real width, thickness and a surface that catches light as it
 * twists — bright blooming edges, translucent detailed core. It weaves,
 * arcs and spirals, splits and rejoins; at each principle it slows,
 * widens and wraps a framing loop around the words while particles peel
 * from its edges, then it gathers itself and flows on. It is the only
 * light in the dark, and it is the main character.
 * ------------------------------------------------------------------ */

const N = WHY_CARDS.length;
const STEP = 7.4;
const M = 30;
const LEAD_S = 15;
const GAP_S = 16;
const TAIL_S = 16;
const AHEAD = 7.0;

const FB = process.env.NEXT_PUBLIC_BASE_PATH || "";
const FONT_BOLD = `${FB}/fonts/syne-700.ttf`;
const FONT_REG = `${FB}/fonts/syne-400.ttf`;

// the flow: an ever-evolving current — layered arcs and a drifting spiral, no
// straight sections, yet forward speed always dominates so it never lurches
const CURVE = (() => {
  const pts: THREE.Vector3[] = [];
  for (let k = 0; k <= M; k += 1) {
    const ang = k * 0.5;
    const rad = 3.2 + 1.4 * Math.sin(k * 0.27 + 0.6);
    const x = rad * Math.sin(ang) + 2.1 * Math.sin(k * 0.16 + 0.3) + 0.9 * Math.sin(k * 0.63);
    const y = rad * 0.6 * Math.cos(ang) + 1.6 * Math.sin(k * 0.21 + 1.1) + 0.7 * Math.cos(k * 0.55);
    const z = 2 - k * STEP;
    pts.push(new THREE.Vector3(x, y, z));
  }
  return new THREE.CatmullRomCurve3(pts, false, "centripetal", 0.5);
})();
const CURVE_L = CURVE.getLength();

const stationU = (i: number) => clamp((LEAD_S + i * GAP_S) / CURVE_L, 0, 1);
export const stationS = (i: number) => LEAD_S + i * GAP_S;
export const cameraMaxS = stationS(N - 1) + TAIL_S;
export const cameraS = (p: number) => p * cameraMaxS;
export const N_ROOMS = N;
function clamp(x: number, a: number, b: number) { return x < a ? a : x > b ? b : x; }
function smoothstep(a: number, b: number, x: number) {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}
export const stationReveal = (p: number, i: number) => smoothstep(11, 3.2, Math.abs(stationS(i) - cameraS(p)));
const revealAtS = (s: number, i: number) => smoothstep(11.5, 3.6, Math.abs(stationS(i) - s));

// how much the ribbon fattens as it nears each destination (the "widen & wrap")
function widen(u: number): number {
  let w = 0;
  for (let i = 0; i < N; i += 1) {
    const d = (u - stationU(i)) / 0.026;
    w += Math.exp(-d * d);
  }
  return w;
}

// the flow slows, nearly pauses to present, then eases away — never constant
const NS = 500;
const S_LUT = (() => {
  const pst = Array.from({ length: N }, (_, i) => stationS(i) / cameraMaxS);
  const cum = [0];
  let total = 0;
  for (let k = 1; k <= NS; k += 1) {
    const p = k / NS;
    let sp = 1;
    for (const ps of pst) {
      const d = (p - ps) / 0.055;
      sp -= 0.86 * Math.exp(-d * d);
    }
    total += Math.max(0.06, sp);
    cum.push(total);
  }
  return cum.map((c) => (c / total) * cameraMaxS);
})();
function sArc(p: number): number {
  const x = clamp(p, 0, 1) * NS;
  const i = Math.floor(x);
  const f = x - i;
  const a = S_LUT[i] ?? 0;
  const b = S_LUT[Math.min(NS, i + 1)] ?? a;
  return a + (b - a) * f;
}

const UP = new THREE.Vector3(0, 1, 0);
const _t = new THREE.Vector3();
const posAt = (s: number) => CURVE.getPointAt(clamp(s / CURVE_L, 0, 1));
const tanAt = (s: number) => CURVE.getTangentAt(clamp(s / CURVE_L, 0, 1), _t).normalize();
function frameAt(s: number) {
  const fwd = tanAt(s).clone();
  let right = new THREE.Vector3().crossVectors(UP, fwd);
  if (right.lengthSq() < 1e-4) right = new THREE.Vector3(1, 0, 0);
  right.normalize();
  const up = new THREE.Vector3().crossVectors(fwd, right).normalize();
  return { pos: posAt(s).clone(), fwd, right, up };
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
  g.addColorStop(0.28, "rgba(255,255,255,0.5)");
  g.addColorStop(0.6, "rgba(255,255,255,0.12)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const t = new THREE.CanvasTexture(c);
  t.needsUpdate = true;
  return t;
}
const GLOW = glowTexture();

const HUES = [
  new THREE.Color(0.74, 0.84, 1.0),
  new THREE.Color(0.88, 0.92, 1.0),
  new THREE.Color(0.8, 0.88, 1.0),
  new THREE.Color(0.94, 0.96, 1.0),
  new THREE.Color(1.0, 0.92, 0.78),
  new THREE.Color(0.82, 0.9, 1.0),
];

// spos = the ribbon's current arc-length; appear = the cinematic reveal (0→1)
type Shared = { spos: { current: number }; appear: { current: number } };

/* ------------------------- the glass ribbon ------------------------- */
// swept lens cross-section → a ribbon with real width & thickness and proper
// surface normals, so it catches light differently as it twists.
function tubeGeometry(halfW: (u: number) => number, halfT: number, twistAmp: number, offset: (u: number) => number, K = 10): THREE.BufferGeometry {
  const n = 340;
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= n; i += 1) {
    const u = i / n;
    const p = CURVE.getPointAt(u);
    // arc-length-consistent stable frame (right, up) around the tangent
    const T = CURVE.getTangentAt(u).normalize();
    let R = new THREE.Vector3().crossVectors(UP, T);
    if (R.lengthSq() < 1e-4) R.set(1, 0, 0);
    R.normalize();
    const Nr = new THREE.Vector3().crossVectors(T, R).normalize();
    const tw = twistAmp * Math.sin(u * 18.0);
    const b = R.clone().multiplyScalar(Math.cos(tw)).add(Nr.clone().multiplyScalar(Math.sin(tw))).normalize();
    const nn = Nr.clone().multiplyScalar(Math.cos(tw)).add(R.clone().multiplyScalar(-Math.sin(tw))).normalize();
    const c = p.clone().add(Nr.clone().multiplyScalar(offset(u)));
    const hw = halfW(u);
    for (let k = 0; k < K; k += 1) {
      const a = (k / K) * Math.PI * 2;
      const ca = Math.cos(a), sa = Math.sin(a);
      const vp = c.clone().add(b.clone().multiplyScalar(ca * hw)).add(nn.clone().multiplyScalar(sa * halfT));
      const nrm = b.clone().multiplyScalar(ca * halfT).add(nn.clone().multiplyScalar(sa * hw)).normalize();
      pos.push(vp.x, vp.y, vp.z);
      nor.push(nrm.x, nrm.y, nrm.z);
      uv.push(u, k / K);
    }
  }
  for (let i = 0; i < n; i += 1) {
    for (let k = 0; k < K; k += 1) {
      const a = i * K + k;
      const b2 = i * K + ((k + 1) % K);
      const c2 = (i + 1) * K + k;
      const d = (i + 1) * K + ((k + 1) % K);
      idx.push(a, c2, b2, b2, c2, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

// the translucent body — liquid-glass: fresnel rim, a sheen that shifts with
// orientation, a slow band of inner light. Normal-blended, writes depth so it
// reads as a solid object; the additive halo blooms only at its silhouette.
function glassMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: true,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uReveal: { value: 1 },
      uAppear: { value: 1 },
      uBody: { value: new THREE.Color(0.22, 0.36, 0.68) },
      uRim: { value: new THREE.Color(0.95, 0.98, 1.0) },
      uSheen: { value: new THREE.Color(1.0, 0.95, 0.86) },
    },
    vertexShader: `
      varying vec3 vN; varying vec3 vV; varying vec2 vUv;
      void main(){
        vUv = uv;
        vN = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      precision highp float;
      varying vec3 vN; varying vec3 vV; varying vec2 vUv;
      uniform float uTime, uReveal, uAppear; uniform vec3 uBody, uRim, uSheen;
      void main(){
        vec3 N = normalize(vN); vec3 V = normalize(vV);
        float ndv = abs(dot(N, V));
        float fres = pow(1.0 - ndv, 2.4);
        // a sheen and a soft reflected-environment gradient give the surface
        // orientation-based highlights — the light lives inside the material
        vec3 L = normalize(vec3(0.35, 0.7, 0.55));
        float sheen = pow(max(dot(N, L), 0.0), 3.6);
        vec3 R = reflect(-V, N);
        float envu = clamp(R.y * 0.5 + 0.5, 0.0, 1.0);
        vec3 env = mix(vec3(0.05, 0.08, 0.17), vec3(0.82, 0.9, 1.0), smoothstep(0.25, 0.96, envu));
        // a slow internal light seen through the translucent body (detail kept)
        float core = smoothstep(0.75, 0.0, abs(vUv.y - 0.5) * 2.0);
        float band = 0.72 + 0.28 * sin(vUv.x * 22.0 - uTime * 1.3);
        float slow = 0.82 + 0.18 * sin(vUv.x * 5.0 - uTime * 0.5);
        float ends = smoothstep(0.0, 0.03, vUv.x) * smoothstep(1.0, 0.965, vUv.x);
        vec3 col = mix(uBody, uRim, fres) + sheen * 0.55 * uSheen + env * fres * 0.7 + core * 0.14 * uRim;
        // the sculpture emerges from darkness, near end first
        float wipe = 1.0 - smoothstep(uAppear * 1.4 - 0.22, uAppear * 1.4, vUv.x);
        wipe *= smoothstep(0.0, 0.22, uAppear);
        float a = (0.26 + 0.6 * fres + core * 0.12) * band * slow * ends * uReveal * wipe;
        gl_FragColor = vec4(col, a);
      }`,
  });
}

// the additive halo/core around the body — soft silhouette bloom & inner spark
function glowMaterial(color: THREE.Color, power: number, alpha: number) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uCol: { value: color }, uPow: { value: power }, uA: { value: alpha }, uAppear: { value: 1 } },
    vertexShader: `
      varying vec3 vN; varying vec3 vV; varying vec2 vUv;
      void main(){ vUv=uv; vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.0); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `
      precision highp float; varying vec3 vN; varying vec3 vV; varying vec2 vUv;
      uniform float uTime, uPow, uA, uAppear; uniform vec3 uCol;
      void main(){
        float fres = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), uPow);
        float band = 0.72 + 0.28 * sin(vUv.x * 32.0 - uTime * 1.7);
        float ends = smoothstep(0.0, 0.04, vUv.x) * smoothstep(1.0, 0.95, vUv.x);
        float wipe = (1.0 - smoothstep(uAppear * 1.4 - 0.22, uAppear * 1.4, vUv.x)) * smoothstep(0.0, 0.22, uAppear);
        gl_FragColor = vec4(uCol, fres * band * ends * uA * wipe);
      }`,
  });
}

function Ribbon({ shared }: { shared: Shared }) {
  // width breathes and swells at each destination (widen & wrap)
  const wMain = (u: number) => 0.42 + 0.16 * Math.sin(u * 22 + 0.4) + 0.6 * widen(u);
  const bodyGeo = useMemo(() => tubeGeometry(wMain, 0.09, 0.55, () => 0, 12), []);
  const haloGeo = useMemo(() => tubeGeometry((u) => wMain(u) * 1.9 + 0.5, 0.24, 0.4, () => 0, 10), []);
  const coreGeo = useMemo(() => tubeGeometry(() => 0.05, 0.05, 0.6, () => 0, 6), []);
  // companion strands that part and rejoin
  const sA = useMemo(() => tubeGeometry(() => 0.05, 0.05, 0.7, (u) => 0.9 * Math.sin(u * 8.0) * smoothstep(0.0, 0.15, u) * smoothstep(1.0, 0.85, u), 6), []);
  const sB = useMemo(() => tubeGeometry(() => 0.045, 0.045, 0.8, (u) => -1.15 * Math.sin(u * 6.5 + 0.8) * smoothstep(0.0, 0.15, u) * smoothstep(1.0, 0.85, u), 6), []);
  const body = useMemo(() => glassMaterial(), []);
  const halo = useMemo(() => glowMaterial(new THREE.Color(0.46, 0.62, 1.0), 2.8, 0.2), []);
  const core = useMemo(() => glowMaterial(new THREE.Color(0.9, 0.95, 1.0), 0.9, 0.42), []);
  const thin = useMemo(() => glowMaterial(new THREE.Color(0.78, 0.88, 1.0), 1.6, 0.4), []);
  const mats = [body, halo, core, thin];
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const ap = shared.appear.current;
    for (const m of mats) {
      m.uniforms.uTime.value = t;
      m.uniforms.uAppear.value = ap;
    }
  });
  return (
    <group>
      <mesh geometry={bodyGeo} material={body} renderOrder={1} />
      <mesh geometry={haloGeo} material={halo} renderOrder={2} />
      <mesh geometry={coreGeo} material={core} renderOrder={3} />
      <mesh geometry={sA} material={thin} renderOrder={2} />
      <mesh geometry={sB} material={thin} renderOrder={2} />
    </group>
  );
}

/* ----------------------- ambient light dust ------------------------ */
// dust that belongs to the ribbon — born near it and drifting behind for depth
function Dust() {
  const geo = useMemo(() => {
    const count = 650;
    const pos = new Float32Array(count * 3);
    const siz = new Float32Array(count);
    const pha = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      const s = Math.random() * CURVE_L;
      const f = frameAt(s);
      const r = 0.8 + Math.random() * 14;
      const a = Math.random() * Math.PI * 2;
      const p = f.pos.clone().add(f.right.clone().multiplyScalar(Math.cos(a) * r)).add(f.up.clone().multiplyScalar(Math.sin(a) * r)).add(f.fwd.clone().multiplyScalar(-Math.random() * 4));
      pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z;
      siz[i] = 0.4 + Math.random() * 1.4;
      pha[i] = Math.random() * Math.PI * 2;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("aSize", new THREE.Float32BufferAttribute(siz, 1));
    g.setAttribute("aPhase", new THREE.Float32BufferAttribute(pha, 1));
    return g;
  }, []);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uTex: { value: GLOW } },
        vertexShader: `
          attribute float aSize; attribute float aPhase; uniform float uTime; varying float vTw;
          void main(){
            vec3 p = position;
            p.y += sin(uTime * 0.1 + aPhase) * 0.5;
            p.x += cos(uTime * 0.08 + aPhase) * 0.4;
            vTw = 0.5 + 0.5 * sin(uTime * 0.4 + aPhase);
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_PointSize = aSize * (150.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: `
          uniform sampler2D uTex; varying float vTw;
          void main(){ vec4 t = texture2D(uTex, gl_PointCoord); gl_FragColor = vec4(vec3(0.66,0.78,1.0), t.a * vTw * 0.24); }`,
      }),
    [],
  );
  useFrame((s) => { mat.uniforms.uTime.value = s.clock.elapsedTime; });
  return <points geometry={geo} material={mat} />;
}

/* --------------------- the service installations -------------------- */
// the ribbon wraps a framing loop around the words; particles peel from its
// edges and drift; the words emerge, then everything dissolves back.
function Installation({ i, shared }: { i: number; shared: Shared }) {
  const card = WHY_CARDS[i];
  const f = useMemo(() => frameAt(stationS(i) + 4), [i]);
  const hue = HUES[i % HUES.length];
  const count = 360;

  // particles that peel off the ribbon near the station and drift away
  const geo = useMemo(() => {
    const form = new Float32Array(count * 3);
    const scatter = new Float32Array(count * 3);
    const siz = new Float32Array(count);
    const pha = new Float32Array(count);
    for (let j = 0; j < count; j += 1) {
      // gathered: a soft halo just outside the framing loop
      const a = (j / count) * Math.PI * 2 * 2;
      const rr = 2.7 + Math.random() * 1.4;
      const fp = f.pos.clone()
        .add(f.right.clone().multiplyScalar(Math.cos(a) * rr))
        .add(f.up.clone().multiplyScalar(Math.sin(a) * rr))
        .add(f.fwd.clone().multiplyScalar((Math.random() - 0.5) * 1.2));
      form[j * 3] = fp.x; form[j * 3 + 1] = fp.y; form[j * 3 + 2] = fp.z;
      // peeled state: on the ribbon itself, a touch off its edge
      const s2 = stationS(i) + 4 + (Math.random() - 0.5) * 6;
      const g2 = frameAt(s2);
      const edge = g2.pos.clone().add(g2.right.clone().multiplyScalar((Math.random() - 0.5) * 1.0)).add(g2.up.clone().multiplyScalar((Math.random() - 0.5) * 0.5));
      scatter[j * 3] = edge.x; scatter[j * 3 + 1] = edge.y; scatter[j * 3 + 2] = edge.z;
      siz[j] = 0.4 + Math.random() * 1.1;
      pha[j] = Math.random() * Math.PI * 2;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(form, 3));
    g.setAttribute("aScatter", new THREE.Float32BufferAttribute(scatter, 3));
    g.setAttribute("aSize", new THREE.Float32BufferAttribute(siz, 1));
    g.setAttribute("aPhase", new THREE.Float32BufferAttribute(pha, 1));
    return g;
  }, [i, f]);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uReveal: { value: 0 }, uTex: { value: GLOW }, uColor: { value: hue } },
        vertexShader: `
          attribute vec3 aScatter; attribute float aSize; attribute float aPhase;
          uniform float uTime, uReveal; varying float vA;
          void main(){
            float r = smoothstep(0.0, 1.0, uReveal);
            vec3 p = mix(aScatter, position, r);
            p += (0.1 + 0.5 * (1.0 - r)) * sin(uTime * 0.6 + aPhase) * vec3(1.0, 0.9, 1.1);
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_PointSize = aSize * (0.5 + 0.5 * r) * (200.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
            vA = r;
          }`,
        fragmentShader: `
          uniform sampler2D uTex; uniform vec3 uColor; varying float vA;
          void main(){ vec4 t = texture2D(uTex, gl_PointCoord); gl_FragColor = vec4(uColor, t.a * vA * 0.5); }`,
      }),
    [hue],
  );

  // the framing loop — a glass ring of the ribbon wrapping the typography
  const ringGeo = useMemo(() => new THREE.TorusGeometry(2.75, 0.1, 10, 64), []);
  const ringMat = useMemo(() => {
    const m = glassMaterial();
    (m.uniforms.uBody.value as THREE.Color).copy(hue).multiplyScalar(0.7);
    m.depthWrite = false;
    return m;
  }, [hue]);
  const ring = useRef<THREE.Mesh>(null);

  const grp = useRef<THREE.Group>(null);
  const textA = useRef({ v: 0 }).current;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const titleRef = useRef<any>(null);
  const idxRef = useRef<any>(null);
  const bodyRef = useRef<any>(null);
  useFrame((state) => {
    const r = revealAtS(shared.spos.current, i);
    const t = state.clock.elapsedTime;
    mat.uniforms.uTime.value = t;
    mat.uniforms.uReveal.value = r;
    ringMat.uniforms.uTime.value = t;
    if (grp.current) grp.current.rotation.z = t * 0.045 + i;
    if (ring.current) {
      ring.current.scale.setScalar(0.55 + 0.45 * r);
      ring.current.rotation.z = -t * 0.06 + i;
      ringMat.uniforms.uReveal.value = r;
    }
    // only the single nearest destination ever shows its words, and only at
    // its heart — so two reveals never overlap and there are no distant ghosts
    let nearest = 0;
    let best = 1e9;
    for (let k = 0; k < N; k += 1) {
      const d = Math.abs(stationS(k) - shared.spos.current);
      if (d < best) { best = d; nearest = k; }
    }
    const gv = i === nearest ? smoothstep(0.5, 0.86, r) : 0;
    textA.v += (gv - textA.v) * 0.14;
    for (const ref of [titleRef, idxRef, bodyRef]) {
      const o = ref.current;
      if (!o) continue;
      if (!o.__init) {
        // draw the words over the glass so they always read clearly at a stop
        o.material.depthTest = false;
        o.material.depthWrite = false;
        o.renderOrder = 12;
        o.__init = true;
      }
      if (Math.abs((o.__op ?? -1) - textA.v) > 0.02) {
        o.fillOpacity = textA.v;
        o.__op = textA.v;
        o.sync?.();
      }
    }
  });
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const theta = Math.atan2(-f.fwd.x, -f.fwd.z);
  const P = (lx: number, ly: number): [number, number, number] => {
    const p = f.pos.clone().add(f.right.clone().multiplyScalar(lx)).add(f.up.clone().multiplyScalar(ly));
    return [p.x, p.y, p.z];
  };
  const idx = String(i + 1).padStart(2, "0");
  return (
    <group>
      <mesh ref={ring} geometry={ringGeo} material={ringMat} position={[f.pos.x, f.pos.y, f.pos.z]} rotation={[0, theta, 0]} renderOrder={4} />
      <group ref={grp}>
        <points geometry={geo} material={mat} />
      </group>
      <Text ref={idxRef} font={FONT_BOLD} fontSize={0.3} color="#dfe8ff" anchorX="center" anchorY="middle" letterSpacing={0.3}
        position={P(0, 1.4)} rotation={[0, theta, 0]} fillOpacity={0}>
        {idx}
      </Text>
      <Text ref={titleRef} font={FONT_BOLD} fontSize={0.62} color="#f6f9ff" anchorX="center" anchorY="middle" textAlign="center" maxWidth={4.2}
        lineHeight={1.05} letterSpacing={-0.01} position={P(0, 0.38)} rotation={[0, theta, 0]} fillOpacity={0}>
        {card.title}
      </Text>
      <Text ref={bodyRef} font={FONT_REG} fontSize={0.21} color="#d2dbee" anchorX="center" anchorY="top" textAlign="center" maxWidth={4.3}
        lineHeight={1.44} position={P(0, -0.55)} rotation={[0, theta, 0]} fillOpacity={0}>
        {card.body}
      </Text>
    </group>
  );
}

/* ------------------------------ camera ------------------------------ */
// a cinematic drone: it never leads, it follows the ribbon with soft inertia.
// It opens on a slow reveal — pulled back to take in the whole sculpture as it
// emerges from black — then eases into the travelling follow as the flow begins.
function Rig({ scroll, shared }: { scroll?: { get: () => number }; shared: Shared }) {
  const { camera } = useThree();
  const eased = useRef(0);
  const t0 = useRef(-1);
  const pos = useRef(new THREE.Vector3());
  const look = useRef(new THREE.Vector3());
  const smooth = useRef(new THREE.Vector3());
  const upv = useRef(new THREE.Vector3(0, 1, 0));
  const inited = useRef(false);
  const f0 = useMemo(() => frameAt(6), []);
  const introTgt = useMemo(() => frameAt(12), []);
  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (t0.current < 0) t0.current = t;
    const target = scroll ? scroll.get() : 0;
    eased.current += (target - eased.current) * Math.min(1, delta * 1.1);
    const s = sArc(eased.current);
    shared.spos.current = s;
    // reveal completes on its own after a held beat, or the instant you scroll
    const timeApp = smoothstep(0.25, 3.0, t - t0.current);
    const scrolled = smoothstep(0.004, 0.03, eased.current);
    const app = Math.max(timeApp, scrolled);
    shared.appear.current = app;

    const f = frameAt(s);
    const ahead = frameAt(s + AHEAD);
    // the travelling follow pose
    const follow = f.pos.clone()
      .add(f.right.clone().multiplyScalar(-0.9 + Math.sin(t * 0.12) * 0.25))
      .add(f.up.clone().multiplyScalar(0.5 + Math.sin(t * 0.1) * 0.18));
    // the opening beauty pose — pulled back and raised, slowly drifting in
    const intro = f0.pos.clone()
      .add(f0.right.clone().multiplyScalar(-3.4 + Math.sin(t * 0.18) * 0.4))
      .add(f0.up.clone().multiplyScalar(2.1 + Math.sin(t * 0.14) * 0.2))
      .add(f0.fwd.clone().multiplyScalar(-6.5));
    const k = smoothstep(0.08, 1.0, app);
    const camTarget = intro.clone().lerp(follow, k);
    const lookTarget = introTgt.pos.clone().lerp(ahead.pos, k);

    // drone inertia: the camera trails its target rather than snapping
    if (!inited.current) { pos.current.copy(camTarget); smooth.current.copy(lookTarget); inited.current = true; }
    pos.current.lerp(camTarget, Math.min(1, delta * 1.5));
    camera.position.copy(pos.current);
    look.current.copy(lookTarget);
    smooth.current.lerp(look.current, Math.min(1, delta * 1.6));
    upv.current.lerp(f.up.clone().multiplyScalar(0.28).add(new THREE.Vector3(0, 1, 0).multiplyScalar(0.72)).normalize(), Math.min(1, delta * 1.0));
    camera.up.copy(upv.current);
    camera.lookAt(smooth.current);
  });
  return null;
}

export default function LightCorridorCanvas({
  eventSource,
  scroll,
}: {
  eventSource: RefObject<HTMLElement | null>;
  scroll?: { get: () => number };
  count?: number;
}) {
  const reduced = usePrefersReducedMotion();
  const mobile = useIsMobile();
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  // progressive load: the sculpture appears instantly; the particles and the
  // service installations fade in a beat later, so the first frame is light
  const [stage, setStage] = useState(0);
  const shared = useRef<Shared>({ spos: { current: 0 }, appear: { current: 0 } }).current;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => setStage(1), 900);
    return () => window.clearTimeout(id);
  }, []);

  const active = !reduced && visible;

  return (
    <div ref={ref} className="absolute inset-0">
      <Canvas
        className="!absolute inset-0"
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
        dpr={reduced ? 1 : [1, mobile ? 1.3 : 1.8]}
        camera={{ position: [0, 1, 4], fov: 60 }}
        frameloop={active ? "always" : "never"}
        eventSource={eventSource as unknown as RefObject<HTMLElement>}
        eventPrefix="client"
        onCreated={({ scene }) => {
          scene.fog = new THREE.FogExp2(0x02030a, 0.011);
        }}
      >
        <Ribbon shared={shared} />
        <Rig scroll={scroll} shared={shared} />
        {stage >= 1 && <Dust />}
        {stage >= 1 && WHY_CARDS.map((_, i) => (
          <Installation key={i} i={i} shared={shared} />
        ))}
      </Canvas>
    </div>
  );
}
