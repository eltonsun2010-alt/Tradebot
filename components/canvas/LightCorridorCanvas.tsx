"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useIsMobile } from "@/hooks/useMediaQuery";

/* ------------------------------------------------------------------ *
 * The Light Corridor — an architectural installation the visitor floats
 * through. Monumental glass pillars rise from a dark reflective floor in
 * an infinite black volume. As the camera glides forward, the pillars at
 * each station part to present a service, the surrounding architecture
 * takes on that service's colour of light, and a river of light energy
 * drifts through the whole space. The architecture itself is the story.
 * ------------------------------------------------------------------ */

export const COR = {
  GAP: 8.5, // world units between installations — generous negative space
  LEAD: 9, // empty corridor before the first
  START: 6, // camera start z
  TRAVEL: 56, // total camera travel
  VIEW_AHEAD: 8.5, // how far ahead a station sits when it is centred
  FLOOR_Y: -4.2,
  PILLAR_H: 15,
};
export const stationZ = (i: number) => -(COR.LEAD + i * COR.GAP);
export const cameraZ = (p: number) => COR.START - p * COR.TRAVEL;
/** signed approach of station i for camera progress p (0 = centred). */
export const stationRel = (p: number, i: number) => cameraZ(p) - (stationZ(i) + COR.VIEW_AHEAD);

