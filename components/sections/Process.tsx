"use client";

import { useRef } from "react";
import { gsap } from "@/lib/gsap";
import { PROCESS } from "@/lib/data";
import { AnimatedText } from "@/components/ui/AnimatedText";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";

/**
 * Process reads as a cinematic horizontal sequence: the section pins and the
 * track slides sideways as you scroll (GSAP + ScrollTrigger, kept in sync with
 * Lenis via the shared ticker). Below md — or with reduced motion — GSAP's
 * matchMedia simply never runs and the panels stack into a normal column.
 */
export function Process() {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

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
    <section id="process" className="relative border-t border-line">
      <div ref={root} className="relative md:h-screen md:overflow-hidden">
        <div className="flex md:h-full md:items-center">
          <div
            ref={track}
            className="flex w-full flex-col gap-20 px-6 py-24 md:w-max md:flex-row md:items-center md:gap-0 md:px-0 md:py-0"
          >
            {/* Intro panel */}
            <div className="flex shrink-0 flex-col justify-center md:h-full md:w-[52vw] md:px-[6vw]">
              <div className="mb-6 flex items-center gap-4">
                <span className="h-px w-12 bg-accent" />
                <span className="text-eyebrow text-paper-dim">The Process</span>
              </div>
              <h2 className="text-display font-display font-extrabold text-paper">
                <AnimatedText text="Idea to" by="word" />
                <br />
                <span className="font-serif text-[1.05em] font-normal italic text-gradient">
                  inevitable.
                </span>
              </h2>
              <p className="mt-8 max-w-sm text-base leading-relaxed text-paper-dim md:text-lg">
                Four phases, zero guesswork. A rhythm we&rsquo;ve refined across
                a hundred launches.
              </p>
              <div className="mt-10 hidden items-center gap-3 text-eyebrow text-paper-faint md:flex">
                <span>Scroll</span>
                <span className="h-px w-16 bg-line-strong" />
                <span aria-hidden>&rarr;</span>
              </div>
            </div>

            {/* Step panels */}
            {PROCESS.map((step, i) => (
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
