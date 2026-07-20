"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, Text } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState, type RefObject, type ReactNode } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three-stdlib";
import { WHY_CARDS } from "@/lib/data";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useIsMobile } from "@/hooks/useMediaQuery";

/* ------------------------------------------------------------------ *
 * The Southpage pavilion — ONE continuous promenade, not a set of rooms.
 * A single travertine floor with a bronze inlay thread runs the whole
 * length; the ceiling datum rises and falls; the light climbs from a dark
 * threshold to a white exit. The visitor walks a physical route — ramps,
 * curves, a bridge — through eight linked spaces (threshold, six principle
 * installations, exit), each a distinct architectural gesture. The camera
 * holds the direction of travel; the building itself turns the eye.
 * ------------------------------------------------------------------ */

const N = WHY_CARDS.length;
const STEP = 7.0;
const LEAD_S = 15;
const GAP_S = 16;
const HALF_L = 8;
const TAIL_S = 15;
const AHEAD = 6.5;
const FLOOR_Y = -1.7;
const EYE = 0.25;

const FB = process.env.NEXT_PUBLIC_BASE_PATH || "";
const FONT_BOLD = `${FB}/fonts/syne-700.ttf`;
const FONT_REG = `${FB}/fonts/syne-400.ttf`;

// The promenade — gentle turns (x) and real level changes (y): a ramp down
// into the precision slot, a low bridge over the atrium void, a step up to the
// courtyard sky, then a rise into the light of the exit. No sharp turns.
const PATH_X = [0, 0, 0.4, 1.0, 0.3, -1.4, -2.2, -1.0, 0.6, 1.8, 0.8, -1.2, -2.0, -0.9, 0.3, 1.1, 0.5, 0, 0, 0, 0, 0, 0];
const PATH_Y = [0, 0, 0, -0.1, -0.9, -1.8, -2.1, -2.1, -1.6, -1.0, -0.2, 0.5, 0.8, 0.4, -0.2, -0.4, -0.2, 0.3, 0.9, 1.5, 1.8, 1.9, 2.0];
const CURVE = (() => {
  const pts: THREE.Vector3[] = [];
  for (let k = 0; k < PATH_X.length; k += 1) {
    pts.push(new THREE.Vector3(PATH_X[k], PATH_Y[k], 2 - k * STEP));
  }
  return new THREE.CatmullRomCurve3(pts, false, "centripetal", 0.5);
})();
const CURVE_L = CURVE.getLength();

export const stationS = (i: number) => LEAD_S + i * GAP_S;
export const cameraMaxS = stationS(N - 1) + TAIL_S;
export const cameraS = (p: number) => p * cameraMaxS;
export const N_ROOMS = N;
const clamp = (x: number, a: number, b: number) => (x < a ? a : x > b ? b : x);
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
export const stationReveal = (p: number, i: number) => {
  const d = stationS(i) - cameraS(p);
  return smoothstep(13, 5.5, d) * smoothstep(0.2, 3.4, d);
};

const UP = new THREE.Vector3(0, 1, 0);
type Frame = { pos: THREE.Vector3; right: THREE.Vector3; fwd: THREE.Vector3; heading: number };
const _tan = new THREE.Vector3();
function frameAt(s: number): Frame {
  const u = clamp(s / CURVE_L, 0, 1);
  const pos = CURVE.getPointAt(u).clone();
  const fwd = CURVE.getTangentAt(u, _tan).normalize().clone();
  const right = new THREE.Vector3().crossVectors(UP, fwd).normalize();
  return { pos, right, fwd, heading: Math.atan2(fwd.x, fwd.z) };
}
// local (lateral, height-above-floor, along) → world. Height rides the ramp
// (f.pos.y), so floor, walls and camera all follow the level changes together.
function Pp(f: Frame, lx: number, ly: number, lz: number): [number, number, number] {
  return [f.pos.x + f.right.x * lx + f.fwd.x * lz, FLOOR_Y + f.pos.y + ly, f.pos.z + f.right.z * lx + f.fwd.z * lz];
}
function PpV(f: Frame, lx: number, ly: number, lz: number): THREE.Vector3 {
  const p = Pp(f, lx, ly, lz);
  return new THREE.Vector3(p[0], p[1], p[2]);
}

/* ------------------- procedural PBR surface detail -------------------- */
const HAS_DOM = typeof document !== "undefined";
type Draw = (ctx: CanvasRenderingContext2D, s: number) => void;
function tex(draw: Draw, rx = 3, ry = 3): THREE.Texture | null {
  if (!HAS_DOM) return null;
  const s = 256;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  draw(ctx, s);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.anisotropy = 4;
  return t;
}
function mottle(gray: number, spread: number, layers = [8, 26, 80]): Draw {
  return (ctx, s) => {
    ctx.fillStyle = `rgb(${gray},${gray},${gray})`;
    ctx.fillRect(0, 0, s, s);
    ctx.imageSmoothingEnabled = true;
    layers.forEach((n, k) => {
      const g = document.createElement("canvas");
      g.width = g.height = n;
      const gg = g.getContext("2d")!;
      const id = gg.createImageData(n, n);
      for (let i = 0; i < n * n; i += 1) {
        const v = Math.max(0, Math.min(255, gray + (Math.random() * 2 - 1) * spread));
        id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v;
        id.data[i * 4 + 3] = 255;
      }
      gg.putImageData(id, 0, 0);
      ctx.globalAlpha = 0.6 / (k + 1);
      ctx.drawImage(g, 0, 0, s, s);
    });
    ctx.globalAlpha = 1;
  };
}
function streak(gray: number, spread: number): Draw {
  return (ctx, s) => {
    for (let x = 0; x < s; x += 1) {
      const v = Math.max(0, Math.min(255, gray + (Math.random() * 2 - 1) * spread)) | 0;
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(x, 0, 1, s);
    }
  };
}

