"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useIsMobile } from "@/hooks/useMediaQuery";

/* ------------------------------------------------------------------ *
 * The Weave — the Automation moment in the Light journey. The single
 * ribbon of silk slows, gathers energy, and divides into four braided
 * strands that explore in different directions through the void. Each
 * strand carries a capability, discovered as the camera drifts past it,
 * and light pulses run its length like information moving through a
 * system. At the far end the strands rejoin, seamlessly, into one
 * powerful stream: complex systems, made simple. No cards, no diagram —
 * the ribbon itself is the story.
 * ------------------------------------------------------------------ */

const FB = process.env.NEXT_PUBLIC_BASE_PATH || "";
const FONT_BOLD = `${FB}/fonts/syne-700.ttf`;
const FONT_REG = `${FB}/fonts/syne-400.ttf`;

// the four capabilities the ribbon introduces, in the order the camera meets
// them — each a distinct, calm hue so the strands read as different pathways
export const WEAVE = [
  { label: "Workflow Automation", hue: new THREE.Color(0.82, 0.89, 1.0) },
  { label: "AI Assistants", hue: new THREE.Color(0.72, 0.7, 1.0) },
  { label: "Business Integrations", hue: new THREE.Color(0.66, 0.9, 0.94) },
  { label: "Customer Systems", hue: new THREE.Color(1.0, 0.9, 0.76) },
] as const;
const NS = WEAVE.length;

