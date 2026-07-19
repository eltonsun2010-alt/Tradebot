"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useRef, useState, type RefObject } from "react";
import { LightHelix } from "./LightHelix";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useIsMobile } from "@/hooks/useMediaQuery";

/**
 * WebGL layer for the Light Helix. Rendered client-only. The render loop
 * pauses whenever the section scrolls out of view, DPR is capped, and the
 * particle count drops on mobile. Pointer events are sourced from the whole
 * section so the parallax responds across the panel, not just over the canvas.
 */
export default function LightHelixCanvas({
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

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "160px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const active = !reduced && visible;
  const count = mobile ? 2600 : 6000;

  return (
    <div ref={ref} className="absolute inset-0">
      <Canvas
        className="!absolute inset-0"
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        dpr={reduced ? 1 : [1, mobile ? 1.5 : 2]}
        camera={{ position: [0, 0, 5], fov: 45 }}
        frameloop={active ? "always" : "never"}
        eventSource={eventSource as unknown as RefObject<HTMLElement>}
        eventPrefix="client"
      >
        <LightHelix count={count} interactive={!mobile && !reduced} scroll={scroll} />
      </Canvas>
    </div>
  );
}
