"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type RefObject, type ReactNode } from "react";
import * as THREE from "three";
import { WHY_CARDS } from "@/lib/data";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useIsMobile } from "@/hooks/useMediaQuery";

/* ------------------------------------------------------------------ *
 * The Southpage headquarters.
 *
 * One iconic contemporary building the visitor walks through. The route
 * leads from a double-height lobby, into a full-height atrium, across a
 * glass bridge, through an exhibition gallery, out to a planted courtyard
 * with a reflection pool, and up to a rooftop terrace. Each space is a
 * recognisable piece of architecture — floor plates, structural columns,
 * curtain-wall glass, staircases, mezzanines and balustrades — and holds
 * one of Southpage's principles.
 * ------------------------------------------------------------------ */

const N = WHY_CARDS.length;
const STEP = 6.6;
const M = 22;
const LEAD_S = 15;
const GAP_S = 16;
const TAIL_S = 13;
const AHEAD = 7;
const FLOOR_Y = -1.7; // ground floor, ~1.9 below the eye
const EYE = 0.2;

const CURVE = (() => {
  const pts: THREE.Vector3[] = [];
  for (let k = 0; k <= M; k += 1) {
    const x = 9.0 * Math.sin(k * 0.42) + 2.2 * Math.sin(k * 0.95 + 0.6);
    const y = 0.5 * Math.sin(k * 0.6 + 0.4);
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
  return smoothstep(14, 6, d) * smoothstep(0.4, 3.6, d);
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
/** local (right, height-above-floor, forward) → world */
function P(f: Frame, lx: number, ly: number, lz: number): [number, number, number] {
  return [f.pos.x + f.right.x * lx + f.fwd.x * lz, FLOOR_Y + ly, f.pos.z + f.right.z * lx + f.fwd.z * lz];
}

/* ------------------------------ materials ------------------------------ */
const concrete = new THREE.MeshStandardMaterial({ color: 0xcccdd0, roughness: 0.82, metalness: 0.02 });
const warmConcrete = new THREE.MeshStandardMaterial({ color: 0xd8cfc0, roughness: 0.8, metalness: 0.02 });
const darkStone = new THREE.MeshStandardMaterial({ color: 0x14161b, roughness: 0.4, metalness: 0.3 });
const aluminium = new THREE.MeshStandardMaterial({ color: 0xa7adb5, roughness: 0.38, metalness: 0.65 });
const lightMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.96, 0.88), toneMapped: false });
const skyMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.5, 0.62, 0.85), toneMapped: false, transparent: true, opacity: 0.5 });

const glassVert = /* glsl */ `
  varying vec3 vN; varying vec3 vV;
  void main(){ vec4 mv=modelViewMatrix*vec4(position,1.0); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }
`;
const glassFrag = /* glsl */ `
  precision mediump float; varying vec3 vN; varying vec3 vV;
  void main(){ float f=pow(1.0-max(dot(normalize(vN),normalize(vV)),0.0),2.2);
    vec3 col=mix(vec3(0.12,0.16,0.22), vec3(0.8,0.88,1.0), f); gl_FragColor=vec4(col,0.06+0.5*f); }
`;
const glass = new THREE.ShaderMaterial({ vertexShader: glassVert, fragmentShader: glassFrag, transparent: true, depthWrite: false, side: THREE.DoubleSide });
const poolMat = new THREE.MeshStandardMaterial({ color: 0x060a12, roughness: 0.04, metalness: 0.95 });

const BOX = new THREE.BoxGeometry(1, 1, 1);
const HUES: [number, number, number][] = [
  [0.66, 0.76, 1.0], [0.86, 0.92, 1.0], [0.7, 0.82, 1.0], [0.9, 0.96, 1.0], [0.74, 0.85, 1.0], [1.0, 0.85, 0.6],
];
const hueOf = (i: number) => new THREE.Color(...HUES[((i % HUES.length) + HUES.length) % HUES.length]);

