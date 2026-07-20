"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, MeshReflectorMaterial } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState, type RefObject, type ReactNode } from "react";
import * as THREE from "three";
import { WHY_CARDS } from "@/lib/data";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useIsMobile } from "@/hooks/useMediaQuery";

/* ------------------------------------------------------------------ *
 * The Southpage headquarters — a walk through one contemporary building,
 * rendered like an architectural interior: image-based lighting from a
 * soft daylight environment, a polished reflective stone floor, filmic
 * tone-mapping, and real premium materials (travertine, white concrete,
 * black polished stone, structural glass, brushed aluminium, bronze,
 * oak). Rooms are an enfilade of enclosed spaces joined by doorways.
 * ------------------------------------------------------------------ */

const N = WHY_CARDS.length;
const STEP = 7.2;
const M = 20;
const LEAD_S = 15;
const GAP_S = 16;
const HALF_L = 8;
const TAIL_S = 13;
const AHEAD = 6.5;
const FLOOR_Y = -1.7;
const EYE = 0.25;
const DOOR_W = 5;
const DOOR_H = 5;

const CURVE = (() => {
  const pts: THREE.Vector3[] = [];
  for (let k = 0; k <= M; k += 1) {
    const x = 3.4 * Math.sin(k * 0.33);
    const y = 0.28 * Math.sin(k * 0.5 + 0.4);
    const z = 2 - k * STEP;
    pts.push(new THREE.Vector3(x, y, z));
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
function Pp(f: Frame, lx: number, ly: number, lz: number): [number, number, number] {
  return [f.pos.x + f.right.x * lx + f.fwd.x * lz, FLOOR_Y + ly, f.pos.z + f.right.z * lx + f.fwd.z * lz];
}

/* --------------------------- premium materials --------------------------- */
const travertine = new THREE.MeshStandardMaterial({ color: 0xd7cdba, roughness: 0.92, metalness: 0.02 });
const concrete = new THREE.MeshStandardMaterial({ color: 0xc6c8cc, roughness: 0.92, metalness: 0.02 });
const blackStone = new THREE.MeshStandardMaterial({ color: 0x0d0f13, roughness: 0.15, metalness: 0.5, envMapIntensity: 1.3 });
const aluminium = new THREE.MeshStandardMaterial({ color: 0xc3c8ce, roughness: 0.28, metalness: 1.0, envMapIntensity: 1.4 });
const bronze = new THREE.MeshStandardMaterial({ color: 0x8c6a3e, roughness: 0.36, metalness: 1.0, envMapIntensity: 1.2 });
const steel = new THREE.MeshStandardMaterial({ color: 0x3a3e44, roughness: 0.5, metalness: 0.9, envMapIntensity: 1.0 });
const oak = new THREE.MeshStandardMaterial({ color: 0x9c754a, roughness: 0.64, metalness: 0.02 });
const reveal = new THREE.MeshStandardMaterial({ color: 0x050608, roughness: 0.9, metalness: 0 });
const glass = new THREE.MeshPhysicalMaterial({ color: 0x2b3a49, metalness: 0, roughness: 0.05, transparent: true, opacity: 0.22, envMapIntensity: 1.7, side: THREE.DoubleSide });
const skyMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.66, 0.75, 0.94), toneMapped: false });

const shaftMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: {},
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader: `precision mediump float; varying vec2 vUv; void main(){ float x=1.0-abs(vUv.x-0.5)*2.0; float y=smoothstep(1.0,0.3,vUv.y); gl_FragColor=vec4(0.95,0.96,1.0, pow(x,1.7)*y*0.09);} `,
});

const BOX = new THREE.BoxGeometry(1, 1, 1);
const HUES: [number, number, number][] = [
  [0.72, 0.8, 1.0], [0.86, 0.92, 1.0], [0.74, 0.84, 1.0], [0.9, 0.95, 1.0], [0.78, 0.86, 1.0], [1.0, 0.86, 0.62],
];
const hueOf = (i: number) => new THREE.Color(...HUES[((i % HUES.length) + HUES.length) % HUES.length]);

