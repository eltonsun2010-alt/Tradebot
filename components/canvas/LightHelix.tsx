"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* ------------------------------------------------------------------ *
 * The Light Helix — a thin, refined thread of light that guides the
 * eye down a luxury exhibition. It is deliberately quiet: a delicate
 * double strand that travels continuously as you scroll (the camera
 * gliding along the curve) and only brightens where a service chapter
 * is active, otherwise falling away into darkness. It is the guide,
 * never the subject.
 * ------------------------------------------------------------------ */

const TAU = Math.PI * 2;
export const HELIX = {
  R: 1.45, // radius of the thread
  TURNS: 5.5, // twists over its full height
  SPAN: 26, // world height of the thread
  OFFSET_X: 2.15, // sits to the right, leaving the stage to the words
  TRAVEL: 15, // world units the eye glides over the whole journey
};

const vertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  varying float vFade;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    // reveal the thread only in a vertical band near the eye — it emerges
    // from darkness above and below, and recedes into depth
    float band = 1.0 - smoothstep(2.6, 5.4, abs(mv.y));
    float depth = 1.0 - smoothstep(9.0, 13.5, -mv.z);
    vFade = band * depth;
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
    float fres = pow(1.0 - max(dot(normalize(vNormal), normalize(vView)), 0.0), 2.2);
    vec3 col = mix(uBody, uEdge, fres);
    float a = uOpacity * (0.12 + 0.88 * fres) * vFade;
    gl_FragColor = vec4(col, a);
  }
`;

function strandGeometry(phase: number) {
  const pts: THREE.Vector3[] = [];
  const samples = 620;
  for (let i = 0; i <= samples; i += 1) {
    const t = i / samples;
    const y = HELIX.SPAN * (0.5 - t);
    const a = phase + t * HELIX.TURNS * TAU;
    pts.push(new THREE.Vector3(Math.cos(a) * HELIX.R, y, Math.sin(a) * HELIX.R));
  }
  // very thin tube — a refined thread, not a rope
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 900, 0.019, 8, false);
}

export function LightHelix({
  interactive = true,
  scroll,
  glow,
}: {
  interactive?: boolean;
  scroll?: { get: () => number };
  glow?: { get: () => number };
}) {
  const group = useRef<THREE.Group>(null);
  const scrollEased = useRef(0);
  const glowEased = useRef(0);
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
        uBody: { value: new THREE.Color(0.55, 0.66, 0.86) },
        uEdge: { value: new THREE.Color(0.92, 0.96, 1.0) },
        uOpacity: { value: 0.12 },
      },
    });
    return { geoA, geoB, material };
  }, []);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const sTarget = scroll ? scroll.get() : 0;
    scrollEased.current += (sTarget - scrollEased.current) * Math.min(1, delta * 3.2);
    const s = scrollEased.current;

    g.position.x = HELIX.OFFSET_X;
    g.position.y = s * HELIX.TRAVEL; // glide down the curve
    g.rotation.y = s * TAU * 0.55; // a slow, continuous turn

    const gTarget = glow ? glow.get() : 0;
    glowEased.current += (gTarget - glowEased.current) * Math.min(1, delta * 4);
    material.uniforms.uOpacity.value = 0.09 + glowEased.current * 0.4;

    if (interactive) {
      mouse.current.x += (state.pointer.x - mouse.current.x) * Math.min(1, delta * 2);
      mouse.current.y += (state.pointer.y - mouse.current.y) * Math.min(1, delta * 2);
      g.rotation.z = mouse.current.x * 0.02;
      g.rotation.x = -mouse.current.y * 0.02;
    }
  });

  return (
    <group ref={group}>
      <mesh geometry={geoA} material={material} />
      <mesh geometry={geoB} material={material} />
    </group>
  );
}
