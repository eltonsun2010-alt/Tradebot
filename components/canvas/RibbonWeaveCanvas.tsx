"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useIsMobile } from "@/hooks/useMediaQuery";

/* ------------------------------------------------------------------ *
 * The Weave — the Automation chapter of the one ribbon. This is not a
 * second sculpture: the same silk ribbon of the Light journey travels
 * straight through, in the same colour, thickness and material. As it
 * reaches Automation it widens, and fine branches peel from its own
 * edges, grow into flowing pathways that each carry a capability, then
 * retract and merge seamlessly back into the single ribbon that carries
 * on. The ribbon became more complex because we entered Automation — it
 * did not become a different animation.
 * ------------------------------------------------------------------ */

const FB = process.env.NEXT_PUBLIC_BASE_PATH || "";
const FONT_BOLD = `${FB}/fonts/syne-700.ttf`;

// the four capabilities the branches introduce, in the order the camera meets
// them — same silk as the main ribbon; they are pathways of it, not new colours
export const WEAVE = [
  "Workflow Automation",
  "AI Assistants",
  "Business Integrations",
  "Customer Systems",
] as const;
const NB = WEAVE.length;

// the one ribbon's colours — identical to the Light Flow, so this reads as the
// same continuous piece of light
const CORE = new THREE.Color(0.9, 0.94, 1.0);
const EDGE = new THREE.Color(0.36, 0.5, 0.86);

