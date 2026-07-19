"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Blob = {
  color: string;
  size: number;
  left: string;
  top: string;
  path: { x: number[]; y: number[]; s: number[] };
  dur: number;
};

/**
 * Animated mesh-gradient / aurora. Soft blurred blobs drift and breathe on
 * long, coprime durations so the composition never visibly repeats. Only
 * transform + scale animate (blur is baked), so it stays on the compositor
 * and costs almost nothing.
 */
export function MeshBackground({
  className,
  opacity = 1,
}: {
  className?: string;
  opacity?: number;
}) {
  const blobs: Blob[] = [
    { color: "rgba(59,130,246,0.22)", size: 620, left: "8%", top: "0%", path: { x: [0, 130, -60, 0], y: [0, -80, 70, 0], s: [1, 1.18, 0.94, 1] }, dur: 19 },
    { color: "rgba(124,58,237,0.20)", size: 560, left: "62%", top: "10%", path: { x: [0, -110, 80, 0], y: [0, 90, -60, 0], s: [1, 0.9, 1.15, 1] }, dur: 23 },
    { color: "rgba(14,165,233,0.16)", size: 520, left: "35%", top: "45%", path: { x: [0, 90, -120, 0], y: [0, -70, 40, 0], s: [1, 1.12, 0.96, 1] }, dur: 29 },
  ];

  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} style={{ opacity }}>
      {blobs.map((b, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full blur-3xl"
          style={{ width: b.size, height: b.size, left: b.left, top: b.top, background: b.color }}
          animate={{ x: b.path.x, y: b.path.y, scale: b.path.s }}
          transition={{ duration: b.dur, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      {/* Fractal-noise distortion layer — a fixed turbulence texture that
          slowly drifts and breathes over the aurora so the surface never
          reads as a flat gradient. Transform-only, so it stays cheap. */}
      <motion.div
        className="absolute -inset-1/4"
        style={{
          backgroundImage: `url("${NOISE_URI}")`,
          backgroundSize: "220px 220px",
          mixBlendMode: "overlay",
          opacity: 0.5,
        }}
        animate={{ x: [0, 24, -16, 0], y: [0, -20, 14, 0], scale: [1, 1.06, 0.98, 1] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

/* Inline SVG fractal noise (feTurbulence) as a data URI — no network, no
   per-frame filter cost, just a tiled texture we transform. */
const NOISE_URI =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'>` +
      `<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/>` +
      `<feColorMatrix type='saturate' values='0'/></filter>` +
      `<rect width='100%' height='100%' filter='url(#n)' opacity='0.55'/></svg>`
  );
