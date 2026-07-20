"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { WHY_CARDS } from "@/lib/data";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useIsMobile } from "@/hooks/useMediaQuery";

/* ------------------------------------------------------------------ *
 * The Light Corridor — a curving architectural route.
 *
 * The visitor floats along the centre-line of a corridor that bends,
 * widens and narrows through an infinite black volume. Monumental glass
 * pillars follow the path; between installations the way is intimate and
 * turns away so you cannot see what is ahead, then it opens into a wider
 * space as the camera rounds the corner and an exhibit is revealed. The
 * architecture itself carries the journey.
 * ------------------------------------------------------------------ */

const N = WHY_CARDS.length;
const STEP = 6;
const M = 18;
const LEAD_S = 15; // arc distance before the first installation
const GAP_S = 15; // arc distance between installations
const TAIL_S = 11;
const AHEAD = 8; // how far along the path the camera looks
const FLOOR_Y = -4.2;
const PILLAR_H = 15;
const NARROW = 3.1;
const WIDE = 7.8;

// the meandering centre-line — gentle, deliberate, never sharp
const CURVE = (() => {
  const pts: THREE.Vector3[] = [];
  for (let k = 0; k <= M; k += 1) {
    const x = 7.6 * Math.sin(k * 0.52) + 3.4 * Math.sin(k * 1.23 + 1.1);
    const y = 0.7 * Math.sin(k * 0.8 + 0.5);
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
/** how present installation i is for camera progress p (0..1). */
export const stationReveal = (p: number, i: number) => {
  const d = stationS(i) - cameraS(p); // >0 ahead, 0 at the gate
  return smoothstep(13, 6, d) * smoothstep(0.4, 3.4, d);
};

const UP = new THREE.Vector3(0, 1, 0);
const _pos = new THREE.Vector3();
const _tan = new THREE.Vector3();
function frameAt(s: number, outPos: THREE.Vector3, outRight: THREE.Vector3) {
  const u = clamp(s / CURVE_L, 0, 1);
  CURVE.getPointAt(u, outPos);
  CURVE.getTangentAt(u, _tan).normalize();
  outRight.crossVectors(UP, _tan).normalize();
  return _tan;
}
const widthAt = (s: number) => {
  let m = 1e9;
  for (let i = 0; i < N; i += 1) m = Math.min(m, Math.abs(s - stationS(i)));
  return NARROW + (WIDE - NARROW) * smoothstep(7, 2, m);
};

const HUES: [number, number, number][] = [
  [0.66, 0.76, 0.98],
  [0.9, 0.94, 1.0],
  [0.72, 0.82, 1.0],
  [0.98, 0.95, 0.9],
  [0.7, 0.8, 1.0],
  [0.86, 0.9, 1.0],
];
const hueOf = (i: number) => HUES[((i % HUES.length) + HUES.length) % HUES.length];

/* ---------------------------- glass pillar ---------------------------- */
const pillarVert = /* glsl */ `
  varying vec3 vN;
  varying vec3 vV;
  varying float vFade;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    float top = 1.0 - smoothstep(2.0, 7.4, position.y);
    float depth = 1.0 - smoothstep(30.0, 52.0, -mv.z);
    float near = smoothstep(-2.0, 3.0, -mv.z);
    vFade = top * depth * near;
    gl_Position = projectionMatrix * mv;
  }
`;
const pillarFrag = /* glsl */ `
  precision mediump float;
  uniform vec3 uEdge;
  uniform vec3 uBody;
  uniform float uOpacity;
  uniform float uGlow;
  varying vec3 vN;
  varying vec3 vV;
  varying float vFade;
  void main() {
    float fres = pow(1.0 - max(dot(normalize(vN), normalize(vV)), 0.0), 2.6);
    vec3 col = mix(uBody, uEdge, fres) + uEdge * uGlow * 0.35;
    float a = (uOpacity * (0.04 + 0.96 * fres) + uGlow * 0.12) * vFade;
    gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
  }
`;
function makePillarMaterial(edge: THREE.Color, opacity: number) {
  return new THREE.ShaderMaterial({
    vertexShader: pillarVert,
    fragmentShader: pillarFrag,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
    uniforms: {
      uEdge: { value: edge.clone() },
      uBody: { value: edge.clone().multiplyScalar(0.42) },
      uOpacity: { value: opacity },
      uGlow: { value: 0 },
    },
  });
}
const pillarGeo = new THREE.BoxGeometry(0.55, PILLAR_H, 0.55);

const haloVert = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const haloFrag = /* glsl */ `
  precision mediump float;
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float a = pow(smoothstep(1.0, 0.0, d), 1.8);
    gl_FragColor = vec4(uColor, a * uOpacity);
  }
`;

type Shared = {
  glow: { current: number };
  tint: { current: THREE.Color };
  pool: { current: THREE.Vector2 };
};

function Rig({ scroll }: { scroll?: { get: () => number } }) {
  const { camera } = useThree();
  const eased = useRef(0);
  const bank = useRef(0);
  const mouse = useRef(new THREE.Vector2());
  const p0 = useRef(new THREE.Vector3());
  const p1 = useRef(new THREE.Vector3());
  const r0 = useRef(new THREE.Vector3());
  useFrame((state, delta) => {
    const target = scroll ? scroll.get() : 0;
    eased.current += (target - eased.current) * Math.min(1, delta * 2.0); // slow inertia
    const s = cameraS(eased.current);
    const t = state.clock.elapsedTime;
    mouse.current.x += (state.pointer.x - mouse.current.x) * Math.min(1, delta * 1.5);
    mouse.current.y += (state.pointer.y - mouse.current.y) * Math.min(1, delta * 1.5);

    const tan = frameAt(s, p0.current, r0.current);
    frameAt(s + AHEAD, p1.current, r0.current);
    camera.position.set(
      p0.current.x + mouse.current.x * 0.4,
      p0.current.y + 0.4 + mouse.current.y * 0.2 + Math.sin(t * 0.07) * 0.1,
      p0.current.z
    );
    camera.lookAt(p1.current.x, p1.current.y + 0.6, p1.current.z);

    // subtle banking that follows the direction of travel
    frameAt(s + 3.5, p1.current, r0.current);
    const turn = tan.x * r0.current.z - tan.z * r0.current.x;
    const bankTarget = clamp(turn * 4.0, -0.05, 0.05);
    bank.current += (bankTarget - bank.current) * Math.min(1, delta * 1.5);
    camera.rotateZ(bank.current);
  });
  return null;
}

function Colonnade() {
  const items = useMemo(() => {
    const arr: { p: [number, number, number] }[] = [];
    const pos = new THREE.Vector3();
    const right = new THREE.Vector3();
    for (let s = 3; s < cameraMaxS + 10; s += 2.6) {
      frameAt(s, pos, right);
      const w = widthAt(s);
      arr.push({ p: [pos.x + right.x * w, FLOOR_Y + PILLAR_H / 2, pos.z + right.z * w] });
      arr.push({ p: [pos.x - right.x * w, FLOOR_Y + PILLAR_H / 2, pos.z - right.z * w] });
    }
    return arr;
  }, []);
  const mat = useMemo(() => makePillarMaterial(new THREE.Color(0.7, 0.78, 0.95), 0.1), []);
  return (
    <group>
      {items.map((it, k) => (
        <mesh key={k} geometry={pillarGeo} material={mat} position={it.p} />
      ))}
    </group>
  );
}

function Stations({ scroll, shared }: { scroll?: { get: () => number }; shared: Shared }) {
  const lefts = useRef<(THREE.Mesh | null)[]>([]);
  const rights = useRef<(THREE.Mesh | null)[]>([]);
  const halos = useRef<(THREE.Mesh | null)[]>([]);
  const { camera } = useThree();

  const stations = useMemo(() => {
    const pos = new THREE.Vector3();
    const right = new THREE.Vector3();
    return Array.from({ length: N }, (_, i) => {
      frameAt(stationS(i), pos, right);
      const edge = new THREE.Color(...hueOf(i));
      return {
        i,
        pos: pos.clone(),
        right: right.clone(),
        lm: makePillarMaterial(edge, 0.5),
        rm: makePillarMaterial(edge, 0.5),
        halo: new THREE.ShaderMaterial({
          vertexShader: haloVert,
          fragmentShader: haloFrag,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          uniforms: { uColor: { value: edge.clone() }, uOpacity: { value: 0 } },
        }),
      };
    });
  }, []);

  const haloGeo = useMemo(() => new THREE.PlaneGeometry(15, 12), []);
  const py = FLOOR_Y + PILLAR_H / 2;

  useFrame(() => {
    const p = scroll ? scroll.get() : 0;
    let maxGlow = 0;
    let active = 0;
    for (let i = 0; i < stations.length; i += 1) {
      const st = stations[i];
      const d = stationS(i) - cameraS(p);
      const reveal = stationReveal(p, i);
      const open = 1.8 + smoothstep(13, 5, d) * 4.6;
      if (reveal > maxGlow) {
        maxGlow = reveal;
        active = i;
      }
      const l = lefts.current[i];
      const r = rights.current[i];
      if (l) l.position.set(st.pos.x - st.right.x * open, py, st.pos.z - st.right.z * open);
      if (r) r.position.set(st.pos.x + st.right.x * open, py, st.pos.z + st.right.z * open);
      st.lm.uniforms.uGlow.value = reveal;
      st.rm.uniforms.uGlow.value = reveal;
      st.halo.uniforms.uOpacity.value = reveal * 0.32;
      const h = halos.current[i];
      if (h) h.lookAt(camera.position);
    }
    shared.glow.current = maxGlow;
    shared.tint.current.setRGB(...hueOf(active));
    shared.pool.current.set(stations[active].pos.x, stations[active].pos.z);
  });

  return (
    <group>
      {stations.map((st) => (
        <group key={st.i}>
          <mesh
            ref={(el) => {
              halos.current[st.i] = el;
            }}
            geometry={haloGeo}
            material={st.halo}
            position={[st.pos.x, py - 1.5, st.pos.z]}
          />
          <mesh
            ref={(el) => {
              lefts.current[st.i] = el;
            }}
            geometry={pillarGeo}
            material={st.lm}
            position={[st.pos.x, py, st.pos.z]}
          />
          <mesh
            ref={(el) => {
              rights.current[st.i] = el;
            }}
            geometry={pillarGeo}
            material={st.rm}
            position={[st.pos.x, py, st.pos.z]}
          />
        </group>
      ))}
    </group>
  );
}

const energyVert = /* glsl */ `
  attribute float aSeed;
  varying float vA;
  uniform float uTime;
  void main() {
    vec3 pos = position;
    pos.z = mod(position.z + uTime * 1.3 + aSeed * 108.0, 108.0) - 102.0;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    float depth = -mv.z;
    gl_PointSize = (16.0 * aSeed + 5.0) * (6.0 / depth);
    vA = (1.0 - smoothstep(30.0, 52.0, depth)) * smoothstep(0.0, 4.0, depth);
  }
`;
const energyFrag = /* glsl */ `
  precision mediump float;
  varying float vA;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d) * vA * 0.5;
    if (a < 0.01) discard;
    gl_FragColor = vec4(0.82, 0.88, 1.0, a);
  }
`;
function Energy() {
  const geo = useMemo(() => {
    const n = 170;
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 3);
    const seed = new Float32Array(n);
    for (let i = 0; i < n; i += 1) {
      pos[i * 3] = (Math.random() - 0.5) * 22;
      pos[i * 3 + 1] = -3.4 + Math.random() * 11;
      pos[i * 3 + 2] = Math.random() * 108 - 102;
      seed[i] = Math.random();
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    return g;
  }, []);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: energyVert,
        fragmentShader: energyFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 } },
      }),
    []
  );
  useFrame((state) => {
    mat.uniforms.uTime.value = state.clock.elapsedTime;
  });
  return <points geometry={geo} material={mat} />;
}