/* --------------------------- building blocks --------------------------- */
function B({ mat, p, s, ry = 0, tl = 0 }: { mat: THREE.Material; p: [number, number, number]; s: [number, number, number]; ry?: number; tl?: number }) {
  return <mesh geometry={BOX} material={mat} position={p} rotation={[tl, ry, 0]} scale={s} castShadow receiveShadow />;
}
function Reveal({ f, lx, lz, len, along = true }: { f: Frame; lx: number; lz: number; len: number; along?: boolean }) {
  const s: [number, number, number] = along ? [0.18, 0.14, len] : [len, 0.14, 0.18];
  return <B mat={reveal} p={Pp(f, lx, 0.07, lz)} s={s} ry={f.heading} />;
}
function DoorWall({ f, lz, halfW, H, mat }: { f: Frame; lz: number; halfW: number; H: number; mat: THREE.Material }) {
  const pier = halfW - DOOR_W / 2;
  const off = DOOR_W / 2 + pier / 2;
  return (
    <group>
      <B mat={mat} p={Pp(f, -off, H / 2, lz)} s={[pier, H, 0.4]} ry={f.heading} />
      <B mat={mat} p={Pp(f, off, H / 2, lz)} s={[pier, H, 0.4]} ry={f.heading} />
      <B mat={mat} p={Pp(f, 0, DOOR_H + (H - DOOR_H) / 2, lz)} s={[DOOR_W, H - DOOR_H, 0.4]} ry={f.heading} />
      <B mat={bronze} p={Pp(f, DOOR_W / 2 - 0.05, DOOR_H / 2, lz)} s={[0.12, DOOR_H, 0.5]} ry={f.heading} />
      <B mat={bronze} p={Pp(f, -DOOR_W / 2 + 0.05, DOOR_H / 2, lz)} s={[0.12, DOOR_H, 0.5]} ry={f.heading} />
    </group>
  );
}
function GlassWall({ f, lx, H }: { f: Frame; lx: number; H: number }) {
  return (
    <group>
      <B mat={glass} p={Pp(f, lx, H / 2, 0)} s={[0.1, H, HALF_L * 2]} ry={f.heading} />
      <B mat={aluminium} p={Pp(f, lx, 0.2, 0)} s={[0.22, 0.2, HALF_L * 2]} ry={f.heading} />
      <B mat={aluminium} p={Pp(f, lx, H - 0.2, 0)} s={[0.22, 0.2, HALF_L * 2]} ry={f.heading} />
      <B mat={aluminium} p={Pp(f, lx, H / 2, -HALF_L)} s={[0.18, H, 0.18]} ry={f.heading} />
      <B mat={aluminium} p={Pp(f, lx, H / 2, HALF_L)} s={[0.18, H, 0.18]} ry={f.heading} />
    </group>
  );
}
function Railing({ f, lx, lz, len, along = true, h = 1.1, post = bronze }: { f: Frame; lx: number; lz: number; len: number; along?: boolean; h?: number; post?: THREE.Material }) {
  const s: [number, number, number] = along ? [0.06, h, len] : [len, h, 0.06];
  const cap: [number, number, number] = along ? [0.12, 0.07, len] : [len, 0.07, 0.12];
  return (
    <group>
      <B mat={glass} p={Pp(f, lx, h / 2, lz)} s={s} ry={f.heading} />
      <B mat={post} p={Pp(f, lx, h + 0.02, lz)} s={cap} ry={f.heading} />
    </group>
  );
}
// a floating stair carried on a single steel stringer beneath the treads
function FloatingStair({ f, lx, top, steps = 12 }: { f: Frame; lx: number; top: number; steps?: number }) {
  const items: ReactNode[] = [];
  const rise = top / steps;
  const run = 8;
  for (let k = 0; k < steps; k += 1) {
    const lz = -run / 2 + (run / steps) * (k + 0.5);
    items.push(<B key={`t${k}`} mat={oak} p={Pp(f, lx, rise * (k + 1), lz)} s={[1.9, 0.16, run / steps + 0.04]} ry={f.heading} />);
  }
  items.push(<B key="stringer" mat={steel} p={Pp(f, lx, top / 2, 0)} s={[0.28, 0.5, run + 0.6]} ry={f.heading} tl={-Math.atan2(top, run)} />);
  return <group>{items}</group>;
}
function CurvedWall({ f, lx, lz, r, h, mat, a0, aLen }: { f: Frame; lx: number; lz: number; r: number; h: number; mat: THREE.Material; a0: number; aLen: number }) {
  const geo = useMemo(() => new THREE.CylinderGeometry(r, r, h, 40, 1, true, a0, aLen), [r, h, a0, aLen]);
  return <mesh geometry={geo} material={mat} position={Pp(f, lx, h / 2, lz)} rotation={[0, f.heading, 0]} />;
}

