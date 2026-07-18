"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { MANIFESTO, STATS, TIMELINE } from "@/lib/data";
import { AnimatedText } from "@/components/ui/AnimatedText";
import { ScrollRevealText } from "@/components/ui/ScrollRevealText";
import { Counter } from "@/components/ui/Counter";
import { Reveal } from "@/components/ui/Reveal";
import { EASE_LUX } from "@/lib/motion";

export function Studio() {
  return (
    <section
      id="studio"
      className="relative border-t border-line py-28 section-x md:py-40"
    >
      {/* Intro — sticky-feeling heading beside the manifesto */}
      <div className="grid gap-12 md:grid-cols-12">
        <div className="md:col-span-4">
          <div className="mb-6 flex items-center gap-4">
            <span className="h-px w-12 bg-accent" />
            <span className="text-eyebrow text-paper-dim">The Studio</span>
          </div>
          <h2 className="font-display text-[2.75rem] font-extrabold leading-[0.95] tracking-[-0.03em] text-paper md:text-6xl">
            <AnimatedText text="Not an agency." by="word" />
            {/* Serif payoff. The trigger lives on the always-visible mask
                (the inner span starts clipped, so observing it directly would
                never fire); the gradient sits on one span so it paints. */}
            <motion.span
              className="mt-1 block overflow-hidden pb-[0.12em] -mb-[0.12em]"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.8 }}
            >
              <motion.span
                className="inline-block font-serif text-[1.12em] font-normal italic text-gradient will-change-transform"
                variants={{
                  hidden: { y: "110%" },
                  visible: {
                    y: "0%",
                    transition: { duration: 0.9, delay: 0.15, ease: EASE_LUX },
                  },
                }}
              >
                A workshop.
              </motion.span>
            </motion.span>
          </h2>
        </div>

        <div className="md:col-span-8 md:pt-3">
          <ScrollRevealText
            text={MANIFESTO}
            className="max-w-3xl font-display text-2xl font-medium leading-[1.28] tracking-[-0.01em] text-paper md:text-[2.6rem]"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="mt-24 grid grid-cols-2 gap-x-8 gap-y-14 border-t border-line pt-16 md:mt-32 md:grid-cols-4">
        {STATS.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.08}>
            <Counter
              value={s.value}
              prefix={"prefix" in s ? (s.prefix as string) : ""}
              suffix={s.suffix}
              className="block font-display text-6xl font-bold tabular-nums tracking-[-0.03em] text-paper md:text-7xl"
            />
            <div className="mt-4 flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-accent" />
              <span className="text-sm text-paper-dim">{s.label}</span>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Timeline */}
      <div className="mt-28 md:mt-36">
        <div className="mb-4 flex items-center gap-4">
          <span className="text-eyebrow text-accent">Milestones</span>
          <span className="h-px w-12 bg-line-strong" />
        </div>
        <Timeline />
      </div>
    </section>
  );
}

function Timeline() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.7", "end 0.8"],
  });
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.4,
  });

  return (
    <div ref={ref} className="relative mt-14">
      {/* Rail: static track + drawing accent fill */}
      <span
        aria-hidden
        className="absolute bottom-2 left-[5px] top-2 w-px bg-line"
      >
        <motion.span
          style={{ scaleY }}
          className="block h-full w-full origin-top bg-gradient-to-b from-accent via-accent-bright to-violet"
        />
      </span>

      <ul className="space-y-16 md:space-y-24">
        {TIMELINE.map((m, i) => (
          <li key={m.year} className="relative pl-12 md:pl-20">
            <NodeDot progress={scaleY} threshold={i / (TIMELINE.length - 1)} />
            <Reveal className="max-w-2xl">
              <span className="font-display text-sm font-semibold tabular-nums tracking-[0.14em] text-paper-dim">
                {m.year}
              </span>
              <h4 className="mt-3 font-display text-2xl font-bold text-paper md:text-4xl">
                {m.title}
              </h4>
              <p className="mt-3 text-base leading-relaxed text-paper-dim md:text-lg">
                {m.body}
              </p>
            </Reveal>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NodeDot({
  progress,
  threshold,
}: {
  progress: MotionValue<number>;
  threshold: number;
}) {
  const backgroundColor = useTransform(
    progress,
    [threshold - 0.001, threshold + 0.06],
    ["rgba(250,250,250,0.16)", "#3b82f6"]
  );
  const scale = useTransform(
    progress,
    [threshold - 0.02, threshold + 0.04],
    [1, 1.4]
  );
  return (
    <motion.span
      aria-hidden
      style={{ backgroundColor, scale }}
      className="absolute left-1 top-1.5 h-2.5 w-2.5 -translate-x-1/2 rounded-full ring-4 ring-ink"
    />
  );
}
