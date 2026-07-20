"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { WHY_CARDS } from "@/lib/data";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useIsMobile } from "@/hooks/useMediaQuery";

/* ------------------------------------------------------------------ *
 * The Light Corridor — a believable architectural promenade.
 *
 * The visitor is carried along the centre-line of a real building: a
 * curving colonnade of structural columns rises floor-to-ceiling and
 * carries a continuous roof; floor-to-ceiling glass curtain walls sit
 * behind the columns; skylight slots drop shafts of daylight to a
 * polished stone floor; integrated light lines run along the floor and
 * the roof coves; reflecting pools mirror the light. The space expands
 * into grand halls and contracts into intimate galleries as you move —
 * every element grounded and structural, nothing floating.
 * ------------------------------------------------------------------ */

const N = WHY_CARDS.length;
const STEP = 6.4;
const M = 22;
const LEAD_S = 16;
const GAP_S = 16;
const TAIL_S = 13;
const AHEAD = 8;
const FLOOR_Y = -4.6;
const COL_STEP = 6; // structural bay spacing

const CURVE = (() => {
  const pts: THREE.Vector3[] = [];
  for (let k = 0; k <= M; k += 1) {
    const x = 8.6 * Math.sin(k * 0.44) + 2.4 * Math.sin(k * 1.0 + 0.6);
    const y = 0.5 * Math.sin(k * 0.7 + 0.5);
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
function place(f: Frame, lx: number, ly: number, lz: number): [number, number, number] {
  return [f.pos.x + f.right.x * lx + f.fwd.x * lz, FLOOR_Y + ly, f.pos.z + f.right.z * lx + f.fwd.z * lz];
}

// the building's section — ceiling height and half-width change per space
const CEIL = [12, 8, 24, 11, 17, 20];
const WID = [5.6, 3.9, 9.6, 5.2, 6.6, 8.4];
function profileAt(s: number) {
  const x = (s - stationS(0)) / GAP_S;
  const i0 = clamp(Math.floor(x), 0, N - 2);
  const t = clamp(x - i0, 0, 1);
  const tt = t * t * (3 - 2 * t);
  return {
    ceil: THREE.MathUtils.lerp(CEIL[i0], CEIL[i0 + 1], tt),
    wid: THREE.MathUtils.lerp(WID[i0], WID[i0 + 1], tt),
  };
}

/* ------------------------------ materials ------------------------------ */
const stoneWhite = new THREE.MeshStandardMaterial({ color: 0xcfd1d4, roughness: 0.85, metalness: 0.02 });
const stoneDark = new THREE.MeshStandardMaterial({ color: 0x0d0e11, roughness: 0.35, metalness: 0.3 });
const aluminium = new THREE.MeshStandardMaterial({ color: 0x9aa0a8, roughness: 0.4, metalness: 0.6 });
const lightMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.95, 0.86), toneMapped: false });

const glassVert = /* glsl */ `
  varying vec3 vN; varying vec3 vV; varying float vFade;
  void main(){ vec4 mv=modelViewMatrix*vec4(position,1.0); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz);
    vFade=(1.0-smoothstep(50.0,84.0,-mv.z))*smoothstep(-2.0,3.0,-mv.z); gl_Position=projectionMatrix*mv; }
`;
const glassFrag = /* glsl */ `
  precision mediump float; varying vec3 vN; varying vec3 vV; varying float vFade;
  void main(){ float f=pow(1.0-max(dot(normalize(vN),normalize(vV)),0.0),2.3);
    vec3 col=mix(vec3(0.10,0.13,0.18), vec3(0.82,0.9,1.0), f);
    gl_FragColor=vec4(col,(0.05+0.5*f)*vFade); }
`;
const glass = new THREE.ShaderMaterial({ vertexShader: glassVert, fragmentShader: glassFrag, transparent: true, depthWrite: false, side: THREE.DoubleSide });

const shaftMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  uniforms: { uColor: { value: new THREE.Color(0.82, 0.9, 1.0) } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader: `precision mediump float; uniform vec3 uColor; varying vec2 vUv;
    void main(){ float x=1.0-abs(vUv.x-0.5)*2.0; float y=smoothstep(1.0,0.45,vUv.y);
      gl_FragColor=vec4(uColor, pow(x,1.7)*y*0.12); }`,
});

const CYL = new THREE.CylinderGeometry(0.26, 0.32, 1, 20);
const BOX = new THREE.BoxGeometry(1, 1, 1);
const PLANE = new THREE.PlaneGeometry(1, 1);

const HUES: [number, number, number][] = [
  [0.62, 0.74, 1.0], [0.86, 0.92, 1.0], [0.7, 0.82, 1.0], [0.9, 0.96, 1.0], [0.78, 0.86, 1.0], [1.0, 0.86, 0.62],
];
const hueOf = (i: number) => new THREE.Color(...HUES[((i % HUES.length) + HUES.length) % HUES.length]);