/* --------------------------- building blocks --------------------------- */
function B({ mat, p, s, ry = 0, tl = 0 }: { mat: THREE.Material; p: [number, number, number]; s: [number, number, number]; ry?: number; tl?: number }) {
  return <mesh geometry={BOX} material={mat} position={p} rotation={[tl, ry, 0]} scale={s} />;
}
function Column({ f, lx, lz, h, mat = concrete }: { f: Frame; lx: number; lz: number; h: number; mat?: THREE.Material }) {
  return <B mat={mat} p={P(f, lx, h / 2, lz)} s={[0.5, h, 0.5]} ry={f.heading} />;
}
function Railing({ f, lx, lz, len, h = 1.1, along = true }: { f: Frame; lx: number; lz: number; len: number; h?: number; along?: boolean }) {
  const s: [number, number, number] = along ? [0.08, h, len] : [len, h, 0.08];
  const cap: [number, number, number] = along ? [0.16, 0.09, len] : [len, 0.09, 0.16];
  return (
    <group>
      <B mat={glass} p={P(f, lx, h / 2, lz)} s={s} ry={f.heading} />
      <B mat={aluminium} p={P(f, lx, h + 0.04, lz)} s={cap} ry={f.heading} />
    </group>
  );
}
function Stairs({ f, lx, lz, run, top, steps = 12, width = 3.4 }: { f: Frame; lx: number; lz: number; run: number; top: number; steps?: number; width?: number }) {
  const items: ReactNode[] = [];
  const rise = top / steps;
  const depth = run / steps;
  for (let k = 0; k < steps; k += 1) {
    items.push(<B key={k} mat={concrete} p={P(f, lx, rise * (k + 0.5), lz - run / 2 + depth * (k + 0.5))} s={[width, rise, depth]} ry={f.heading} />);
  }
  return <group>{items}</group>;
}
function Shaft({ f, lx, lz, w, h }: { f: Frame; lx: number; lz: number; w: number; h: number }) {
  return <mesh geometry={BOX} material={shaftMat} position={P(f, lx, h / 2, lz)} rotation={[0, f.heading, 0]} scale={[w, h, 0.1]} />;
}
const shaftMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  uniforms: {},
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader: `precision mediump float; varying vec2 vUv; void main(){ float x=1.0-abs(vUv.x-0.5)*2.0; float y=smoothstep(1.0,0.4,vUv.y); gl_FragColor=vec4(0.85,0.9,1.0, pow(x,1.6)*y*0.1); }`,
});

