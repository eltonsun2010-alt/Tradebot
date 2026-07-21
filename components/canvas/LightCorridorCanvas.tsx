"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { WHY_CARDS } from "@/lib/data";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useIsMobile } from "@/hooks/useMediaQuery";

/* ------------------------------------------------------------------ *
 * The Light Flow — Southpage's signature. A single living ribbon of
 * light peels off the Helix and travels an infinite black void. It
 * weaves, spirals, widens and narrows; the camera simply drifts along
 * it. At each principle the flow slows and thousands of particles gather
 * into a luminous sculpture with the words woven in, then dissolve back
 * into the current. No rooms, no walls — the light is the architecture.
 * ------------------------------------------------------------------ */

const N = WHY_CARDS.length;
const STEP = 7.4;
const M = 30;
const LEAD_S = 15;
const GAP_S = 16;
const TAIL_S = 16;
const AHEAD = 7.0;

const FB = process.env.NEXT_PUBLIC_BASE_PATH || "";
const FONT_BOLD = `${FB}/fonts/syne-700.ttf`;
const FONT_REG = `${FB}/fonts/syne-400.ttf`;

// the flow: a drifting helix — spirals and weaves, but forward speed always
// dominates the lateral, so it reads as an elegant current, never a coaster
const CURVE = (() => {
  const pts: THREE.Vector3[] = [];
  for (let k = 0; k <= M; k += 1) {
    const ang = k * 0.52;
    const rad = 3.1 + 1.3 * Math.sin(k * 0.29 + 0.6);
    const x = rad * Math.sin(ang) + 1.8 * Math.sin(k * 0.17);
    const y = rad * 0.62 * Math.cos(ang) + 1.4 * Math.sin(k * 0.23 + 1.1);
    const z = 2 - k * STEP;
    pts.push(new THREE.Vector3(x, y, z));
  }
  return new THREE.CatmullRomCurve3(pts, false, "centripetal", 0.5);
})();
const CURVE_L = CURVE.getLength();

export const stationS = (i: number) => LEAD_S + i * GAP_S;
export const cameraMaxS = stationS(N - 1) + TAIL_S;
export const cameraS = (p: number) => p * cameraMaxS;
export const N_ROOMS = N;
const clamp = (x: number, a: number, b: number) => (x < a ? a : x > b ? b : x);
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
// how strongly a station is "gathered" — bell around the moment of arrival
export const stationReveal = (p: number, i: number) => {
  const d = Math.abs(stationS(i) - cameraS(p));
  return smoothstep(11, 3.2, d);
};
const revealAtS = (s: number, i: number) => smoothstep(11, 3.4, Math.abs(stationS(i) - s));

// the flow slows as it nears each destination and eases away again — the
// current lingers so the visitor meets each sculpture head-on, then drifts on
const NS = 400;
const S_LUT = (() => {
  const pst = Array.from({ length: N }, (_, i) => stationS(i) / cameraMaxS);
  const cum = [0];
  let total = 0;
  for (let k = 1; k <= NS; k += 1) {
    const p = k / NS;
    let sp = 1;
    for (const ps of pst) {
      const d = (p - ps) / 0.05;
      sp -= 0.62 * Math.exp(-d * d);
    }
    total += Math.max(0.16, sp);
    cum.push(total);
  }
  return cum.map((c) => (c / total) * cameraMaxS);
})();
function sArc(p: number): number {
  const x = clamp(p, 0, 1) * NS;
  const i = Math.floor(x);
  const f = x - i;
  const a = S_LUT[i] ?? 0;
  const b = S_LUT[Math.min(NS, i + 1)] ?? a;
  return a + (b - a) * f;
}

const UP = new THREE.Vector3(0, 1, 0);
const _t = new THREE.Vector3();
function posAt(s: number): THREE.Vector3 {
  return CURVE.getPointAt(clamp(s / CURVE_L, 0, 1));
}
function tanAt(s: number): THREE.Vector3 {
  return CURVE.getTangentAt(clamp(s / CURVE_L, 0, 1), _t).normalize();
}
// a stable orthonormal frame at arc-length s (tangent, right, up)
function frameAt(s: number) {
  const fwd = tanAt(s).clone();
  let right = new THREE.Vector3().crossVectors(UP, fwd);
  if (right.lengthSq() < 1e-4) right = new THREE.Vector3(1, 0, 0);
  right.normalize();
  const up = new THREE.Vector3().crossVectors(fwd, right).normalize();
  return { pos: posAt(s).clone(), fwd, right, up };
}