/* --------------------------- material palette --------------------------- */
const travertine = new THREE.MeshStandardMaterial({
  color: 0xd8cfbe, roughness: 0.86, metalness: 0.02, envMapIntensity: 0.7,
  roughnessMap: tex(mottle(180, 55), 2, 2), bumpMap: tex(mottle(150, 70), 2, 2) ?? undefined, bumpScale: 0.006,
});
const concrete = new THREE.MeshStandardMaterial({
  color: 0xc8c9cc, roughness: 0.9, metalness: 0.02, envMapIntensity: 0.6,
  roughnessMap: tex(mottle(180, 40), 2.5, 2.5), bumpMap: tex(mottle(150, 45), 2.5, 2.5) ?? undefined, bumpScale: 0.004,
});
// darker board-formed concrete for the projection wall (white type reads on it)
const darkConcrete = new THREE.MeshStandardMaterial({
  color: 0x585c63, roughness: 0.92, metalness: 0.02, envMapIntensity: 0.5,
  roughnessMap: tex(mottle(150, 40), 2, 2), bumpMap: tex(mottle(140, 60), 2, 2) ?? undefined, bumpScale: 0.006,
});
const blackStone = new THREE.MeshStandardMaterial({
  color: 0x0c0e12, roughness: 0.15, metalness: 0.5, envMapIntensity: 1.5,
  roughnessMap: tex(mottle(70, 34), 3, 3),
});
const aluminium = new THREE.MeshStandardMaterial({
  color: 0xc3c8ce, roughness: 0.34, metalness: 1.0, envMapIntensity: 1.5,
  roughnessMap: tex(streak(190, 26), 1, 6),
});
const bronze = new THREE.MeshStandardMaterial({
  color: 0x8c6a3e, roughness: 0.42, metalness: 1.0, envMapIntensity: 1.3,
  roughnessMap: tex(streak(150, 30), 1, 5),
});
const oak = new THREE.MeshStandardMaterial({
  color: 0x9a7748, roughness: 0.62, metalness: 0.02, envMapIntensity: 0.5,
  roughnessMap: tex(streak(150, 40), 1, 8), bumpMap: tex(streak(150, 60), 1, 8) ?? undefined, bumpScale: 0.01,
});
const reveal = new THREE.MeshStandardMaterial({ color: 0x050608, roughness: 0.9, metalness: 0 });
const glass = new THREE.MeshPhysicalMaterial({ color: 0x0f141a, metalness: 0, roughness: 0.06, transparent: true, opacity: 0.5, envMapIntensity: 1.4, side: THREE.DoubleSide });
const skyMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.66, 0.75, 0.94), toneMapped: false });
// backlit smoked-glass pane — opaque so the incised content reads crisply
const displayLit = new THREE.MeshStandardMaterial({ color: 0x0e141b, roughness: 0.34, metalness: 0.45, emissive: 0x1b2735, emissiveIntensity: 0.5, envMapIntensity: 1.2, roughnessMap: tex(mottle(80, 26), 2, 2) });
// a dark machined-metal pane for the precision inlay (light lettering)
const steelPane = new THREE.MeshStandardMaterial({ color: 0x1b1f25, roughness: 0.38, metalness: 1.0, envMapIntensity: 1.4, roughnessMap: tex(streak(120, 26), 1, 6) });
// a still, dark, mirror-calm water/stone for reflecting pools
const pool = new THREE.MeshStandardMaterial({ color: 0x090b0f, roughness: 0.08, metalness: 0.6, envMapIntensity: 1.6 });

const shaftMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: {},
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader: `precision mediump float; varying vec2 vUv; void main(){ float x=1.0-abs(vUv.x-0.5)*2.0; float y=smoothstep(1.0,0.25,vUv.y); gl_FragColor=vec4(0.95,0.96,1.0, pow(x,1.7)*y*0.08);} `,
});

const BOX = new THREE.BoxGeometry(1, 1, 1);
const HUES: [number, number, number][] = [
  [0.86, 0.8, 0.66], [0.8, 0.86, 1.0], [0.82, 0.88, 1.0], [0.92, 0.95, 1.0], [1.0, 0.9, 0.66], [0.86, 0.9, 1.0],
];
const hueOf = (i: number) => new THREE.Color(...HUES[((i % HUES.length) + HUES.length) % HUES.length]);

