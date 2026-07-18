"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { ShaderBackground } from "./ShaderBackground";
import { Particles } from "./Particles";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useIsMobile } from "@/hooks/useMediaQuery";

/**
 * GPU layer for the hero. Rendered client-only (dynamic ssr:false).
 * A CSS gradient sits behind it as a graceful fallback, so a WebGL
 * failure still looks intentional. The render loop pauses whenever the
 * hero scrolls out of view so it never taxes the rest of the page, and
 * DPR is capped to keep the shader affordable.
 */
export default function HeroCanvas() {
  const reduced = usePrefersReducedMotion();
  const mobile = useIsMobile();
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "120px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const active = !reduced && visible;

  return (
    <div ref={ref} className="absolute inset-0">
      {/* Fallback / base wash — always visible behind the canvas. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 10%, rgba(59,130,246,0.14), transparent 55%), radial-gradient(90% 70% at 80% 90%, rgba(124,58,237,0.12), transparent 60%), #050505",
        }}
      />
      <Canvas
        className="!absolute inset-0"
        dpr={reduced ? 1 : [1, mobile ? 1.25 : 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, 5], fov: 75 }}
        frameloop={active ? "always" : "never"}
      >
        <ShaderBackground />
        {!reduced && <Particles count={mobile ? 200 : 320} />}
      </Canvas>
    </div>
  );
}
