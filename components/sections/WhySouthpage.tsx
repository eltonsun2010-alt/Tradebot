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

function LightCorridor() {
  const sectionRef = useRef<HTMLElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const p = scrollYProgress.get();
      // the entrance title dissolves as the visitor steps inside; from there
      // every principle is read off the building itself, never off an overlay
      if (introRef.current) {
        introRef.current.style.opacity = (1 - smoothstep(0.012, 0.05, p)).toFixed(3);
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
        {/* the architecture — and, built into it, the exhibits themselves */}
        <LightCorridorCanvas eventSource={sectionRef} scroll={scrollYProgress} count={N} />

        {/* a deep vignette to seat the room in shadow at the frame edges */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(130% 100% at 50% 42%, transparent 46%, rgba(0,0,0,0.82))" }}
        />

        {/* the entrance — the only overlay, and it clears as you step inside */}
        <div ref={introRef} className="pointer-events-none absolute inset-x-0 top-[24vh] flex flex-col items-center text-center section-x">
          <div className="mb-6 flex items-center gap-4">
            <span className="h-px w-12 bg-accent" />
            <span className="text-eyebrow text-paper-dim">Why choose Southpage</span>
          </div>
          <h2 className="max-w-2xl font-display text-[clamp(2.2rem,4.6vw,3.6rem)] font-extrabold leading-[1.04] tracking-[-0.025em] text-paper">
            Built with intention.
          </h2>
          <p className="mt-7 text-eyebrow text-paper-faint">Walk through &darr;</p>
        </div>

        {/* the same principles, exposed to assistive tech (the 3D lettering is
            decorative to a screen reader) */}
        <ul className="sr-only">
          {WHY_CARDS.map((card, i) => (
            <li key={card.title}>
              {idx(i)}. {card.title}. {card.body}
            </li>
          ))}
        </ul>
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