/* ---- per-installation design: each principle, commissioned for its room ---- */
type Variant = "carved" | "metal" | "backlit" | "projected" | "etched" | "monolith";
type Feature = {
  side: 1 | -1;
  wx: number; lz: number; cy: number;
  panelW: number; panelH: number; fs: number; w: number;
  variant: Variant;
};
const FEATURES: Feature[] = [
  { side: 1, wx: 6.4, lz: 1.2, cy: 3.0, panelW: 5.4, panelH: 5.0, fs: 0.6, w: 4.8, variant: "carved" },
  { side: 1, wx: 3.5, lz: 0.0, cy: 2.4, panelW: 4.6, panelH: 3.6, fs: 0.44, w: 4.2, variant: "metal" },
  { side: -1, wx: -9.0, lz: 2.4, cy: 3.6, panelW: 7.0, panelH: 7.4, fs: 0.8, w: 6.2, variant: "backlit" },
  { side: 1, wx: 5.4, lz: 1.0, cy: 2.7, panelW: 5.0, panelH: 4.2, fs: 0.52, w: 4.6, variant: "projected" },
  { side: -1, wx: -8.4, lz: 1.8, cy: 3.0, panelW: 6.0, panelH: 5.2, fs: 0.62, w: 5.2, variant: "etched" },
  { side: 1, wx: 4.4, lz: 1.0, cy: 2.3, panelW: 4.0, panelH: 4.4, fs: 0.46, w: 3.6, variant: "monolith" },
];
type VStyle = { pane: THREE.Material; title: string; body: string; idx: string; freestanding?: boolean };
const VSTYLES: Record<Variant, VStyle> = {
  carved: { pane: travertine, title: "#2c261d", body: "#4c463b", idx: "#7c6a48" },
  metal: { pane: steelPane, title: "#eef1f5", body: "#c3c8d0", idx: "#aebbcf" },
  backlit: { pane: displayLit, title: "#f4f1ea", body: "#cdd2d9", idx: "#9fc0ff" },
  projected: { pane: darkConcrete, title: "#f3f5f8", body: "#d6dae0", idx: "#c9d4ea" },
  etched: { pane: bronze, title: "#f6efe2", body: "#e3d8c4", idx: "#f0d8a8" },
  monolith: { pane: displayLit, title: "#f4f1ea", body: "#cdd2d9", idx: "#c8b48a", freestanding: true },
};
const featureOf = (i: number) => FEATURES[i % FEATURES.length];
function featureWorld(i: number): THREE.Vector3 {
  const f = frameAt(stationS(i));
  const ft = featureOf(i);
  return PpV(f, ft.wx - ft.side * 0.32, ft.cy, ft.lz);
}

/* --------------------------- building blocks --------------------------- */
const _geoCache = new Map<string, THREE.BufferGeometry>();
function roundedGeo(w: number, h: number, d: number): THREE.BufferGeometry {
  const q = (n: number) => Math.round(Math.abs(n) * 100) / 100;
  const key = `${q(w)},${q(h)},${q(d)}`;
  let g = _geoCache.get(key);
  if (!g) {
    const r = Math.min(0.04, Math.min(q(w), q(h), q(d)) * 0.42);
    g = new RoundedBoxGeometry(q(w), q(h), q(d), 2, r);
    _geoCache.set(key, g);
  }
  return g;
}
function B({ mat, p, s, ry = 0, tl = 0 }: { mat: THREE.Material; p: [number, number, number]; s: [number, number, number]; ry?: number; tl?: number }) {
  return <mesh geometry={roundedGeo(s[0], s[1], s[2])} material={mat} position={p} rotation={[tl, ry, 0]} castShadow receiveShadow />;
}

