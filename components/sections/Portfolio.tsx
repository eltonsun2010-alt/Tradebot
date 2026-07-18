"use client";

import { useRef, type MouseEvent } from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { CONCEPTS } from "@/lib/data";
import { AnimatedText } from "@/components/ui/AnimatedText";
import { Reveal } from "@/components/ui/Reveal";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { ProjectMockup } from "@/components/ui/ProjectMockup";
import { useLenis } from "@/components/providers/SmoothScrollProvider";
import { useIsTouch } from "@/hooks/useMediaQuery";

const LAYOUTS = ["editorial", "analytics", "portfolio", "dashboard"];

export function Portfolio() {
  const { scrollTo } = useLenis();
  return (
    <section id="portfolio" className="relative border-t border-line py-28 section-x md:py-40">
      <div className="grid gap-8 md:grid-cols-12 md:items-end">
        <div className="md:col-span-8">
          <div className="mb-6 flex items-center gap-4">
            <span className="text-eyebrow text-accent">Selected work</span>
            <span className="h-px w-12 bg-line-strong" />
          </div>
          <h2 className="text-display font-display font-extrabold text-paper">
            <AnimatedText text="Designed to demonstrate" by="word" />
            <br />
            <AnimatedText text="what's possible." by="word" delay={0.08} />
          </h2>
        </div>
        <Reveal className="md:col-span-4" delay={0.12}>
          <p className="max-w-sm text-base leading-relaxed text-paper-dim md:text-lg">
            As Southpage grows, this portfolio grows with it. Until then, these
            concept projects show our approach to modern web design, UX and
            development.
          </p>
        </Reveal>
      </div>

      <div className="mt-16 grid gap-8 md:grid-cols-2">
        {CONCEPTS.map((c, i) => (
          <Reveal key={c.title} delay={(i % 2) * 0.1}>
            <TiltCard
              title={c.title}
              words={c.words}
              body={c.body}
              accent={c.accent}
              layout={LAYOUTS[i]}
              demo={c.demo}
            />
          </Reveal>
        ))}
      </div>

      <div className="mt-14 flex justify-center">
        <MagneticButton
          as="button"
          onClick={() => scrollTo("#contact")}
          cursorLabel="Let's talk"
          className="rounded-full border border-line-strong px-8 py-4 text-sm font-medium text-paper transition-colors hover:border-accent"
        >
          See more projects
        </MagneticButton>
      </div>
    </section>
  );
}

function TiltCard({
  title,
  words,
  body,
  accent,
  layout,
  demo,
}: {
  title: string;
  words: readonly string[];
  body: string;
  accent: string;
  layout: string;
  demo: string | null;
}) {
  const touch = useIsTouch();
  const ref = useRef<HTMLDivElement>(null);
  const rx = useSpring(useMotionValue(0), { stiffness: 150, damping: 18 });
  const ry = useSpring(useMotionValue(0), { stiffness: 150, damping: 18 });

  const onMove = (e: MouseEvent) => {
    if (touch || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * 12);
    rx.set(-py * 12);
  };
  const reset = () => {
    rx.set(0);
    ry.set(0);
  };

  const inner = (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
      className="group relative rounded-3xl border border-line bg-ink-soft p-4 [perspective:1000px]"
    >
      <div style={{ transform: "translateZ(30px)" }}>
        <div
          className="relative overflow-hidden rounded-2xl p-3"
          style={{ background: `linear-gradient(160deg, ${accent}22, transparent)` }}
        >
          <div className="aspect-[16/10] w-full">
            <ProjectMockup accent={accent} layout={layout} />
          </div>
        </div>

        <div className="flex items-end justify-between px-3 pb-2 pt-6">
          <div>
            <div className="flex flex-wrap gap-2">
              {words.map((w) => (
                <span
                  key={w}
                  className="rounded-full border border-line-strong px-3 py-1 text-xs text-paper-dim"
                >
                  {w}
                </span>
              ))}
            </div>
            <h3 className="mt-4 font-display text-3xl font-bold text-paper md:text-4xl">
              {title}
            </h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-paper-dim">
              {body}
            </p>
          </div>
          <span
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-paper transition-all duration-500 group-hover:scale-110"
            style={{ background: accent, color: "#050505" }}
          >
            →
          </span>
        </div>

        <span
          className="absolute right-6 top-6 rounded-full px-3 py-1 text-[11px] font-semibold"
          style={{
            background: demo ? "#fafafa" : "rgba(250,250,250,0.1)",
            color: demo ? "#050505" : "#a1a1aa",
          }}
        >
          {demo ? "Live demo" : "Concept"}
        </span>
      </div>
    </motion.div>
  );

  return demo ? (
    <Link href={demo} data-cursor="view" data-cursor-label="Open">
      {inner}
    </Link>
  ) : (
    inner
  );
}