const UP = new THREE.Vector3(0, 1, 0);
function clamp(x: number, a: number, b: number) { return x < a ? a : x > b ? b : x; }
function smoothstep(a: number, b: number, x: number) {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

/* -------------------------- the braid geometry -------------------------- */
// the single stream travelling forward through the void, gently drifting
const ZL = 68;
function spine(t: number, o: THREE.Vector3) {
  o.set(
    2.0 * Math.sin(t * Math.PI * 1.1),
    1.1 * Math.sin(t * Math.PI * 0.9 + 0.4),
    9 - t * ZL,
  );
  return o;
}
// a stable frame along the spine (forward + a right/up that don't tumble)
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

// how far the strands are apart at position t — nil at both ends (one stream),
// widest through the middle where the four pathways explore
const spread = (t: number) => Math.pow(Math.sin(Math.PI * clamp(t, 0, 1)), 1.25);
const RMAX = 2.55;
const TWIST = 1.5 * Math.PI;

// the centre-line of strand j: the spine, displaced out into its own pathway,
// braiding slowly around the stream as it travels
function strandPoint(j: number, t: number, out: THREE.Vector3) {
  const fr = spineFrame(t);
  const ang = (j / NS) * Math.PI * 2 + t * TWIST;
  const rad = RMAX * spread(t) * (0.72 + 0.28 * Math.sin(t * Math.PI * 2.0 + j * 1.7));
  out.copy(fr.p)
    .addScaledVector(fr.right, Math.cos(ang) * rad)
    .addScaledVector(fr.up, Math.sin(ang) * rad);
  return out;
}

function strandCurve(j: number): THREE.CatmullRomCurve3 {
  const pts: THREE.Vector3[] = [];
  const N = 150;
  for (let i = 0; i <= N; i += 1) {
    pts.push(strandPoint(j, i / N, new THREE.Vector3()));
  }
  return new THREE.CatmullRomCurve3(pts, false, "centripetal", 0.5);
}

// the flattened-silk tube (a wafer-thin lens section) swept along a strand —
// the same body language as the Light Flow: never a zero-area strip, so it
// stays present as it rolls, with a bright edge and a luminous face
const CROSS = 8;
function silkTube(curve: THREE.Curve<THREE.Vector3>, halfW: number, halfT: number): THREE.BufferGeometry {
  const n = 220;
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const P = new THREE.Vector3();
  const T = new THREE.Vector3();
  for (let i = 0; i <= n; i += 1) {
    const u = i / n;
    curve.getPointAt(u, P);
    curve.getTangentAt(u, T).normalize();
    let R = new THREE.Vector3().crossVectors(UP, T);
    if (R.lengthSq() < 1e-4) R.set(1, 0, 0);
    R.normalize();
    const Nr = new THREE.Vector3().crossVectors(T, R).normalize();
    // taper to a fine point at both ends so the strands melt into the stream
    const taper = Math.pow(Math.sin(Math.PI * u), 0.35);
    const hw = halfW * (0.5 + 0.5 * taper);
    for (let j = 0; j < CROSS; j += 1) {
      const th = (j / CROSS) * Math.PI * 2;
      const ct = Math.cos(th);
      const st = Math.sin(th);
      const point = P.clone().addScaledVector(R, hw * ct).addScaledVector(Nr, halfT * st);
      const normal = R.clone().multiplyScalar(halfT * ct).addScaledVector(Nr, hw * st).normalize();
      pos.push(point.x, point.y, point.z);
      nor.push(normal.x, normal.y, normal.z);
      uv.push(u, 0.5 + 0.5 * ct);
    }
  }
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < CROSS; j += 1) {
      const a = i * CROSS + j;
      const b = i * CROSS + ((j + 1) % CROSS);
      const c = (i + 1) * CROSS + j;
      const d = (i + 1) * CROSS + ((j + 1) % CROSS);
      idx.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

// illuminated silk with a travelling pulse — existence (a faint constant body,
// always drawn, never facing-dependent) kept apart from illumination (facing
// glow, sheen and a moving band of light that reads as information flowing)
function silkMaterial(core: THREE.Color, edge: THREE.Color, alpha: number) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 }, uReveal: { value: 0 }, uAlpha: { value: alpha }, uFlow: { value: 0 },
      uCore: { value: core }, uEdge: { value: edge },
    },
    vertexShader: `
      varying vec3 vN; varying vec3 vV; varying vec2 vUv; varying float vDepth;
      void main(){ vUv=uv; vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.0); vV=normalize(-mv.xyz); vDepth=-mv.z; gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `
      precision highp float;
      varying vec3 vN; varying vec3 vV; varying vec2 vUv; varying float vDepth;
      uniform float uTime, uReveal, uAlpha, uFlow; uniform vec3 uCore, uEdge;
      void main(){
        vec3 N = normalize(vN); vec3 V = normalize(vV);
        float ndv = abs(dot(N, V));
        vec3 L = normalize(vec3(0.3, 0.75, 0.55));
        float sheen = pow(abs(dot(N, L)), 2.4);
        float across = 1.0 - abs(vUv.y - 0.5) * 2.0;
        float softEdge = smoothstep(0.0, 0.5, across);
        float glow = pow(clamp(across, 0.0, 1.0), 1.9);
        float ends = smoothstep(0.0, 0.02, vUv.x) * smoothstep(1.0, 0.98, vUv.x);
        // EXISTENCE — a faint body that never depends on facing the camera,
        // floored so it recedes into the dark but the strand is always there
        float presence = clamp(exp(-0.010 * vDepth), 0.4, 1.0);
        float base = 0.055 * (0.55 + 0.45 * softEdge) * ends * presence;
        // ILLUMINATION — facing glow softened by distance haze
        float face = 0.4 + 0.6 * smoothstep(0.05, 0.82, ndv);
        float haze = clamp(exp(-0.014 * vDepth), 0.0, 1.0);
        float lit = (0.10 + 0.24 * glow) * face * softEdge * ends * haze;
        // information flowing — a few soft bands of light running the strand
        float pv = fract(vUv.x * 2.0 - uTime * 0.16);
        float pulse = smoothstep(0.0, 0.05, pv) * (1.0 - smoothstep(0.05, 0.16, pv));
        lit += pulse * 0.5 * uFlow * softEdge * haze;
        vec3 col = mix(uEdge, uCore, glow) + pulse * uFlow * 0.4 * uCore;
        float a = (base + lit) * uReveal * uAlpha;
        gl_FragColor = vec4(col, a);
      }`,
  });
}

type Shared = { p: { current: number }; appear: { current: number } };

/* ------------------------------ a strand ------------------------------ */
function Strand({ j, shared }: { j: number; shared: Shared }) {
  const cap = WEAVE[j];
  const curve = useMemo(() => strandCurve(j), [j]);
  const bodyGeo = useMemo(() => silkTube(curve, 0.2, 0.04), [curve]);
  const haloGeo = useMemo(() => silkTube(curve, 0.52, 0.055), [curve]);
  const body = useMemo(() => silkMaterial(new THREE.Color(0.94, 0.97, 1.0).multiply(cap.hue), cap.hue.clone().multiplyScalar(0.55), 0.95), [cap.hue]);
  const halo = useMemo(() => silkMaterial(cap.hue.clone(), cap.hue.clone().multiplyScalar(0.4), 0.18), [cap.hue]);

  // the label sits where this strand is well clear of the others, staggered
  // along the braid so the four are discovered one after another
  const spacing = 0.4 / (NS - 1);
  const tLabel = 0.30 + j * spacing; // 0.30 .. 0.70
  const labelData = useMemo(() => {
    const fr = spineFrame(tLabel);
    const p = strandPoint(j, tLabel, new THREE.Vector3());
    const outward = p.clone().sub(fr.p).normalize();
    const anchor = p.clone().addScaledVector(outward, 0.85);
    return { anchor, hueHex: `#${cap.hue.getHexString()}` };
  }, [j, tLabel, cap.hue]);

  const billboard = useRef<THREE.Group>(null);
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const labelRef = useRef<any>(null);
  const tickRef = useRef<any>(null);
  const shown = useRef(0);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const ap = shared.appear.current;
    for (const m of [body, halo]) {
      m.uniforms.uTime.value = t;
      m.uniforms.uReveal.value = ap;
    }
    // flow (pulses) fade in with the split and settle to a calm baseline
    const sp = spread(shared.p.current);
    body.uniforms.uFlow.value = 0.35 + 0.65 * sp;
    // reveal the label as the camera passes — but only ever the single nearest
    // strand, so two capabilities never crowd the frame at once
    const nearest = clamp(Math.round((shared.p.current - 0.30) / spacing), 0, NS - 1);
    const near = j === nearest ? smoothstep(0.09, 0.0, Math.abs(shared.p.current - tLabel)) : 0;
    const target = near * smoothstep(0.2, 0.6, ap);
    shown.current += (target - shown.current) * 0.12;
    const { camera } = state;
    if (billboard.current) billboard.current.quaternion.copy(camera.quaternion);
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
      <group ref={billboard} position={[labelData.anchor.x, labelData.anchor.y, labelData.anchor.z]}>
        <Text ref={tickRef} font={FONT_BOLD} fontSize={0.16} color={labelData.hueHex} anchorX="center" anchorY="middle"
          letterSpacing={0.35} position={[0, 0.34, 0]} fillOpacity={0}>
          {`0${j + 1}`}
        </Text>
        <Text ref={labelRef} font={FONT_BOLD} fontSize={0.44} color="#f5f8ff" anchorX="center" anchorY="middle"
          textAlign="center" maxWidth={3.4} lineHeight={1.05} letterSpacing={-0.01} position={[0, -0.06, 0]} fillOpacity={0}>
          {cap.label}
        </Text>
      </group>
    </group>
  );
}