/* ------------------------------- the wings ------------------------------- */
function Space({ i, f }: { i: number; f: Frame }) {
  const h = f.heading;
  const wing = i % 6;

  if (wing === 0) {
    // Double-height lobby — polished floor, glass facade, grand stair to a mezzanine
    return (
      <group>
        <B mat={darkStone} p={P(f, 0, -0.05, 0)} s={[18, 0.2, 18]} ry={h} />
        <B mat={concrete} p={P(f, -8.5, 7, 0)} s={[0.5, 14, 18]} ry={h} />
        <B mat={glass} p={P(f, 8.5, 7, 0)} s={[0.3, 14, 18]} ry={h} />
        <B mat={concrete} p={P(f, 0, 14.2, 0)} s={[18, 0.6, 18]} ry={h} />
        <Column f={f} lx={5.5} lz={-6} h={14} />
        <Column f={f} lx={5.5} lz={0} h={14} />
        <Column f={f} lx={5.5} lz={6} h={14} />
        <Stairs f={f} lx={-4.5} lz={2} run={7} top={5} />
        <B mat={concrete} p={P(f, -5.5, 5, 6.2)} s={[7, 0.35, 7]} ry={h} />
        <Railing f={f} lx={-2.2} lz={6} len={7} />
        <B mat={lightMat} p={P(f, -8.2, 0.06, 0)} s={[0.1, 0.1, 18]} ry={h} />
        <B mat={lightMat} p={P(f, 0, 13.8, 0)} s={[1.2, 0.06, 18]} ry={h} />
      </group>
    );
  }
  if (wing === 1) {
    // Atrium — full-height void, stacked mezzanine balconies, tall glass, skylight
    return (
      <group>
        <B mat={darkStone} p={P(f, 0, -0.05, 0)} s={[20, 0.2, 20]} ry={h} />
        <B mat={concrete} p={P(f, -9, 12, 0)} s={[0.5, 24, 20]} ry={h} />
        <B mat={glass} p={P(f, 9, 12, 0)} s={[0.3, 24, 20]} ry={h} />
        <B mat={concrete} p={P(f, -6, 6, 0)} s={[6, 0.3, 20]} ry={h} />
        <Railing f={f} lx={-3.1} lz={0} len={20} h={1.1} />
        <B mat={concrete} p={P(f, -6, 12, 0)} s={[6, 0.3, 20]} ry={h} />
        <Railing f={f} lx={-3.1} lz={0} len={20} h={1.1} />
        <Column f={f} lx={-3} lz={-7} h={24} />
        <Column f={f} lx={-3} lz={7} h={24} />
        <B mat={glass} p={P(f, 0, 24.2, 0)} s={[20, 0.3, 20]} ry={h} />
        <Shaft f={f} lx={2} lz={0} w={9} h={24} />
        <B mat={lightMat} p={P(f, -3, 6.4, 0)} s={[0.1, 0.08, 20]} ry={h} />
      </group>
    );
  }
  if (wing === 2) {
    // Glass bridge — a deck over a void, full-glass balustrades, crossing the atrium
    return (
      <group>
        <B mat={darkStone} p={P(f, 0, -6, 0)} s={[16, 0.3, 20]} ry={h} />
        <B mat={concrete} p={P(f, 0, 2, 0)} s={[5.5, 0.35, 20]} ry={h} />
        <Railing f={f} lx={-2.7} lz={0} len={20} h={1.2} />
        <Railing f={f} lx={2.7} lz={0} len={20} h={1.2} />
        <Column f={f} lx={-2.7} lz={-8} h={2.2} mat={aluminium} />
        <Column f={f} lx={2.7} lz={-8} h={2.2} mat={aluminium} />
        <Column f={f} lx={-2.7} lz={8} h={2.2} mat={aluminium} />
        <Column f={f} lx={2.7} lz={8} h={2.2} mat={aluminium} />
        <B mat={concrete} p={P(f, 0, 12, 0)} s={[14, 0.5, 20]} ry={h} />
        <B mat={glass} p={P(f, -8, 6, 0)} s={[0.3, 12, 20]} ry={h} />
        <B mat={lightMat} p={P(f, 0, 2.3, 0)} s={[0.12, 0.06, 20]} ry={h} />
      </group>
    );
  }
  if (wing === 3) {
    // Exhibition gallery — enclosed white room, controlled light, a partition
    return (
      <group>
        <B mat={darkStone} p={P(f, 0, -0.05, 0)} s={[14, 0.2, 20]} ry={h} />
        <B mat={concrete} p={P(f, -5.5, 5, 0)} s={[0.4, 10, 20]} ry={h} />
        <B mat={concrete} p={P(f, 5.5, 5, 0)} s={[0.4, 10, 20]} ry={h} />
        <B mat={concrete} p={P(f, 0, 10.1, 0)} s={[12, 0.5, 20]} ry={h} />
        <B mat={warmConcrete} p={P(f, -2, 4, 4)} s={[0.35, 8, 8]} ry={h} />
        <B mat={lightMat} p={P(f, -5.1, 9.4, 0)} s={[0.08, 0.08, 20]} ry={h} />
        <B mat={lightMat} p={P(f, 5.1, 9.4, 0)} s={[0.08, 0.08, 20]} ry={h} />
        <B mat={lightMat} p={P(f, 0, 9.7, 0)} s={[0.9, 0.05, 20]} ry={h} />
      </group>
    );
  }
  if (wing === 4) {
    // Courtyard — open to the sky, a reflection pool, low walls and columns
    return (
      <group>
        <B mat={darkStone} p={P(f, 0, -0.05, 0)} s={[22, 0.2, 22]} ry={h} />
        <mesh geometry={BOX} material={poolMat} position={P(f, 0, 0.06, 0)} rotation={[0, h, 0]} scale={[9, 0.05, 12]} />
        <B mat={aluminium} p={P(f, 4.6, 0.12, 0)} s={[0.3, 0.2, 12]} ry={h} />
        <B mat={aluminium} p={P(f, -4.6, 0.12, 0)} s={[0.3, 0.2, 12]} ry={h} />
        <B mat={concrete} p={P(f, -10, 2.5, 0)} s={[0.5, 5, 22]} ry={h} />
        <B mat={glass} p={P(f, 10, 4, 0)} s={[0.3, 8, 22]} ry={h} />
        <Column f={f} lx={-7} lz={-8} h={8} />
        <Column f={f} lx={-7} lz={8} h={8} />
        <Column f={f} lx={7} lz={-8} h={8} />
        <Column f={f} lx={7} lz={8} h={8} />
        <mesh geometry={BOX} material={skyMat} position={P(f, 0, 15, 0)} rotation={[Math.PI / 2, 0, 0]} scale={[16, 20, 0.1]} />
        <B mat={lightMat} p={P(f, -4.6, 0.2, 0)} s={[0.06, 0.06, 12]} ry={h} />
      </group>
    );
  }
  // Rooftop terrace — a high deck, panoramic glass balustrade, open sky, canopy
  return (
    <group>
      <B mat={warmConcrete} p={P(f, 0, -0.05, 0)} s={[20, 0.25, 20]} ry={h} />
      <Railing f={f} lx={-8.5} lz={0} len={20} h={1.2} />
      <Railing f={f} lx={8.5} lz={0} len={20} h={1.2} />
      <B mat={concrete} p={P(f, 0, 9, 0)} s={[16, 0.5, 12]} ry={h} />
      <Column f={f} lx={-6} lz={-4} h={9} mat={aluminium} />
      <Column f={f} lx={6} lz={-4} h={9} mat={aluminium} />
      <Column f={f} lx={-6} lz={4} h={9} mat={aluminium} />
      <Column f={f} lx={6} lz={4} h={9} mat={aluminium} />
      <B mat={warmConcrete} p={P(f, -5, 0.4, -3)} s={[3, 0.8, 1.2]} ry={h} />
      <B mat={warmConcrete} p={P(f, 5, 0.4, 4)} s={[3, 0.8, 1.2]} ry={h} />
      <mesh geometry={BOX} material={skyMat} position={P(f, 0, 22, 0)} rotation={[Math.PI / 2, 0, 0]} scale={[24, 24, 0.1]} />
      <B mat={lightMat} p={P(f, 0, 8.6, 0)} s={[1.0, 0.06, 12]} ry={h} />
    </group>
  );
}

