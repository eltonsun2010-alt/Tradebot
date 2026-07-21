"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { WHY_CARDS } from "@/lib/data";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useIsMobile } from "@/hooks/useMediaQuery";

/* ------------------------------------------------------------------ *
 * The Light Flow — Southpage's signature. A single thin ribbon of
 * illuminated silk travels an infinite black void: it stays calm and
 * softly lit through the journey, keeps its presence as it recedes and
 * dissolves into the distance rather than ending, and only brightens
 * where it swells to wrap a fine framing ring around a principle. Light
 * fragments peel from its edges and drift; nothing floats at random. It
 * is the only light in the dark, and it is the main character.
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

// The Automation chapter — the SAME ribbon, further along the SAME curve. After
// the sixth principle the ribbon travels on, slows, widens, and splits into four
// pathways (the capabilities) that peel from its own edges, then merges back. It
// is one continuous journey and one camera — never a second sculpture.
export const AUTO_LABELS = ["Workflow Automation", "AI Assistants", "Business Integrations", "Customer Systems"] as const;
const NA = AUTO_LABELS.length;
const AUTO_S0 = 138;                                // the ribbon begins to split
const AUTO_S1 = 196;                                // the branches have merged back
const autoStationS = (j: number) => 150 + j * 12;   // the four capabilities: 150,162,174,186

export const cameraMaxS = AUTO_S1 + 14;             // the journey now runs through Automation
export const cameraS = (p: number) => p * cameraMaxS;
export const N_ROOMS = N;
function clamp(x: number, a: number, b: number) { return x < a ? a : x > b ? b : x; }
function smoothstep(a: number, b: number, x: number) {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}
export const stationReveal = (p: number, i: number) => smoothstep(11, 3.2, Math.abs(stationS(i) - cameraS(p)));
const revealAtS = (s: number, i: number) => smoothstep(11.5, 3.6, Math.abs(stationS(i) - s));
// how deep into the automation zone we are, and how far the branches have peeled
const autoZone = (s: number) => smoothstep(AUTO_S0 - 16, AUTO_S0, s) * smoothstep(AUTO_S1 + 16, AUTO_S1, s);
const autoEmerge = (s: number) => smoothstep(AUTO_S0, AUTO_S0 + 14, s) * smoothstep(AUTO_S1, AUTO_S1 - 14, s);
const autoStationReveal = (s: number, j: number) => smoothstep(8.5, 2.8, Math.abs(autoStationS(j) - s));
// the finale dive: once merged, the single ribbon curves gracefully DOWNWARD and
// accelerates into the space below, carrying the camera with it — the descent
// becomes the scroll into the Process chapter
const FINALE_S = 196;
const FINALE_DROP = 20;
function finaleDrop(s: number): number {
  const t = smoothstep(FINALE_S, cameraMaxS, s);
  return -FINALE_DROP * t * t; // accelerating downward curve, off the bottom
}

// how much the ribbon fattens as it nears each destination (the "widen & wrap")
function widen(u: number): number {
  let w = 0;
  for (let i = 0; i < N; i += 1) {
    const d = (u - stationU(i)) / 0.026;
    w += Math.exp(-d * d);
  }
  return w;
}

// the flow slows, nearly pauses to present, then eases away — never constant. It
// slows at each of the six principles and again at each of the four automation
// pathways, so the whole journey shares one rhythm.
const NS = 500;
const DIP_P = 6.0 / cameraMaxS; // a station dip ~6 arc-units wide, independent of length
const S_LUT = (() => {
  const pst = [
    ...Array.from({ length: N }, (_, i) => stationS(i) / cameraMaxS),
    ...Array.from({ length: NA }, (_, j) => autoStationS(j) / cameraMaxS),
  ];
  const cum = [0];
  let total = 0;
  for (let k = 1; k <= NS; k += 1) {
    const p = k / NS;
    let sp = 1;
    for (const ps of pst) {
      const d = (p - ps) / DIP_P;
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

/* --------------------- the ribbon of illuminated silk --------------------- */
// A continuous flattened-tube band swept along the flow — a wide, very thin
// ribbon of silk with a real (tiny) thickness. Because it is a closed lens
// section, it NEVER collapses to zero screen area: as it rolls edge-on the
// broad face turns away but the thin edge still presents a fine bright line, so
// the sculpture stays physically present from beginning to end. Existence lives
// in the mesh; illumination is handled entirely in the material.
const CROSS = 10; // points around the flattened cross-section
function stripGeometry(
  halfW: (u: number) => number,
  twistAmp: number,
  offset: (u: number) => number,
  halfT = 0.05,
): THREE.BufferGeometry {
  const n = 380;
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const boost: number[] = [];
  const emg: number[] = [];
  const flow: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= n; i += 1) {
    const u = i / n;
    const p = CURVE.getPointAt(u);
    p.y += finaleDrop(u * CURVE_L); // the ribbon dives downward at the very end
    const T = CURVE.getTangentAt(u).normalize();
    let R = new THREE.Vector3().crossVectors(UP, T);
    if (R.lengthSq() < 1e-4) R.set(1, 0, 0);
    R.normalize();
    const Nr = new THREE.Vector3().crossVectors(T, R).normalize();
    const tw = twistAmp * Math.sin(u * 16.0);
    const w = R.clone().multiplyScalar(Math.cos(tw)).add(Nr.clone().multiplyScalar(Math.sin(tw))).normalize(); // width axis
    const nrm = Nr.clone().multiplyScalar(Math.cos(tw)).add(R.clone().multiplyScalar(-Math.sin(tw))).normalize(); // thickness axis
    const c = p.clone().add(Nr.clone().multiplyScalar(offset(u)));
    const hw = halfW(u);
    const az = autoZone(u * CURVE_L);
    const b = Math.min(1, widen(u) + 0.5 * az); // brighter at a stop, and as it gathers to split
    for (let j = 0; j < CROSS; j += 1) {
      const th = (j / CROSS) * Math.PI * 2;
      const ct = Math.cos(th);
      const st = Math.sin(th);
      // flattened ellipse: wide across w, wafer-thin across nrm
      const point = c.clone()
        .add(w.clone().multiplyScalar(hw * ct))
        .add(nrm.clone().multiplyScalar(halfT * st));
      // outward normal of that ellipse (semi-axes hw along w, halfT along nrm)
      const normal = w.clone().multiplyScalar(halfT * ct)
        .add(nrm.clone().multiplyScalar(hw * st))
        .normalize();
      pos.push(point.x, point.y, point.z);
      nor.push(normal.x, normal.y, normal.z);
      // uv.y peaks (0.5) at the broad-face centres, falls to the edges → the
      // glow band still reads "bright down the middle of the face"
      uv.push(u, 0.5 + 0.5 * ct);
      boost.push(b);
      emg.push(1); // the main ribbon is always fully present
      flow.push(az); // information pulses only run once it enters Automation
    }
  }
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < CROSS; j += 1) {
      const a = i * CROSS + j;
      const bb = i * CROSS + ((j + 1) % CROSS);
      const c = (i + 1) * CROSS + j;
      const d = (i + 1) * CROSS + ((j + 1) % CROSS);
      idx.push(a, c, bb, bb, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute("aBoost", new THREE.Float32BufferAttribute(boost, 1));
  g.setAttribute("aEmerge", new THREE.Float32BufferAttribute(emg, 1));
  g.setAttribute("aFlow", new THREE.Float32BufferAttribute(flow, 1));
  g.setIndex(idx);
  return g;
}

// A flattened-silk tube swept along an ARBITRARY curve (used for the automation
// branches). Sampled in uniform parameter space so the emerge/flow functions,
// keyed on arc-length s, line up. Same cross-section and attributes as the main
// ribbon, so a branch is unmistakably the same material.
function tubeAlong(curve: THREE.Curve<THREE.Vector3>, a: number, b: number, halfW: number, halfT: number): THREE.BufferGeometry {
  const n = 200;
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const boost: number[] = [];
  const emg: number[] = [];
  const flow: number[] = [];
  const idx: number[] = [];
  const P = new THREE.Vector3();
  const T = new THREE.Vector3();
  for (let i = 0; i <= n; i += 1) {
    const u = i / n;
    const s = a + u * (b - a);
    curve.getPoint(u, P);
    P.y += finaleDrop(s); // follow the ribbon's downward dive at the finale
    curve.getTangent(u, T).normalize();
    let R = new THREE.Vector3().crossVectors(UP, T);
    if (R.lengthSq() < 1e-4) R.set(1, 0, 0);
    R.normalize();
    const Nr = new THREE.Vector3().crossVectors(T, R).normalize();
    const taper = Math.pow(Math.sin(Math.PI * u), 0.35);
    const hw = halfW * (0.5 + 0.5 * taper);
    const e = autoEmerge(s);
    for (let j = 0; j < CROSS; j += 1) {
      const th = (j / CROSS) * Math.PI * 2;
      const ct = Math.cos(th);
      const st = Math.sin(th);
      const point = P.clone().addScaledVector(R, hw * ct).addScaledVector(Nr, halfT * st);
      const normal = R.clone().multiplyScalar(halfT * ct).addScaledVector(Nr, hw * st).normalize();
      pos.push(point.x, point.y, point.z);
      nor.push(normal.x, normal.y, normal.z);
      uv.push(u, 0.5 + 0.5 * ct);
      boost.push(0.7 * e);
      emg.push(e);
      flow.push(e);
    }
  }
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < CROSS; j += 1) {
      const p0 = i * CROSS + j;
      const p1 = i * CROSS + ((j + 1) % CROSS);
      const p2 = (i + 1) * CROSS + j;
      const p3 = (i + 1) * CROSS + ((j + 1) % CROSS);
      idx.push(p0, p2, p1, p1, p2, p3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute("aBoost", new THREE.Float32BufferAttribute(boost, 1));
  g.setAttribute("aEmerge", new THREE.Float32BufferAttribute(emg, 1));
  g.setAttribute("aFlow", new THREE.Float32BufferAttribute(flow, 1));
  g.setIndex(idx);
  return g;
}

// the branches peel from the ribbon's own edges: a branch starts just inside the
// edge and only swings out where it has emerged, then retracts and rejoins
const AUTO_BASE_ANG = [0.6, -0.6, Math.PI + 0.6, Math.PI - 0.6];
const AUTO_RMAX = 2.1;
const AUTO_TWIST = 1.2 * Math.PI;
// each pathway takes on its own calm hue as it leaves the ribbon — the trail is
// still one continuous neutral silk; only the branches bloom into colour
const AUTO_HUES = [
  new THREE.Color(0.82, 0.89, 1.0),  // Workflow Automation — cool white-blue
  new THREE.Color(0.72, 0.7, 1.0),   // AI Assistants — soft violet
  new THREE.Color(0.66, 0.9, 0.94),  // Business Integrations — teal
  new THREE.Color(1.0, 0.9, 0.76),   // Customer Systems — warm champagne
];
function ribbonHalfWAt(s: number): number {
  const u = clamp(s / CURVE_L, 0, 1);
  return 0.3 + 0.34 * widen(u) + 0.14 * autoZone(s);
}
function autoBranchPoint(j: number, s: number, out: THREE.Vector3): THREE.Vector3 {
  const f = frameAt(s);
  const e = autoEmerge(s);
  const indiv = 0.7 + 0.3 * Math.sin(s * 0.5 + j * 1.7);
  const edge = ribbonHalfWAt(s) * 0.85;
  const rad = edge + e * (AUTO_RMAX * indiv - edge);
  const ang = AUTO_BASE_ANG[j] + AUTO_TWIST * e;
  out.copy(f.pos).addScaledVector(f.right, Math.cos(ang) * rad).addScaledVector(f.up, Math.sin(ang) * rad);
  return out;
}
function autoBranchCurve(j: number): { curve: THREE.CatmullRomCurve3; a: number; b: number } {
  const a = AUTO_S0 - 6;
  const b = AUTO_S1 + 6;
  const pts: THREE.Vector3[] = [];
  const M2 = 140;
  for (let i = 0; i <= M2; i += 1) pts.push(autoBranchPoint(j, a + (i / M2) * (b - a), new THREE.Vector3()));
  return { curve: new THREE.CatmullRomCurve3(pts, false, "centripetal", 0.5), a, b };
}

// illuminated silk: broad and luminous when its face turns toward you, thinning
// to a fine line edge-on, with a satin highlight and a gentle internal glow
// woven in and soft blooming edges. Light lives in the fabric — no glass.
function silkMaterial(core: THREE.Color, edge: THREE.Color, sheenCol: THREE.Color, alpha: number, soft = 0.42) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 }, uReveal: { value: 1 }, uAppear: { value: 1 }, uAlpha: { value: alpha }, uSoft: { value: soft },
      uCore: { value: core }, uEdge: { value: edge }, uSheen: { value: sheenCol },
    },
    vertexShader: `
      attribute float aBoost; attribute float aEmerge; attribute float aFlow;
      varying vec3 vN; varying vec3 vV; varying vec2 vUv; varying float vBoost; varying float vDepth; varying float vEmerge; varying float vFlow;
      void main(){ vUv=uv; vBoost=aBoost; vEmerge=aEmerge; vFlow=aFlow; vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.0); vV=normalize(-mv.xyz); vDepth=-mv.z; gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `
      precision highp float;
      varying vec3 vN; varying vec3 vV; varying vec2 vUv; varying float vBoost; varying float vDepth; varying float vEmerge; varying float vFlow;
      uniform float uTime, uReveal, uAppear, uAlpha, uSoft; uniform vec3 uCore, uEdge, uSheen;
      void main(){
        vec3 N = normalize(vN); vec3 V = normalize(vV);
        float ndv = abs(dot(N, V));
        vec3 L = normalize(vec3(0.3, 0.75, 0.55));
        float sheen = pow(abs(dot(N, L)), 2.4);            // refined satin highlight
        float across = 1.0 - abs(vUv.y - 0.5) * 2.0;
        float softEdge = smoothstep(0.0, uSoft, across);   // edges bloom softly
        float glow = pow(clamp(across, 0.0, 1.0), 1.9);    // subtle internal glow
        float shimmer = 0.86 + 0.14 * sin(vUv.x * 15.0 - uTime * 1.0);
        // gentle caps so the very ends of the mesh aren't hard-edged
        float ends = smoothstep(0.0, 0.015, vUv.x) * smoothstep(1.0, 0.985, vUv.x);
        // the cinematic reveal wipes the silk into being as the journey opens
        float wipe = (1.0 - smoothstep(uAppear * 1.4 - 0.22, uAppear * 1.4, vUv.x)) * smoothstep(0.0, 0.22, uAppear);
        // calm during travel; the brightest silk only at the stops it swells for
        float boost = 0.5 + 0.85 * vBoost;

        // ── EXISTENCE (always drawn) ─────────────────────────────────────
        // A faint, constant body that does NOT depend on facing the camera, so
        // the ribbon is physically present even edge-on and never disappears.
        // Only a soft, floored distance term lets it recede — it dims into the
        // dark but the mesh is always there: "the journey continues".
        float presence = clamp(exp(-0.006 * vDepth), 0.42, 1.0);
        float base = 0.06 * (0.55 + 0.45 * softEdge) * ends * wipe * presence;

        // ── ILLUMINATION (variable) ──────────────────────────────────────
        // The luminous silk: bright when its broad face turns toward you, lifted
        // at the stops, softened by atmospheric haze in the distance. Haze only
        // reduces the light — never the ribbon's existence.
        float face = 0.4 + 0.6 * smoothstep(0.05, 0.82, ndv);
        float haze = clamp(exp(-0.013 * vDepth), 0.0, 1.0);
        float lit = (0.10 + 0.24 * glow) * face * softEdge * shimmer * boost * ends * wipe * haze;

        // information flowing — soft bands of light running the ribbon, but only
        // through Automation (vFlow) where the systems come alive
        float pv = fract(vUv.x * 3.0 - uTime * 0.16);
        float pulse = smoothstep(0.0, 0.05, pv) * (1.0 - smoothstep(0.05, 0.16, pv));
        lit += pulse * 0.5 * vFlow * softEdge * haze;

        // branches appear only where they have peeled away from the ribbon's edge
        float peel = smoothstep(0.03, 0.28, vEmerge);
        vec3 col = mix(uEdge, uCore, glow) + sheen * 0.3 * uSheen + pulse * vFlow * 0.4 * uCore;
        float a = (base + lit) * uReveal * uAlpha * peel;
        gl_FragColor = vec4(col, a);
      }`,
  });
}

// a soft additive glow for the framing loop — a fine bright ring, not a tube
function ringMaterial(color: THREE.Color) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uCol: { value: color }, uReveal: { value: 0 } },
    vertexShader: `
      varying vec3 vN; varying vec3 vV;
      void main(){ vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.0); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `
      precision highp float; varying vec3 vN; varying vec3 vV; uniform vec3 uCol; uniform float uReveal;
      void main(){
        float rim = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 1.3);
        gl_FragColor = vec4(uCol, rim * uReveal * 0.6);
      }`,
  });
}

