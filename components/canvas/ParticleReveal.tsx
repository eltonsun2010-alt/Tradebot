"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* ------------------------------------------------------------------ *
 * ParticleReveal — the cinematic brand loader.
 *
 * Thousands of soft silver/blue particles drift in the dark, gather to
 * build the word SOUTHPAGE out of pure light, hold, then stretch and
 * stream forward through the letters, dissolving into the scene. The
 * whole timeline is time-driven (not scroll) and eased so it reads like
 * an Apple-style product reveal: "the experience is built from light."
 *
 * Positions passed in are pre-sampled on the CPU:
 *   start  — the initial floating cloud (wide, with real depth)
 *   target — the letterforms of SOUTHPAGE
 *   flow   — a per-particle vector it streams along as it dissolves
 * ------------------------------------------------------------------ */

export type RevealData = {
  count: number;
  start: Float32Array;
  target: Float32Array;
  flow: Float32Array;
  seed: Float32Array;
};

// timeline, in seconds from first frame
export const REVEAL = {
  FLOAT_END: 0.9, // particles drift
  GATHER_END: 2.7, // …organically assemble the word
  HOLD_END: 3.5, // …hold the formed word
  DISSOLVE_END: 4.7, // …stretch, flow and dissolve
  LEAVE_AT: 4.1, // hand off to the site (start the curtain)
  FADE_DUR: 0.8,
};

const vertex = /* glsl */ `
  uniform float uGather;
  uniform float uDissolve;
  uniform float uTime;
  uniform float uSize;
  uniform float uScale;
  uniform float uFade;
  attribute vec3 aStart;
  attribute vec3 aTarget;
  attribute vec3 aFlow;
  attribute float aSeed;
  varying float vA;
  varying float vSeed;
  varying float vGlow;

  float ease(float x){ return x * x * (3.0 - 2.0 * x); }

  void main() {
    // staggered assembly — particles arrive at slightly different times
    float gs = aSeed * 0.34;
    float lg = ease(clamp((uGather - gs) / (1.0 - 0.34), 0.0, 1.0));
    // staggered dissolve — they leave in a different order than they came
    float ds = (1.0 - aSeed) * 0.30;
    float ld = ease(clamp((uDissolve - ds) / (1.0 - 0.30), 0.0, 1.0));

    vec3 formed = mix(aStart, aTarget, lg);

    // organic curl while still unformed, damped to zero as the word sets
    float drift = 1.0 - lg;
    float ph = aSeed * 6.2831;
    formed.x += sin(uTime * 0.6 + ph * 4.7) * 0.13 * drift;
    formed.y += cos(uTime * 0.5 + ph * 3.9) * 0.13 * drift;
    formed.z += sin(uTime * 0.4 + ph * 5.3) * 0.11 * drift;

    // the settled word breathes very faintly so it feels alive, not frozen
    float breathe = lg * (1.0 - ld);
    formed.x += sin(uTime * 1.1 + ph) * 0.006 * breathe;
    formed.y += cos(uTime * 0.9 + ph) * 0.006 * breathe;

    // dissolve: stream forward through and past the letters
    vec3 pos = mix(formed, formed + aFlow, ld);

    vec4 mv = modelViewMatrix * vec4(pos * uScale, 1.0);
    gl_Position = projectionMatrix * mv;
    float depth = -mv.z;
    gl_PointSize = uSize * (6.0 / depth) * (1.0 + ld * 2.0);

    float formA = mix(0.26, 1.0, lg);           // faint drift → solid light
    float dissA = 1.0 - smoothstep(0.30, 1.0, ld);
    vA = formA * dissA * (1.0 - uFade);
    // luminous core when formed; slight depth shading for realism
    vGlow = (0.55 + 0.45 * lg) * clamp(1.35 - depth * 0.05, 0.6, 1.35);
    vSeed = aSeed;
  }
`;

const fragment = /* glsl */ `
  precision mediump float;
  varying float vA;
  varying float vSeed;
  varying float vGlow;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float core = smoothstep(0.5, 0.0, d);
    // mostly soft white/silver, a minority tinted electric blue
    vec3 white = vec3(0.87, 0.91, 1.0);
    vec3 blue = vec3(0.40, 0.60, 1.0);
    vec3 col = mix(white, blue, smoothstep(0.62, 1.0, vSeed) * 0.85);
    col *= vGlow;
    float a = core * vA;
    if (a < 0.01) discard;
    gl_FragColor = vec4(col, a);
  }
`;

export function ParticleReveal({
  data,
  onLeaving,
  scale = 1.15,
  size = 5.4,
}: {
  data: RevealData;
  onLeaving: () => void;
  scale?: number;
  size?: number;
}) {
  const t0 = useRef(-1);
  const leftRef = useRef(false);

  const { geometry, material } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(data.start.slice(), 3));
    g.setAttribute("aStart", new THREE.BufferAttribute(data.start, 3));
    g.setAttribute("aTarget", new THREE.BufferAttribute(data.target, 3));
    g.setAttribute("aFlow", new THREE.BufferAttribute(data.flow, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(data.seed, 1));
    const m = new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uGather: { value: 0 },
        uDissolve: { value: 0 },
        uTime: { value: 0 },
        uSize: { value: size },
        uScale: { value: scale },
        uFade: { value: 0 },
      },
    });
    return { geometry: g, material: m };
  }, [data, scale, size]);

  useFrame((state) => {
    if (t0.current < 0) t0.current = state.clock.elapsedTime;
    const e = state.clock.elapsedTime - t0.current;

    const gather = clamp01((e - REVEAL.FLOAT_END) / (REVEAL.GATHER_END - REVEAL.FLOAT_END));
    const dissolve = clamp01((e - REVEAL.HOLD_END) / (REVEAL.DISSOLVE_END - REVEAL.HOLD_END));
    const fade = clamp01((e - REVEAL.LEAVE_AT) / REVEAL.FADE_DUR);

    const u = material.uniforms;
    u.uGather.value = gather;
    u.uDissolve.value = dissolve;
    u.uTime.value = e;
    u.uFade.value = fade;

    // cinematic camera: a slow push-in through the reveal, easing back a
    // touch as the particles stream past on dissolve, plus a whisper of drift
    const cam = state.camera;
    const eg = smooth(gather);
    const ed = smooth(dissolve);
    cam.position.z = 6.7 - eg * 0.7 + ed * 0.25;
    cam.position.x = Math.sin(e * 0.14) * 0.05;
    cam.position.y = 0.02 + Math.sin(e * 0.11) * 0.03;
    cam.lookAt(0, 0, 0);

    if (!leftRef.current && e >= REVEAL.LEAVE_AT) {
      leftRef.current = true;
      onLeaving();
    }
  });

  return <points geometry={geometry} material={material} />;
}

function clamp01(x: number) {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}
function smooth(x: number) {
  return x * x * (3 - 2 * x);
}
