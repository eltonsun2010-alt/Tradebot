"use client";

/**
 * Animated film grain. A single static noise texture is cheap to render;
 * the `grain-shift` keyframes jitter it so the surface reads as alive
 * without re-computing turbulence every frame.
 */
const NOISE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>
      <filter id='n'>
        <feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/>
        <feColorMatrix type='saturate' values='0'/>
      </filter>
      <rect width='100%' height='100%' filter='url(#n)'/>
    </svg>`
  );

export function GrainOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[200] opacity-[0.045] mix-blend-overlay"
      style={{
        backgroundImage: `url("${NOISE}")`,
        backgroundSize: "200px 200px",
        animation: "grain-shift 8s steps(6) infinite",
      }}
    />
  );
}
