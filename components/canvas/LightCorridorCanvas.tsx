"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type RefObject, type ReactNode } from "react";
import * as THREE from "three";
import { WHY_CARDS } from "@/lib/data";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useIsMobile } from "@/hooks/useMediaQuery";

/* ------------------------------------------------------------------ *
 * The Southpage headquarters — a walk through one contemporary building.
 *
 * The rooms are arranged as an enfilade: each is a real enclosed space
 * with a floor, a ceiling and walls, connected to the next by an aligned
 * doorway you pass through. The route leads from a double-height lobby
 * with a floating stair, into a full-height atrium with a skylight and
 * mezzanine, across a glazed bridge, through an enclosed gallery, out to
 * a courtyard with a reflecting pool, and up to a rooftop terrace.
 * ------------------------------------------------------------------ */

const N = WHY_CARDS.length;
const STEP = 7.2;
const M = 20;
const LEAD_S = 15;
const GAP_S = 16;
const HALF_L = 8; // half room depth (rooms abut at GAP_S)
const TAIL_S = 13;
const AHEAD = 6.5;
const FLOOR_Y = -1.7;
const EYE = 0.25;
const DOOR_W = 5;
const DOOR_H = 5;

// a subtle, large-radius curve so the building reads as one calm form
const CURVE = (() => {
  const pts: THREE.Vector3[] = [];
  for (let k = 0; k <= M; k += 1) {
    const x = 3.6 * Math.sin(k * 0.34);
    const y = 0.3 * Math.sin(k * 0.5 + 0.4);
    const z = 2 - k * STEP;
    pts.push(new THREE.Vector3(x, y, z));
  }
  return new THREE.CatmullRomCurve3(pts, false, "centripetal", 0.5);
})();
const CURVE_L = CURVE.getLength();

export const stationS = (i: number) => LEAD_S + i * GAP_S;
export const cameraMaxS = stationS(N - 1) + TAIL_S;
export const cameraS = (p: number) => p * cameraMaxS;
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
function P(f: Frame, lx: number, ly: number, lz: number): [number, number, number] {
  return [f.pos.x + f.right.x * lx + f.fwd.x * lz, FLOOR_Y + ly, f.pos.z + f.right.z * lx + f.fwd.z * lz];
}

/* ------------------------------ materials ------------------------------ */
const concrete = new THREE.MeshStandardMaterial({ color: 0xcfd0d3, roughness: 0.8, metalness: 0.02 });
const warmWall = new THREE.MeshStandardMaterial({ color: 0xc8b8a2, roughness: 0.78, metalness: 0.02 });
const stoneFloor = new THREE.MeshStandardMaterial({ color: 0x2a2d33, roughness: 0.22, metalness: 0.3 });
const aluminium = new THREE.MeshStandardMaterial({ color: 0xacb2ba, roughness: 0.36, metalness: 0.7 });
const lightMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.96, 0.9), toneMapped: false });
const poolMat = new THREE.MeshStandardMaterial({ color: 0x070b13, roughness: 0.03, metalness: 0.95 });
const skyMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.62, 0.72, 0.92), toneMapped: false });

const glassVert = /* glsl */ `varying vec3 vN; varying vec3 vV;
  void main(){ vec4 mv=modelViewMatrix*vec4(position,1.0); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`;
const glassFrag = /* glsl */ `precision mediump float; varying vec3 vN; varying vec3 vV;
  void main(){ float f=pow(1.0-max(dot(normalize(vN),normalize(vV)),0.0),2.2);
    vec3 col=mix(vec3(0.14,0.18,0.24), vec3(0.78,0.86,1.0), f); gl_FragColor=vec4(col,0.07+0.45*f); }`;
const glass = new THREE.ShaderMaterial({ vertexShader: glassVert, fragmentShader: glassFrag, transparent: true, depthWrite: false, side: THREE.DoubleSide });

const shaftMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: {},
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader: `precision mediump float; varying vec2 vUv; void main(){ float x=1.0-abs(vUv.x-0.5)*2.0; float y=smoothstep(1.0,0.35,vUv.y); gl_FragColor=vec4(0.86,0.9,1.0, pow(x,1.6)*y*0.11);} `,
});

const BOX = new THREE.BoxGeometry(1, 1, 1);
const HUES: [number, number, number][] = [
  [0.66, 0.76, 1.0], [0.86, 0.92, 1.0], [0.7, 0.82, 1.0], [0.9, 0.96, 1.0], [0.74, 0.85, 1.0], [1.0, 0.85, 0.6],
];
const hueOf = (i: number) => new THREE.Color(...HUES[((i % HUES.length) + HUES.length) % HUES.length]);