const floorVert = /* glsl */ `
  varying vec3 vWorld;
  varying float vDepth;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vec4 mv = viewMatrix * world;
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;
const floorFrag = /* glsl */ `
  precision mediump float;
  uniform vec2 uPool;
  uniform vec3 uTint;
  uniform float uGlow;
  varying vec3 vWorld;
  varying float vDepth;
  void main() {
    float dist = length(vWorld.xz - uPool);
    float pool = smoothstep(11.0, 0.0, dist) * uGlow;
    float depthFade = 1.0 - smoothstep(24.0, 60.0, vDepth);
    vec3 base = vec3(0.005, 0.007, 0.013);
    vec3 col = base + (uTint * 0.16 * pool + vec3(0.02, 0.028, 0.05) * pool) * depthFade;
    gl_FragColor = vec4(col, 1.0);
  }
`;
function Floor({ shared }: { shared: Shared }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: floorVert,
        fragmentShader: floorFrag,
        uniforms: {
          uPool: { value: new THREE.Vector2() },
          uTint: { value: new THREE.Color(0.7, 0.8, 1.0) },
          uGlow: { value: 0 },
        },
      }),
    []
  );
  useFrame(() => {
    const u = mat.uniforms;
    (u.uPool.value as THREE.Vector2).lerp(shared.pool.current, 0.08);
    u.uGlow.value += (shared.glow.current - u.uGlow.value) * 0.1;
    (u.uTint.value as THREE.Color).lerp(shared.tint.current, 0.05);
  });
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y, -48]} material={mat}>
      <planeGeometry args={[60, 160]} />
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
        dpr={reduced ? 1 : [1, mobile ? 1.4 : 1.8]}
        camera={{ position: [0, 0.4, 2], fov: 46 }}
        frameloop={active ? "always" : "never"}
        eventSource={eventSource as unknown as RefObject<HTMLElement>}
        eventPrefix="client"
        onCreated={({ scene }) => {
          scene.fog = new THREE.FogExp2(0x000000, 0.038);
        }}
      >
        <Rig scroll={scroll} />
        <Floor shared={shared} />
        <Colonnade />
        <Stations scroll={scroll} shared={shared} />
        <Energy />
      </Canvas>
    </div>
  );
}