/* ------------------------- soft light sprites ------------------------- */
// a radial-gradient glow sprite (built in-canvas) — the basis of every
// particle and the ribbon's halo; gives a soft bloom without postprocessing
function glowTexture(): THREE.Texture | null {
  if (typeof document === "undefined") return null;
  const s = 128;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(255,255,255,0.55)");
  g.addColorStop(0.55, "rgba(255,255,255,0.14)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const t = new THREE.CanvasTexture(c);
  t.needsUpdate = true;
  return t;
}
const GLOW = glowTexture();

// premium, not neon — cool silver-blue with a faint warm memory of the Helix
const COL_CORE = new THREE.Color(0.95, 0.97, 1.0);
const COL_EDGE = new THREE.Color(0.42, 0.6, 0.98);
const HUES = [
  new THREE.Color(0.72, 0.82, 1.0),
  new THREE.Color(0.86, 0.9, 1.0),
  new THREE.Color(0.78, 0.86, 1.0),
  new THREE.Color(0.92, 0.95, 1.0),
  new THREE.Color(1.0, 0.9, 0.74),
  new THREE.Color(0.8, 0.88, 1.0),
];

/* ---------------------------- the ribbon ---------------------------- */
// one flowing strip of light. Width breathes along its length; a gentle twist
// and companion strands give the sense of a living current that splits & merges.
function ribbonGeometry(halfW: (u: number) => number, twistAmp: number, offset: (u: number) => number): THREE.BufferGeometry {
  const n = 520;
  const frames = CURVE.computeFrenetFrames(n, false);
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (let k = 0; k <= n; k += 1) {
    const u = k / n;
    const p = CURVE.getPointAt(u);
    const tan = frames.tangents[k];
    let bin = frames.binormals[k].clone();
    const nor = frames.normals[k].clone();
    // gentle twist of the strip around its own axis
    const a = twistAmp * Math.sin(u * 22.0);
    bin = bin.clone().multiplyScalar(Math.cos(a)).add(nor.clone().multiplyScalar(Math.sin(a))).normalize();
    // lateral offset for companion strands (they part and rejoin)
    const off = offset(u);
    const c = p.clone().add(nor.clone().multiplyScalar(off));
    const hw = halfW(u);
    const l = c.clone().add(bin.clone().multiplyScalar(-hw));
    const r = c.clone().add(bin.clone().multiplyScalar(hw));
    pos.push(l.x, l.y, l.z, r.x, r.y, r.z);
    uv.push(u, 0, u, 1);
    void tan;
  }
  for (let k = 0; k < n; k += 1) {
    const a = k * 2;
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

function ribbonMaterial(coreCol: THREE.Color, edgeCol: THREE.Color, corePow: number, alpha: number) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uCore: { value: coreCol },
      uEdge: { value: edgeCol },
      uPow: { value: corePow },
      uAlpha: { value: alpha },
      uHead: { value: 0 }, // travel position, for a soft leading pulse
    },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `
      precision highp float;
      varying vec2 vUv;
      uniform float uTime, uPow, uAlpha, uHead;
      uniform vec3 uCore, uEdge;
      void main(){
        float edge = 1.0 - abs(vUv.y - 0.5) * 2.0;
        float core = pow(clamp(edge, 0.0, 1.0), uPow);
        // energy travelling along the ribbon — alive, not mechanical
        float flow = 0.62 + 0.38 * sin(vUv.x * 46.0 - uTime * 2.4);
        float slow = 0.75 + 0.25 * sin(vUv.x * 7.0 - uTime * 0.8);
        // fade the two ends so the strand emerges from and melts into black
        float ends = smoothstep(0.0, 0.05, vUv.x) * smoothstep(1.0, 0.94, vUv.x);
        // a soft brightening around the visitor's current position
        float head = smoothstep(0.10, 0.0, abs(vUv.x - uHead));
        vec3 col = mix(uEdge, uCore, core);
        float a = core * flow * slow * ends * (0.85 + 0.5 * head) * uAlpha;
        gl_FragColor = vec4(col, a);
      }
    `,
  });
}