function Ribbon({ shared }: { shared: Shared }) {
  // thin, elegant — width breathes gently, swells a little at a stop, expands as
  // it gathers energy to split in Automation, and finally tapers to a fine
  // thread as all of it distils toward a single point of light
  const endThin = (u: number) => 0.32 + 0.68 * smoothstep(1.0, 0.9, u);
  const wMain = (u: number) => (0.3 + 0.08 * Math.sin(u * 20 + 0.4) + 0.34 * widen(u) + 0.14 * autoZone(u * CURVE_L)) * endThin(u);
  // a calmer roll now the tube keeps a visible edge even side-on
  const bodyGeo = useMemo(() => stripGeometry(wMain, 0.35, () => 0, 0.05), []);
  const haloGeo = useMemo(() => stripGeometry((u) => wMain(u) * 2.2 + 0.25, 0.35, () => 0, 0.06), []);
  // companion silks that part and rejoin
  const sA = useMemo(() => stripGeometry(() => 0.09, 0.4, (u) => 0.7 * Math.sin(u * 8.0) * smoothstep(0.0, 0.15, u) * smoothstep(1.0, 0.85, u), 0.03), []);
  const sB = useMemo(() => stripGeometry(() => 0.08, 0.45, (u) => -0.9 * Math.sin(u * 6.5 + 0.8) * smoothstep(0.0, 0.15, u) * smoothstep(1.0, 0.85, u), 0.03), []);
  const body = useMemo(() => silkMaterial(new THREE.Color(0.9, 0.94, 1.0), new THREE.Color(0.36, 0.5, 0.86), new THREE.Color(0.95, 0.92, 0.82), 0.78, 0.42), []);
  const halo = useMemo(() => silkMaterial(new THREE.Color(0.56, 0.7, 1.0), new THREE.Color(0.22, 0.34, 0.78), new THREE.Color(0.7, 0.8, 1.0), 0.15, 0.85), []);
  const thin = useMemo(() => silkMaterial(new THREE.Color(0.78, 0.88, 1.0), new THREE.Color(0.38, 0.52, 0.9), new THREE.Color(0.85, 0.9, 1.0), 0.32, 0.6), []);
  const mats = [body, halo, thin];
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
      <mesh geometry={haloGeo} material={halo} renderOrder={1} />
      <mesh geometry={bodyGeo} material={body} renderOrder={2} />
      <mesh geometry={sA} material={thin} renderOrder={1} />
      <mesh geometry={sB} material={thin} renderOrder={1} />
    </group>
  );
}

