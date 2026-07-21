"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { FAQS } from "@/lib/data";
import { useIsMobile } from "@/hooks/useMediaQuery";

const ConstellationCanvas = dynamic(() => import("@/components/canvas/ConstellationCanvas"), {
  ssr: false,
});

/* ==================================================================== *
 * The final chapter — a constellation of questions. A quiet night sky
 * suspended in darkness where every question is a star that always
 * exists. As the visitor drifts through, one star at a time becomes the
 * focus, breaks briefly into delicate light that assembles its question,
 * and then the sky returns to stillness. Calm, minimal, memorable — the
 * place the journey resolves into trust. Below md / reduced motion it
 * becomes a calm reading catalogue.
 * ==================================================================== */

const N = FAQS.length;
const two = (i: number) => String(i + 1).padStart(2, "0");
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

export function Faq() {
  const reduced = useReducedMotion();
  const mobile = useIsMobile();
  if (mobile || reduced) return <FaqStacked />;
  return <FaqConstellation />;
}

function FaqConstellation() {
  const sectionRef = useRef<HTMLElement>(null);
  const progress = useRef(0);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const sect = sectionRef.current;
      if (sect) {
        const range = sect.offsetHeight - window.innerHeight;
        progress.current = range > 0 ? clamp01(-sect.getBoundingClientRect().top / range) : 0;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // a stable scroll accessor for the canvas rig
  const scroll = useRef({ get: () => progress.current }).current;

  return (
    <section
      id="faq"
      ref={sectionRef}
      className="relative border-t border-line bg-ink"
      style={{ height: `${N * 88 + 60}vh` }}
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* the night — almost pure black, with a single faint pool of light */}
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(125% 95% at 50% 46%, #0a0b10 0%, #050609 52%, #030305 100%)" }} />

        {/* the constellation */}
        <ConstellationCanvas eventSource={sectionRef} scroll={scroll} />

        {/* a deep vignette so the sky sinks into black at the edges */}
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(135% 108% at 50% 47%, transparent 46%, rgba(0,0,0,0.9))" }} />

        {/* the only overlay — a quiet label and an invitation to explore */}
        <div className="pointer-events-none absolute inset-x-0 top-[7vh] flex flex-col items-center text-center">
          <div className="mb-4 flex items-center gap-4">
            <span className="h-px w-12 bg-accent" />
            <span className="text-eyebrow text-paper-dim">Common questions</span>
          </div>
          <p className="text-eyebrow text-paper-faint">Drift through the sky &darr;</p>
        </div>
      </div>

      {/* the same questions and answers, exposed to assistive tech (the
          constellation is decorative to a screen reader) */}
      <ul className="sr-only">
        {FAQS.map((f) => (
          <li key={f.q}>
            {f.q} {f.a}
          </li>
        ))}
      </ul>
    </section>
  );
}

/* --------------- mobile / reduced motion: a calm reading catalogue --------------- */
function FaqStacked() {
  return (
    <section id="faq" className="relative border-t border-line bg-ink py-24 section-x">
      <div className="mb-16 text-center">
        <div className="mb-5 flex items-center justify-center gap-4">
          <span className="h-px w-12 bg-accent" />
          <span className="text-eyebrow text-paper-dim">Common questions</span>
        </div>
        <h2 className="mx-auto max-w-md font-display text-3xl font-extrabold leading-[1.05] tracking-[-0.02em] text-paper">
          The honest answers.
        </h2>
      </div>
      <div className="mx-auto flex max-w-2xl flex-col gap-12">
        {FAQS.map((f, i) => (
          <div key={f.q} className="border-b border-line pb-10">
            <span className="font-display text-xs font-semibold tracking-[0.28em] text-accent-bright">{two(i)}</span>
            <h3 className="mt-4 font-display text-xl font-bold leading-[1.2] tracking-[-0.01em] text-paper md:text-2xl">
              {f.q}
            </h3>
            <p className="mt-4 text-base leading-relaxed text-paper-dim">{f.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