function Ribbon() {
  const coreGeo = useMemo(() => ribbonGeometry((u) => 0.12 + 0.09 * Math.sin(u * 30 + 0.5), 0.5, () => 0), []);
  const haloGeo = useMemo(() => ribbonGeometry((u) => 0.5 + 0.34 * Math.sin(u * 18 + 1.0), 0.35, () => 0), []);
  const strandA = useMemo(() => ribbonGeometry((u) => 0.05 + 0.03 * Math.sin(u * 40), 0.6, (u) => 0.55 * Math.sin(u * 9.0)), []);
  const strandB = useMemo(() => ribbonGeometry((u) => 0.05 + 0.03 * Math.cos(u * 38), 0.7, (u) => -0.7 * Math.sin(u * 7.5 + 0.7)), []);
  const core = useMemo(() => ribbonMaterial(COL_CORE, COL_EDGE, 2.4, 1.0), []);
  const halo = useMemo(() => ribbonMaterial(COL_CORE, COL_EDGE, 1.1, 0.28), []);
  const thin = useMemo(() => ribbonMaterial(new THREE.Color(0.85, 0.92, 1.0), COL_EDGE, 2.0, 0.55), []);
  const mats = [core, halo, thin];
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    for (const m of mats) m.uniforms.uTime.value = t;
  });
  return (
    <group>
      <mesh geometry={haloGeo} material={halo} />
      <mesh geometry={coreGeo} material={core} />
      <mesh geometry={strandA} material={thin} />
      <mesh geometry={strandB} material={thin} />
    </group>
  );
}

