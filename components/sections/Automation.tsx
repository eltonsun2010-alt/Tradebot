"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { useReducedMotion, useScroll } from "framer-motion";
import { AUTOMATIONS } from "@/lib/data";
import { useIsMobile } from "@/hooks/useMediaQuery";

const RibbonWeaveCanvas = dynamic(() => import("@/components/canvas/RibbonWeaveCanvas"), {
  ssr: false,
});

/* ==================================================================== *
 * Automation as a moment in the Light journey. The single ribbon slows,
 * gathers energy and divides into four braided strands — Workflow
 * Automation, AI Assistants, Business Integrations, Customer Systems —
 * each discovered as the camera drifts past it, before the strands
 * rejoin into one powerful stream. The visitor feels what automation
 * does before reading a word: complex systems, made simple.
 * ==================================================================== */

// the four pathways the ribbon introduces — the visual capabilities, distinct
// from the six detailed automations kept below for reading and assistive tech
const CAPABILITIES = [
  "Workflow Automation",
  "AI Assistants",
  "Business Integrations",
  "Customer Systems",
] as const;

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export function Automation() {
  const reduced = useReducedMotion();
  const mobile = useIsMobile();
  if (mobile || reduced) return <AutomationStacked />;
  return <AutomationWeave />;
}

function AutomationWeave() {
  const sectionRef = useRef<HTMLElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const outroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const p = scrollYProgress.get();
      // the opening line dissolves as the ribbon begins to divide; the closing
      // line rises only once the strands have rejoined into one stream
      if (introRef.current) introRef.current.style.opacity = (1 - smoothstep(0.04, 0.16, p)).toFixed(3);
      if (outroRef.current) outroRef.current.style.opacity = smoothstep(0.82, 0.96, p).toFixed(3);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [scrollYProgress]);

  return (
    <section
      id="automation"
      ref={sectionRef}
      className="relative bg-ink"
      style={{ height: "340vh" }}
    >
      <div className="sticky top-0 h-screen overflow-hidden bg-ink">
        {/* the ribbon becomes automation */}
        <RibbonWeaveCanvas eventSource={sectionRef} scroll={scrollYProgress} />

        {/* sink the void to black at the edges */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(135% 100% at 50% 45%, transparent 54%, rgba(0,0,0,0.9))" }}
        />

        {/* the entrance — dissolves as the stream divides */}
        <div ref={introRef} className="pointer-events-none absolute inset-x-0 top-[22vh] flex flex-col items-center text-center section-x">
          <div className="mb-6 flex items-center gap-4">
            <span className="h-px w-12 bg-violet" />
            <span className="text-eyebrow text-paper-dim">Smart automation</span>
          </div>
          <h2 className="max-w-2xl font-display text-[clamp(2.2rem,4.6vw,3.6rem)] font-extrabold leading-[1.04] tracking-[-0.025em] text-paper">
            One stream. Many systems.
          </h2>
          <p className="mt-6 max-w-md text-eyebrow text-paper-faint">Scroll to watch it divide &darr;</p>
        </div>

        {/* the resolution — rises as the strands rejoin */}
        <div ref={outroRef} className="pointer-events-none absolute inset-x-0 bottom-[16vh] flex flex-col items-center text-center section-x" style={{ opacity: 0 }}>
          <p className="max-w-xl font-display text-[clamp(1.4rem,2.6vw,2.2rem)] font-bold leading-[1.15] tracking-[-0.02em] text-paper">
            Complex systems become simple.
          </p>
        </div>

        {/* the capabilities and the detailed automations, for assistive tech */}
        <ul className="sr-only">
          {CAPABILITIES.map((c) => (
            <li key={c}>{c}</li>
          ))}
          {AUTOMATIONS.map((a) => (
            <li key={a.title}>
              {a.title}. {a.body}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* --------------- mobile / reduced motion: a calm editorial list --------------- */
function AutomationStacked() {
  return (
    <section id="automation" className="relative border-t border-line bg-ink py-24 section-x">
      <div className="mb-14 text-center">
        <div className="mb-5 flex items-center justify-center gap-4">
          <span className="h-px w-12 bg-violet" />
          <span className="text-eyebrow text-paper-dim">Smart automation</span>
        </div>
        <h2 className="mx-auto max-w-md font-display text-3xl font-extrabold leading-[1.05] tracking-[-0.02em] text-paper">
          One stream. Many systems.
        </h2>
        <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-paper-dim">
          A single connected flow that quietly runs the repetitive work — so no
          enquiry is missed and no opportunity is overlooked.
        </p>
      </div>

      <div className="mx-auto flex max-w-lg flex-col gap-12">
        {CAPABILITIES.map((c, i) => (
          <div key={c} className="text-center">
            <span className="font-display text-xs font-semibold tracking-[0.28em] text-violet">
              0{i + 1}
            </span>
            <h3 className="mt-3 font-display text-[1.9rem] font-extrabold leading-[1.05] tracking-[-0.03em] text-paper">
              {c}
            </h3>
          </div>
        ))}
      </div>

      <p className="mx-auto mt-16 max-w-md text-center font-display text-xl text-paper">
        Complex systems become simple.
      </p>
    </section>
  );
}
