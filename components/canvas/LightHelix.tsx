"use client";

import { useMemo, useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* ------------------------------------------------------------------ *
 * The Light Helix — a tall glowing double-helix standing in front of
 * the camera. The service cards are parented to this same group, mounted
 * on the spiral. As you scroll the whole structure ROTATES about its
 * vertical axis and DRIFTS downward, so every card orbits along the
 * glowing spiral path — travelling through the scene as one connected
 * 3D system, each one swinging to the front to be read, then continuing
 * round and away as the next arrives.
 * ------------------------------------------------------------------ */

export const HELIX = {
  N: 5, // number of cards / landmarks
  DELTA: 1.15, // angle (rad) between cards — kept so all N sweep < one full turn
  PITCH: 0.62, // vertical drop per radian of twist
  R_CARD: 2.15, // radius of the card orbit
  R_STRAND: 1.95, // radius of the glowing strands (just inside the cards)
  S0: 0.12, // scroll at which the first card reaches the front
  S1: 0.88, // scroll at which the last card reaches the front
  CAM_Z: 8, // camera distance — shared with the DOM card projection
  FOCAL: 680, // px per world-unit at unit depth (DOM projection only)
};

const THETA_TOTAL = (HELIX.N - 1) * HELIX.DELTA;

/** Local position on the card orbit for card `i` (before the group moves). */
export function cardPoint(i: number): [number, number, number] {
  const t = i * HELIX.DELTA;
  return [Math.sin(t) * HELIX.R_CARD, -t * HELIX.PITCH, Math.cos(t) * HELIX.R_CARD];
}

/** Map raw scroll (0..1) to the group's rotation angle about Y. Each card `i`
 *  faces the camera when this equals its own angle `i*DELTA`. */
export function scrollToRot(s: number): number {
  const u = (s - HELIX.S0) / (HELIX.S1 - HELIX.S0);
  return THREE.MathUtils.clamp(u, -0.25, 1.25) * THETA_TOTAL;
}

const vertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  varying float vFade;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    // vignette the spiral gently into the surrounding darkness
    float d = length(mv.xyz);
    vFade = (1.0 - smoothstep(8.5, 15.0, d)) * smoothstep(1.5, 3.0, d);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragment = /* glsl */ `
  precision mediump float;
  uniform vec3 uBody;
  uniform vec3 uEdge;
  uniform float uOpacity;
  varying vec3 vNormal;
  varying vec3 vView;
  varying float vFade;
  void main() {
    float fres = pow(1.0 - max(dot(normalize(vNormal), normalize(vView)), 0.0), 2.4);
    vec3 col = mix(uBody, uEdge, fres);
    float a = uOpacity * (0.16 + 0.84 * fres) * vFade;
    gl_FragColor = vec4(col, a);
  }
`;

function strandGeometry(phase: number) {
  const pts: THREE.Vector3[] = [];
  const samples = 340;
  // the strands run well beyond the card sweep so the spiral reads as a tall,
  // endless glowing corridor behind the travelling panels
  const tMin = -2.6;
  const tMax = THETA_TOTAL + 3.2;
  for (let i = 0; i <= samples; i += 1) {
    const t = tMin + (tMax - tMin) * (i / samples);
    const a = t + phase;
    pts.push(new THREE.Vector3(Math.sin(a) * HELIX.R_STRAND, -t * HELIX.PITCH, Math.cos(a) * HELIX.R_STRAND));
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 620, 0.055, 10, false);
}

export function LightHelix({
  interactive = true,
  scroll,
  children,
}: {
  interactive?: boolean;
  scroll?: { get: () => number };
  children?: ReactNode;
}) {
  const group = useRef<THREE.Group>(null);
  const rotEased = useRef(0);
  const mouse = useRef(new THREE.Vector2(0, 0));

  const { geoA, geoB, material } = useMemo(() => {
    const geoA = strandGeometry(0);
    const geoB = strandGeometry(Math.PI);
    const material = new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.NormalBlending,
      uniforms: {
        uBody: { value: new THREE.Color(0.62, 0.7, 0.86) },
        uEdge: { value: new THREE.Color(0.9, 0.94, 1.0) },
        uOpacity: { value: 0.58 },
      },
    });
    return { geoA, geoB, material };
  }, []);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const target = scroll ? scrollToRot(scroll.get()) : 0;
    rotEased.current += (target - rotEased.current) * Math.min(1, delta * 3.6);
    const rot = rotEased.current;
    // rotate the whole structure so each card orbits to the front in turn…
    g.rotation.y = -rot;
    // …and lift it so whichever card is at the front sits at eye level
    g.position.y = rot * HELIX.PITCH;
    // a whisper of mouse parallax on the whole corridor
    if (interactive) {
      mouse.current.x += (state.pointer.x - mouse.current.x) * Math.min(1, delta * 2);
      mouse.current.y += (state.pointer.y - mouse.current.y) * Math.min(1, delta * 2);
      g.rotation.z = mouse.current.x * 0.03;
      g.rotation.x = -mouse.current.y * 0.03;
    }
  });

  return (
    <group ref={group}>
      <mesh geometry={geoA} material={material} />
      <mesh geometry={geoB} material={material} />
      {children}
    </group>
  );
}