/* --------------------------- the architecture --------------------------- */
type Box = { pos: [number, number, number]; scale: [number, number, number]; rotY: number; mat: THREE.Material };
type Col = { pos: [number, number, number]; h: number; rotY: number };
type Shaft = { pos: [number, number, number]; scale: [number, number]; rotY: number };

function Building() {
  const { columns, boxes, glasses, strips, shafts } = useMemo(() => {
    const columns: Col[] = [];
    const boxes: Box[] = [];
    const glasses: Box[] = [];
    const strips: Box[] = [];
    const shafts: Shaft[] = [];
    let bay = 0;
    for (let s = 2; s < cameraMaxS + 12; s += COL_STEP, bay += 1) {
      const f = frameAt(s);
      const { ceil, wid } = profileAt(s);
      const h = f.heading;
      // structural columns, floor to ceiling, both sides
      columns.push({ pos: place(f, -wid, ceil / 2, 0), h: ceil, rotY: h });
      columns.push({ pos: place(f, wid, ceil / 2, 0), h: ceil, rotY: h });
      // integrated floor light lines running the colonnade
      strips.push({ pos: place(f, -wid + 0.25, 0.05, 0), scale: [0.1, 0.1, COL_STEP], rotY: h, mat: lightMat });
      strips.push({ pos: place(f, wid - 0.25, 0.05, 0), scale: [0.1, 0.1, COL_STEP], rotY: h, mat: lightMat });
      // continuous roof carried by the columns, with skylight slots
      const sky = bay % 3 === 2;
      if (!sky) {
        boxes.push({ pos: place(f, 0, ceil + 0.3, 0), scale: [wid * 2 + 1.4, 0.6, COL_STEP + 0.2], rotY: h, mat: stoneWhite });
      } else {
        boxes.push({ pos: place(f, -wid * 0.62, ceil + 0.3, 0), scale: [wid * 0.9, 0.6, COL_STEP + 0.2], rotY: h, mat: stoneWhite });
        boxes.push({ pos: place(f, wid * 0.62, ceil + 0.3, 0), scale: [wid * 0.9, 0.6, COL_STEP + 0.2], rotY: h, mat: stoneWhite });
        shafts.push({ pos: place(f, 0, ceil * 0.52, 0), scale: [wid * 1.0, ceil * 1.05], rotY: h });
      }
      // roof-cove light lines
      strips.push({ pos: place(f, -wid + 0.4, ceil - 0.2, 0), scale: [0.1, 0.1, COL_STEP], rotY: h, mat: lightMat });
      strips.push({ pos: place(f, wid - 0.4, ceil - 0.2, 0), scale: [0.1, 0.1, COL_STEP], rotY: h, mat: lightMat });
      // floor-to-ceiling glass curtain wall behind the columns
      if (bay % 2 === 0) {
        glasses.push({ pos: place(f, -wid - 0.55, ceil / 2, 0), scale: [0.12, ceil, COL_STEP], rotY: h, mat: glass });
        glasses.push({ pos: place(f, wid + 0.55, ceil / 2, 0), scale: [0.12, ceil, COL_STEP], rotY: h, mat: glass });
      }
    }
    return { columns, boxes, glasses, strips, shafts };
  }, []);

  return (
    <group>
      {columns.map((c, k) => (
        <mesh key={`c${k}`} geometry={CYL} material={stoneWhite} position={c.pos} rotation={[0, c.rotY, 0]} scale={[1, c.h, 1]} />
      ))}
      {boxes.map((b, k) => (
        <mesh key={`b${k}`} geometry={BOX} material={b.mat} position={b.pos} rotation={[0, b.rotY, 0]} scale={b.scale} />
      ))}
      {glasses.map((b, k) => (
        <mesh key={`g${k}`} geometry={BOX} material={b.mat} position={b.pos} rotation={[0, b.rotY, 0]} scale={b.scale} />
      ))}
      {strips.map((b, k) => (
        <mesh key={`s${k}`} geometry={BOX} material={b.mat} position={b.pos} rotation={[0, b.rotY, 0]} scale={b.scale} />
      ))}
      {shafts.map((sh, k) => (
        <mesh key={`sh${k}`} geometry={PLANE} material={shaftMat} position={sh.pos} rotation={[0, sh.rotY, 0]} scale={[sh.scale[0], sh.scale[1], 1]} />
      ))}
    </group>
  );
}

/* reflecting pools set into the floor at the grand halls */
function Pools() {
  const pools = useMemo(() => [2, 3].map((i) => ({ f: frameAt(stationS(i) + 2), i })), []);
  const poolMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0x05070c, roughness: 0.06, metalness: 0.9 }),
    []
  );
  return (
    <group>
      {pools.map(({ f, i }, k) => {
        const { wid } = profileAt(stationS(i));
        return (
          <group key={k}>
            <mesh geometry={PLANE} material={poolMat} rotation={[-Math.PI / 2, 0, f.heading]} position={place(f, 0, 0.02, 0)} scale={[wid * 1.2, 10, 1]} />
            <mesh geometry={BOX} material={aluminium} position={place(f, wid * 0.62, 0.12, 0)} rotation={[0, f.heading, 0]} scale={[0.2, 0.24, 10]} />
            <mesh geometry={BOX} material={aluminium} position={place(f, -wid * 0.62, 0.12, 0)} rotation={[0, f.heading, 0]} scale={[0.2, 0.24, 10]} />
          </group>
        );
      })}
    </group>
  );
}