// a monolithic wall along the route, on a recessed floor shadow-gap
function Wall({ f, lx, lz = 0, H, len = HALF_L * 2, th = 0.6, mat, top = true }: { f: Frame; lx: number; lz?: number; H: number; len?: number; th?: number; mat: THREE.Material; top?: boolean }) {
  const h = f.heading;
  const g = 0.1;
  const tg = top ? 0.14 : 0;
  const bodyH = H - g - tg;
  return (
    <group>
      <B mat={mat} p={Pp(f, lx, g + bodyH / 2, lz)} s={[th, bodyH, len]} ry={h} />
      <B mat={reveal} p={Pp(f, lx, g / 2, lz)} s={[th - 0.2, g, len]} ry={h} />
      {top && <B mat={reveal} p={Pp(f, lx, H - tg / 2, lz)} s={[th - 0.2, tg, len]} ry={h} />}
    </group>
  );
}
function CurvedWall({ f, lx, lz, r, h, mat, a0, aLen }: { f: Frame; lx: number; lz: number; r: number; h: number; mat: THREE.Material; a0: number; aLen: number }) {
  const geo = useMemo(() => new THREE.CylinderGeometry(r, r, h, 48, 1, true, a0, aLen), [r, h, a0, aLen]);
  return <mesh geometry={geo} material={mat} position={Pp(f, lx, h / 2, lz)} rotation={[0, f.heading, 0]} castShadow receiveShadow />;
}
function Glazing({ f, lx, H, len = HALF_L * 2, mull = 1 }: { f: Frame; lx: number; H: number; len?: number; mull?: number }) {
  const h = f.heading;
  const items: ReactNode[] = [
    <B key="g" mat={glass} p={Pp(f, lx, H / 2, 0)} s={[0.07, H - 0.3, len]} ry={h} />,
    <B key="sill" mat={aluminium} p={Pp(f, lx, 0.11, 0)} s={[0.14, 0.22, len]} ry={h} />,
    <B key="head" mat={aluminium} p={Pp(f, lx, H - 0.11, 0)} s={[0.14, 0.22, len]} ry={h} />,
  ];
  for (let k = 1; k <= mull; k += 1) {
    const lz = -len / 2 + (len / (mull + 1)) * k;
    items.push(<B key={`m${k}`} mat={aluminium} p={Pp(f, lx, H / 2, lz)} s={[0.1, H - 0.3, 0.1]} ry={h} />);
  }
  return <group>{items}</group>;
}
// a thick wall across the route with one large, asymmetric recessed opening
function Portal({ f, lz, span, H, openW, openH, off = 0, mat }: { f: Frame; lz: number; span: number; H: number; openW: number; openH: number; off?: number; mat: THREE.Material }) {
  const h = f.heading;
  const th = 0.72;
  const l0 = -span, l1 = off - openW / 2, r0 = off + openW / 2, r1 = span;
  const Lw = l1 - l0, Rw = r1 - r0, Hh = H - openH;
  return (
    <group>
      <B mat={mat} p={Pp(f, (l0 + l1) / 2, H / 2, lz)} s={[Lw, H, th]} ry={h} />
      <B mat={mat} p={Pp(f, (r0 + r1) / 2, H / 2, lz)} s={[Rw, H, th]} ry={h} />
      <B mat={mat} p={Pp(f, off, openH + Hh / 2, lz)} s={[openW, Hh, th]} ry={h} />
      <B mat={reveal} p={Pp(f, l1, openH / 2, lz)} s={[0.1, openH, th * 0.55]} ry={h} />
      <B mat={reveal} p={Pp(f, r0, openH / 2, lz)} s={[0.1, openH, th * 0.55]} ry={h} />
      <B mat={reveal} p={Pp(f, off, openH, lz)} s={[openW, 0.1, th * 0.55]} ry={h} />
    </group>
  );
}
function Slab({ f, lx, ly, lz = 0, w, d, th = 0.4, mat }: { f: Frame; lx: number; ly: number; lz?: number; w: number; d: number; th?: number; mat: THREE.Material }) {
  const h = f.heading;
  return (
    <group>
      <B mat={mat} p={Pp(f, lx, ly, lz)} s={[w, th, d]} ry={h} />
      <B mat={reveal} p={Pp(f, lx, ly - th / 2 - 0.03, lz)} s={[w * 0.97, 0.05, d * 0.97]} ry={h} />
    </group>
  );
}
function Blade({ f, lx, lz = 0, H, len, th = 0.5, mat, ry }: { f: Frame; lx: number; lz?: number; H: number; len: number; th?: number; mat: THREE.Material; ry?: number }) {
  return <B mat={mat} p={Pp(f, lx, H / 2, lz)} s={[th, H, len]} ry={ry ?? f.heading} />;
}
function Railing({ f, lx, lz, len, along = true, h = 1.1 }: { f: Frame; lx: number; lz: number; len: number; along?: boolean; h?: number }) {
  const hd = f.heading;
  const s: [number, number, number] = along ? [0.05, h, len] : [len, h, 0.05];
  const cap: [number, number, number] = along ? [0.1, 0.06, len] : [len, 0.06, 0.1];
  return (
    <group>
      <B mat={glass} p={Pp(f, lx, h / 2, lz)} s={s} ry={hd} />
      <B mat={bronze} p={Pp(f, lx, h + 0.02, lz)} s={cap} ry={hd} />
    </group>
  );
}
function FloatingStair({ f, lx, top, steps = 11 }: { f: Frame; lx: number; top: number; steps?: number }) {
  const items: ReactNode[] = [];
  const rise = top / steps;
  const run = 8;
  for (let k = 0; k < steps; k += 1) {
    const lz = -run / 2 + (run / steps) * (k + 0.5);
    items.push(<B key={`t${k}`} mat={travertine} p={Pp(f, lx, rise * (k + 1), lz)} s={[2.0, 0.14, run / steps + 0.02]} ry={f.heading} />);
  }
  items.push(<B key="stringer" mat={blackStone} p={Pp(f, lx, top / 2, 0)} s={[0.3, 0.44, run + 0.6]} ry={f.heading} tl={-Math.atan2(top, run)} />);
  return <group>{items}</group>;
}
function Skylight({ f, lz = 0, w, H, len = 5 }: { f: Frame; lz?: number; w: number; H: number; len?: number }) {
  const h = f.heading;
  return <mesh geometry={BOX} material={shaftMat} position={Pp(f, 0, H / 2, lz)} rotation={[0, h, 0]} scale={[w, H, len]} />;
}

/* -- the continuous spine: one unbroken floor ribbon carrying a bronze thread,
      following the route's curves and ramps as a single surface -- */
