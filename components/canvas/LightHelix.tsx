"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/* ------------------------------------------------------------------ *
 * A double helix drawn entirely from thousands of soft glowing points.
 * No solid geometry — additive points with a gaussian falloff read as
 * ribbons of light. All motion (twist, slow 3D rotation, shimmer, drift,
 * pulse, mouse parallax + attraction) happens in the vertex/fragment
 * shader so it stays cheap and holds 60fps.
 * ------------------------------------------------------------------ */

const vertex = /* glsl */ `
  #define TAU 6.283185307
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform vec2  uMouse;      // -1..1, already eased on the CPU
  uniform float uInteractive;

  attribute float aT;
  attribute float aStrand;
  attribute float aRad;
  attribute float aAng;
  attribute float aSeed;
  attribute float aDrift;

  varying float vBright;
  varying float vAccent;

  const float TURNS  = 3.0;
  const float HEIGHT = 6.2;
  const float RADIUS = 1.35;
  const float TUBE   = 0.16;

  void main() {
    float twist = uTime * 0.12;
    float ang = aT * TAU * TURNS + aStrand * 3.14159265 + twist;

    vec2 rd = vec2(cos(ang), sin(ang));       // radial direction
    vec3 pos;
    pos.x = rd.x * RADIUS;
    pos.z = rd.y * RADIUS;
    pos.y = (aT - 0.5) * HEIGHT;

    // ribbon thickness — scatter around the strand centreline
    pos.x += rd.x * aRad * TUBE;
    pos.z += rd.y * aRad * TUBE;
    pos.y += (aAng - 0.5) * TUBE;

    // some particles drift outward and ease back — a living quality
    float dsel = smoothstep(0.62, 1.0, aDrift);
    float dph  = uTime * 0.24 + aSeed * TAU;
    float dmag = (sin(dph) * 0.5 + 0.5) * dsel * 0.55;
    pos.x += rd.x * dmag;
    pos.z += rd.y * dmag;
    pos.y += sin(dph * 0.7) * dmag * 0.4;

    // slow global reveal-rotation + gentle mouse parallax
    float ry = uTime * 0.05 + uMouse.x * 0.38 * uInteractive;
    float rx = uMouse.y * 0.20 * uInteractive;
    float cy = cos(ry), sy = sin(ry);
    pos = vec3(pos.x * cy + pos.z * sy, pos.y, -pos.x * sy + pos.z * cy);
    float cx = cos(rx), sx = sin(rx);
    pos = vec3(pos.x, pos.y * cx - pos.z * sx, pos.y * sx + pos.z * cx);

    // soft attraction toward the cursor, then ease back (handled by uMouse easing)
    vec3 mworld = vec3(uMouse.x * 1.7, uMouse.y * 1.25, 1.5);
    float md = distance(pos, mworld);
    float pull = smoothstep(1.15, 0.0, md) * 0.16 * uInteractive;
    pos += (mworld - pos) * pull;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    float shimmer = 0.6 + 0.4 * sin(uTime * 1.6 + aSeed * TAU);
    float pulse   = 0.88 + 0.12 * sin(uTime * 0.5 + 1.7);
    gl_PointSize = uSize * uPixelRatio * shimmer * (1.0 / -mv.z);

    vBright = shimmer * pulse;
    vAccent = aSeed;
  }
`;

const fragment = /* glsl */ `
  precision mediump float;
  uniform vec3 uColorCore;
  uniform vec3 uColorAccent;
  uniform float uOpacity;
  varying float vBright;
  varying float vAccent;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    // soft gaussian core + wide faint halo → bloom-like glow
    float core = exp(-d * d * 9.0);
    float halo = smoothstep(0.5, 0.0, d) * 0.5;
    float a = clamp(core + halo, 0.0, 1.0);

    // mostly soft white, a subtle brand-blue accent on a minority of points
    vec3 col = mix(uColorCore, uColorAccent, smoothstep(0.74, 1.0, vAccent) * 0.7);
    col *= 0.7 + 0.6 * vBright;

    gl_FragColor = vec4(col, a * vBright * uOpacity);
    if (gl_FragColor.a < 0.01) discard;
  }
`;

export function LightHelix({
  count = 6000,
  interactive = true,
}: {
  count?: number;
  interactive?: boolean;
}) {
  const { size, viewport } = useThree();
  const mouse = useRef(new THREE.Vector2(0, 0));
  const eased = useRef(new THREE.Vector2(0, 0));

  const { geometry, material } = useMemo(() => {
    const half = Math.floor(count / 2);
    const aT = new Float32Array(count);
    const aStrand = new Float32Array(count);
    const aRad = new Float32Array(count);
    const aAng = new Float32Array(count);
    const aSeed = new Float32Array(count);
    const aDrift = new Float32Array(count);
    const position = new Float32Array(count * 3); // required by three, unused by shader math

    for (let i = 0; i < count; i += 1) {
      const strand = i < half ? 0 : 1;
      const local = strand === 0 ? i : i - half;
      const n = strand === 0 ? half : count - half;
      aStrand[i] = strand;
      aT[i] = local / n + (Math.random() - 0.5) * (1 / n);
      // ~half the points hug the centreline (bright thread), the rest add volume
      const core = Math.random() < 0.5;
      aRad[i] = core ? (Math.random() - 0.5) * 0.5 : (Math.random() * 2 - 1);
      aAng[i] = Math.random();
      aSeed[i] = Math.random();
      aDrift[i] = Math.random();
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(position, 3));
    g.setAttribute("aT", new THREE.BufferAttribute(aT, 1));
    g.setAttribute("aStrand", new THREE.BufferAttribute(aStrand, 1));
    g.setAttribute("aRad", new THREE.BufferAttribute(aRad, 1));
    g.setAttribute("aAng", new THREE.BufferAttribute(aAng, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(aSeed, 1));
    g.setAttribute("aDrift", new THREE.BufferAttribute(aDrift, 1));

    const m = new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: 26 },
        uPixelRatio: { value: 1 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uInteractive: { value: interactive ? 1 : 0 },
        uOpacity: { value: 1 },
        uColorCore: { value: new THREE.Color(0.86, 0.91, 1.0) },
        uColorAccent: { value: new THREE.Color(0.32, 0.58, 1.0) },
      },
    });
    return { geometry: g, material: m };
  }, [count, interactive]);

  useFrame((state, delta) => {
    const u = material.uniforms;
    u.uTime.value = state.clock.elapsedTime;
    u.uPixelRatio.value = Math.min(2, viewport.dpr || 1);
    if (interactive) {
      mouse.current.set(state.pointer.x, state.pointer.y);
      // ease toward the cursor so attraction glides back when it stops moving
      eased.current.lerp(mouse.current, Math.min(1, delta * 2.2));
      (u.uMouse.value as THREE.Vector2).copy(eased.current);
    }
  });

  // frame the helix nicely regardless of the canvas aspect
  const scale = Math.min(1.15, Math.max(0.7, size.height / 620));

  return <points geometry={geometry} material={material} scale={scale} />;
}