/* --------------------------- building blocks --------------------------- */
function B({ mat, p, s, ry = 0, tl = 0 }: { mat: THREE.Material; p: [number, number, number]; s: [number, number, number]; ry?: number; tl?: number }) {
  return <mesh geometry={BOX} material={mat} position={p} rotation={[tl, ry, 0]} scale={s} />;
}
// a wall across the room with a centred doorway (left pier + right pier + lintel)
function DoorWall({ f, lz, halfW, H, mat }: { f: Frame; lz: number; halfW: number; H: number; mat: THREE.Material }) {
  const pier = halfW - DOOR_W / 2;
  const off = DOOR_W / 2 + pier / 2;
  return (
    <group>
      <B mat={mat} p={P(f, -off, H / 2, lz)} s={[pier, H, 0.4]} ry={f.heading} />
      <B mat={mat} p={P(f, off, H / 2, lz)} s={[pier, H, 0.4]} ry={f.heading} />
      <B mat={mat} p={P(f, 0, DOOR_H + (H - DOOR_H) / 2, lz)} s={[DOOR_W, H - DOOR_H, 0.4]} ry={f.heading} />
    </group>
  );
}
// a frameless structural-glass wall with a slim aluminium frame
function GlassWall({ f, lx, H, mat = glass }: { f: Frame; lx: number; H: number; mat?: THREE.Material }) {
  return (
    <group>
      <B mat={mat} p={P(f, lx, H / 2, 0)} s={[0.12, H, HALF_L * 2]} ry={f.heading} />
      <B mat={aluminium} p={P(f, lx, 0.15, 0)} s={[0.24, 0.16, HALF_L * 2]} ry={f.heading} />
      <B mat={aluminium} p={P(f, lx, H - 0.15, 0)} s={[0.24, 0.16, HALF_L * 2]} ry={f.heading} />
    </group>
  );
}
function Railing({ f, lx, lz, len, along = true, h = 1.1 }: { f: Frame; lx: number; lz: number; len: number; along?: boolean; h?: number }) {
  const s: [number, number, number] = along ? [0.08, h, len] : [len, h, 0.08];
  const cap: [number, number, number] = along ? [0.16, 0.08, len] : [len, 0.08, 0.16];
  return (
    <group>
      <B mat={glass} p={P(f, lx, h / 2, lz)} s={s} ry={f.heading} />
      <B mat={aluminium} p={P(f, lx, h + 0.03, lz)} s={cap} ry={f.heading} />
    </group>
  );
}
// a cantilevered floating stair rising along the wall to a mezzanine
function FloatingStair({ f, lx, top, steps = 12 }: { f: Frame; lx: number; top: number; steps?: number }) {
  const items: ReactNode[] = [];
  const rise = top / steps;
  const run = 8;
  for (let k = 0; k < steps; k += 1) {
    items.push(<B key={k} mat={concrete} p={P(f, lx, rise * (k + 1), -run / 2 + (run / steps) * (k + 0.5))} s={[1.8, 0.18, run / steps + 0.05]} ry={f.heading} />);
  }
  return <group>{items}</group>;
}