function Building() {
  const frames = useMemo(() => Array.from({ length: N }, (_, i) => frameAt(stationS(i))), []);
  return (
    <group>
      {frames.map((f, i) => (
        <Space key={i} i={i} f={f} />
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
    l.intensity += (26 + shared.glow.current * 70 - l.intensity) * 0.08;
  });
  return <pointLight ref={light} distance={40} decay={1.4} />;
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
    mouse.current.x += (state.pointer.x - mouse.current.x) * Math.min(1, delta * 1.5);
    mouse.current.y += (state.pointer.y - mouse.current.y) * Math.min(1, delta * 1.5);
    const f = frameAt(s);
    const ahead = frameAt(s + AHEAD);
    camera.position.set(f.pos.x + mouse.current.x * 0.4, f.pos.y + EYE + mouse.current.y * 0.22 + Math.sin(t * 0.06) * 0.05, f.pos.z);
    camera.lookAt(ahead.pos.x, ahead.pos.y + EYE + 0.4, ahead.pos.z);
    const turn = f.fwd.x * ahead.fwd.z - f.fwd.z * ahead.fwd.x;
    const bankTarget = clamp(turn * 2.4, -0.03, 0.03);
    bank.current += (bankTarget - bank.current) * Math.min(1, delta * 1.5);
    camera.rotateZ(bank.current);
  });
  return null;
}

const floorVert = /* glsl */ `varying vec3 vWorld; varying float vDepth; void main(){ vec4 w=modelMatrix*vec4(position,1.0); vWorld=w.xyz; vec4 mv=viewMatrix*w; vDepth=-mv.z; gl_Position=projectionMatrix*mv; }`;
const floorFrag = /* glsl */ `
  precision mediump float; uniform vec2 uPool; uniform vec3 uTint; uniform float uGlow; varying vec3 vWorld; varying float vDepth;
  void main(){ float dist=length(vWorld.xz-uPool); float pool=smoothstep(16.0,0.0,dist)*uGlow;
    float depthFade=1.0-smoothstep(30.0,74.0,vDepth); vec3 base=vec3(0.014,0.016,0.022);
    vec3 col=base + (uTint*0.14+vec3(0.02,0.026,0.045))*pool*depthFade; gl_FragColor=vec4(col,1.0); }
`;
function Floor({ shared }: { shared: Shared }) {
  const mat = useMemo(() => new THREE.ShaderMaterial({ vertexShader: floorVert, fragmentShader: floorFrag, uniforms: { uPool: { value: new THREE.Vector2() }, uTint: { value: new THREE.Color(0.7, 0.8, 1.0) }, uGlow: { value: 0 } } }), []);
  useFrame(() => {
    const u = mat.uniforms;
    (u.uPool.value as THREE.Vector2).lerp(shared.pool.current, 0.08);
    u.uGlow.value += (shared.glow.current - u.uGlow.value) * 0.1;
    (u.uTint.value as THREE.Color).lerp(shared.tint.current, 0.05);
  });
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y - 0.2, -55]} material={mat}>
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
        camera={{ position: [0, 0.2, 2], fov: 56 }}
        frameloop={active ? "always" : "never"}
        eventSource={eventSource as unknown as RefObject<HTMLElement>}
        eventPrefix="client"
        onCreated={({ scene }) => {
          scene.fog = new THREE.FogExp2(0x03040a, 0.018);
        }}
      >
        <ambientLight intensity={0.34} />
        <hemisphereLight args={[0x9aa8c0, 0x0a0c12, 0.55]} />
        <directionalLight position={[12, 26, 10]} intensity={0.7} color={0xeef2f8} />
        <AccentLight shared={shared} />
        <Floor shared={shared} />
        <Building />
        <Rig scroll={scroll} />
        <StationDrivers scroll={scroll} shared={shared} />
      </Canvas>
    </div>
  );
}
