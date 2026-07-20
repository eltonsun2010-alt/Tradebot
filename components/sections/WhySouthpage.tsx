"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { useReducedMotion, useScroll } from "framer-motion";
import { WHY_CARDS } from "@/lib/data";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { stationReveal } from "@/components/canvas/LightCorridorCanvas";

const LightCorridorCanvas = dynamic(() => import("@/components/canvas/LightCorridorCanvas"), {
  ssr: false,
});

/* ==================================================================== *
 * The Light Corridor. The visitor floats through a monumental hall of
 * glass pillars rising from a dark reflective floor. The architecture
 * itself presents each principle: the pillars part, the space fills with
 * that principle's colour of light, and an editorial panel settles into
 * the opening. Only one commands the space at a time; the rest recede
 * into an infinite black volume.
 * ==================================================================== */

export function WhySouthpage() {
  const reduced = useReducedMotion();
  const mobile = useIsMobile();
  if (mobile || reduced) return <CorridorStacked />;
  return <LightCorridor />;
}

const N = WHY_CARDS.length;
const idx = (i: number) => String(i + 1).padStart(2, "0");
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

function LightCorridor() {
  const sectionRef = useRef<HTMLElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const panels = useRef<(HTMLDivElement | null)[]>([]);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const p = scrollYProgress.get();
      let activity = 0;
      for (let i = 0; i < N; i += 1) {
        // the panel settles into the opening as the camera rounds the corner
        // and the pillars part — one installation at a time
        const reveal = stationReveal(p, i);
        activity = Math.max(activity, reveal);
        const el = panels.current[i];
        if (el) {
          el.style.opacity = reveal.toFixed(3);
          el.style.filter = `blur(${((1 - reveal) * 5).toFixed(2)}px)`;
          const rise = (1 - reveal) * 26;
          el.style.transform = `translateY(${rise.toFixed(1)}px) scale(${(0.94 + 0.06 * reveal).toFixed(3)})`;
          el.style.pointerEvents = reveal > 0.7 ? "auto" : "none";
        }
      }
      if (glowRef.current) glowRef.current.style.opacity = (0.16 + activity * 0.5).toFixed(3);
      if (introRef.current) {
        introRef.current.style.opacity = (1 - smoothstep(0.015, 0.06, p)).toFixed(3);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [scrollYProgress]);

  return (
    <section
      id="why"
      ref={sectionRef}
      className="relative border-t border-line bg-ink"
      style={{ height: `${N * 128 + 120}vh` }}
    >
      <div className="sticky top-0 h-screen overflow-hidden bg-ink">
        {/* the architecture */}
        <LightCorridorCanvas eventSource={sectionRef} scroll={scrollYProgress} count={N} />

        {/* cinematic key light on the active installation + a deep vignette */}
        <div
          ref={glowRef}
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(38% 44% at 50% 44%, rgba(150,180,255,0.12), transparent 72%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(125% 100% at 50% 40%, transparent 38%, rgba(0,0,0,0.9))" }}
        />

        {/* editorial exhibits, settled into the opening between the pillars */}
        {WHY_CARDS.map((card, i) => (
          <div
            key={card.title}
            ref={(el) => {
              panels.current[i] = el;
            }}
            className="absolute inset-0 flex items-center justify-center opacity-0 will-change-[opacity,transform,filter]"
          >
            <div className="w-[min(32rem,84vw)] text-center">
              <span className="font-display text-xs font-semibold tracking-[0.34em] text-accent-bright">
                {idx(i)}
              </span>
              <h3 className="mx-auto mt-6 max-w-[16ch] font-display text-[clamp(2.2rem,4.4vw,3.6rem)] font-extrabold leading-[1.0] tracking-[-0.035em] text-white">
                {card.title}
              </h3>
              <p className="mx-auto mt-7 max-w-sm text-[0.95rem] leading-relaxed text-white/60">{card.body}</p>
            </div>
          </div>
        ))}

        {/* the entrance */}
        <div ref={introRef} className="pointer-events-none absolute inset-x-0 top-[26vh] flex flex-col items-center text-center section-x">
          <div className="mb-6 flex items-center gap-4">
            <span className="h-px w-12 bg-accent" />
            <span className="text-eyebrow text-paper-dim">Why choose Southpage</span>
          </div>
          <h2 className="max-w-2xl font-display text-[clamp(2.2rem,4.6vw,3.6rem)] font-extrabold leading-[1.04] tracking-[-0.025em] text-paper">
            Built with intention.
          </h2>
          <p className="mt-7 text-eyebrow text-paper-faint">Enter the corridor &darr;</p>
        </div>
      </div>
    </section>
  );
}

/* --------------- mobile / reduced motion: a calm editorial list --------------- */
function CorridorStacked() {
  return (
    <section id="why" className="relative border-t border-line bg-ink py-24 section-x">
      <div className="mb-16 text-center">
        <div className="mb-5 flex items-center justify-center gap-4">
          <span className="h-px w-12 bg-accent" />
          <span className="text-eyebrow text-paper-dim">Why choose Southpage</span>
        </div>
        <h2 className="mx-auto max-w-md font-display text-3xl font-extrabold leading-[1.05] tracking-[-0.02em] text-paper">
          Built with intention.
        </h2>
      </div>
      <div className="mx-auto flex max-w-lg flex-col gap-14">
        {WHY_CARDS.map((card, i) => (
          <div key={card.title} className="text-center">
            <span className="font-display text-xs font-semibold tracking-[0.28em] text-accent-bright">
              {idx(i)}
            </span>
            <h3 className="mt-4 font-display text-[2rem] font-extrabold leading-[1.05] tracking-[-0.03em] text-paper">
              {card.title}
            </h3>
            <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-paper-dim">{card.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