/* ------------------------------ the rooms ------------------------------ */
function Room({ i, f }: { i: number; f: Frame }) {
  const h = f.heading;
  const room = i % 6;

  if (room === 0) {
    // Double-height lobby — glass façade, feature wall, floating stair to mezzanine
    const HW = 7, H = 13;
    return (
      <group>
        <B mat={stoneFloor} p={P(f, 0, -0.1, 0)} s={[HW * 2, 0.3, HALF_L * 2]} ry={h} />
        <B mat={concrete} p={P(f, 0, H, 0)} s={[HW * 2, 0.4, HALF_L * 2]} ry={h} />
        <GlassWall f={f} lx={HW} H={H} />
        <B mat={warmWall} p={P(f, -HW, H / 2, 0)} s={[0.4, H, HALF_L * 2]} ry={h} />
        <GlassWall f={f} lx={0} H={H} mat={glass} />
        <DoorWall f={f} lz={HALF_L} halfW={HW} H={H} mat={concrete} />
        <FloatingStair f={f} lx={-5} top={5.4} />
        <B mat={concrete} p={P(f, -4.4, 5.4, 4.4)} s={[5.2, 0.3, 7]} ry={h} />
        <Railing f={f} lx={-1.9} lz={4.4} len={7} />
        <B mat={aluminium} p={P(f, 3.5, 0.5, -5)} s={[3, 1, 1.2]} ry={h} />
        <B mat={lightMat} p={P(f, 0, H - 0.5, 0)} s={[1.4, 0.06, HALF_L * 2]} ry={h} />
      </group>
    );
  }
  if (room === 1) {
    // Atrium — full height, skylight, glazed façade, mezzanine balcony
    const HW = 10, H = 22;
    return (
      <group>
        <B mat={stoneFloor} p={P(f, 0, -0.1, 0)} s={[HW * 2, 0.3, HALF_L * 2]} ry={h} />
        <B mat={concrete} p={P(f, -HW * 0.55, H, 0)} s={[HW * 0.9, 0.5, HALF_L * 2]} ry={h} />
        <B mat={concrete} p={P(f, HW * 0.55, H, 0)} s={[HW * 0.9, 0.5, HALF_L * 2]} ry={h} />
        <mesh geometry={BOX} material={shaftMat} position={P(f, 0, H / 2, 0)} rotation={[0, h, 0]} scale={[HW * 0.7, H, 0.1]} />
        <B mat={lightMat} p={P(f, -HW * 0.2, H - 0.3, 0)} s={[0.1, 0.08, HALF_L * 2]} ry={h} />
        <B mat={lightMat} p={P(f, HW * 0.2, H - 0.3, 0)} s={[0.1, 0.08, HALF_L * 2]} ry={h} />
        <GlassWall f={f} lx={HW} H={H} />
        <B mat={concrete} p={P(f, -HW, H / 2, 0)} s={[0.4, H, HALF_L * 2]} ry={h} />
        <B mat={concrete} p={P(f, -HW + 3, 8, 0)} s={[6, 0.3, HALF_L * 2]} ry={h} />
        <Railing f={f} lx={-HW + 6} lz={0} len={HALF_L * 2} />
        <DoorWall f={f} lz={-HALF_L} halfW={HW} H={H} mat={concrete} />
        <DoorWall f={f} lz={HALF_L} halfW={HW} H={H} mat={concrete} />
      </group>
    );
  }
  if (room === 2) {
    // Glazed bridge — a narrow glass link with a drop visible outside
    const HW = 4.2, H = 8;
    return (
      <group>
        <B mat={stoneFloor} p={P(f, 0, -0.1, 0)} s={[HW * 2, 0.3, HALF_L * 2]} ry={h} />
        <B mat={concrete} p={P(f, 0, H, 0)} s={[HW * 2 + 0.6, 0.4, HALF_L * 2]} ry={h} />
        <GlassWall f={f} lx={HW} H={H} />
        <GlassWall f={f} lx={-HW} H={H} />
        <B mat={stoneFloor} p={P(f, 12, -6.5, 0)} s={[16, 0.4, HALF_L * 2]} ry={h} />
        <B mat={stoneFloor} p={P(f, -12, -6.5, 0)} s={[16, 0.4, HALF_L * 2]} ry={h} />
        <DoorWall f={f} lz={-HALF_L} halfW={HW} H={H} mat={aluminium} />
        <DoorWall f={f} lz={HALF_L} halfW={HW} H={H} mat={aluminium} />
        <B mat={lightMat} p={P(f, 0, H - 0.4, 0)} s={[0.9, 0.05, HALF_L * 2]} ry={h} />
      </group>
    );
  }
  if (room === 3) {
    // Exhibition gallery — enclosed, angled feature wall, recessed light
    const HW = 6, H = 7;
    return (
      <group>
        <B mat={stoneFloor} p={P(f, 0, -0.1, 0)} s={[HW * 2, 0.3, HALF_L * 2]} ry={h} />
        <B mat={concrete} p={P(f, 0, H, 0)} s={[HW * 2, 0.4, HALF_L * 2]} ry={h} />
        <B mat={concrete} p={P(f, HW, H / 2, 0)} s={[0.4, H, HALF_L * 2]} ry={h} />
        <B mat={concrete} p={P(f, -HW, H / 2, 0)} s={[0.4, H, HALF_L * 2]} ry={h} />
        <B mat={warmWall} p={P(f, -1.5, H / 2, 3)} s={[0.35, H, 7]} ry={h + 0.28} />
        <DoorWall f={f} lz={-HALF_L} halfW={HW} H={H} mat={concrete} />
        <DoorWall f={f} lz={HALF_L} halfW={HW} H={H} mat={concrete} />
        <B mat={lightMat} p={P(f, -HW + 0.5, H - 0.2, 0)} s={[0.9, 0.05, HALF_L * 2]} ry={h} />
        <B mat={lightMat} p={P(f, HW - 0.5, H - 0.2, 0)} s={[0.9, 0.05, HALF_L * 2]} ry={h} />
      </group>
    );
  }
  if (room === 4) {
    // Courtyard — open to the sky, reflecting pool, enclosing walls
    const HW = 9, H = 11;
    return (
      <group>
        <B mat={stoneFloor} p={P(f, 0, -0.1, 0)} s={[HW * 2, 0.3, HALF_L * 2]} ry={h} />
        <mesh geometry={BOX} material={poolMat} position={P(f, 0.5, 0.05, 0)} rotation={[0, h, 0]} scale={[9, 0.06, 11]} />
        <B mat={aluminium} p={P(f, 5.2, 0.14, 0)} s={[0.3, 0.22, 11]} ry={h} />
        <B mat={aluminium} p={P(f, -4.2, 0.14, 0)} s={[0.3, 0.22, 11]} ry={h} />
        <B mat={concrete} p={P(f, -HW, H / 2, 0)} s={[0.4, H, HALF_L * 2]} ry={h} />
        <GlassWall f={f} lx={HW} H={H} />
        <mesh geometry={BOX} material={skyMat} position={P(f, 0, H + 6, 0)} rotation={[Math.PI / 2, 0, 0]} scale={[HW * 2, HALF_L * 2, 0.1]} />
        <DoorWall f={f} lz={-HALF_L} halfW={HW} H={H} mat={concrete} />
        <DoorWall f={f} lz={HALF_L} halfW={HW} H={H} mat={concrete} />
        <B mat={lightMat} p={P(f, -4.2, 0.24, 0)} s={[0.06, 0.06, 11]} ry={h} />
      </group>
    );
  }
  // Rooftop terrace — open deck, panoramic glass balustrade, canopy
  const HW = 8;
  return (
    <group>
      <B mat={warmWall} p={P(f, 0, -0.1, 0)} s={[HW * 2, 0.3, HALF_L * 2]} ry={h} />
      <Railing f={f} lx={HW} lz={0} len={HALF_L * 2} h={1.2} />
      <Railing f={f} lx={-HW} lz={0} len={HALF_L * 2} h={1.2} />
      <Railing f={f} lx={0} lz={HALF_L} len={HW * 2} along={false} h={1.2} />
      <B mat={aluminium} p={P(f, 0, 8.4, -1)} s={[HW * 1.6, 0.25, 9]} ry={h} />
      <B mat={aluminium} p={P(f, -5, 4.2, -4)} s={[0.3, 8.4, 0.3]} ry={h} />
      <B mat={aluminium} p={P(f, 5, 4.2, -4)} s={[0.3, 8.4, 0.3]} ry={h} />
      <B mat={aluminium} p={P(f, -5, 4.2, 3)} s={[0.3, 8.4, 0.3]} ry={h} />
      <B mat={aluminium} p={P(f, 5, 4.2, 3)} s={[0.3, 8.4, 0.3]} ry={h} />
      <B mat={warmWall} p={P(f, -6, 0.4, 4)} s={[3, 0.8, 1.2]} ry={h} />
      <mesh geometry={BOX} material={skyMat} position={P(f, 0, 20, 4)} rotation={[Math.PI / 2, 0, 0]} scale={[28, 24, 0.1]} />
      <B mat={lightMat} p={P(f, 0, 8.2, -1)} s={[1.0, 0.05, 9]} ry={h} />
    </group>
  );
}

