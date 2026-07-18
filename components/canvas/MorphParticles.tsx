"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/* ------------------------------------------------------------------ *
 * Shape sampling — draw a silhouette on an offscreen canvas, then keep
 * the opaque pixels as a point cloud. Every shape is sampled to exactly
 * `count` points so we can lerp one into the next in the shader.
 * ------------------------------------------------------------------ */
const W = 400;
const H = 170;
const ASPECT = W / H;

function samplePixels(draw: (ctx: CanvasRenderingContext2D) => void): number[][] {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, W, H);
  draw(ctx);
  const data = ctx.getImageData(0, 0, W, H).data;
  const pts: number[][] = [];
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      if (data[(y * W + x) * 4 + 3] > 50) pts.push([x, y]);
    }
  }
  // shuffle so repeats/pads are evenly distributed
  for (let i = pts.length - 1; i > 0; i -= 1) {
    const j = (Math.random() * (i + 1)) | 0;
    [pts[i], pts[j]] = [pts[j], pts[i]];
  }
  return pts;
}

function shapeToArray(count: number, pts: number[][]): Float32Array {
  const out = new Float32Array(count * 3);
  const n = pts.length;
  for (let i = 0; i < count; i += 1) {
    const [px, py] = n ? pts[i % n] : [W / 2, H / 2];
    // tiny jitter keeps edges soft instead of gridded, without smearing
    const jx = (Math.random() - 0.5) * 0.6;
    const jy = (Math.random() - 0.5) * 0.6;
    out[i * 3 + 0] = ((px + jx) / W - 0.5) * ASPECT;
    out[i * 3 + 1] = -((py + jy) / H - 0.5);
    out[i * 3 + 2] = (Math.random() - 0.5) * 0.03;
  }
  return out;
}

function cloudArray(count: number, spread: number): Float32Array {
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    out[i * 3 + 0] = (Math.random() - 0.5) * ASPECT * spread;
    out[i * 3 + 1] = (Math.random() - 0.5) * spread;
    out[i * 3 + 2] = (Math.random() - 0.5) * 0.6;
  }
  return out;
}

/* ------------------------------- shapes ------------------------------- */
function drawLogo(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let size = 64;
  ctx.font = `800 ${size}px Syne, system-ui, sans-serif`;
  const target = W * 0.92;
  const w = ctx.measureText("SOUTHPAGE").width;
  if (w > target) {
    size = Math.floor(size * (target / w));
    ctx.font = `800 ${size}px Syne, system-ui, sans-serif`;
  }
  ctx.fillText("SOUTHPAGE", W / 2, H / 2 + 2);
}

function drawLaptop(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = "#fff";
  ctx.fillStyle = "#fff";
  ctx.lineJoin = "round";
  ctx.lineWidth = 7;
  // screen
  const sx = W * 0.26;
  const sy = H * 0.2;
  const sw = W - sx * 2;
  const sh = H * 0.44;
  ctx.strokeRect(sx, sy, sw, sh);
  // hinge / base trapezoid
  ctx.beginPath();
  ctx.moveTo(sx - 34, sy + sh + 26);
  ctx.lineTo(W - sx + 34, sy + sh + 26);
  ctx.lineTo(W - sx + 8, sy + sh);
  ctx.lineTo(sx - 8, sy + sh);
  ctx.closePath();
  ctx.stroke();
  // screen detail so it reads as a device
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(sx + 16, sy + 20);
  ctx.lineTo(sx + 74, sy + 20);
  ctx.stroke();
}

function drawWireframe(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = "#fff";
  ctx.fillStyle = "#fff";
  ctx.lineWidth = 6;
  const x = W * 0.14;
  const y = H * 0.14;
  const w = W - x * 2;
  const h = H - y * 2;
  // window
  ctx.strokeRect(x, y, w, h);
  // top bar
  ctx.fillRect(x, y, w, 18);
  // content blocks
  ctx.fillRect(x + 16, y + 34, w * 0.34, h - 52); // sidebar
  ctx.fillRect(x + 28 + w * 0.34, y + 34, w * 0.5, 16); // heading
  ctx.fillRect(x + 28 + w * 0.34, y + 60, w * 0.5, 12);
  ctx.fillRect(x + 28 + w * 0.34, y + 82, w * 0.42, 12);
  ctx.fillRect(x + 28 + w * 0.34, y + 108, w * 0.28, 22); // button
}

