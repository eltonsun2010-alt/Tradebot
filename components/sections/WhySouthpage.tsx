"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { useReducedMotion, useScroll } from "framer-motion";
import { WHY_CARDS } from "@/lib/data";
import { useIsMobile } from "@/hooks/useMediaQuery";

const LightCorridorCanvas = dynamic(() => import("@/components/canvas/LightCorridorCanvas"), {
  ssr: false,
});

/* ==================================================================== *
 * The Light Corridor. The visitor walks through one contemporary
 * building where each principle is a curated exhibit built permanently
 * into the architecture — a recessed stone display, an illuminated glass
 * panel, a monumental etched wall. The camera faces the way it travels;
 * the layout of each room draws the eye to its feature wall, the view
 * turns to appreciate the piece, then turns back and continues. The
 * content lives in the building, never as an overlay on top of it.
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

// The four automation capabilities, exposed to assistive tech (the in-scene
// lettering is decorative to a screen reader).
const AUTO_CAPS = ["Workflow Automation", "AI Assistants", "Business Integrations", "Customer Systems"];

function LightCorridor() {
  const sectionRef = useRef<HTMLElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const autoIntroRef = useRef<HTMLDivElement>(null);
  const autoOutroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const p = scrollYProgress.get();
      // the entrance title dissolves as the visitor steps inside; from there
      // every principle is read off the ribbon itself, never off an overlay
      if (introRef.current) {
        introRef.current.style.opacity = (1 - smoothstep(0.012, 0.05, p)).toFixed(3);
      }
      // the same ribbon travels on into Automation: the chapter title rises as
      // it begins to split, and the resolution as the pathways merge back
      if (autoIntroRef.current) {
        autoIntroRef.current.style.opacity = (smoothstep(0.55, 0.61, p) * (1 - smoothstep(0.65, 0.70, p))).toFixed(3);
      }
      if (autoOutroRef.current) {
        // the resolution holds, then clears as the single ribbon begins its dive
        autoOutroRef.current.style.opacity = (smoothstep(0.84, 0.88, p) * (1 - smoothstep(0.9, 0.93, p))).toFixed(3);
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
      // the one journey — the six principles and the Automation transformation
      // of the same ribbon — over a single continuous scroll
      style={{ height: "1720vh" }}
    >
      <div className="sticky top-0 h-screen overflow-hidden bg-ink">
        {/* the living ribbon of light travelling the void */}
        <LightCorridorCanvas eventSource={sectionRef} scroll={scrollYProgress} count={N} />

        {/* a deep vignette to sink the void into black at the frame edges */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(135% 100% at 50% 45%, transparent 52%, rgba(0,0,0,0.9))" }}
        />

        {/* the entrance — the only overlay, and it dissolves as the light carries you in */}
        <div ref={introRef} className="pointer-events-none absolute inset-x-0 top-[24vh] flex flex-col items-center text-center section-x">
          <div className="mb-6 flex items-center gap-4">
            <span className="h-px w-12 bg-accent" />
            <span className="text-eyebrow text-paper-dim">Why choose Southpage</span>
          </div>
          <h2 className="max-w-2xl font-display text-[clamp(2.2rem,4.6vw,3.6rem)] font-extrabold leading-[1.04] tracking-[-0.025em] text-paper">
            Follow the light.
          </h2>
          <p className="mt-7 text-eyebrow text-paper-faint">Scroll to drift &darr;</p>
        </div>

        {/* the Automation chapter — same ribbon, further along. Its title rises
            as the ribbon begins to split, over the same continuous scroll */}
        <div ref={autoIntroRef} className="pointer-events-none absolute inset-x-0 top-[22vh] flex flex-col items-center text-center section-x" style={{ opacity: 0 }}>
          <div className="mb-6 flex items-center gap-4">
            <span className="h-px w-12 bg-violet" />
            <span className="text-eyebrow text-paper-dim">Smart automation</span>
          </div>
          <h2 className="max-w-2xl font-display text-[clamp(2.2rem,4.6vw,3.6rem)] font-extrabold leading-[1.04] tracking-[-0.025em] text-paper">
            One stream. Many systems.
          </h2>
        </div>

        {/* the resolution — rises as the pathways rejoin the one ribbon */}
        <div ref={autoOutroRef} className="pointer-events-none absolute inset-x-0 bottom-[16vh] flex flex-col items-center text-center section-x" style={{ opacity: 0 }}>
          <p className="max-w-xl font-display text-[clamp(1.4rem,2.6vw,2.2rem)] font-bold leading-[1.15] tracking-[-0.02em] text-paper">
            Complex systems become simple.
          </p>
        </div>


        {/* the same principles and capabilities, exposed to assistive tech (the
            3D lettering is decorative to a screen reader) */}
        <ul className="sr-only">
          {WHY_CARDS.map((card, i) => (
            <li key={card.title}>
              {idx(i)}. {card.title}. {card.body}
            </li>
          ))}
          {AUTO_CAPS.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </div>

      {/* anchor for the Automation chapter, roughly where the ribbon splits */}
      <div id="automation" className="pointer-events-none absolute" style={{ top: "62%" }} aria-hidden />
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