function Building() {
  const frames = useMemo(() => Array.from({ length: N }, (_, i) => frameAt(stationS(i))), []);
  return (
    <group>
      {frames.map((f, i) => (
        <Room key={i} i={i} f={f} />
      ))}
    </group>
  );
}

/* ------------------------------ systems ------------------------------ */
type Shared = { glow: { current: number }; tint: { current: THREE.Color }; pool: { current: THREE.Vector2 }; active: { current: THREE.Vector3 } };

function AccentLight({ shared }: { shared: Shared }) {
  const light = useRef<THREE.PointLight>(null);
  const v = useRef(new THREE.Vector3());
  useFrame(() => {
    const l = light.current;
    if (!l) return;
    v.current.set(shared.active.current.x, 4, shared.active.current.z);
    l.position.lerp(v.current, 0.08);
    l.color.lerp(shared.tint.current, 0.06);
    l.intensity += (24 + shared.glow.current * 55 - l.intensity) * 0.08;
  });
  return <pointLight ref={light} distance={38} decay={1.4} />;
}

function StationDrivers({ scroll, shared }: { scroll?: { get: () => number }; shared: Shared }) {
  const stations = useMemo(() => Array.from({ length: N }, (_, i) => ({ frame: frameAt(stationS(i)), hue: hueOf(i) })), []);
  useFrame(() => {
    const p = scroll ? scroll.get() : 0;
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
    shared.tint.current.lerp(stations[active].hue, 0.06);
    shared.active.current.lerp(stations[active].frame.pos, 0.08);
    shared.pool.current.set(stations[active].frame.pos.x, stations[active].frame.pos.z);
  });
  return null;
}