/* ------------- the Automation transformation of the same ribbon ------------- */
// four pathways of the SAME silk peel from the ribbon's edges, carry a
// capability each, and merge back — a chapter of the sculpture, not a new one
function AutoBranches({ shared }: { shared: Shared }) {
  const bodies = useMemo(() => AUTO_LABELS.map((_, j) => { const { curve, a, b } = autoBranchCurve(j); return tubeAlong(curve, a, b, 0.17, 0.04); }), []);
  const halos = useMemo(() => AUTO_LABELS.map((_, j) => { const { curve, a, b } = autoBranchCurve(j); return tubeAlong(curve, a, b, 0.4, 0.05); }), []);
  // each pathway carries its own hue, but the same silk material and body
  const bodyMats = useMemo(() => AUTO_HUES.map((h) => silkMaterial(h.clone(), h.clone().multiplyScalar(0.5), h.clone().lerp(new THREE.Color(1, 1, 1), 0.35), 0.82, 0.5)), []);
  const haloMats = useMemo(() => AUTO_HUES.map((h) => silkMaterial(h.clone().multiplyScalar(0.78), h.clone().multiplyScalar(0.36), h.clone(), 0.14, 0.85)), []);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const ap = shared.appear.current;
    for (const m of [...bodyMats, ...haloMats]) { m.uniforms.uTime.value = t; m.uniforms.uAppear.value = ap; }
  });
  return (
    <group>
      {halos.map((g, j) => <mesh key={`h${j}`} geometry={g} material={haloMats[j]} renderOrder={1} />)}
      {bodies.map((g, j) => <mesh key={`b${j}`} geometry={g} material={bodyMats[j]} renderOrder={2} />)}
      {AUTO_LABELS.map((_, j) => <AutoStation key={j} j={j} shared={shared} />)}
    </group>
  );
}