function ribbonGeo(halfW: number, yOff: number): THREE.BufferGeometry {
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const total = cameraMaxS + TAIL_S + 14;
  const n = Math.ceil(total / 1.4);
  let vAcc = 0;
  let prev: THREE.Vector3 | null = null;
  for (let k = 0; k <= n; k += 1) {
    const s = -6 + (total + 6) * (k / n);
    const f = frameAt(clamp(s, 0, CURVE_L));
    const cx = f.pos.x, cy = FLOOR_Y + f.pos.y + yOff, cz = f.pos.z;
    if (prev) vAcc += new THREE.Vector3(cx, cy, cz).distanceTo(prev) * 0.32;
    prev = new THREE.Vector3(cx, cy, cz);
    pos.push(cx - f.right.x * halfW, cy, cz - f.right.z * halfW, cx + f.right.x * halfW, cy, cz + f.right.z * halfW);
    uv.push(0, vAcc, 1, vAcc);
  }
  for (let k = 0; k < n; k += 1) {
    const a = k * 2;
    idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); // wound so the face points up
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
function Spine() {
  const floor = useMemo(() => ribbonGeo(4.8, 0.02), []);
  const thread = useMemo(() => ribbonGeo(0.09, 0.05), []);
  return (
    <group>
      <mesh geometry={floor} material={travertine} receiveShadow />
      <mesh geometry={thread} material={bronze} />
    </group>
  );
}

// the arrival threshold — a low, compressed concrete vestibule with a single
// blade of daylight ahead, before the gallery opens out
function Threshold() {
  const f = useMemo(() => frameAt(5), []);
  const H = 6;
  return (
    <group>
      <Wall f={f} lx={3.4} lz={0} H={H} len={16} th={0.6} mat={concrete} />
      <Wall f={f} lx={-3.4} lz={0} H={H} len={16} th={0.6} mat={concrete} />
      <Slab f={f} lx={0} ly={H} lz={0} w={8} d={16} th={0.4} mat={concrete} />
      <Skylight f={f} lz={7} w={1.8} H={H} len={3} />
    </group>
  );
}

// the promenade resolves into light — converging travertine walls and a
// luminous opening the visitor walks out toward
function Exit() {
  const f = useMemo(() => frameAt(cameraMaxS + 4), []);
  const h = f.heading;
  const H = 8;
  return (
    <group>
      <Wall f={f} lx={4.6} lz={0} H={H} len={22} th={0.7} mat={travertine} />
      <Wall f={f} lx={-4.6} lz={0} H={H} len={22} th={0.7} mat={travertine} />
      <Slab f={f} lx={0} ly={H} lz={0} w={11} d={22} th={0.5} mat={concrete} />
      <mesh geometry={BOX} material={skyMat} position={Pp(f, 0, H / 2, 11)} rotation={[0, h, 0]} scale={[8.4, H, 0.1]} />
      <Skylight f={f} lz={9} w={3} H={H} len={4} />
    </group>
  );
}

/* --------- the installation: each principle, built into the room --------- */
function FeatureExhibit({ i, f }: { i: number; f: Frame }) {
  const card = WHY_CARDS[i];
  const ft = featureOf(i);
  const st = VSTYLES[ft.variant];
  const h = f.heading;
  const { side, wx, lz, cy, panelW, panelH, fs, w } = ft;
  const theta = h - side * Math.PI / 2;
  const faceX = wx - side * 0.3;
  const panelX = faceX - side * 0.04;
  const textX = panelX - side * 0.07;
  const idx = String(i + 1).padStart(2, "0");

  return (
    <group>
      {st.freestanding && (
        <Blade f={f} lx={wx + side * 0.34} lz={lz} H={panelH + 1.8} len={panelW + 1.1} th={0.7} mat={travertine} />
      )}
      {/* a reveal frames the inset as a shadow gap — part of the wall, not a card */}
      <B mat={reveal} p={Pp(f, panelX + side * 0.05, cy, lz)} s={[0.06, panelH + 0.22, panelW + 0.22]} ry={h} />
      <B mat={st.pane} p={Pp(f, panelX, cy, lz)} s={[0.1, panelH, panelW]} ry={h} />

      <Text font={FONT_BOLD} fontSize={fs * 0.32} color={st.idx} anchorX="center" anchorY="middle" letterSpacing={0.28}
        position={Pp(f, textX, cy + fs * 1.7, lz)} rotation={[0, theta, 0]}>
        {idx}
      </Text>
      <Text font={FONT_BOLD} fontSize={fs} color={st.title} anchorX="center" anchorY="middle" textAlign="center" maxWidth={w}
        lineHeight={1.02} letterSpacing={-0.01} outlineWidth={fs * 0.008} outlineColor="#05060a" outlineOpacity={0.35}
        position={Pp(f, textX, cy + fs * 0.45, lz)} rotation={[0, theta, 0]}>
        {card.title}
      </Text>
      <B mat={bronze} p={Pp(f, textX, cy - fs * 0.55, lz)} s={[0.04, 0.03, w * 0.44]} ry={h} />
      <Text font={FONT_REG} fontSize={fs * 0.32} color={st.body} anchorX="center" anchorY="top" textAlign="center" maxWidth={w * 0.94}
        lineHeight={1.4} outlineWidth={fs * 0.006} outlineColor="#05060a" outlineOpacity={0.3}
        position={Pp(f, textX, cy - fs * 0.9, lz)} rotation={[0, theta, 0]}>
        {card.body}
      </Text>
    </group>
  );
}

/* ------------------------------ the spaces ------------------------------ *
 * Eight linked gestures, alternating compression and expansion. Threshold and
 * exit bracket the six principle-installations; each space is unique.        */
function Room({ i, f }: { i: number; f: Frame }) {
  const h = f.heading;
  const room = i % 6;

  if (room === 0) {
    // The Long Gallery — first expansion; a calm travertine hall, the words
    // CARVED into an angled monolithic wall grazed by a clerestory slot.
    const H = 15;
    return (
      <group>
        <Slab f={f} lx={0} ly={H} w={20} d={HALF_L * 2} th={0.5} mat={concrete} />
        <Skylight f={f} lz={-1} w={2.6} H={H} len={HALF_L * 2} />
        <Wall f={f} lx={6.7} lz={0} H={H} th={0.7} mat={travertine} />
        <CurvedWall f={f} lx={-6.6} lz={0} r={8} h={H} mat={travertine} a0={-0.75} aLen={1.5} />
        <FloatingStair f={f} lx={-3.2} top={5.6} />
        <Slab f={f} lx={-4.6} ly={5.6} lz={4.4} w={6} d={6.6} th={0.34} mat={travertine} />
        <Railing f={f} lx={-1.6} lz={4.4} len={6.6} />
        <Portal f={f} lz={-HALF_L} span={9} H={H} openW={5.2} openH={6.4} off={-1.6} mat={travertine} />
      </group>
    );
  }
  if (room === 1) {
    // The Precision Slot — compression; a taut black-stone passage with one
    // razor line of light and a machined brushed-aluminium inlay.
    const H = 6.5;
    return (
      <group>
        <Slab f={f} lx={0} ly={H} w={9} d={HALF_L * 2} th={0.45} mat={blackStone} />
        <Wall f={f} lx={4.0} H={H} th={0.6} mat={blackStone} />
        <Wall f={f} lx={-4.0} H={H} th={0.6} mat={blackStone} />
        {/* the single linear cove — a bright reveal line at eye level */}
        <B mat={aluminium} p={Pp(f, -3.68, 2.4, 0)} s={[0.06, 0.12, HALF_L * 2]} ry={h} />
        <Portal f={f} lz={-HALF_L} span={4.0} H={H} openW={3.4} openH={5.2} off={0.7} mat={blackStone} />
        <Portal f={f} lz={HALF_L} span={4.0} H={H} openW={3.4} openH={5.2} off={-0.7} mat={blackStone} />
      </group>
    );
  }
  if (room === 2) {
    // The Atrium & Bridge — the great expansion; a skylit concrete void, a
    // cantilevered walkway, a backlit glass plane mirrored in a black pool.
    const H = 24;
    return (
      <group>
        <Slab f={f} lx={-5.6} ly={H} w={9} d={HALF_L * 2} th={0.6} mat={concrete} />
        <Slab f={f} lx={5.6} ly={H} w={9} d={HALF_L * 2} th={0.6} mat={concrete} />
        <Skylight f={f} lz={0} w={5.4} H={H} len={HALF_L * 2} />
        <Wall f={f} lx={-9.6} H={H} th={0.7} mat={concrete} />
        <Glazing f={f} lx={9.8} H={H} mull={1} />
        {/* the still reflecting pool below the walkway */}
        <mesh geometry={BOX} material={pool} position={Pp(f, -3, -3.2, 0)} rotation={[0, h, 0]} scale={[8, 0.1, HALF_L * 2]} castShadow receiveShadow />
        <Slab f={f} lx={-6.4} ly={8.4} w={5.2} d={HALF_L * 2} th={0.5} mat={travertine} />
        <Railing f={f} lx={3.6} lz={0} len={HALF_L * 2} />
        <Railing f={f} lx={-3.6} lz={0} len={HALF_L * 2} />
        <Portal f={f} lz={-HALF_L} span={10} H={H} openW={5.0} openH={7.5} off={2.4} mat={concrete} />
        <Portal f={f} lz={HALF_L} span={10} H={H} openW={5.0} openH={7.5} off={-2.4} mat={concrete} />
      </group>
    );
  }
  if (room === 3) {
    // The Intimate Gallery — compression, stillness; board-formed concrete, an
    // oak bench, a smoked-glass wall; the words PROJECTED onto raw concrete.
    const H = 7;
    return (
      <group>
        <Slab f={f} lx={0} ly={H} w={13} d={HALF_L * 2} th={0.45} mat={concrete} />
        <Wall f={f} lx={6.0} H={H} th={0.6} mat={darkConcrete} />
        <Glazing f={f} lx={-6.0} H={H} mull={1} />
        <B mat={oak} p={Pp(f, -3.6, 0.32, 3)} s={[3, 0.5, 0.9]} ry={h} />
        <Portal f={f} lz={-HALF_L} span={6.0} H={H} openW={4.0} openH={5.4} off={1.4} mat={concrete} />
        <Portal f={f} lz={HALF_L} span={6.0} H={H} openW={4.0} openH={5.4} off={-1.4} mat={concrete} />
      </group>
    );
  }
  if (room === 4) {
    // The Courtyard — expansion to sky; travertine, a reflecting channel and a
    // bronze relief wall whose letters emerge in raking light.
    const H = 12;
    return (
      <group>
        <Wall f={f} lx={-9.0} H={H} th={0.7} mat={concrete} />
        <Glazing f={f} lx={9.2} H={H} mull={1} />
        {/* a thin reflecting channel along the base of the relief wall */}
        <mesh geometry={BOX} material={pool} position={Pp(f, -6.6, 0.04, 0)} rotation={[0, h, 0]} scale={[2.2, 0.08, HALF_L * 2]} castShadow receiveShadow />
        <B mat={travertine} p={Pp(f, -5.3, 0.1, 0)} s={[0.3, 0.16, HALF_L * 2]} ry={h} />
        <Blade f={f} lx={6.4} lz={-4.5} H={3.0} len={2.4} th={0.6} mat={travertine} />
        <mesh geometry={BOX} material={skyMat} position={Pp(f, 0.5, H + 9, 0)} rotation={[Math.PI / 2, 0, 0]} scale={[18, HALF_L * 2, 0.1]} />
        <Portal f={f} lz={-HALF_L} span={9} H={H} openW={4.6} openH={6.4} off={1.8} mat={travertine} />
        <Portal f={f} lz={HALF_L} span={9} H={H} openW={4.6} openH={6.4} off={1.8} mat={travertine} />
      </group>
    );
  }
  // The Reflection Lounge — a soft, warm compression; one oak bench, a still
  // pool, and a single black-stone monolith under one precise skylight.
  const H = 6.8;
  return (
    <group>
      <Slab f={f} lx={0} ly={H} w={13} d={HALF_L * 2} th={0.45} mat={concrete} />
      <Skylight f={f} lz={1} w={1.8} H={H} len={2.6} />
      <Wall f={f} lx={6.4} H={H} th={0.6} mat={travertine} />
      <Wall f={f} lx={-6.4} H={H} th={0.6} mat={concrete} />
      <mesh geometry={BOX} material={pool} position={Pp(f, -3.4, 0.04, -1)} rotation={[0, h, 0]} scale={[4, 0.08, 7]} castShadow receiveShadow />
      <B mat={oak} p={Pp(f, -3.4, 0.32, 4.4)} s={[3, 0.5, 0.9]} ry={h} />
      <Portal f={f} lz={-HALF_L} span={6.4} H={H} openW={3.8} openH={5.0} off={1.2} mat={concrete} />
    </group>
  );
}

function Building() {
  const frames = useMemo(() => Array.from({ length: N }, (_, i) => frameAt(stationS(i))), []);
  return (
    <group>
      <Spine />
      <Threshold />
      {frames.map((f, i) => (
        <group key={i}>
          <Room i={i} f={f} />
          <FeatureExhibit i={i} f={f} />
        </group>
      ))}
      <Exit />
    </group>
  );
}

// a quiet dark base so deep voids read as ground-in-shadow, never empty black
function GroundBase() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y - 3.6, -70]} receiveShadow>
      <planeGeometry args={[180, 340]} />
      <meshStandardMaterial color="#0a0c10" roughness={0.92} metalness={0.1} />
    </mesh>
  );
}

