"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { PROCESS } from "@/lib/data";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";

/**
 * Process is the next chapter of the ribbon journey. It opens on the single
 * point of light the journey distilled into: that point blooms into the word
 * PROCESS and the opening lines emerge from it — inspiration resolving into
 * execution — with no hard cut. Then the section pins and its steps slide past
 * as a cinematic horizontal sequence (GSAP + ScrollTrigger, in sync with Lenis).
 * Below md — or with reduced motion — the panels simply stack into a column.
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
  const pointRef = useRef<HTMLDivElement>(null);
  const eyebrowRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);

  // The point-of-light → PROCESS reveal, driven from the threshold's real
  // scrolled position (getBoundingClientRect), so it stays exact under Lenis
  // smooth-scroll. The reveal completes early and then holds on PROCESS.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const el = threshold.current;
      if (el) {
        const range = el.offsetHeight - window.innerHeight;
        const p = range > 0 ? clamp01(-el.getBoundingClientRect().top / range) : 0;
        if (pointRef.current) {
          pointRef.current.style.opacity = (1 - smoothstep(0.14, 0.42, p)).toFixed(3);
          pointRef.current.style.transform = `scale(${(0.5 + smoothstep(0, 0.46, p) * 1.5).toFixed(3)})`;
        }
        if (eyebrowRef.current) {
          eyebrowRef.current.style.opacity = smoothstep(0.14, 0.3, p).toFixed(3);
        }
        if (titleRef.current) {
          titleRef.current.style.opacity = smoothstep(0.2, 0.38, p).toFixed(3);
          const sc = 0.82 + 0.18 * smoothstep(0.2, 0.5, p);
          titleRef.current.style.transform = `scale(${sc.toFixed(3)})`;
          titleRef.current.style.letterSpacing = `${(0.42 - 0.3 * smoothstep(0.2, 0.56, p)).toFixed(3)}em`;
        }
        if (subRef.current) {
          const s = smoothstep(0.4, 0.58, p);
          subRef.current.style.opacity = s.toFixed(3);
          subRef.current.style.transform = `translateY(${((1 - s) * 22).toFixed(1)}px)`;
        }
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
      {/* the threshold — the distilled point of light becomes the next chapter */}
      <div ref={threshold} className="relative h-[200vh]">
        <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden section-x text-center">
          {/* a faint, steady glow behind the title — the ribbon's light, held */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 m-auto h-[38vh] w-[38vh] rounded-full opacity-40"
            style={{ background: "radial-gradient(circle, rgba(150,180,255,0.28) 0%, rgba(90,120,220,0.1) 38%, transparent 66%)" }}
          />
          {/* the point of light, carried over from the end of the ribbon, blooming
              open into the title then dissolving into it */}
          <div
            ref={pointRef}
            aria-hidden
            className="pointer-events-none absolute inset-0 m-auto h-[42vh] w-[42vh] rounded-full"
            style={{
              opacity: 1,
              transform: "scale(0.5)",
              background: "radial-gradient(circle, rgba(220,232,255,0.95) 0%, rgba(150,180,255,0.5) 14%, rgba(90,120,220,0.18) 34%, transparent 62%)",
            }}
          />

          <div ref={eyebrowRef} className="relative mb-7 flex items-center gap-4" style={{ opacity: 0 }}>
            <span className="h-px w-12 bg-accent" />
            <span className="text-eyebrow text-paper-dim">Our process</span>
          </div>

          {/* PROCESS — formed from the ribbon's energy */}
          <h2
            ref={titleRef}
            className="relative whitespace-nowrap font-display text-[clamp(2.4rem,9vw,7rem)] font-extrabold leading-none text-paper"
            style={{ opacity: 0, transform: "scale(0.82)", letterSpacing: "0.42em" }}
          >
            PROCESS
          </h2>

          <p
            ref={subRef}
            className="relative mt-10 max-w-md text-base leading-relaxed text-paper-dim md:text-lg"
            style={{ opacity: 0, transform: "translateY(22px)" }}
          >
            From inspiration into execution. Every project follows a clear,
            confident path — no confusion, no surprises, just a straightforward
            route to a website you&rsquo;re proud to launch.
          </p>
        </div>
      </div>

      {/* the steps — a cinematic horizontal sequence that grows from the same point */}
      <div ref={root} className="relative md:h-screen md:overflow-hidden">
        <div className="flex md:h-full md:items-center">
          <div
            ref={track}
            className="flex w-full flex-col gap-20 px-6 py-24 md:w-max md:flex-row md:items-center md:gap-0 md:px-0 md:py-0"
          >
            {/* a calm opening panel so the first step doesn't begin hard against the title */}
            <div className="hidden shrink-0 md:flex md:h-full md:w-[26vw] md:items-center md:px-[6vw]">
              <div className="flex items-center gap-3 text-eyebrow text-paper-faint">
                <span>Six steps</span>
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