/* --------------------------- the core stream --------------------------- */
// a faint continuous thread down the spine so the eye reads one system even
// where the four strands have parted — the connective tissue of the weave
function CoreStream({ shared }: { shared: Shared }) {
  const curve = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 120; i += 1) pts.push(spine(i / 120, new THREE.Vector3()));
    return new THREE.CatmullRomCurve3(pts, false, "centripetal", 0.5);
  }, []);
  const geo = useMemo(() => silkTube(curve, 0.1, 0.025), [curve]);
  const mat = useMemo(() => silkMaterial(new THREE.Color(0.9, 0.94, 1.0), new THREE.Color(0.36, 0.46, 0.8), 0.5), []);
  useFrame((s) => {
    mat.uniforms.uTime.value = s.clock.elapsedTime;
    mat.uniforms.uReveal.value = shared.appear.current;
    // the core is brightest where the strands are merged (the single stream)
    mat.uniforms.uFlow.value = 0.6 * (1.0 - spread(shared.p.current));
  });
  return <mesh geometry={geo} material={mat} renderOrder={1} />;
}

/* ------------------------------- camera ------------------------------- */
// a cinematic drone drifting the length of the weave: pulled back and raised
// through the split to take in all four pathways, easing in as they rejoin
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

    // travel along the spine; dolly out and rise as the pathways spread
    const ct = 0.06 + p * 0.86;
    const fr = spineFrame(ct);
    const sp = spread(ct);
    const back = 8.5 + 6.5 * sp;
    const camTarget = fr.p.clone()
      .addScaledVector(fr.fwd, -back)
      .addScaledVector(fr.up, 2.0 + 3.4 * sp + Math.sin(t * 0.14) * 0.25)
      .addScaledVector(fr.right, -1.6 + Math.sin(t * 0.11) * 0.4);
    const lookTarget = fr.p.clone().addScaledVector(fr.fwd, 2.5);

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
        <CoreStream shared={shared} />
        {WEAVE.map((_, j) => (
          <Strand key={j} j={j} shared={shared} />
        ))}
        <Rig scroll={scroll} shared={shared} />
      </Canvas>
    </div>
  );
}