/* ------------------------------ lighting ------------------------------ */
type Shared = { glow: { current: number }; tint: { current: THREE.Color }; pool: { current: THREE.Vector2 }; active: { current: THREE.Vector3 } };

function AccentLight({ shared }: { shared: Shared }) {
  const light = useRef<THREE.PointLight>(null);
  const v = useRef(new THREE.Vector3());
  useFrame(() => {
    const l = light.current;
    if (!l) return;
    v.current.set(shared.active.current.x, 7, shared.active.current.z);
    l.position.lerp(v.current, 0.08);
    l.color.lerp(shared.tint.current, 0.06);
    l.intensity += (40 + shared.glow.current * 120 - l.intensity) * 0.08;
  });
  return <pointLight ref={light} distance={52} decay={1.3} />;
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
    camera.position.set(f.pos.x + mouse.current.x * 0.4, f.pos.y + 0.7 + mouse.current.y * 0.25 + Math.sin(t * 0.06) * 0.08, f.pos.z);
    camera.lookAt(ahead.pos.x, ahead.pos.y + 1.6, ahead.pos.z);
    const turn = f.fwd.x * ahead.fwd.z - f.fwd.z * ahead.fwd.x;
    const bankTarget = clamp(turn * 3.0, -0.04, 0.04);
    bank.current += (bankTarget - bank.current) * Math.min(1, delta * 1.5);
    camera.rotateZ(bank.current);
  });
  return null;
}

const floorVert = /* glsl */ `
  varying vec3 vWorld; varying float vDepth;
  void main(){ vec4 w=modelMatrix*vec4(position,1.0); vWorld=w.xyz; vec4 mv=viewMatrix*w; vDepth=-mv.z; gl_Position=projectionMatrix*mv; }
`;
const floorFrag = /* glsl */ `
  precision mediump float; uniform vec2 uPool; uniform vec3 uTint; uniform float uGlow; varying vec3 vWorld; varying float vDepth;
  void main(){
    float dist=length(vWorld.xz-uPool);
    float pool=smoothstep(16.0,0.0,dist)*uGlow;
    float depthFade=1.0-smoothstep(34.0,80.0,vDepth);
    vec3 base=vec3(0.012,0.014,0.02);
    vec3 col=base + (uTint*0.14 + vec3(0.02,0.026,0.045))*pool*depthFade;
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
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y, -60]} material={mat}>
      <planeGeometry args={[90, 220]} />
    </mesh>
  );
}

function Motes() {
  const geo = useMemo(() => {
    const n = 90;
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 3);
    const seed = new Float32Array(n);
    for (let i = 0; i < n; i += 1) {
      pos[i * 3] = (Math.random() - 0.5) * 26;
      pos[i * 3 + 1] = -3.6 + Math.random() * 22;
      pos[i * 3 + 2] = Math.random() * 140 - 134;
      seed[i] = Math.random();
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    return g;
  }, []);
  const mat = useMemo(
    () => new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uTime: { value: 0 } },
      vertexShader: `attribute float aSeed; varying float vA; uniform float uTime;
        void main(){ vec3 p=position; p.z=mod(position.z+uTime*0.9+aSeed*140.0,140.0)-134.0; vec4 mv=modelViewMatrix*vec4(p,1.0);
          gl_Position=projectionMatrix*mv; float d=-mv.z; gl_PointSize=(10.0*aSeed+3.0)*(6.0/d); vA=(1.0-smoothstep(44.0,74.0,d))*smoothstep(0.0,5.0,d); }`,
      fragmentShader: `precision mediump float; varying float vA; void main(){ float d=length(gl_PointCoord-0.5); float a=smoothstep(0.5,0.0,d)*vA*0.3; if(a<0.01)discard; gl_FragColor=vec4(0.86,0.9,1.0,a); }`,
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
        camera={{ position: [0, 0.7, 2], fov: 50 }}
        frameloop={active ? "always" : "never"}
        eventSource={eventSource as unknown as RefObject<HTMLElement>}
        eventPrefix="client"
        onCreated={({ scene }) => {
          scene.fog = new THREE.FogExp2(0x000000, 0.026);
        }}
      >
        <ambientLight intensity={0.22} />
        <hemisphereLight args={[0x8090a8, 0x06070b, 0.42]} />
        <directionalLight position={[10, 30, 8]} intensity={0.55} color={0xe6ecf6} />
        <AccentLight shared={shared} />
        <Floor shared={shared} />
        <Building />
        <Pools />
        <Motes />
        <Rig scroll={scroll} />
        <StationDrivers scroll={scroll} shared={shared} />
      </Canvas>
    </div>
  );
}