// each capability, billboarded to the camera and revealed only as the drone
// draws level with its pathway — one at a time, discovered through the motion
function AutoStation({ j, shared }: { j: number; shared: Shared }) {
  const anchor = useMemo(() => {
    const s = autoStationS(j);
    const f = frameAt(s);
    const p = autoBranchPoint(j, s, new THREE.Vector3());
    const out = p.clone().sub(f.pos).normalize();
    return p.clone().addScaledVector(out, 0.7);
  }, [j]);
  const billboard = useRef<THREE.Group>(null);
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const labelRef = useRef<any>(null);
  const tickRef = useRef<any>(null);
  const shown = useRef(0);
  useFrame((state) => {
    const s = shared.spos.current;
    let nearest = 0; let best = 1e9;
    for (let k = 0; k < NA; k += 1) { const d = Math.abs(autoStationS(k) - s); if (d < best) { best = d; nearest = k; } }
    const r = autoStationReveal(s, j);
    const target = j === nearest ? smoothstep(0.4, 0.85, r) * smoothstep(0.2, 0.6, shared.appear.current) : 0;
    shown.current += (target - shown.current) * 0.12;
    if (billboard.current) billboard.current.quaternion.copy(state.camera.quaternion);
    for (const ref of [labelRef, tickRef]) {
      const o = ref.current;
      if (!o) continue;
      if (!o.__init) { o.material.depthTest = false; o.material.depthWrite = false; o.renderOrder = 14; o.__init = true; }
      if (Math.abs((o.__op ?? -1) - shown.current) > 0.02) { o.fillOpacity = shown.current; o.__op = shown.current; o.sync?.(); }
    }
  });
  /* eslint-enable @typescript-eslint/no-explicit-any */
  return (
    <group ref={billboard} position={[anchor.x, anchor.y, anchor.z]}>
      <Text ref={tickRef} font={FONT_BOLD} fontSize={0.16} color={`#${AUTO_HUES[j].getHexString()}`} anchorX="center" anchorY="middle"
        letterSpacing={0.35} position={[0, 0.34, 0]} fillOpacity={0}>
        {`0${j + 1}`}
      </Text>
      <Text ref={labelRef} font={FONT_BOLD} fontSize={0.42} color="#f5f8ff" anchorX="center" anchorY="middle"
        textAlign="center" maxWidth={3.4} lineHeight={1.05} letterSpacing={-0.01} position={[0, -0.06, 0]} fillOpacity={0}>
        {AUTO_LABELS[j]}
      </Text>
    </group>
  );
}