// each installation gives the architecture its own restrained colour of light
const HUES: [number, number, number][] = [
  [0.66, 0.76, 0.98],
  [0.9, 0.94, 1.0],
  [0.72, 0.82, 1.0],
  [0.98, 0.95, 0.9],
  [0.7, 0.8, 1.0],
  [0.86, 0.9, 1.0],
];
const hueOf = (i: number) => HUES[((i % HUES.length) + HUES.length) % HUES.length];

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/* ---------------------------- glass pillar ---------------------------- */
const pillarVert = /* glsl */ `
  varying vec3 vN;
  varying vec3 vV;
  varying float vFade;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    float top = 1.0 - smoothstep(2.0, 7.4, position.y);   // dissolve upward
    float depth = 1.0 - smoothstep(34.0, 58.0, -mv.z);    // recede into black
    float near = smoothstep(-2.0, 3.0, -mv.z);            // clear the lens
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

const pillarGeo = new THREE.BoxGeometry(0.55, COR.PILLAR_H, 0.55);
const slabGeo = new THREE.BoxGeometry(0.9, COR.PILLAR_H + 3, 0.9);

// a soft radial halo of light for the active installation (not a flat slab)
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

function Rig({ scroll }: { scroll?: { get: () => number } }) {
  const { camera } = useThree();
  const eased = useRef(0);
  const mouse = useRef(new THREE.Vector2());
  useFrame((state, delta) => {
    const target = scroll ? scroll.get() : 0;
    eased.current += (target - eased.current) * Math.min(1, delta * 2.2); // slow inertia
    const p = eased.current;
    const t = state.clock.elapsedTime;
    mouse.current.x += (state.pointer.x - mouse.current.x) * Math.min(1, delta * 1.6);
    mouse.current.y += (state.pointer.y - mouse.current.y) * Math.min(1, delta * 1.6);
    camera.position.z = cameraZ(p);
    camera.position.x = mouse.current.x * 0.5 + Math.sin(t * 0.09) * 0.25;
    camera.position.y = 0.3 + mouse.current.y * 0.25 + Math.sin(t * 0.07) * 0.12;
    camera.lookAt(Math.sin(t * 0.05) * 0.3, 0.6, camera.position.z - 12);
  });
  return null;
}

/* ---------------------- monumental colonnade ---------------------- */
function Colonnade() {
  const items = useMemo(() => {
    const arr: { x: number; z: number; s: number }[] = [];
    const zEnd = stationZ(HUES.length) - 6;
    for (let z = COR.START - 4; z > zEnd; z -= 4.7) {
      const jitter = ((z * 13.13) % 1) * 0.8;
      arr.push({ x: 8.6 + jitter, z, s: 1 });
      arr.push({ x: -8.6 - jitter, z, s: 1 });
    }
    return arr;
  }, []);
  const mat = useMemo(() => makePillarMaterial(new THREE.Color(0.7, 0.78, 0.95), 0.1), []);
  return (
    <group>
      {items.map((it, k) => (
        <mesh key={k} geometry={slabGeo} material={mat} position={[it.x, COR.FLOOR_Y + (COR.PILLAR_H + 3) / 2, it.z]} />
      ))}
    </group>
  );
}

/* ---------------------- reactive station gates ---------------------- */
function Stations({
  count,
  scroll,
  glowRef,
  tintRef,
}: {
  count: number;
  scroll?: { get: () => number };
  glowRef: { current: number };
  tintRef: { current: THREE.Color };
}) {
  const groups = useRef<(THREE.Group | null)[]>([]);
  const glows = useRef<(THREE.Mesh | null)[]>([]);
  const leftMat = useRef<THREE.ShaderMaterial[]>([]);
  const rightMat = useRef<THREE.ShaderMaterial[]>([]);

  const stations = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const edge = new THREE.Color(...hueOf(i));
      const lm = makePillarMaterial(edge, 0.5);
      const rm = makePillarMaterial(edge, 0.5);
      leftMat.current[i] = lm;
      rightMat.current[i] = rm;
      const glowMat = new THREE.ShaderMaterial({
        vertexShader: haloVert,
        fragmentShader: haloFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uColor: { value: edge.clone() }, uOpacity: { value: 0 } },
      });
      return { i, z: stationZ(i), lm, rm, glowMat };
    });
  }, [count]);

  const glowGeo = useMemo(() => new THREE.PlaneGeometry(15, 12), []);

  useFrame(() => {
    const p = scroll ? scroll.get() : 0;
    let maxGlow = 0;
    let activeI = 0;
    for (let i = 0; i < stations.length; i += 1) {
      const rel = stationRel(p, i);
      const sep = smoothstep(-11, -1.5, rel);
      const open = 1.6 + sep * 4.2; // pillars part to present the service
      const glow = smoothstep(-8, -2, rel) * (1 - smoothstep(1.5, 4.5, rel));
      if (glow > maxGlow) {
        maxGlow = glow;
        activeI = i;
      }
      const g = groups.current[i];
      if (g) {
        const l = g.children[0] as THREE.Mesh;
        const r = g.children[1] as THREE.Mesh;
        l.position.x = -open;
        r.position.x = open;
      }
      leftMat.current[i].uniforms.uGlow.value = glow;
      rightMat.current[i].uniforms.uGlow.value = glow;
      const gm = glows.current[i];
      if (gm) (gm.material as THREE.ShaderMaterial).uniforms.uOpacity.value = glow * 0.32;
    }
    glowRef.current = maxGlow;
    tintRef.current.setRGB(...hueOf(activeI));
  });

  return (
    <group>
      {stations.map((st) => (
        <group key={st.i}>
          <mesh
            ref={(el) => {
              glows.current[st.i] = el;
            }}
            geometry={glowGeo}
            material={st.glowMat}
            position={[0, 1.4, st.z - 2.4]}
          />
          <group
            ref={(el) => {
              groups.current[st.i] = el;
            }}
            position={[0, 0, st.z]}
          >
            <mesh geometry={pillarGeo} material={st.lm} position={[-1.6, COR.FLOOR_Y + COR.PILLAR_H / 2, 0]} />
            <mesh geometry={pillarGeo} material={st.rm} position={[1.6, COR.FLOOR_Y + COR.PILLAR_H / 2, 0]} />
          </group>
        </group>
      ))}
    </group>
  );
}

/* ---------------------- flowing light energy ---------------------- */
const energyVert = /* glsl */ `
  attribute float aSeed;
  varying float vA;
  uniform float uTime;
  void main() {
    vec3 pos = position;
    pos.z = mod(position.z + uTime * 1.4 + aSeed * 52.0, 52.0) - 46.0;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    float depth = -mv.z;
    gl_PointSize = (18.0 * aSeed + 6.0) * (6.0 / depth);
    vA = (1.0 - smoothstep(34.0, 55.0, depth)) * smoothstep(0.0, 4.0, depth);
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
  const ref = useRef<THREE.ShaderMaterial>(null);
  const geo = useMemo(() => {
    const n = 150;
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 3);
    const seed = new Float32Array(n);
    for (let i = 0; i < n; i += 1) {
      pos[i * 3] = (Math.random() - 0.5) * 15;
      pos[i * 3 + 1] = -3.4 + Math.random() * 10;
      pos[i * 3 + 2] = Math.random() * 52 - 46;
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
    if (ref.current) ref.current.uniforms.uTime.value = state.clock.elapsedTime;
  });
  return <points geometry={geo} material={mat} />;
}

