"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { PROCESS } from "@/lib/data";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";

/**
 * Process is a new chapter. The ribbon has already delivered the visitor to its
 * entrance and left the stage, so Process no longer speaks the ribbon's
 * language: the PROCESS heading — handed over by the ribbon — settles into a
 * structured, architectural composition (a drawn baseline, a step index, a
 * confident statement) that says clarity and structure, then the steps slide
 * past as a pinned horizontal sequence. Below md / reduced motion it stacks.
 */
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export function Process() {
  const threshold = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const ruleRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);

  // The heading the ribbon delivered settles into structure — driven from the
  // panel's real scrolled position so it stays exact under Lenis smooth-scroll.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const el = threshold.current;
      if (el) {
        const range = el.offsetHeight - window.innerHeight;
        const p = range > 0 ? clamp01(-el.getBoundingClientRect().top / range) : 0;
        if (titleRef.current) {
          // after the ribbon's dark pause, the chapter opens: PROCESS settles in
          titleRef.current.style.opacity = smoothstep(0.02, 0.2, p).toFixed(3);
          titleRef.current.style.transform = `scale(${(1.06 - 0.06 * smoothstep(0.02, 0.32, p)).toFixed(3)})`;
        }
        if (indexRef.current) indexRef.current.style.opacity = smoothstep(0.12, 0.34, p).toFixed(3);
        if (ruleRef.current) ruleRef.current.style.transform = `scaleX(${smoothstep(0.18, 0.56, p).toFixed(3)})`;
        if (subRef.current) {
          const s = smoothstep(0.4, 0.64, p);
          subRef.current.style.opacity = s.toFixed(3);
          subRef.current.style.transform = `translateY(${((1 - s) * 20).toFixed(1)}px)`;
        }
        if (cueRef.current) cueRef.current.style.opacity = smoothstep(0.66, 0.86, p).toFixed(3);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useIsomorphicLayoutEffect(() => {
    const trackEl = track.current;
    const rootEl = root.current;
    if (!trackEl || !rootEl) return;

    const mm = gsap.matchMedia();
    mm.add(
      "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
      () => {
        const distance = () => trackEl.scrollWidth - window.innerWidth;
        const tween = gsap.to(trackEl, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: rootEl,
            start: "top top",
            end: () => `+=${distance()}`,
            scrub: 0.6,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });
        return () => tween.kill();
      }
    );
    return () => mm.revert();
  }, []);

  return (
    <section id="process" className="relative bg-ink">
      {/* the threshold — the delivered heading settles into a structured chapter */}
      <div ref={threshold} className="relative h-[180vh]">
        <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden section-x text-center">
          <div className="mb-7 flex items-center gap-4">
            <span className="h-px w-12 bg-accent" />
            <span className="text-eyebrow text-paper-dim">Our process</span>
          </div>

          {/* PROCESS — handed over by the ribbon, now crisp and structural */}
          <h2
            ref={titleRef}
            className="whitespace-nowrap font-display text-[clamp(2.4rem,9vw,7rem)] font-extrabold leading-none tracking-[0.12em] text-paper"
            style={{ opacity: 0, transform: "scale(1.06)" }}
          >
            PROCESS
          </h2>

          {/* a drawn baseline and a step index — the new chapter's structure */}
          <div className="mt-9 flex w-[min(30rem,78vw)] flex-col items-center gap-3">
            <div ref={ruleRef} className="h-px w-full origin-center bg-line-strong" style={{ transform: "scaleX(0)" }} />
            <div ref={indexRef} className="flex w-full items-center justify-between text-eyebrow tabular-nums text-paper-faint" style={{ opacity: 0 }}>
              <span>01</span>
              <span>Six steps</span>
              <span>0{PROCESS.length}</span>
            </div>
          </div>

          <p
            ref={subRef}
            className="mt-9 max-w-md text-base leading-relaxed text-paper-dim md:text-lg"
            style={{ opacity: 0, transform: "translateY(20px)" }}
          >
            From inspiration into execution. Every project follows a clear,
            confident path — no confusion, no surprises, just a straightforward
            route to a website you&rsquo;re proud to launch.
          </p>

          <div ref={cueRef} className="mt-12 hidden items-center gap-3 text-eyebrow text-paper-faint md:flex" style={{ opacity: 0 }}>
            <span>Scroll</span>
            <span className="h-px w-16 bg-line-strong" />
            <span aria-hidden>&rarr;</span>
          </div>
        </div>
      </div>

      {/* the steps — a structured horizontal sequence, the chapter's own language */}
      <div ref={root} className="relative border-t border-line md:h-screen md:overflow-hidden">
        <div className="flex md:h-full md:items-center">
          <div
            ref={track}
            className="flex w-full flex-col gap-20 px-6 py-24 md:w-max md:flex-row md:items-center md:gap-0 md:px-0 md:py-0"
          >
            {/* a calm opening panel so the first step doesn't begin hard against the title */}
            <div className="hidden shrink-0 md:flex md:h-full md:w-[24vw] md:items-center md:px-[6vw]">
              <div className="flex items-center gap-3 text-eyebrow text-paper-faint">
                <span>The path</span>
                <span className="h-px w-16 bg-line-strong" />
                <span aria-hidden>&rarr;</span>
              </div>
            </div>

            {/* Step panels */}
            {PROCESS.map((step) => (
              <div
                key={step.step}
                className="flex shrink-0 flex-col justify-center md:h-full md:w-[42vw] md:px-[5vw]"
              >
                {/* Connector rail — adjacent panels form a continuous line */}
                <div className="mb-10 flex items-center gap-4">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-accent" />
                  <span className="h-px flex-1 bg-line-strong" />
                  <span className="text-eyebrow tabular-nums text-paper-faint">
                    {step.step} / 0{PROCESS.length}
                  </span>
                </div>

                <span
                  aria-hidden
                  className="font-display text-[6rem] font-extrabold leading-none text-transparent md:text-[9rem]"
                  style={{ WebkitTextStroke: "1px rgba(250,250,250,0.14)" }}
                >
                  {step.step}
                </span>

                <h3 className="mt-4 font-display text-4xl font-bold tracking-[-0.02em] text-paper md:text-6xl">
                  {step.title}
                </h3>
                <p className="mt-5 max-w-md text-base leading-relaxed text-paper-dim md:text-lg">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