const UP = new THREE.Vector3(0, 1, 0);
function clamp(x: number, a: number, b: number) { return x < a ? a : x > b ? b : x; }
function smoothstep(a: number, b: number, x: number) {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

/* -------------------------- the braid geometry -------------------------- */
// the single stream travelling forward through the void, drifting with the same
// movement language as the main journey
const ZL = 68;
function spine(t: number, o: THREE.Vector3) {
  o.set(
    2.2 * Math.sin(t * Math.PI * 1.15) + 0.8 * Math.sin(t * Math.PI * 2.3),
    1.2 * Math.sin(t * Math.PI * 0.9 + 0.4) + 0.5 * Math.cos(t * Math.PI * 1.7),
    9 - t * ZL,
  );
  return o;
}
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
function spineFrame(t: number) {
  const p = spine(t, new THREE.Vector3());
  const h = 0.004;
  spine(Math.min(1, t + h), _a);
  spine(Math.max(0, t - h), _b);
  const fwd = _a.clone().sub(_b).normalize();
  let right = new THREE.Vector3().crossVectors(UP, fwd);
  if (right.lengthSq() < 1e-4) right.set(1, 0, 0);
  right.normalize();
  const up = new THREE.Vector3().crossVectors(fwd, right).normalize();
  return { p, fwd, right, up };
}

// the automation zone — where the ribbon widens and the branches live
const T_SPLIT = 0.28;
const T_MERGE = 0.72;
const zone = (t: number) => smoothstep(0.16, 0.30, t) * smoothstep(0.84, 0.70, t);
// the ribbon's half-width: the Light Flow's thickness, swelling a little as it
// gathers energy for the split
const ribbonHalfW = (t: number) => 0.3 + 0.1 * zone(t) + 0.02 * Math.sin(t * 28);
// how far the branches have emerged from the ribbon (0 outside the zone)
const emerge = (t: number) => smoothstep(T_SPLIT, T_SPLIT + 0.12, t) * smoothstep(T_MERGE, T_MERGE - 0.12, t);

const RMAX = 2.0;
const TWIST = 1.2 * Math.PI;
// two branches lean off each flat edge of the ribbon, then fan out and braid
const BASE_ANG = [0.6, -0.6, Math.PI + 0.6, Math.PI - 0.6];

// the centre-line of branch j: it starts just inside the ribbon's edge and,
// only where it has emerged, swings out into its own pathway
function branchPoint(j: number, t: number, out: THREE.Vector3) {
  const fr = spineFrame(t);
  const e = emerge(t);
  const indiv = 0.7 + 0.3 * Math.sin(t * Math.PI * 2 + j * 1.7);
  const edge = ribbonHalfW(t) * 0.85;
  const rad = edge + e * (RMAX * indiv - edge);
  const ang = BASE_ANG[j] + TWIST * e;
  out.copy(fr.p)
    .addScaledVector(fr.right, Math.cos(ang) * rad)
    .addScaledVector(fr.up, Math.sin(ang) * rad);
  return out;
}

// the flattened-silk tube (a wafer-thin lens section) swept along a path in
// uniform parameter space, so t ≈ u and the width / emerge functions line up.
// `emergeFn` fades a strand in only where it has peeled away from the ribbon.
const CROSS = 8;
function silkTube(
  curve: THREE.Curve<THREE.Vector3>,
  a: number,
  b: number,
  halfWFn: (t: number) => number,
  halfT: number,
  emergeFn: (t: number) => number = () => 1,
): THREE.BufferGeometry {
  const n = 220;
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const em: number[] = [];
  const idx: number[] = [];
  const P = new THREE.Vector3();
  const T = new THREE.Vector3();
  for (let i = 0; i <= n; i += 1) {
    const s = i / n;
    const t = a + s * (b - a);
    curve.getPoint(s, P);
    curve.getTangent(s, T).normalize();
    let R = new THREE.Vector3().crossVectors(UP, T);
    if (R.lengthSq() < 1e-4) R.set(1, 0, 0);
    R.normalize();
    const Nr = new THREE.Vector3().crossVectors(T, R).normalize();
    const taper = Math.pow(Math.sin(Math.PI * s), 0.35);
    const hw = halfWFn(t) * (0.5 + 0.5 * taper);
    const ev = emergeFn(t);
    for (let j = 0; j < CROSS; j += 1) {
      const th = (j / CROSS) * Math.PI * 2;
      const ct = Math.cos(th);
      const st = Math.sin(th);
      const point = P.clone().addScaledVector(R, hw * ct).addScaledVector(Nr, halfT * st);
      const normal = R.clone().multiplyScalar(halfT * ct).addScaledVector(Nr, hw * st).normalize();
      pos.push(point.x, point.y, point.z);
      nor.push(normal.x, normal.y, normal.z);
      uv.push(s, 0.5 + 0.5 * ct);
      em.push(ev);
    }
  }
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < CROSS; j += 1) {
      const p0 = i * CROSS + j;
      const p1 = i * CROSS + ((j + 1) % CROSS);
      const p2 = (i + 1) * CROSS + j;
      const p3 = (i + 1) * CROSS + ((j + 1) % CROSS);
      idx.push(p0, p2, p1, p1, p2, p3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute("aEmerge", new THREE.Float32BufferAttribute(em, 1));
  g.setIndex(idx);
  return g;
}

// illuminated silk — the exact material language of the Light Flow: existence
// (a faint constant body, never facing-dependent, floored so it recedes but is
// always present) kept apart from illumination (facing glow softened by haze),
// plus a travelling pulse that reads as information moving through the system.
// `aEmerge` lets a branch appear only where it has peeled from the ribbon.
function silkMaterial(core: THREE.Color, edge: THREE.Color, alpha: number) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 }, uReveal: { value: 0 }, uAlpha: { value: alpha }, uFlow: { value: 0 },
      uCore: { value: core }, uEdge: { value: edge },
    },
    vertexShader: `
      attribute float aEmerge;
      varying vec3 vN; varying vec3 vV; varying vec2 vUv; varying float vDepth; varying float vEmerge;
      void main(){ vUv=uv; vEmerge=aEmerge; vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.0); vV=normalize(-mv.xyz); vDepth=-mv.z; gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `
      precision highp float;
      varying vec3 vN; varying vec3 vV; varying vec2 vUv; varying float vDepth; varying float vEmerge;
      uniform float uTime, uReveal, uAlpha, uFlow; uniform vec3 uCore, uEdge;
      void main(){
        vec3 N = normalize(vN); vec3 V = normalize(vV);
        float ndv = abs(dot(N, V));
        float across = 1.0 - abs(vUv.y - 0.5) * 2.0;
        float softEdge = smoothstep(0.0, 0.5, across);
        float glow = pow(clamp(across, 0.0, 1.0), 1.9);
        float ends = smoothstep(0.0, 0.02, vUv.x) * smoothstep(1.0, 0.98, vUv.x);
        // branches fade in only where they have peeled from the ribbon's edge
        float peel = smoothstep(0.04, 0.28, vEmerge);
        float presence = clamp(exp(-0.010 * vDepth), 0.4, 1.0);
        float base = 0.055 * (0.55 + 0.45 * softEdge) * ends * presence;
        float face = 0.4 + 0.6 * smoothstep(0.05, 0.82, ndv);
        float haze = clamp(exp(-0.014 * vDepth), 0.0, 1.0);
        float lit = (0.10 + 0.24 * glow) * face * softEdge * ends * haze;
        // information flowing — soft bands of light running the length
        float pv = fract(vUv.x * 2.0 - uTime * 0.16);
        float pulse = smoothstep(0.0, 0.05, pv) * (1.0 - smoothstep(0.05, 0.16, pv));
        lit += pulse * 0.5 * uFlow * softEdge * haze;
        vec3 col = mix(uEdge, uCore, glow) + pulse * uFlow * 0.4 * uCore;
        float a = (base + lit) * uReveal * uAlpha * peel;
        gl_FragColor = vec4(col, a);
      }`,
  });
}

type Shared = { p: { current: number }; appear: { current: number } };

/* --------------------------- the main ribbon --------------------------- */
// the one continuous ribbon of the journey, passing straight through Automation
// — same silk, same colour, same thickness — swelling a little through the zone
function MainRibbon({ shared }: { shared: Shared }) {
  const curve = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 130; i += 1) pts.push(spine(i / 130, new THREE.Vector3()));
    return new THREE.CatmullRomCurve3(pts, false, "centripetal", 0.5);
  }, []);
  const bodyGeo = useMemo(() => silkTube(curve, 0, 1, ribbonHalfW, 0.05), [curve]);
  const haloGeo = useMemo(() => silkTube(curve, 0, 1, (t) => ribbonHalfW(t) * 2.1 + 0.2, 0.06), [curve]);
  const body = useMemo(() => silkMaterial(CORE.clone(), EDGE.clone(), 0.82), []);
  const halo = useMemo(() => silkMaterial(new THREE.Color(0.56, 0.7, 1.0), EDGE.clone().multiplyScalar(0.7), 0.15), []);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    for (const m of [body, halo]) { m.uniforms.uTime.value = t; m.uniforms.uReveal.value = shared.appear.current; }
    // pulses strongest as the single stream gathers and again once it reforms
    body.uniforms.uFlow.value = 0.4 + 0.4 * zone(shared.p.current);
  });
  return (
    <group>
      <mesh geometry={haloGeo} material={halo} renderOrder={1} />
      <mesh geometry={bodyGeo} material={body} renderOrder={2} />
    </group>
  );
}

/* ------------------------------ a branch ------------------------------ */
// a pathway that peels from the ribbon's edge, carries one capability, and
// retracts back — the same silk, only thinner
function Branch({ j, shared }: { j: number; shared: Shared }) {
  const label = WEAVE[j];
  const a = T_SPLIT - 0.05;
  const b = T_MERGE + 0.05;
  const curve = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const N = 120;
    for (let i = 0; i <= N; i += 1) {
      const t = a + (i / N) * (b - a);
      pts.push(branchPoint(j, t, new THREE.Vector3()));
    }
    return new THREE.CatmullRomCurve3(pts, false, "centripetal", 0.5);
  }, [j, a, b]);
  const bodyGeo = useMemo(() => silkTube(curve, a, b, () => 0.17, 0.04, emerge), [curve, a, b]);
  const haloGeo = useMemo(() => silkTube(curve, a, b, () => 0.4, 0.05, emerge), [curve, a, b]);
  const body = useMemo(() => silkMaterial(CORE.clone(), EDGE.clone(), 0.85), []);
  const halo = useMemo(() => silkMaterial(new THREE.Color(0.56, 0.7, 1.0), EDGE.clone().multiplyScalar(0.7), 0.14), []);

  // the label sits where this branch is well clear of the ribbon, staggered
  // along the zone so the four are discovered one after another
  const spacing = 0.32 / (NB - 1);
  const tLabel = 0.34 + j * spacing; // 0.34 .. 0.66
  const anchor = useMemo(() => {
    const fr = spineFrame(tLabel);
    const p = branchPoint(j, tLabel, new THREE.Vector3());
    const outward = p.clone().sub(fr.p).normalize();
    return p.clone().addScaledVector(outward, 0.85);
  }, [j, tLabel]);

  const billboard = useRef<THREE.Group>(null);
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const labelRef = useRef<any>(null);
  const tickRef = useRef<any>(null);
  const shown = useRef(0);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    for (const m of [body, halo]) {
      m.uniforms.uTime.value = t;
      m.uniforms.uReveal.value = shared.appear.current;
      m.uniforms.uFlow.value = 0.9; // the branches always carry flowing light
    }
    // reveal the label as the camera passes — only ever the nearest branch
    const nearest = clamp(Math.round((shared.p.current - 0.34) / spacing), 0, NB - 1);
    const near = j === nearest ? smoothstep(0.08, 0.0, Math.abs(shared.p.current - tLabel)) : 0;
    const target = near * smoothstep(0.2, 0.6, shared.appear.current);
    shown.current += (target - shown.current) * 0.12;
    if (billboard.current) billboard.current.quaternion.copy(state.camera.quaternion);
    for (const ref of [labelRef, tickRef]) {
      const o = ref.current;
      if (!o) continue;
      if (!o.__init) { o.material.depthTest = false; o.material.depthWrite = false; o.renderOrder = 14; o.__init = true; }
      if (Math.abs((o.__op ?? -1) - shown.current) > 0.02) { o.fillOpacity = shown.current; o.__op = shown.current; o.sync?.(); }
    }
  });
  /* eslint-enable @typescript-eslint/no-explicit-any */

  return (
    <group>
      <mesh geometry={haloGeo} material={halo} renderOrder={1} />
      <mesh geometry={bodyGeo} material={body} renderOrder={2} />
      <group ref={billboard} position={[anchor.x, anchor.y, anchor.z]}>
        <Text ref={tickRef} font={FONT_BOLD} fontSize={0.16} color="#9db4de" anchorX="center" anchorY="middle"
          letterSpacing={0.35} position={[0, 0.34, 0]} fillOpacity={0}>
          {`0${j + 1}`}
        </Text>
        <Text ref={labelRef} font={FONT_BOLD} fontSize={0.44} color="#f5f8ff" anchorX="center" anchorY="middle"
          textAlign="center" maxWidth={3.4} lineHeight={1.05} letterSpacing={-0.01} position={[0, -0.06, 0]} fillOpacity={0}>
          {label}
        </Text>
      </group>
    </group>
  );
}

/* ------------------------------- camera ------------------------------- */
// a cinematic drone following the one ribbon: it eases back and rises through
// the split to take in the pathways, then settles as they merge back
function Rig({ scroll, shared }: { scroll?: { get: () => number }; shared: Shared }) {
  const { camera } = useThree();
  const eased = useRef(0);
  const t0 = useRef(-1);
  const pos = useRef(new THREE.Vector3());
  const look = useRef(new THREE.Vector3());
  const inited = useRef(false);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (t0.current < 0) t0.current = t;
    const target = scroll ? scroll.get() : 0;
    eased.current += (target - eased.current) * Math.min(1, delta * 1.1);
    const p = clamp(eased.current, 0, 1);
    shared.p.current = p;
    const timeApp = smoothstep(0.25, 3.0, t - t0.current);
    const scrolled = smoothstep(0.004, 0.03, eased.current);
    shared.appear.current = Math.max(timeApp, scrolled);

    // travel along the ribbon; ease back and rise where the pathways spread
    const ct = 0.05 + p * 0.9;
    const fr = spineFrame(ct);
    const z = zone(ct);
    const back = 7.5 + 5.5 * z;
    const camTarget = fr.p.clone()
      .addScaledVector(fr.fwd, -back)
      .addScaledVector(fr.up, 1.7 + 2.6 * z + Math.sin(t * 0.14) * 0.22)
      .addScaledVector(fr.right, -1.3 + Math.sin(t * 0.11) * 0.35);
    const lookTarget = fr.p.clone().addScaledVector(fr.fwd, 2.8);

    if (!inited.current) { pos.current.copy(camTarget); look.current.copy(lookTarget); inited.current = true; }
    pos.current.lerp(camTarget, Math.min(1, delta * 1.4));
    look.current.lerp(lookTarget, Math.min(1, delta * 1.6));
    camera.position.copy(pos.current);
    camera.up.set(0, 1, 0);
    camera.lookAt(look.current);
  });
  return null;
}

export default function RibbonWeaveCanvas({
  eventSource,
  scroll,
}: {
  eventSource: RefObject<HTMLElement | null>;
  scroll?: { get: () => number };
}) {
  const reduced = usePrefersReducedMotion();
  const mobile = useIsMobile();
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const shared = useRef<Shared>({ p: { current: 0 }, appear: { current: 0 } }).current;

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
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
        dpr={reduced ? 1 : [1, mobile ? 1.3 : 1.8]}
        camera={{ position: [0, 2, 6], fov: 60 }}
        frameloop={active ? "always" : "never"}
        eventSource={eventSource as unknown as RefObject<HTMLElement>}
        eventPrefix="client"
        onCreated={({ scene }) => { scene.fog = new THREE.FogExp2(0x02030a, 0.012); }}
      >
        <MainRibbon shared={shared} />
        {WEAVE.map((_, j) => (
          <Branch key={j} j={j} shared={shared} />
        ))}
        <Rig scroll={scroll} shared={shared} />
      </Canvas>
    </div>
  );
}
