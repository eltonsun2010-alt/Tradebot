"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type RefObject } from "react";
import { useReducedMotion, useScroll, type MotionValue } from "framer-motion";
import { SERVICES } from "@/lib/data";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { ServiceCard, ICONS } from "@/components/ui/ServiceCard";
import { HELIX, scrollToRot } from "@/components/canvas/LightHelix";

const LightHelixCanvas = dynamic(() => import("@/components/canvas/LightHelixCanvas"), {
  ssr: false,
});

export function Services() {
  const reduced = useReducedMotion();
  const mobile = useIsMobile();
  if (mobile || reduced) return <ServicesCarousel showHelix={!reduced} />;
  return <ServicesJourney />;
}

/* ==================================================================== *
 * Desktop: the service cards are premium glass panels mounted on the
 * Light Helix. The WebGL layer draws the glowing double-helix; this DOM
 * layer positions each card using the SAME spiral math (same rotation,
 * pitch and camera), so the panels orbit and travel along the glowing
 * strands as one connected system. As you scroll the whole structure
 * turns: each card sweeps to the front to be read, then continues round
 * and away as the next arrives — every card stays on the strand the
 * entire time, only dimming as it swings behind.
 * ==================================================================== */
const N = SERVICES.length;
const TAU = Math.PI * 2;
const wrapAngle = (a: number) => a - TAU * Math.round(a / TAU);
const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function ServicesJourney() {
  const sectionRef = useRef<HTMLElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  return (
    <section
      id="services"
      ref={sectionRef}
      className="relative border-t border-line"
      style={{ height: `${N * 100 + 60}vh` }}
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* The glowing double-helix — the spiral path */}
        <LightHelixCanvas eventSource={sectionRef} scroll={scrollYProgress} />

        {/* The glass panels mounted on the helix, orbiting along it. The same
            loop also fades the intro heading, so they stay perfectly in sync. */}
        <HelixCards progress={scrollYProgress} introRef={introRef} />

        {/* Intro heading — the mouth of the corridor, before the first card */}
        <div ref={introRef} className="pointer-events-none absolute inset-x-0 top-0 z-40 section-x pt-28 will-change-[opacity,transform]">
          <div className="mb-5 flex items-center gap-4">
            <span className="h-px w-12 bg-accent" />
            <span className="text-eyebrow text-paper-dim">What we do</span>
          </div>
          <h2 className="max-w-lg font-display text-3xl font-extrabold leading-[1.06] tracking-[-0.02em] text-paper md:text-4xl">
            Everything your business needs to stand out online.
          </h2>
          <p className="mt-6 text-sm text-paper-faint">Scroll to travel the helix &darr;</p>
        </div>
      </div>
    </section>
  );
}

/** DOM overlay: each card projected onto the same orbiting spiral the WebGL
 *  helix uses, so the panels ride the glowing strands together. */
function HelixCards({ progress, introRef }: { progress: MotionValue<number>; introRef: RefObject<HTMLDivElement | null> }) {
  const wraps = useRef<(HTMLDivElement | null)[]>([]);
  const [focused, setFocused] = useState(-1);
  const focusedRef = useRef(-1);
  const rotEased = useRef(scrollToRot(progress.get()));

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = progress.get();
      const target = scrollToRot(s);
      rotEased.current += (target - rotEased.current) * Math.min(1, dt * 3.6);
      const rot = rotEased.current;

      // fade / lift the intro heading out as the first card arrives
      if (introRef.current) {
        introRef.current.style.opacity = (1 - smoothstep(0.04, 0.11, s)).toFixed(3);
        introRef.current.style.transform = `translateY(${(-42 * smoothstep(0, 0.12, s)).toFixed(1)}px)`;
      }

      let nextFocus = -1;
      let bestFront = -1;
      for (let i = 0; i < N; i += 1) {
        const theta = i * HELIX.DELTA;
        const phi = wrapAngle(theta - rot);
        // world position on the card orbit after the group's rotation + lift
        const worldX = HELIX.R_CARD * Math.sin(theta - rot);
        const worldZ = HELIX.R_CARD * Math.cos(theta - rot);
        const worldY = HELIX.PITCH * (rot - theta);
        const dz = HELIX.CAM_Z - worldZ; // depth from camera (always > 0)
        const sx = (worldX * HELIX.FOCAL) / dz;
        const sy = (-worldY * HELIX.FOCAL) / dz;
        // gentle depth-scale: front cards grow, back cards recede, but kept in a
        // range where an expanded front card still fits the viewport
        const scale = Math.min(1.12, Math.max(0.52, (HELIX.CAM_Z / dz) * 0.82));
        const front = Math.cos(phi) * 0.5 + 0.5; // 1 front → 0 back
        const opacity = 0.14 + 0.86 * Math.pow(front, 1.5);

        const el = wraps.current[i];
        if (el) {
          el.style.transform = `translate(-50%, -50%) translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px) scale(${scale.toFixed(3)})`;
          el.style.opacity = opacity.toFixed(3);
          el.style.zIndex = String(1000 + Math.round(worldZ * 100));
          el.style.pointerEvents = Math.abs(phi) < 0.5 ? "auto" : "none";
        }
        if (front > bestFront && Math.abs(phi) < 0.62) {
          bestFront = front;
          nextFocus = i;
        }
      }
      if (nextFocus !== focusedRef.current) {
        focusedRef.current = nextFocus;
        setFocused(nextFocus);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [progress, introRef]);

  return (
    <div className="absolute inset-0 z-30 overflow-hidden">
      {SERVICES.map((service, i) => (
        <div
          key={service.index}
          ref={(el) => {
            wraps.current[i] = el;
          }}
          className="absolute left-1/2 top-1/2 w-[330px] will-change-transform"
          style={{ transform: "translate(-50%,-50%)" }}
        >
          <ServiceCard
            icon={ICONS[i]}
            label={service.index}
            title={service.title}
            body={service.summary}
            features={service.tags}
            forceOpen={focused === i}
          />
        </div>
      ))}
    </div>
  );
}

/* --------------------- mobile: horizontal carousel --------------------- */
function ServicesCarousel({ showHelix }: { showHelix: boolean }) {
  const ref = useRef<HTMLElement>(null);
  return (
    <section id="services" ref={ref} className="relative overflow-hidden border-t border-line py-24">
      {showHelix && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[52vh] opacity-50"
          style={{
            WebkitMaskImage: "radial-gradient(70% 60% at 50% 25%, #000 25%, transparent 78%)",
            maskImage: "radial-gradient(70% 60% at 50% 25%, #000 25%, transparent 78%)",
          }}
        >
          <LightHelixCanvas eventSource={ref} />
        </div>
      )}
      <div className="relative section-x">
        <div className="mb-5 flex items-center gap-4">
          <span className="h-px w-12 bg-accent" />
          <span className="text-eyebrow text-paper-dim">What we do</span>
        </div>
        <h2 className="max-w-lg font-display text-3xl font-extrabold leading-[1.06] tracking-[-0.02em] text-paper md:text-4xl">
          Everything your business needs to stand out online.
        </h2>
      </div>
      <div className="relative mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-[max(1.25rem,5vw)] pb-6 [scrollbar-width:none]">
        {SERVICES.map((service, i) => (
          <div key={service.index} className="w-[82%] shrink-0 snap-center sm:w-[60%]">
            <ServiceCard
              icon={ICONS[i]}
              label={service.index}
              title={service.title}
              body={service.summary}
              features={service.tags}
              forceOpen
            />
          </div>
        ))}
      </div>
    </section>
  );
}