function Rig({ scroll }: { scroll?: { get: () => number } }) {
  const { camera } = useThree();
  const eased = useRef(0);
  const bank = useRef(0);
  const mouse = useRef(new THREE.Vector2());
  useFrame((state, delta) => {
    const target = scroll ? scroll.get() : 0;
    eased.current += (target - eased.current) * Math.min(1, delta * 2.0);
    const s = cameraS(eased.current);
    const t = state.clock.elapsedTime;
    mouse.current.x += (state.pointer.x - mouse.current.x) * Math.min(1, delta * 1.4);
    mouse.current.y += (state.pointer.y - mouse.current.y) * Math.min(1, delta * 1.4);
    const f = frameAt(s);
    const ahead = frameAt(s + AHEAD);
    camera.position.set(f.pos.x + mouse.current.x * 0.35, f.pos.y + EYE + mouse.current.y * 0.18 + Math.sin(t * 0.06) * 0.04, f.pos.z);
    camera.lookAt(ahead.pos.x, ahead.pos.y + EYE + 0.35, ahead.pos.z);
    const turn = f.fwd.x * ahead.fwd.z - f.fwd.z * ahead.fwd.x;
    const bankTarget = clamp(turn * 2.0, -0.025, 0.025);
    bank.current += (bankTarget - bank.current) * Math.min(1, delta * 1.4);
    camera.rotateZ(bank.current);
  });
  return null;
}

const floorVert = /* glsl */ `varying vec3 vWorld; varying float vDepth; void main(){ vec4 w=modelMatrix*vec4(position,1.0); vWorld=w.xyz; vec4 mv=viewMatrix*w; vDepth=-mv.z; gl_Position=projectionMatrix*mv; }`;
const floorFrag = /* glsl */ `precision mediump float; uniform vec2 uPool; uniform vec3 uTint; uniform float uGlow; varying vec3 vWorld; varying float vDepth;
  void main(){ float dist=length(vWorld.xz-uPool); float pool=smoothstep(15.0,0.0,dist)*uGlow; float depthFade=1.0-smoothstep(30.0,70.0,vDepth);
    vec3 base=vec3(0.016,0.018,0.024); vec3 col=base + (uTint*0.12+vec3(0.02,0.026,0.045))*pool*depthFade; gl_FragColor=vec4(col,1.0); }`;
function Floor({ shared }: { shared: Shared }) {
  const mat = useMemo(() => new THREE.ShaderMaterial({ vertexShader: floorVert, fragmentShader: floorFrag, uniforms: { uPool: { value: new THREE.Vector2() }, uTint: { value: new THREE.Color(0.7, 0.8, 1.0) }, uGlow: { value: 0 } } }), []);
  useFrame(() => {
    const u = mat.uniforms;
    (u.uPool.value as THREE.Vector2).lerp(shared.pool.current, 0.08);
    u.uGlow.value += (shared.glow.current - u.uGlow.value) * 0.1;
    (u.uTint.value as THREE.Color).lerp(shared.tint.current, 0.05);
  });
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y - 0.22, -55]} material={mat}>
      <planeGeometry args={[120, 220]} />
    </mesh>
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
    tint: { current: new THREE.Color(0.7, 0.8, 1.0) },
    pool: { current: new THREE.Vector2() },
    active: { current: new THREE.Vector3() },
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
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        dpr={reduced ? 1 : [1, mobile ? 1.3 : 1.7]}
        camera={{ position: [0, 0.25, 2], fov: 60 }}
        frameloop={active ? "always" : "never"}
        eventSource={eventSource as unknown as RefObject<HTMLElement>}
        eventPrefix="client"
        onCreated={({ scene }) => {
          scene.fog = new THREE.FogExp2(0x04050b, 0.02);
        }}
      >
        <ambientLight intensity={0.4} />
        <hemisphereLight args={[0xa4b0c6, 0x0c0e14, 0.6]} />
        <directionalLight position={[14, 24, 12]} intensity={0.75} color={0xf0f4fa} />
        <AccentLight shared={shared} />
        <Floor shared={shared} />
        <Building />
        <Rig scroll={scroll} />
        <StationDrivers scroll={scroll} shared={shared} />
      </Canvas>
    </div>
  );
}