/* ------------------------------ systems ------------------------------ */
type Shared = { glow: { current: number }; tint: { current: THREE.Color }; active: { current: THREE.Vector3 }; prog: { current: number } };

function AccentLight({ shared }: { shared: Shared }) {
  const light = useRef<THREE.PointLight>(null);
  const v = useRef(new THREE.Vector3());
  useFrame(() => {
    const l = light.current;
    if (!l) return;
    v.current.set(shared.active.current.x, shared.active.current.y + 1.4, shared.active.current.z);
    l.position.lerp(v.current, 0.07);
    l.color.lerp(shared.tint.current, 0.05);
    l.intensity += (9 + shared.glow.current * 20 - l.intensity) * 0.07;
  });
  return <pointLight ref={light} distance={26} decay={1.7} />;
}

function ShadowSun({ shared }: { shared: Shared }) {
  const light = useRef<THREE.DirectionalLight>(null);
  const { scene } = useThree();
  useEffect(() => {
    if (light.current) scene.add(light.current.target);
  }, [scene]);
  useFrame(() => {
    const l = light.current;
    if (!l) return;
    const a = shared.active.current;
    l.position.set(a.x + 7, a.y + 24, a.z + 11);
    l.target.position.set(a.x, a.y - 2, a.z);
    l.target.updateMatrixWorld();
  });
  return (
    <directionalLight ref={light} intensity={0.9} color={0xf1efe8} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0002} shadow-normalBias={0.7}>
      <orthographicCamera attach="shadow-camera" args={[-24, 24, 26, -26, 1, 90]} />
    </directionalLight>
  );
}