/* ------------------------------- material ------------------------------- */
const vertex = /* glsl */ `
  uniform float uProg;
  uniform float uTime;
  uniform float uScale;
  uniform float uSize;
  attribute vec3 aP0;
  attribute vec3 aP1;
  attribute vec3 aP2;
  attribute vec3 aP3;
  attribute vec3 aP4;
  attribute float aSeed;
  varying float vAlpha;
  varying float vSeed;

  void main() {
    float p = clamp(uProg, 0.0, 1.0) * 4.0;
    float seg = floor(p);
    float t = smoothstep(0.0, 1.0, fract(p));
    vec3 a, b;
    if (seg < 0.5)      { a = aP0; b = aP1; }
    else if (seg < 1.5) { a = aP1; b = aP2; }
    else if (seg < 2.5) { a = aP2; b = aP3; }
    else                { a = aP3; b = aP4; }
    vec3 pos = mix(a, b, t);

    // gentle life so a settled shape still breathes (kept small so text stays legible)
    pos.x += sin(uTime * 0.6 + aSeed * 6.2831) * 0.006;
    pos.y += cos(uTime * 0.5 + aSeed * 6.2831) * 0.006;
    pos *= uScale;
    // sit a touch below centre so the taller shapes clear the fixed navbar
    pos.y -= 0.34;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (5.0 / -mv.z);

    float mid = smoothstep(0.1, 0.42, uProg) * (1.0 - smoothstep(0.78, 0.98, uProg));
    vAlpha = (0.2 + 0.8 * mid) * (1.0 - smoothstep(0.92, 1.0, uProg));
    vSeed = aSeed;
  }
`;

const fragment = /* glsl */ `
  precision mediump float;
  varying float vAlpha;
  varying float vSeed;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    // blue → sky → soft violet by seed
    vec3 blue = vec3(0.36, 0.55, 1.0);
    vec3 violet = vec3(0.6, 0.45, 0.98);
    vec3 col = mix(blue, violet, smoothstep(0.4, 1.0, vSeed));
    col = mix(col, vec3(0.9, 0.95, 1.0), smoothstep(0.8, 1.0, a) * 0.6);
    gl_FragColor = vec4(col, a * vAlpha);
    if (gl_FragColor.a < 0.01) discard;
  }
`;

export function MorphParticles({ count = 2600 }: { count?: number }) {
  const { size } = useThree();
  const prog = useRef(0);

  const { geometry, material } = useMemo(() => {
    const logo = shapeToArray(count, samplePixels(drawLogo));
    const laptop = shapeToArray(count, samplePixels(drawLaptop));
    const wire = shapeToArray(count, samplePixels(drawWireframe));
    const cloudA = cloudArray(count, 1.5);
    const cloudB = cloudArray(count, 2.2);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i += 1) seeds[i] = Math.random();

    const g = new THREE.BufferGeometry();
    // position is required by three; reuse the first cloud
    g.setAttribute("position", new THREE.BufferAttribute(cloudA.slice(), 3));
    g.setAttribute("aP0", new THREE.BufferAttribute(cloudA, 3));
    g.setAttribute("aP1", new THREE.BufferAttribute(logo, 3));
    g.setAttribute("aP2", new THREE.BufferAttribute(laptop, 3));
    g.setAttribute("aP3", new THREE.BufferAttribute(wire, 3));
    g.setAttribute("aP4", new THREE.BufferAttribute(cloudB, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));

    const m = new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uProg: { value: 0 },
        uTime: { value: 0 },
        uScale: { value: 2.7 },
        uSize: { value: 6.5 },
      },
    });
    return { geometry: g, material: m };
  }, [count]);

  useFrame((state, delta) => {
    // scroll progress — compressed so the full sequence (logo → laptop →
    // wireframe → disperse) plays while the hero is still centred in view.
    const vh = window.innerHeight || 800;
    const target = Math.min(1, Math.max(0, window.scrollY / (vh * 0.72)));
    prog.current += (target - prog.current) * Math.min(1, delta * 6);
    material.uniforms.uProg.value = prog.current;
    material.uniforms.uTime.value = state.clock.elapsedTime;
    // keep shapes readable on very wide / very narrow viewports
    material.uniforms.uScale.value = size.width < 720 ? 1.9 : 2.7;
  });

  return <points geometry={geometry} material={material} />;
}
