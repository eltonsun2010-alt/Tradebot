"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type RefObject, type ReactNode } from "react";
import * as THREE from "three";
import { WHY_CARDS } from "@/lib/data";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useIsMobile } from "@/hooks/useMediaQuery";

/* ------------------------------------------------------------------ *
 * The Light Corridor — a sequence of monumental architectural rooms.
 *
 * The visitor is carried along the centre-line of a building: through a
 * portal into an entrance gallery, along a flowing glass passage, into a
 * vast exhibition hall, across a light bridge, through a floating
 * chamber, and out into a warm final atrium. Each room is composed by
 * hand from premium materials — matte concrete, dark stone, aluminium,
 * structural glass, glowing acrylic and integrated light strips — and
 * lit so the architecture itself, not a card, presents each idea.
 * ------------------------------------------------------------------ */

const N = WHY_CARDS.length;
const STEP = 6.4;
const M = 20;
const LEAD_S = 16;
const GAP_S = 16;
const TAIL_S = 12;
const AHEAD = 8;
const FLOOR_Y = -4.6;

// the building's spine — long, deliberate, gently curving
const CURVE = (() => {
  const pts: THREE.Vector3[] = [];
  for (let k = 0; k <= M; k += 1) {
    const x = 8.4 * Math.sin(k * 0.46) + 2.6 * Math.sin(k * 1.05 + 0.6);
    const y = 0.6 * Math.sin(k * 0.7 + 0.5);
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
/** local (right, up-from-floor, forward) → world position */
function place(f: Frame, lx: number, ly: number, lz: number): [number, number, number] {
  return [
    f.pos.x + f.right.x * lx + f.fwd.x * lz,
    FLOOR_Y + ly,
    f.pos.z + f.right.z * lx + f.fwd.z * lz,
  ];
}

/* ------------------------------ materials ------------------------------ */
const concrete = new THREE.MeshStandardMaterial({ color: 0xc7c9cd, roughness: 0.95, metalness: 0.02 });
const stone = new THREE.MeshStandardMaterial({ color: 0x0b0c0f, roughness: 0.28, metalness: 0.35 });
const aluminium = new THREE.MeshStandardMaterial({ color: 0x9a9fa7, roughness: 0.42, metalness: 0.6 });
const warmStone = new THREE.MeshStandardMaterial({ color: 0x141210, roughness: 0.4, metalness: 0.2 });

const glassVert = /* glsl */ `
  varying vec3 vN; varying vec3 vV; varying float vFade;
  void main(){
    vec4 mv = modelViewMatrix * vec4(position,1.0);
    vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
    vFade = (1.0 - smoothstep(46.0, 78.0, -mv.z)) * smoothstep(-2.0, 3.0, -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const glassFrag = /* glsl */ `
  precision mediump float; uniform vec3 uTint; varying vec3 vN; varying vec3 vV; varying float vFade;
  void main(){
    float f = pow(1.0 - max(dot(normalize(vN), normalize(vV)),0.0), 2.4);
    vec3 col = mix(uTint*0.5, vec3(0.9,0.95,1.0), f);
    float a = (0.05 + 0.6*f) * vFade;
    gl_FragColor = vec4(col, a);
  }
`;
function makeGlass(tint: THREE.Color) {
  return new THREE.ShaderMaterial({
    vertexShader: glassVert, fragmentShader: glassFrag, transparent: true, depthWrite: false,
    side: THREE.DoubleSide, uniforms: { uTint: { value: tint.clone() } },
  });
}

const HUES: [number, number, number][] = [
  [0.62, 0.74, 1.0], // cool blue — flowing
  [0.86, 0.92, 1.0], // near white — precise
  [0.7, 0.82, 1.0], // blue — moving light
  [0.9, 0.96, 1.0], // clear — unfolding
  [0.78, 0.86, 1.0], // soft blue — suspended
  [1.0, 0.86, 0.66], // warm — calm final
];
const hueOf = (i: number) => new THREE.Color(...HUES[((i % HUES.length) + HUES.length) % HUES.length]);

/* --------------------------- form primitives --------------------------- */
function Slab({ mat, pos, size, rotY = 0, tilt = 0 }: { mat: THREE.Material; pos: [number, number, number]; size: [number, number, number]; rotY?: number; tilt?: number }) {
  return (
    <mesh material={mat} position={pos} rotation={[tilt, rotY, 0]} castShadow receiveShadow>
      <boxGeometry args={size} />
    </mesh>
  );
}
function Strip({ color, pos, size, rotY = 0, intensity = 1 }: { color: THREE.Color; pos: [number, number, number]; size: [number, number, number]; rotY?: number; intensity?: number }) {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: color.clone().multiplyScalar(intensity), toneMapped: false, transparent: true, opacity: 0.95 }), [color, intensity]);
  return (
    <mesh material={mat} position={pos} rotation={[0, rotY, 0]}>
      <boxGeometry args={size} />
    </mesh>
  );
}

// a soft volumetric light shaft (large angled additive plane)
const shaftMat = (() => {
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uColor: { value: new THREE.Color(0.8, 0.88, 1.0) }, uOpacity: { value: 0.14 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `precision mediump float; uniform vec3 uColor; uniform float uOpacity; varying vec2 vUv;
      void main(){ float x=1.0-abs(vUv.x-0.5)*2.0; float y=smoothstep(0.0,0.35,vUv.y)*(1.0-smoothstep(0.7,1.0,vUv.y));
        gl_FragColor=vec4(uColor, pow(x,2.0)*y*uOpacity);}`,
  });
  return m;
})();
function Shaft({ pos, size, rotY = 0, tilt = 0 }: { pos: [number, number, number]; size: [number, number]; rotY?: number; tilt?: number }) {
  return (
    <mesh material={shaftMat} position={pos} rotation={[tilt, rotY, 0]}>
      <planeGeometry args={size} />
    </mesh>
  );
}

/* ------------------------------ the rooms ------------------------------ */
function Room({ i, frame }: { i: number; frame: Frame }) {
  const hue = hueOf(i);
  const glass = useMemo(() => makeGlass(hue), [i]);
  const h = frame.heading;
  const motif = i % 6;

  const forms: ReactNode[] = [];
  const key = (n: string) => `${i}-${n}`;

  if (motif === 0) {
    // Entrance gallery — a monumental portal into matte-concrete walls
    forms.push(
      <Slab key={key("wl")} mat={concrete} pos={place(frame, -7, 15, 0)} size={[0.5, 30, 14]} rotY={h} />,
      <Slab key={key("wr")} mat={concrete} pos={place(frame, 7, 15, 0)} size={[0.5, 30, 14]} rotY={h} />,
      <Slab key={key("lintel")} mat={stone} pos={place(frame, 0, 24, -6)} size={[16, 3, 2.2]} rotY={h} />,
      <Strip key={key("s1")} color={hue} pos={place(frame, -6.6, 12, -6)} size={[0.18, 20, 0.18]} rotY={h} />,
      <Strip key={key("s2")} color={hue} pos={place(frame, 6.6, 12, -6)} size={[0.18, 20, 0.18]} rotY={h} />
    );
  } else if (motif === 1) {
    // Flowing passage — sweeping glass fins that lean along the curve
    for (let k = -2; k <= 2; k += 1) {
      const side = k < 0 ? -1 : 1;
      forms.push(
        <Slab key={key(`fin${k}`)} mat={glass} pos={place(frame, side * 6.5, 10, k * 3.2)} size={[0.25, 22, 5]} rotY={h + side * 0.5} tilt={0.12 * side} />
      );
    }
    forms.push(
      <Strip key={key("floorL")} color={hue} pos={place(frame, -5.2, 0.06, 0)} size={[0.16, 0.16, 16]} rotY={h} />,
      <Strip key={key("floorR")} color={hue} pos={place(frame, 5.2, 0.06, 0)} size={[0.16, 0.16, 16]} rotY={h} />
    );
  } else if (motif === 2) {
    // Vast exhibition hall — one massive offset stone wall, high ceiling beams
    forms.push(
      <Slab key={key("bigwall")} mat={stone} pos={place(frame, -10, 18, 2)} size={[0.6, 36, 26]} rotY={h} />,
      <Slab key={key("beam1")} mat={concrete} pos={place(frame, 2, 30, -2)} size={[26, 1.6, 2]} rotY={h} />,
      <Slab key={key("beam2")} mat={concrete} pos={place(frame, 4, 26, 6)} size={[22, 1.4, 2]} rotY={h} />,
      <Strip key={key("wallstrip")} color={hue} pos={place(frame, -9.6, 16, 2)} size={[0.2, 30, 0.2]} rotY={h} />,
      <Shaft key={key("shaft")} pos={place(frame, -3, 16, -3)} size={[10, 34]} rotY={h + 0.3} tilt={0.5} />
    );
  } else if (motif === 3) {
    // Glass bridge — clear balustrades, open sides, integrated floor light
    forms.push(
      <Slab key={key("balL")} mat={glass} pos={place(frame, -4.4, 3, 0)} size={[0.2, 6, 18]} rotY={h} />,
      <Slab key={key("balR")} mat={glass} pos={place(frame, 4.4, 3, 0)} size={[0.2, 6, 18]} rotY={h} />,
      <Slab key={key("capL")} mat={aluminium} pos={place(frame, -4.4, 6.2, 0)} size={[0.5, 0.3, 18]} rotY={h} />,
      <Slab key={key("capR")} mat={aluminium} pos={place(frame, 4.4, 6.2, 0)} size={[0.5, 0.3, 18]} rotY={h} />,
      <Strip key={key("bl")} color={hue} pos={place(frame, -4.2, 0.12, 0)} size={[0.14, 0.14, 18]} rotY={h} />,
      <Strip key={key("br")} color={hue} pos={place(frame, 4.2, 0.12, 0)} size={[0.14, 0.14, 18]} rotY={h} />,
      <Slab key={key("arch")} mat={aluminium} pos={place(frame, 0, 22, -5)} size={[12, 1, 1]} rotY={h} />
    );
  } else if (motif === 4) {
    // Floating chamber — suspended slabs above and to one side
    forms.push(
      <Slab key={key("float1")} mat={concrete} pos={place(frame, -6, 20, -1)} size={[10, 0.8, 12]} rotY={h} tilt={0.06} />,
      <Slab key={key("float2")} mat={stone} pos={place(frame, 7, 14, 3)} size={[0.6, 22, 10]} rotY={h + 0.2} />,
      <Slab key={key("float3")} mat={aluminium} pos={place(frame, 3, 27, -4)} size={[14, 0.6, 6]} rotY={h - 0.15} />,
      <Strip key={key("edge")} color={hue} pos={place(frame, -6, 15.4, -1)} size={[9.5, 0.16, 0.16]} rotY={h} />,
      <Shaft key={key("shaft")} pos={place(frame, 4, 14, 2)} size={[8, 30]} rotY={h - 0.2} tilt={0.4} />
    );
  } else {
    // Final atrium — a towering warm light shaft in a huge calm space
    forms.push(
      <Slab key={key("wallA")} mat={concrete} pos={place(frame, -9, 20, 4)} size={[0.6, 40, 20]} rotY={h} />,
      <Slab key={key("wallB")} mat={warmStone} pos={place(frame, 9, 20, -4)} size={[0.6, 40, 20]} rotY={h} />,
      <Slab key={key("skybeam")} mat={concrete} pos={place(frame, 0, 34, 0)} size={[24, 2, 24]} rotY={h} />,
      <Strip key={key("colL")} color={hue} pos={place(frame, -8.6, 18, 4)} size={[0.24, 34, 0.24]} rotY={h} intensity={1.3} />,
      <Strip key={key("colR")} color={hue} pos={place(frame, 8.6, 18, -4)} size={[0.24, 34, 0.24]} rotY={h} intensity={1.3} />,
      <Shaft key={key("bigshaft")} pos={place(frame, 0, 17, 0)} size={[16, 40]} rotY={h} tilt={0} />
    );
  }

  return <group>{forms}</group>;
}

/* ------------------------------ lighting ------------------------------ */
type Shared = { glow: { current: number }; tint: { current: THREE.Color }; pool: { current: THREE.Vector2 }; active: { current: THREE.Vector3 } };

function AccentLight({ shared }: { shared: Shared }) {
  const light = useRef<THREE.PointLight>(null);
  useFrame(() => {
    const l = light.current;
    if (!l) return;
    l.position.lerp(new THREE.Vector3(shared.active.current.x, 6, shared.active.current.z), 0.08);
    l.color.lerp(shared.tint.current, 0.06);
    l.intensity += (30 + shared.glow.current * 90 - l.intensity) * 0.08;
  });
  return <pointLight ref={light} distance={44} decay={1.4} />;
}

function Rooms() {
  const frames = useMemo(() => Array.from({ length: N }, (_, i) => frameAt(stationS(i))), []);
  return (
    <group>
      {frames.map((f, i) => (
        <Room key={i} i={i} frame={f} />
      ))}
    </group>
  );
}

function StationDrivers({ scroll, shared }: { scroll?: { get: () => number }; shared: Shared }) {
  const stations = useMemo(
    () => Array.from({ length: N }, (_, i) => ({ i, frame: frameAt(stationS(i)), hue: hueOf(i) })),
    []
  );
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
    camera.position.set(
      f.pos.x + mouse.current.x * 0.4,
      f.pos.y + 0.6 + mouse.current.y * 0.25 + Math.sin(t * 0.06) * 0.1,
      f.pos.z
    );
    camera.lookAt(ahead.pos.x, ahead.pos.y + 1.4, ahead.pos.z);
    const turn = f.fwd.x * ahead.fwd.z - f.fwd.z * ahead.fwd.x;
    const bankTarget = clamp(turn * 3.2, -0.045, 0.045);
    bank.current += (bankTarget - bank.current) * Math.min(1, delta * 1.5);
    camera.rotateZ(bank.current);
  });
  return null;
}

/* dark polished-stone floor that pools light at the active installation */
const floorVert = /* glsl */ `
  varying vec3 vWorld; varying float vDepth;
  void main(){ vec4 w=modelMatrix*vec4(position,1.0); vWorld=w.xyz; vec4 mv=viewMatrix*w; vDepth=-mv.z; gl_Position=projectionMatrix*mv; }
`;
const floorFrag = /* glsl */ `
  precision mediump float; uniform vec2 uPool; uniform vec3 uTint; uniform float uGlow; varying vec3 vWorld; varying float vDepth;
  void main(){
    float dist=length(vWorld.xz-uPool);
    float pool=smoothstep(15.0,0.0,dist)*uGlow;
    float depthFade=1.0-smoothstep(30.0,74.0,vDepth);
    vec3 base=vec3(0.006,0.008,0.014);
    vec3 col=base + (uTint*0.16 + vec3(0.02,0.026,0.045))*pool*depthFade;
    gl_FragColor=vec4(col,1.0);
  }
`;
function Floor({ shared }: { shared: Shared }) {
  const mat = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: floorVert, fragmentShader: floorFrag, uniforms: { uPool: { value: new THREE.Vector2() }, uTint: { value: new THREE.Color(0.7, 0.8, 1.0) }, uGlow: { value: 0 } } }),
    []
  );
  useFrame(() => {
    const u = mat.uniforms;
    (u.uPool.value as THREE.Vector2).lerp(shared.pool.current, 0.08);
    u.uGlow.value += (shared.glow.current - u.uGlow.value) * 0.1;
    (u.uTint.value as THREE.Color).lerp(shared.tint.current, 0.05);
  });
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y, -55]} material={mat}>
      <planeGeometry args={[80, 200]} />
    </mesh>
  );
}

function Energy() {
  const geo = useMemo(() => {
    const n = 120;
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 3);
    const seed = new Float32Array(n);
    for (let i = 0; i < n; i += 1) {
      pos[i * 3] = (Math.random() - 0.5) * 26;
      pos[i * 3 + 1] = -3.6 + Math.random() * 24;
      pos[i * 3 + 2] = Math.random() * 130 - 124;
      seed[i] = Math.random();
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    return g;
  }, []);
  const mat = useMemo(
    () => new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 } },
      vertexShader: `attribute float aSeed; varying float vA; uniform float uTime;
        void main(){ vec3 p=position; p.z=mod(position.z+uTime*1.1+aSeed*130.0,130.0)-124.0;
          vec4 mv=modelViewMatrix*vec4(p,1.0); gl_Position=projectionMatrix*mv; float d=-mv.z;
          gl_PointSize=(13.0*aSeed+4.0)*(6.0/d); vA=(1.0-smoothstep(40.0,70.0,d))*smoothstep(0.0,5.0,d); }`,
      fragmentShader: `precision mediump float; varying float vA;
        void main(){ float d=length(gl_PointCoord-0.5); float a=smoothstep(0.5,0.0,d)*vA*0.4; if(a<0.01)discard; gl_FragColor=vec4(0.85,0.9,1.0,a); }`,
    }),
    []
  );
  useFrame((state) => { mat.uniforms.uTime.value = state.clock.elapsedTime; });
  return <points geometry={geo} material={mat} />;
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
        camera={{ position: [0, 0.6, 2], fov: 48 }}
        frameloop={active ? "always" : "never"}
        eventSource={eventSource as unknown as RefObject<HTMLElement>}
        eventPrefix="client"
        onCreated={({ scene }) => {
          scene.fog = new THREE.FogExp2(0x000000, 0.03);
        }}
      >
        <ambientLight intensity={0.16} />
        <hemisphereLight args={[0x6a7890, 0x05060a, 0.3]} />
        <directionalLight position={[8, 26, 6]} intensity={0.5} color={0xdfe6f2} />
        <AccentLight shared={shared} />
        <Floor shared={shared} />
        <Rooms />
        <Energy />
        <Rig scroll={scroll} />
        <StationDrivers scroll={scroll} shared={shared} />
      </Canvas>
    </div>
  );
}
