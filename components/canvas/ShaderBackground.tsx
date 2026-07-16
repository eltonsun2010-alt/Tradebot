"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Domain-warped fbm mesh with a mouse-driven light pool.
const fragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uAspect;

  vec2 hash(vec2 p){
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }
  float noise(vec2 p){
    const float K1 = 0.366025404;
    const float K2 = 0.211324865;
    vec2 i = floor(p + (p.x + p.y) * K1);
    vec2 a = p - i + (i.x + i.y) * K2;
    float m = step(a.y, a.x);
    vec2 o = vec2(m, 1.0 - m);
    vec2 b = a - o + K2;
    vec2 c = a - 1.0 + 2.0 * K2;
    vec3 h = max(0.5 - vec3(dot(a,a), dot(b,b), dot(c,c)), 0.0);
    vec3 n = h*h*h*h * vec3(dot(a, hash(i)), dot(b, hash(i + o)), dot(c, hash(i + 1.0)));
    return dot(n, vec3(70.0));
  }
  float fbm(vec2 p){
    float v = 0.0;
    float a = 0.5;
    mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 5; i++){
      v += a * noise(p);
      p = rot * p * 2.0;
      a *= 0.5;
    }
    return v;
  }

  void main(){
    vec2 uv = vUv;
    vec2 p = uv;
    p.x *= uAspect;
    float t = uTime * 0.06;

    vec2 q = vec2(fbm(p + t), fbm(p + vec2(3.2, 1.7) - t));
    float n = fbm(p + q * 1.4 + t * 0.5);

    vec3 col = vec3(0.02, 0.02, 0.03);
    vec3 blue = vec3(0.231, 0.510, 0.965);
    vec3 violet = vec3(0.486, 0.227, 0.929);

    col = mix(col, blue * 0.5, smoothstep(0.1, 0.7, n) * 0.55);
    col = mix(col, violet * 0.5, smoothstep(0.35, 0.9, q.x) * 0.35);

    // Light that pools around the pointer.
    vec2 m = uMouse * 0.5 + 0.5;
    m.x *= uAspect;
    vec2 up = uv; up.x *= uAspect;
    float d = distance(up, m);
    float light = smoothstep(0.65, 0.0, d);
    col += blue * light * 0.22;
    col += violet * light * 0.10;

    float vig = smoothstep(1.15, 0.2, distance(uv, vec2(0.5)));
    col *= mix(0.5, 1.0, vig);

    // Dither to kill banding on dark gradients.
    col += (hash(uv * (uTime + 1.0)).x) * 0.016;

    gl_FragColor = vec4(col, 1.0);
  }
`;

export function ShaderBackground() {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const { viewport, size } = useThree();
  const mouse = useRef(new THREE.Vector2(0, 0));
  const smoothed = useRef(new THREE.Vector2(0, 0));

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uAspect: { value: 1 },
    }),
    []
  );

  useFrame((state, delta) => {
    if (!mat.current) return;
    // Pointer is provided by R3F in -1..1 (y already flipped).
    mouse.current.set(state.pointer.x, state.pointer.y);
    smoothed.current.lerp(mouse.current, Math.min(1, delta * 2.5));
    mat.current.uniforms.uTime.value += delta;
    mat.current.uniforms.uMouse.value.copy(smoothed.current);
    mat.current.uniforms.uAspect.value = size.width / size.height;
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={mat}
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        depthWrite={false}
      />
    </mesh>
  );
}