/* --------------------- fragments of the ribbon --------------------- */
// not a particle field — a small number of light fragments that peel from the
// ribbon's edges, drift with momentum, fade into the dark, and recycle back.
// Everything belongs to the ribbon; nothing floats at random.
function RibbonSparks() {
  const geo = useMemo(() => {
    const count = 200;
    const start = new Float32Array(count * 3);
    const drift = new Float32Array(count * 3);
    const siz = new Float32Array(count);
    const pha = new Float32Array(count);
    const spd = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      const u = 0.02 + Math.random() * 0.96;
      const f = frameAt(u * CURVE_L);
      const side = Math.random() < 0.5 ? -1 : 1;
      // born just off an edge of the ribbon
      const edge = f.pos.clone()
        .add(f.right.clone().multiplyScalar(side * (0.26 + Math.random() * 0.14)))
        .add(f.up.clone().multiplyScalar((Math.random() - 0.5) * 0.18));
      // drift: gently outward and a little downstream, with momentum
      const d = f.right.clone().multiplyScalar(side * (0.5 + Math.random() * 1.5))
        .add(f.up.clone().multiplyScalar((Math.random() - 0.35) * 1.1))
        .add(f.fwd.clone().multiplyScalar((Math.random() - 0.5) * 1.6));
      start[i * 3] = edge.x; start[i * 3 + 1] = edge.y; start[i * 3 + 2] = edge.z;
      drift[i * 3] = d.x; drift[i * 3 + 1] = d.y; drift[i * 3 + 2] = d.z;
      siz[i] = 0.35 + Math.random() * 0.7;
      pha[i] = Math.random();
      spd[i] = 0.6 + Math.random() * 0.7;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(start, 3));
    g.setAttribute("aDrift", new THREE.Float32BufferAttribute(drift, 3));
    g.setAttribute("aSize", new THREE.Float32BufferAttribute(siz, 1));
    g.setAttribute("aPhase", new THREE.Float32BufferAttribute(pha, 1));
    g.setAttribute("aSpeed", new THREE.Float32BufferAttribute(spd, 1));
    return g;
  }, []);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uTex: { value: GLOW } },
        vertexShader: `
          attribute vec3 aDrift; attribute float aSize; attribute float aPhase; attribute float aSpeed;
          uniform float uTime; varying float vA;
          void main(){
            float life = fract(uTime * 0.05 * aSpeed + aPhase);   // slow release cycle
            float e = 1.0 - pow(1.0 - life, 1.8);                 // ease out with momentum
            vec3 p = position + aDrift * e;
            // peel in softly, then dissolve into darkness
            vA = smoothstep(0.0, 0.14, life) * (1.0 - smoothstep(0.45, 1.0, life));
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_PointSize = aSize * (1.0 - 0.35 * life) * (170.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: `
          uniform sampler2D uTex; varying float vA;
          void main(){ vec4 t = texture2D(uTex, gl_PointCoord); gl_FragColor = vec4(vec3(0.78,0.87,1.0), t.a * vA * 0.28); }`,
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
  const count = 110;

  // as the flow arrives, a few fragments peel off the ribbon and drift outward,
  // then dissolve back — a gentle emission, never a halo ringing the circle
  const geo = useMemo(() => {
    const on = new Float32Array(count * 3);
    const drift = new Float32Array(count * 3);
    const siz = new Float32Array(count);
    const pha = new Float32Array(count);
    for (let j = 0; j < count; j += 1) {
      const g2 = frameAt(stationS(i) + 4 + (Math.random() - 0.5) * 8);
      const side = Math.random() < 0.5 ? -1 : 1;
      const edge = g2.pos.clone()
        .add(g2.right.clone().multiplyScalar(side * (0.24 + Math.random() * 0.16)))
        .add(g2.up.clone().multiplyScalar((Math.random() - 0.5) * 0.3));
      on[j * 3] = edge.x; on[j * 3 + 1] = edge.y; on[j * 3 + 2] = edge.z;
      const d = g2.right.clone().multiplyScalar(side * (0.7 + Math.random() * 1.8))
        .add(g2.up.clone().multiplyScalar((Math.random() - 0.3) * 1.4))
        .add(g2.fwd.clone().multiplyScalar((Math.random() - 0.5) * 2.2));
      drift[j * 3] = d.x; drift[j * 3 + 1] = d.y; drift[j * 3 + 2] = d.z;
      siz[j] = 0.35 + Math.random() * 0.85;
      pha[j] = Math.random() * Math.PI * 2;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(on, 3));
    g.setAttribute("aDrift", new THREE.Float32BufferAttribute(drift, 3));
    g.setAttribute("aSize", new THREE.Float32BufferAttribute(siz, 1));
    g.setAttribute("aPhase", new THREE.Float32BufferAttribute(pha, 1));
    return g;
  }, [i]);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uReveal: { value: 0 }, uTex: { value: GLOW }, uColor: { value: hue } },
        vertexShader: `
          attribute vec3 aDrift; attribute float aSize; attribute float aPhase;
          uniform float uTime, uReveal; varying float vA;
          void main(){
            float r = smoothstep(0.0, 1.0, uReveal);
            float flow = 0.5 + 0.5 * sin(uTime * 0.5 + aPhase);   // gentle, alive
            vec3 p = position + aDrift * (r * (0.45 + 0.55 * flow));
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_PointSize = aSize * (0.5 + 0.5 * r) * (190.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
            vA = r * (0.55 + 0.45 * flow);
          }`,
        fragmentShader: `
          uniform sampler2D uTex; uniform vec3 uColor; varying float vA;
          void main(){ vec4 t = texture2D(uTex, gl_PointCoord); gl_FragColor = vec4(uColor, t.a * vA * 0.3); }`,
      }),
    [hue],
  );

  // the framing loop — a fine ring of light wrapping the typography
  const ringGeo = useMemo(() => new THREE.TorusGeometry(2.75, 0.05, 8, 72), []);
  const ringMat = useMemo(() => ringMaterial(hue.clone()), [hue]);
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
    // the travelling follow pose — the same drone eases back and rises through
    // the Automation split to take in the pathways, then settles as they merge
    const az = autoZone(s);
    // the finale: the drone follows the ribbon into its downward dive. It trails
    // the descent (only part of the drop) so the ribbon sinks toward the bottom
    // of the frame and slips off below — the descent IS the scroll into Process.
    const dive = smoothstep(cameraMaxS - 30, cameraMaxS - 2, s);
    const off = 1 - 0.55 * dive;
    const follow = f.pos.clone()
      .add(f.right.clone().multiplyScalar((-0.9 - 0.5 * az) * off + Math.sin(t * 0.12) * 0.25 * off))
      .add(f.up.clone().multiplyScalar((0.5 + 2.6 * az) * off + Math.sin(t * 0.1) * 0.18 * off))
      .add(f.fwd.clone().multiplyScalar(-4.5 * az - 2.0 * dive));
    follow.y += finaleDrop(s) * 0.45; // the camera dives too, but lags the ribbon
    // the opening beauty pose — pulled back and raised, slowly drifting in
    const intro = f0.pos.clone()
      .add(f0.right.clone().multiplyScalar(-3.4 + Math.sin(t * 0.18) * 0.4))
      .add(f0.up.clone().multiplyScalar(2.1 + Math.sin(t * 0.14) * 0.2))
      .add(f0.fwd.clone().multiplyScalar(-6.5));
    const k = smoothstep(0.08, 1.0, app);
    const camTarget = intro.clone().lerp(follow, k);
    const aheadDrop = ahead.pos.clone();
    aheadDrop.y += finaleDrop(s + AHEAD); // look toward where the ribbon is diving
    const lookTarget = introTgt.pos.clone().lerp(aheadDrop, k);

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
        {stage >= 1 && <RibbonSparks />}
        {stage >= 1 && WHY_CARDS.map((_, i) => (
          <Installation key={i} i={i} shared={shared} />
        ))}
        {stage >= 1 && <AutoBranches shared={shared} />}
      </Canvas>
    </div>
  );
}
