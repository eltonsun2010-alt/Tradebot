"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AnimatedText } from "@/components/ui/AnimatedText";
import { ParticleReveal, REVEAL, type RevealData } from "@/components/canvas/ParticleReveal";

/* ------------------------------------------------------------------ *
 * Sample the wordmark into a point cloud, then derive the three states
 * every particle moves between: a floating cloud, the letterforms, and
 * a forward-streaming flow it dissolves along.
 * ------------------------------------------------------------------ */
function buildReveal(count: number): RevealData {
  const W = 1024;
  const H = 260;
  const ASPECT = W / H;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let px = 168;
  ctx.font = `800 ${px}px Syne, system-ui, sans-serif`;
  const targetW = W * 0.92;
  const measured = ctx.measureText("SOUTHPAGE").width;
  if (measured > targetW) {
    px = Math.floor(px * (targetW / measured));
    ctx.font = `800 ${px}px Syne, system-ui, sans-serif`;
  }
  ctx.fillText("SOUTHPAGE", W / 2, H / 2 + 4);

  const img = ctx.getImageData(0, 0, W, H).data;
  const pts: [number, number][] = [];
  for (let y = 0; y < H; y += 2) {
    for (let x = 0; x < W; x += 2) {
      if (img[(y * W + x) * 4 + 3] > 60) pts.push([x, y]);
    }
  }
  for (let i = pts.length - 1; i > 0; i -= 1) {
    const j = (Math.random() * (i + 1)) | 0;
    [pts[i], pts[j]] = [pts[j], pts[i]];
  }

  const start = new Float32Array(count * 3);
  const target = new Float32Array(count * 3);
  const flow = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  const n = pts.length || 1;

  for (let i = 0; i < count; i += 1) {
    const [sx, sy] = pts[i % n] ?? [W / 2, H / 2];
    // letterform position (world units), with a wafer-thin depth
    const tx = (sx / W - 0.5) * ASPECT + (Math.random() - 0.5) * 0.004;
    const ty = -(sy / H - 0.5) + (Math.random() - 0.5) * 0.004;
    const tz = (Math.random() - 0.5) * 0.05;
    target[i * 3] = tx;
    target[i * 3 + 1] = ty;
    target[i * 3 + 2] = tz;

    // initial floating cloud — wide, deep, elegant
    const ang = Math.random() * Math.PI * 2;
    const rad = 0.7 + Math.random() * 1.9;
    start[i * 3] = Math.cos(ang) * rad * ASPECT * 0.5;
    start[i * 3 + 1] = (Math.random() - 0.5) * 2.4;
    start[i * 3 + 2] = (Math.random() - 0.5) * 2.6 - 0.3;

    // dissolve flow — mostly forward (toward the camera), rising and spreading
    flow[i * 3] = tx * 0.5 + (Math.random() - 0.5) * 0.9;
    flow[i * 3 + 1] = ty * 0.25 + 0.35 + Math.random() * 0.7;
    flow[i * 3 + 2] = 1.4 + Math.random() * 2.4;

    seed[i] = Math.random();
  }

  return { count, start, target, flow, seed };
}

function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (c.getContext("webgl") || c.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

/**
 * Premium brand reveal: soft particles gather into SOUTHPAGE out of the
 * dark, hold, then stream forward and dissolve into the site. Falls back
 * to an elegant wordmark fade where WebGL isn't available.
 */
export function Loader({ onComplete }: { onComplete: () => void }) {
  const [data, setData] = useState<RevealData | null>(null);
  const [mode, setMode] = useState<"pending" | "particles" | "fallback">("pending");
  const [leaving, setLeaving] = useState(false);
  const finished = useRef(false);

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    document.body.style.overflow = "";
    onComplete();
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    let cancelled = false;

    if (!hasWebGL()) {
      setMode("fallback");
      const t = setTimeout(() => setLeaving(true), 1500);
      return () => clearTimeout(t);
    }

    const mobile = window.matchMedia("(max-width: 768px)").matches;
    const count = mobile ? 4200 : 9000;

    // wait for the brand font so the letterforms are correct, but never hang
    const ready = Promise.race([
      (document.fonts?.ready ?? Promise.resolve()) as Promise<unknown>,
      new Promise((r) => setTimeout(r, 1200)),
    ]);
    ready.then(() => {
      if (cancelled) return;
      setData(buildReveal(count));
      setMode("particles");
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // hard safety net: never trap the visitor behind the loader
  useEffect(() => {
    const t = setTimeout(finish, 9000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[500] overflow-hidden bg-ink"
      initial={{ opacity: 1 }}
      animate={{ opacity: leaving ? 0 : 1 }}
      transition={{ duration: REVEAL.FADE_DUR, ease: [0.4, 0, 0.2, 1] }}
      onAnimationComplete={() => {
        if (leaving) finish();
      }}
    >
      {/* depth vignette + faint central bloom so the light has somewhere to sit */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 50%, rgba(80,120,220,0.10), transparent 70%), radial-gradient(120% 100% at 50% 50%, transparent 55%, rgba(0,0,0,0.6))",
        }}
      />

      {mode === "particles" && data && (
        <Canvas
          className="!absolute inset-0"
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          dpr={[1, 2]}
          camera={{ position: [0, 0, 6.7], fov: 50 }}
        >
          <ParticleReveal data={data} onLeaving={() => setLeaving(true)} />
        </Canvas>
      )}

      {/* minimal, premium caption — fades in on the hold, out on the hand-off */}
      {mode === "particles" && (
        <motion.div
          className="pointer-events-none absolute inset-x-0 top-[62%] flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0, 0.8, 0.8, 0] }}
          transition={{
            duration: REVEAL.LEAVE_AT,
            times: [0, REVEAL.HOLD_END / REVEAL.LEAVE_AT - 0.18, REVEAL.HOLD_END / REVEAL.LEAVE_AT, 0.94, 1],
            ease: "easeInOut",
          }}
        >
          <motion.span
            className="block h-px bg-line-strong"
            initial={{ width: 0 }}
            animate={{ width: [0, 0, 64, 64, 0] }}
            transition={{ duration: REVEAL.LEAVE_AT, times: [0, 0.72, 0.82, 0.94, 1], ease: "easeInOut" }}
          />
          <span className="text-[10px] uppercase tracking-[0.42em] text-paper-dim">
            Design Studio
          </span>
        </motion.div>
      )}

      {mode === "fallback" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <AnimatedText
            text="SOUTHPAGE"
            by="char"
            as="h1"
            play
            stagger={0.05}
            className="font-display text-[13vw] font-extrabold leading-none tracking-[-0.04em] text-paper sm:text-[9vw] md:text-8xl"
          />
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-6 text-[10px] uppercase tracking-[0.42em] text-paper-dim"
          >
            Design Studio
          </motion.span>
        </div>
      )}
    </motion.div>
  );
}
