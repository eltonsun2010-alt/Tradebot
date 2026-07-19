"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/* ------------------------------------------------------------------ *
 * A minimal, architectural double helix made of two translucent
 * glass-like light strands — no particles. Each strand is a smooth tube
 * lit by a soft fresnel rim so it reads as flowing glass rather than a
 * neon wire. The whole helix drifts vertically with scroll and wraps by
 * exactly one turn (the strand is periodic) so travel feels endless.
 * ------------------------------------------------------------------ */

const TAU = Math.PI * 2;
const TURNS = 6;
const HEIGHT = 15;
const RADIUS = 1.3;
const PITCH = HEIGHT / TURNS; // vertical distance per turn — the wrap length

const vertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
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
  void main() {
    float fres = pow(1.0 - max(dot(normalize(vNormal), normalize(vView)), 0.0), 2.4);
    vec3 col = mix(uBody, uEdge, fres);
    float a = uOpacity * (0.14 + 0.86 * fres); // translucent body, brighter glass rim
    gl_FragColor = vec4(col, a);
  }
`;

function helixCurve(phase: number) {
  const pts: THREE.Vector3[] = [];
  const samples = 240;
  for (let i = 0; i <= samples; i += 1) {
    const t = i / samples;
    const a = t * TURNS * TAU + phase;
    pts.push(new THREE.Vector3(Math.cos(a) * RADIUS, (t - 0.5) * HEIGHT, Math.sin(a) * RADIUS));
  }
  return new THREE.CatmullRomCurve3(pts);
}

export function LightHelix({
  interactive = true,
  scroll,
}: {
  count?: number;
  interactive?: boolean;
  scroll?: { get: () => number };
}) {
  const group = useRef<THREE.Group>(null);
  const mouse = useRef(new THREE.Vector2(0, 0));
  const scrollEased = useRef(0);
  const { size } = useThree();

  const { geoA, geoB, material } = useMemo(() => {
    const geoA = new THREE.TubeGeometry(helixCurve(0), 420, 0.05, 9, false);
    const geoB = new THREE.TubeGeometry(helixCurve(Math.PI), 420, 0.05, 9, false);
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
        uOpacity: { value: 0.5 },
      },
    });
    return { geoA, geoB, material };
  }, []);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    // travel: drift the helix up as the camera descends, wrapping by one turn
    if (scroll) {
      const target = scroll.get();
      scrollEased.current += (target - scrollEased.current) * Math.min(1, delta * 3.2);
    }
    const shift = ((scrollEased.current * HEIGHT) % PITCH + PITCH) % PITCH;
    g.position.y = shift;

    // slow continuous twist + gentle mouse parallax
    g.rotation.y += delta * 0.04;
    if (interactive) {
      mouse.current.x += (state.pointer.x - mouse.current.x) * Math.min(1, delta * 2);
      mouse.current.y += (state.pointer.y - mouse.current.y) * Math.min(1, delta * 2);
      g.rotation.z = mouse.current.x * 0.05;
      g.rotation.x = -mouse.current.y * 0.05;
    }
  });

  const scale = Math.min(1.15, Math.max(0.72, size.height / 640));

  return (
    <group ref={group} scale={scale}>
      <mesh geometry={geoA} material={material} />
      <mesh geometry={geoB} material={material} />
    </group>
  );
}