function StationDrivers({ scroll, shared }: { scroll?: { get: () => number }; shared: Shared }) {
  const targets = useMemo(() => Array.from({ length: N }, (_, i) => ({ pos: featureWorld(i), hue: hueOf(i) })), []);
  useFrame(() => {
    const p = scroll ? scroll.get() : 0;
    shared.prog.current += (p - shared.prog.current) * 0.08;
    let maxGlow = 0;
    let active = 0;
    for (let i = 0; i < N; i += 1) {
      const r = stationReveal(p, i);
      if (r > maxGlow) {
        maxGlow = r;
        active = i;
      }
    }
    shared.glow.current = maxGlow;
    shared.tint.current.lerp(targets[active].hue, 0.05);
    shared.active.current.lerp(targets[active].pos, 0.07);
  });
  return null;
}

// the light climbs across the journey: near-dark at the threshold, bright at
// the exit — the whole promenade is one arc from shadow to daylight
function Mood({ shared }: { shared: Shared }) {
  const { gl } = useThree();
  useFrame(() => {
    const p = shared.prog.current;
    const target = 0.82 + smoothstep(0.0, 1.0, p) * 0.5; // 0.82 → 1.32
    gl.toneMappingExposure += (target - gl.toneMappingExposure) * 0.05;
  });
  return null;
}

