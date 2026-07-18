"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import { PROJECTS } from "@/lib/data";
import { AnimatedText } from "@/components/ui/AnimatedText";
import { ProjectMockup } from "@/components/ui/ProjectMockup";
import { EASE_LUX } from "@/lib/motion";
import { useIsTouch } from "@/hooks/useMediaQuery";

export function Work() {
  const touch = useIsTouch();
  const [hovered, setHovered] = useState<number | null>(null);

  // Cursor-following preview (desktop only). Springs give the card weight.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const px = useSpring(mx, { stiffness: 260, damping: 30, mass: 0.6 });
  const py = useSpring(my, { stiffness: 260, damping: 30, mass: 0.6 });

  const onMove = (e: React.MouseEvent) => {
    mx.set(e.clientX);
    my.set(e.clientY);
  };

  const active = hovered !== null ? PROJECTS[hovered] : null;

  return (
    <section
      id="work"
      onMouseMove={touch ? undefined : onMove}
      className="relative border-t border-line py-28 section-x md:py-40"
    >
      {/* Header */}
      <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
        <div>
          <div className="mb-6 flex items-center gap-4">
            <span className="text-eyebrow text-accent">Selected Work</span>
            <span className="h-px w-12 bg-line-strong" />
            <span className="text-eyebrow text-paper-faint">
              {String(PROJECTS.length).padStart(2, "0")}
            </span>
          </div>
          <h2 className="text-display font-display font-extrabold text-paper">
            <AnimatedText text="Work that earns" by="word" />
            <br />
            <AnimatedText text="a second look." by="word" delay={0.08} />
          </h2>
        </div>
        <p className="max-w-xs text-base leading-relaxed text-paper-dim md:text-right">
          Three live demo sites — each a different industry, palette and mood.
          Click any one to explore it in full.
        </p>
      </div>

      {/* Project list */}
      <ul className="mt-16 border-t border-line">
        {PROJECTS.map((p, i) => (
          <motion.li
            key={p.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.7, delay: i * 0.06, ease: EASE_LUX }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            className="group relative border-b border-line"
          >
            <Link
              href={p.demo}
              data-cursor={touch ? undefined : "view"}
              data-cursor-label="Live demo"
              className="relative grid grid-cols-[auto_1fr_auto] items-center gap-4 py-7 md:gap-8 md:py-9"
            >
              {/* Accent wash on hover */}
              <span
                className="pointer-events-none absolute inset-0 -mx-4 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100 md:-mx-8"
                style={{
                  background: `radial-gradient(80% 140% at 15% 50%, ${p.accent}22, transparent 70%)`,
                }}
              />

              <span className="relative font-display text-sm tabular-nums text-paper-faint">
                {String(i + 1).padStart(2, "0")}
              </span>

              <div className="relative min-w-0">
                <h3 className="flex items-center gap-3 font-display text-3xl font-bold tracking-[-0.02em] text-paper transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:text-5xl md:group-hover:translate-x-3">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{ background: p.accent }}
                  />
                  {p.title}
                </h3>
                <p className="mt-1 text-sm text-paper-dim md:ml-[22px]">
                  {p.category}
                </p>

                {/* Inline mockup — mobile / touch only */}
                {touch && (
                  <div className="mt-5 h-52 w-full">
                    <ProjectMockup accent={p.accent} layout={p.layout} />
                  </div>
                )}
              </div>

              <div className="relative flex items-center gap-6">
                <span className="hidden text-sm tabular-nums text-paper-faint sm:block">
                  {p.year}
                </span>
                <span
                  className="grid h-11 w-11 place-items-center rounded-full border border-line-strong text-paper transition-all duration-500 group-hover:border-transparent"
                  style={
                    hovered === i
                      ? { background: p.accent, color: "#050505" }
                      : undefined
                  }
                >
                  <Arrow />
                </span>
              </div>
            </Link>
          </motion.li>
        ))}
      </ul>

      {/* Floating cursor preview — desktop only */}
      {!touch && (
        <motion.div
          aria-hidden
          className="pointer-events-none fixed left-0 top-0 z-[150] hidden md:block"
          style={{ x: px, y: py }}
        >
          <AnimatePresence>
            {active && (
              <motion.div
                key={active.id}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.35, ease: EASE_LUX }}
                className="h-[260px] w-[380px]"
                style={{ x: "-50%", y: "-50%" }}
              >
                <ProjectMockup
                  accent={active.accent}
                  layout={active.layout}
                  className="shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]"
                />
                <p className="mt-3 text-center font-serif text-lg italic text-paper-dim">
                  {active.tagline}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </section>
  );
}

function Arrow() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
      <path
        d="M3.5 11.5 11.5 3.5M11.5 3.5H5.5M11.5 3.5V9.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