/* a dark, polished floor that catches the corridor's light down its centre
 * and, near the active installation, pools a soft reflection of its glow */
const floorVert = /* glsl */ `
  varying vec2 vUv;
  varying float vDepth;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;
const floorFrag = /* glsl */ `
  precision mediump float;
  uniform float uGlow;
  uniform vec3 uTint;
  varying vec2 vUv;
  varying float vDepth;
  void main() {
    float centre = 1.0 - min(abs(vUv.x - 0.5) * 2.0, 1.0);
    float sheen = pow(centre, 2.4);
    float depthFade = 1.0 - smoothstep(22.0, 60.0, vDepth);
    float near = smoothstep(0.0, 7.0, vDepth);
    vec3 base = vec3(0.005, 0.007, 0.013);
    vec3 col = base + (vec3(0.035, 0.048, 0.085) + uTint * 0.22 * uGlow) * sheen * depthFade * near;
    gl_FragColor = vec4(col, 1.0);
  }
`;
function Floor({ glowRef, tintRef }: { glowRef: { current: number }; tintRef: { current: THREE.Color } }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: floorVert,
        fragmentShader: floorFrag,
        uniforms: { uGlow: { value: 0 }, uTint: { value: new THREE.Color(0.7, 0.8, 1.0) } },
      }),
    []
  );
  useFrame(() => {
    mat.uniforms.uGlow.value += (glowRef.current - mat.uniforms.uGlow.value) * 0.12;
    (mat.uniforms.uTint.value as THREE.Color).lerp(tintRef.current, 0.06);
  });
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, COR.FLOOR_Y, -20]} material={mat}>
      <planeGeometry args={[90, 150]} />
    </mesh>
  );
}

export default function LightCorridorCanvas({
  eventSource,
  scroll,
  count,
}: {
  eventSource: RefObject<HTMLElement | null>;
  scroll?: { get: () => number };
  count: number;
}) {
  const reduced = usePrefersReducedMotion();
  const mobile = useIsMobile();
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const active = !reduced && visible;
  const floorGlow = useRef(0);
  const floorTint = useRef(new THREE.Color(0.7, 0.8, 1.0));

  return (
    <div ref={ref} className="absolute inset-0">
      <Canvas
        className="!absolute inset-0"
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        dpr={reduced ? 1 : [1, mobile ? 1.4 : 1.8]}
        camera={{ position: [0, 0.3, COR.START], fov: 42 }}
        frameloop={active ? "always" : "never"}
        eventSource={eventSource as unknown as RefObject<HTMLElement>}
        eventPrefix="client"
        onCreated={({ scene }) => {
          scene.fog = new THREE.FogExp2(0x000000, 0.03);
        }}
      >
        <Rig scroll={scroll} />
        <Floor glowRef={floorGlow} tintRef={floorTint} />
        <Colonnade />
        <Stations count={count} scroll={scroll} glowRef={floorGlow} tintRef={floorTint} />
        <Energy />
      </Canvas>
    </div>
  );
}