/* ----------------------- ambient light dust ------------------------ */
function Dust() {
  const geo = useMemo(() => {
    const count = 1000;
    const pos = new Float32Array(count * 3);
    const siz = new Float32Array(count);
    const pha = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      const s = Math.random() * CURVE_L;
      const f = frameAt(s);
      const r = 3 + Math.random() * 22;
      const a = Math.random() * Math.PI * 2;
      const p = f.pos.clone().add(f.right.clone().multiplyScalar(Math.cos(a) * r)).add(f.up.clone().multiplyScalar(Math.sin(a) * r));
      pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z;
      siz[i] = 0.5 + Math.random() * 1.6;
      pha[i] = Math.random() * Math.PI * 2;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("aSize", new THREE.Float32BufferAttribute(siz, 1));
    g.setAttribute("aPhase", new THREE.Float32BufferAttribute(pha, 1));
    return g;
  }, []);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uTex: { value: GLOW } },
        vertexShader: `
          attribute float aSize; attribute float aPhase; uniform float uTime; varying float vTw;
          void main(){
            vec3 p = position;
            p.y += sin(uTime * 0.12 + aPhase) * 0.7;
            p.x += cos(uTime * 0.09 + aPhase) * 0.5;
            vTw = 0.5 + 0.5 * sin(uTime * 0.5 + aPhase);
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_PointSize = aSize * (150.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: `
          uniform sampler2D uTex; varying float vTw;
          void main(){ vec4 t = texture2D(uTex, gl_PointCoord); gl_FragColor = vec4(vec3(0.72,0.82,1.0), t.a * vTw * 0.28); }`,
      }),
    [],
  );
  useFrame((s) => { mat.uniforms.uTime.value = s.clock.elapsedTime; });
  return <points geometry={geo} material={mat} />;
}

/* --------------------- the service installations -------------------- */
// at each principle, particles gather from the current into a slow luminous
// sculpture (a woven ring), with the words integrated; then dissolve away.
function Installation({ i, spos }: { i: number; spos: { current: number } }) {
  const card = WHY_CARDS[i];
  // sit a little ahead of where the flow lingers, so it's framed as we approach
  const f = useMemo(() => frameAt(stationS(i) + 4), [i]);
  const hue = HUES[i % HUES.length];
  const count = 620;
  const geo = useMemo(() => {
    const form = new Float32Array(count * 3);
    const scatter = new Float32Array(count * 3);
    const siz = new Float32Array(count);
    const pha = new Float32Array(count);
    for (let j = 0; j < count; j += 1) {
      // the gathered form: a woven ring around a clear centre for the words
      const a = (j / count) * Math.PI * 2 * 3;
      const rr = 2.9 + 0.28 * Math.sin(a * 2.0) + (Math.random() - 0.5) * 0.2;
      const band = Math.sin(a * 1.5) * 0.35;
      const fp = f.pos.clone()
        .add(f.right.clone().multiplyScalar(Math.cos(a) * rr))
        .add(f.up.clone().multiplyScalar(Math.sin(a) * rr))
        .add(f.fwd.clone().multiplyScalar(band));
      form[j * 3] = fp.x; form[j * 3 + 1] = fp.y; form[j * 3 + 2] = fp.z;
      // the scattered state: dispersed along the current, so it melts in/out
      const s2 = stationS(i) + (Math.random() - 0.5) * 30;
      const g2 = frameAt(s2);
      const rad = 3 + Math.random() * 8;
      const ang = Math.random() * Math.PI * 2;
      const sp = g2.pos.clone().add(g2.right.clone().multiplyScalar(Math.cos(ang) * rad)).add(g2.up.clone().multiplyScalar(Math.sin(ang) * rad));
      scatter[j * 3] = sp.x; scatter[j * 3 + 1] = sp.y; scatter[j * 3 + 2] = sp.z;
      siz[j] = 0.5 + Math.random() * 1.3;
      pha[j] = Math.random() * Math.PI * 2;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(form, 3));
    g.setAttribute("aScatter", new THREE.Float32BufferAttribute(scatter, 3));
    g.setAttribute("aSize", new THREE.Float32BufferAttribute(siz, 1));
    g.setAttribute("aPhase", new THREE.Float32BufferAttribute(pha, 1));
    return g;
  }, [i, f]);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uReveal: { value: 0 }, uTex: { value: GLOW }, uColor: { value: hue } },
        vertexShader: `
          attribute vec3 aScatter; attribute float aSize; attribute float aPhase;
          uniform float uTime, uReveal; varying float vA;
          void main(){
            float r = smoothstep(0.0, 1.0, uReveal);
            vec3 p = mix(aScatter, position, r);
            p += 0.08 * sin(uTime * 0.7 + aPhase) * vec3(1.0, 0.9, 1.1);
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_PointSize = aSize * (0.5 + 0.5 * r) * (200.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
            vA = r;
          }`,
        fragmentShader: `
          uniform sampler2D uTex; uniform vec3 uColor; varying float vA;
          void main(){ vec4 t = texture2D(uTex, gl_PointCoord); gl_FragColor = vec4(uColor, t.a * vA * 0.5); }`,
      }),
    [hue],
  );
  const grp = useRef<THREE.Group>(null);
  const textA = useRef({ v: 0 }).current;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const titleRef = useRef<any>(null);
  const idxRef = useRef<any>(null);
  const bodyRef = useRef<any>(null);
  useFrame((state) => {
    const r = revealAtS(spos.current, i);
    mat.uniforms.uTime.value = state.clock.elapsedTime;
    mat.uniforms.uReveal.value = r;
    // the whole sculpture turns slowly, alive
    if (grp.current) grp.current.rotation.z = state.clock.elapsedTime * 0.05 + i;
    textA.v += (r - textA.v) * 0.12;
    // troika needs fillOpacity + sync; throttle so we only re-sync on real change
    for (const ref of [titleRef, idxRef, bodyRef]) {
      const o = ref.current;
      if (o && Math.abs((o.__op ?? -1) - textA.v) > 0.02) {
        o.fillOpacity = textA.v;
        o.__op = textA.v;
        o.sync?.();
      }
    }
  });
  /* eslint-enable @typescript-eslint/no-explicit-any */
  // face the lettering back toward the approaching camera (never mirrored)
  const theta = Math.atan2(-f.fwd.x, -f.fwd.z);
  const P = (lx: number, ly: number): [number, number, number] => {
    const p = f.pos.clone().add(f.right.clone().multiplyScalar(lx)).add(f.up.clone().multiplyScalar(ly));
    return [p.x, p.y, p.z];
  };
  const idx = String(i + 1).padStart(2, "0");
  return (
    <group>
      <group ref={grp}>
        <points geometry={geo} material={mat} />
      </group>
      <Text ref={idxRef} font={FONT_BOLD} fontSize={0.3} color="#dfe8ff" anchorX="center" anchorY="middle" letterSpacing={0.3}
        position={P(0, 1.45)} rotation={[0, theta, 0]} fillOpacity={0}>
        {idx}
      </Text>
      <Text ref={titleRef} font={FONT_BOLD} fontSize={0.66} color="#f6f9ff" anchorX="center" anchorY="middle" textAlign="center" maxWidth={4.4}
        lineHeight={1.04} letterSpacing={-0.01} position={P(0, 0.4)} rotation={[0, theta, 0]} fillOpacity={0}>
        {card.title}
      </Text>
      <Text ref={bodyRef} font={FONT_REG} fontSize={0.22} color="#d2dbee" anchorX="center" anchorY="top" textAlign="center" maxWidth={4.6}
        lineHeight={1.42} position={P(0, -0.62)} rotation={[0, theta, 0]} fillOpacity={0}>
        {card.body}
      </Text>
    </group>
  );
}

/* ------------------------------ camera ------------------------------ */
function Rig({ scroll, spos }: { scroll?: { get: () => number }; spos: { current: number } }) {
  const { camera } = useThree();
  const eased = useRef(0);
  const look = useRef(new THREE.Vector3());
  const smooth = useRef(new THREE.Vector3());
  const upv = useRef(new THREE.Vector3(0, 1, 0));
  const inited = useRef(false);
  useFrame((state, delta) => {
    const target = scroll ? scroll.get() : 0;
    eased.current += (target - eased.current) * Math.min(1, delta * 1.3);
    const s = sArc(eased.current); // the flow slows near each destination
    spos.current = s;
    const t = state.clock.elapsedTime;
    const f = frameAt(s);
    const ahead = frameAt(s + AHEAD);
    // sit just off the ribbon so it flows beside us, and breathe gently
    const off = f.right.clone().multiplyScalar(-0.8 + Math.sin(t * 0.13) * 0.25).add(f.up.clone().multiplyScalar(0.45 + Math.sin(t * 0.11) * 0.18));
    camera.position.copy(f.pos).add(off);
    look.current.copy(ahead.pos);
    if (!inited.current) { smooth.current.copy(look.current); inited.current = true; }
    smooth.current.lerp(look.current, Math.min(1, delta * 2.0));
    // gently bank the up-vector toward the flow's own up, so spirals feel felt
    upv.current.lerp(f.up.clone().multiplyScalar(0.3).add(new THREE.Vector3(0, 1, 0).multiplyScalar(0.7)).normalize(), Math.min(1, delta * 1.2));
    camera.up.copy(upv.current);
    camera.lookAt(smooth.current);
  });
  return null;
}

export default function LightCorridorCanvas({
  eventSource,
  scroll,
}: {
  eventSource: RefObject<HTMLElement | null>;
  scroll?: { get: () => number };
  count?: number;
}) {
  const reduced = usePrefersReducedMotion();
  const mobile = useIsMobile();
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const spos = useRef({ current: 0 }).current;

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
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance", toneMapping: THREE.NoToneMapping }}
        dpr={reduced ? 1 : [1, mobile ? 1.4 : 2]}
        camera={{ position: [0, 1, 4], fov: 62 }}
        frameloop={active ? "always" : "never"}
        eventSource={eventSource as unknown as RefObject<HTMLElement>}
        eventPrefix="client"
        onCreated={({ scene }) => {
          scene.fog = new THREE.FogExp2(0x02030a, 0.012);
        }}
      >
        <Dust />
        <Ribbon />
        {WHY_CARDS.map((_, i) => (
          <Installation key={i} i={i} spos={spos} />
        ))}
        <Rig scroll={scroll} spos={spos} />
      </Canvas>
    </div>
  );
}