/* ------------------------------ the rooms ------------------------------ */
function Room({ i, f }: { i: number; f: Frame }) {
  const h = f.heading;
  const room = i % 6;

  if (room === 0) {
    // Lobby — double height, curved travertine feature wall, floating oak stair, oak reception
    const HW = 8, H = 13;
    return (
      <group>
        <B mat={concrete} p={Pp(f, 0, H, 0)} s={[HW * 2, 0.4, HALF_L * 2]} ry={h} />
        <GlassWall f={f} lx={HW} H={H} />
        <CurvedWall f={f} lx={-6} lz={0} r={7} h={H} mat={travertine} a0={-0.85} aLen={1.7} />
        <DoorWall f={f} lz={HALF_L} halfW={HW} H={H} mat={travertine} />
        <FloatingStair f={f} lx={-3.5} top={5.4} />
        <B mat={concrete} p={Pp(f, -4.4, 5.4, 4.6)} s={[6, 0.3, 6.8]} ry={h} />
        <Railing f={f} lx={-1.5} lz={4.6} len={6.8} />
        <B mat={oak} p={Pp(f, 3.5, 0.55, -5)} s={[3.4, 1.1, 1.1]} ry={h} />
        <B mat={blackStone} p={Pp(f, 3.5, 1.15, -5)} s={[3.6, 0.1, 1.3]} ry={h} />
        <Reveal f={f} lx={HW - 0.3} lz={0} len={HALF_L * 2} />
      </group>
    );
  }
  if (room === 1) {
    // Atrium — full height, linear skylight, mezzanine, black-stone feature wall
    const HW = 10, H = 22;
    return (
      <group>
        <B mat={concrete} p={Pp(f, -HW * 0.55, H, 0)} s={[HW * 0.9, 0.5, HALF_L * 2]} ry={h} />
        <B mat={concrete} p={Pp(f, HW * 0.55, H, 0)} s={[HW * 0.9, 0.5, HALF_L * 2]} ry={h} />
        <mesh geometry={BOX} material={shaftMat} position={Pp(f, 0, H / 2, 0)} rotation={[0, h, 0]} scale={[HW * 0.55, H, 0.1]} />
        <GlassWall f={f} lx={HW} H={H} />
        <B mat={blackStone} p={Pp(f, -HW, H / 2, 0)} s={[0.5, H, HALF_L * 2]} ry={h} />
        <B mat={travertine} p={Pp(f, -HW + 3, 8, 0)} s={[6, 0.4, HALF_L * 2]} ry={h} />
        <Railing f={f} lx={-HW + 6} lz={0} len={HALF_L * 2} />
        <B mat={steel} p={Pp(f, -HW + 5.9, 4, -6)} s={[0.3, 8, 0.3]} ry={h} />
        <B mat={steel} p={Pp(f, -HW + 5.9, 4, 6)} s={[0.3, 8, 0.3]} ry={h} />
        <DoorWall f={f} lz={-HALF_L} halfW={HW} H={H} mat={concrete} />
        <DoorWall f={f} lz={HALF_L} halfW={HW} H={H} mat={concrete} />
        <Reveal f={f} lx={-HW + 0.3} lz={0} len={HALF_L * 2} />
      </group>
    );
  }
  if (room === 2) {
    // Glazed bridge — a slender glass link with a drop to a lower floor
    const HW = 4.2, H = 8;
    return (
      <group>
        <B mat={blackStone} p={Pp(f, 0, -0.08, 0)} s={[HW * 2, 0.3, HALF_L * 2]} ry={h} />
        <B mat={concrete} p={Pp(f, 0, H, 0)} s={[HW * 2 + 0.8, 0.4, HALF_L * 2]} ry={h} />
        <GlassWall f={f} lx={HW} H={H} />
        <GlassWall f={f} lx={-HW} H={H} />
        <B mat={travertine} p={Pp(f, 13, -6.5, 0)} s={[18, 0.4, HALF_L * 2]} ry={h} />
        <B mat={travertine} p={Pp(f, -13, -6.5, 0)} s={[18, 0.4, HALF_L * 2]} ry={h} />
        <B mat={steel} p={Pp(f, 0, -0.5, -HALF_L)} s={[HW * 2, 0.8, 0.5]} ry={h} />
        <B mat={steel} p={Pp(f, 0, -0.5, HALF_L)} s={[HW * 2, 0.8, 0.5]} ry={h} />
        <DoorWall f={f} lz={-HALF_L} halfW={HW} H={H} mat={aluminium} />
        <DoorWall f={f} lz={HALF_L} halfW={HW} H={H} mat={aluminium} />
      </group>
    );
  }
  if (room === 3) {
    // Gallery — enclosed, angled travertine feature wall, oak floor band, cove reveal
    const HW = 6, H = 7;
    return (
      <group>
        <B mat={concrete} p={Pp(f, 0, H, 0)} s={[HW * 2, 0.4, HALF_L * 2]} ry={h} />
        <B mat={concrete} p={Pp(f, HW, H / 2, 0)} s={[0.4, H, HALF_L * 2]} ry={h} />
        <B mat={concrete} p={Pp(f, -HW, H / 2, 0)} s={[0.4, H, HALF_L * 2]} ry={h} />
        <B mat={travertine} p={Pp(f, -1.8, H / 2, 3)} s={[0.4, H, 8]} ry={h + 0.3} />
        <B mat={oak} p={Pp(f, 3.5, 0.06, 0)} s={[3, 0.1, HALF_L * 2]} ry={h} />
        <DoorWall f={f} lz={-HALF_L} halfW={HW} H={H} mat={concrete} />
        <DoorWall f={f} lz={HALF_L} halfW={HW} H={H} mat={concrete} />
        <Reveal f={f} lx={HW - 0.3} lz={0} len={HALF_L * 2} />
        <Reveal f={f} lx={-HW + 0.3} lz={0} len={HALF_L * 2} />
      </group>
    );
  }
  if (room === 4) {
    // Courtyard — reflecting pool, travertine walls, opening to the sky
    const HW = 9, H = 11;
    return (
      <group>
        <mesh geometry={BOX} material={blackStone} position={Pp(f, 0.5, 0.02, 0)} rotation={[0, h, 0]} scale={[9, 0.06, 11]} />
        <B mat={travertine} p={Pp(f, 5.4, 0.16, 0)} s={[0.3, 0.28, 11]} ry={h} />
        <B mat={travertine} p={Pp(f, -4, 0.16, 0)} s={[0.3, 0.28, 11]} ry={h} />
        <B mat={travertine} p={Pp(f, -HW, H / 2, 0)} s={[0.5, H, HALF_L * 2]} ry={h} />
        <GlassWall f={f} lx={HW} H={H} />
        <B mat={oak} p={Pp(f, -6.5, 1.4, -4)} s={[2, 2.8, 0.4]} ry={h} />
        <mesh geometry={BOX} material={skyMat} position={Pp(f, 0, H + 7, 0)} rotation={[Math.PI / 2, 0, 0]} scale={[HW * 2, HALF_L * 2, 0.1]} />
        <DoorWall f={f} lz={-HALF_L} halfW={HW} H={H} mat={travertine} />
        <DoorWall f={f} lz={HALF_L} halfW={HW} H={H} mat={travertine} />
      </group>
    );
  }
  // Rooftop terrace — deck, panoramic glass balustrade, steel canopy, oak bench
  const HW = 8;
  return (
    <group>
      <B mat={travertine} p={Pp(f, 0, -0.08, 0)} s={[HW * 2, 0.3, HALF_L * 2]} ry={h} />
      <Railing f={f} lx={HW} lz={0} len={HALF_L * 2} h={1.2} />
      <Railing f={f} lx={-HW} lz={0} len={HALF_L * 2} h={1.2} />
      <Railing f={f} lx={0} lz={HALF_L} len={HW * 2} along={false} h={1.2} />
      <B mat={steel} p={Pp(f, 0, 8.4, -1)} s={[HW * 1.6, 0.22, 9]} ry={h} />
      <B mat={steel} p={Pp(f, -5, 4.2, -4)} s={[0.26, 8.4, 0.26]} ry={h} />
      <B mat={steel} p={Pp(f, 5, 4.2, -4)} s={[0.26, 8.4, 0.26]} ry={h} />
      <B mat={steel} p={Pp(f, -5, 4.2, 3)} s={[0.26, 8.4, 0.26]} ry={h} />
      <B mat={steel} p={Pp(f, 5, 4.2, 3)} s={[0.26, 8.4, 0.26]} ry={h} />
      <B mat={oak} p={Pp(f, -6, 0.35, 4)} s={[3, 0.6, 1]} ry={h} />
      <mesh geometry={BOX} material={skyMat} position={Pp(f, 0, 20, 4)} rotation={[Math.PI / 2, 0, 0]} scale={[30, 26, 0.1]} />
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
type Shared = { glow: { current: number }; tint: { current: THREE.Color }; active: { current: THREE.Vector3 } };

function AccentLight({ shared }: { shared: Shared }) {
  const light = useRef<THREE.PointLight>(null);
  const v = useRef(new THREE.Vector3());
  useFrame(() => {
    const l = light.current;
    if (!l) return;
    v.current.set(shared.active.current.x, 4.5, shared.active.current.z);
    l.position.lerp(v.current, 0.07);
    l.color.lerp(shared.tint.current, 0.05);
    l.intensity += (18 + shared.glow.current * 40 - l.intensity) * 0.07;
  });
  return <pointLight ref={light} distance={34} decay={1.5} />;
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
    shared.tint.current.lerp(stations[active].hue, 0.05);
    shared.active.current.lerp(stations[active].frame.pos, 0.07);
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
    eased.current += (target - eased.current) * Math.min(1, delta * 1.5); // slow, cinematic
    const s = cameraS(eased.current);
    const t = state.clock.elapsedTime;
    mouse.current.x += (state.pointer.x - mouse.current.x) * Math.min(1, delta * 1.2);
    mouse.current.y += (state.pointer.y - mouse.current.y) * Math.min(1, delta * 1.2);
    const f = frameAt(s);
    const ahead = frameAt(s + AHEAD);
    camera.position.set(f.pos.x + mouse.current.x * 0.32, f.pos.y + EYE + mouse.current.y * 0.16 + Math.sin(t * 0.05) * 0.03, f.pos.z);
    camera.lookAt(ahead.pos.x, ahead.pos.y + EYE + 0.35, ahead.pos.z);
    const turn = f.fwd.x * ahead.fwd.z - f.fwd.z * ahead.fwd.x;
    const bankTarget = clamp(turn * 1.8, -0.02, 0.02);
    bank.current += (bankTarget - bank.current) * Math.min(1, delta * 1.2);
    camera.rotateZ(bank.current);
  });
  return null;
}

function ReflectiveFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y - 0.12, -55]}>
      <planeGeometry args={[120, 240]} />
      <MeshReflectorMaterial
        resolution={512}
        blur={[500, 160]}
        mixBlur={1.4}
        mixStrength={2.4}
        depthScale={1.0}
        minDepthThreshold={0.3}
        maxDepthThreshold={1.3}
        roughness={0.7}
        metalness={0.35}
        color="#181b21"
      />
    </mesh>
  );
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
    tint: { current: new THREE.Color(0.8, 0.86, 1.0) },
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
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
        dpr={reduced ? 1 : [1, mobile ? 1.3 : 1.7]}
        camera={{ position: [0, 0.25, 2], fov: 58 }}
        frameloop={active ? "always" : "never"}
        eventSource={eventSource as unknown as RefObject<HTMLElement>}
        eventPrefix="client"
        onCreated={({ scene }) => {
          scene.fog = new THREE.FogExp2(0x05060c, 0.017);
        }}
      >
        <Sky />
        <ambientLight intensity={0.14} />
        <directionalLight position={[16, 26, 10]} intensity={0.55} color={0xf3f6fb} />
        <AccentLight shared={shared} />
        <ReflectiveFloor />
        <Building />
        <Rig scroll={scroll} />
        <StationDrivers scroll={scroll} shared={shared} />
      </Canvas>
    </div>
  );
}