function Rig({ scroll }: { scroll?: { get: () => number } }) {
  const { camera } = useThree();
  const eased = useRef(0);
  const bank = useRef(0);
  const mouse = useRef(new THREE.Vector2());
  const targets = useMemo(() => Array.from({ length: N }, (_, i) => featureWorld(i)), []);
  const look = useRef(new THREE.Vector3());
  const smooth = useRef(new THREE.Vector3());
  const inited = useRef(false);
  useFrame((state, delta) => {
    const target = scroll ? scroll.get() : 0;
    eased.current += (target - eased.current) * Math.min(1, delta * 1.4); // slow, cinematic
    const s = cameraS(eased.current);
    const t = state.clock.elapsedTime;
    mouse.current.x += (state.pointer.x - mouse.current.x) * Math.min(1, delta * 1.2);
    mouse.current.y += (state.pointer.y - mouse.current.y) * Math.min(1, delta * 1.2);
    const f = frameAt(s);
    const ahead = frameAt(s + AHEAD);
    camera.position.set(
      f.pos.x + mouse.current.x * 0.22,
      f.pos.y + EYE + mouse.current.y * 0.1 + Math.sin(t * 0.05) * 0.03,
      f.pos.z,
    );

    // the camera holds the way it travels; only a late, gentle drift lets the
    // building reveal each installation — anticipation first, never a snap
    look.current.set(ahead.pos.x, ahead.pos.y + EYE + 0.3, ahead.pos.z);
    let gaze = 0;
    let gi = 0;
    for (let i = 0; i < N; i += 1) {
      // asymmetric & late: barely turns on approach, resolves as you pass
      const d = stationS(i) - s;
      const g = smoothstep(10.5, 2.5, Math.abs(d)) * (d > 0 ? 0.72 : 1);
      if (g > gaze) {
        gaze = g;
        gi = i;
      }
    }
    if (gaze > 0) look.current.lerp(targets[gi], gaze * 0.55);

    if (!inited.current) {
      smooth.current.copy(look.current);
      inited.current = true;
    }
    smooth.current.lerp(look.current, Math.min(1, delta * 2.4));
    camera.lookAt(smooth.current);

    const turn = f.fwd.x * ahead.fwd.z - f.fwd.z * ahead.fwd.x;
    const bankTarget = clamp(turn * 1.5, -0.014, 0.014) * (1 - gaze);
    bank.current += (bankTarget - bank.current) * Math.min(1, delta * 1.2);
    camera.rotateZ(bank.current);
  });
  return null;
}

function Sky() {
  return (
    <Environment resolution={256} frames={1}>
      <Lightformer intensity={1.1} color="#eef3f8" position={[0, 14, -6]} scale={[24, 16, 1]} rotation-x={Math.PI / 2} />
      <Lightformer intensity={0.35} color="#161a20" position={[0, -10, -6]} scale={[24, 16, 1]} rotation-x={-Math.PI / 2} />
      <Lightformer intensity={0.9} form="rect" color="#ffe4bf" position={[16, 5, -8]} scale={[10, 14, 1]} rotation-y={-Math.PI / 2} />
      <Lightformer intensity={0.7} form="rect" color="#cfe0ff" position={[-16, 6, 6]} scale={[10, 14, 1]} rotation-y={Math.PI / 2} />
    </Environment>
  );
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
  const shared = useRef<Shared>({
    glow: { current: 0 },
    tint: { current: new THREE.Color(0.86, 0.82, 0.7) },
    active: { current: new THREE.Vector3() },
    prog: { current: 0 },
  }).current;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const active = !reduced && visible;

  return (
    <div ref={ref} className="absolute inset-0">
      <Canvas
        className="!absolute inset-0"
        shadows="soft"
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.82 }}
        dpr={reduced ? 1 : [1, mobile ? 1.3 : 1.7]}
        camera={{ position: [0, 0.25, 2], fov: 56 }}
        frameloop={active ? "always" : "never"}
        eventSource={eventSource as unknown as RefObject<HTMLElement>}
        eventPrefix="client"
        onCreated={({ scene }) => {
          scene.fog = new THREE.FogExp2(0x05060c, 0.017);
        }}
      >
        <Sky />
        <ambientLight intensity={0.05} />
        <hemisphereLight args={[0xdfe7f2, 0x2a2620, 0.4]} />
        <ShadowSun shared={shared} />
        <AccentLight shared={shared} />
        <GroundBase />
        <Building />
        <Rig scroll={scroll} />
        <StationDrivers scroll={scroll} shared={shared} />
        <Mood shared={shared} />
      </Canvas>
    </div>
  );
}
