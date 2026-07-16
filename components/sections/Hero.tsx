"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { AnimatedText } from "@/components/ui/AnimatedText";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { useLenis } from "@/components/providers/SmoothScrollProvider";
import { EASE_LUX } from "@/lib/motion";

// GPU background is client-only with a graceful CSS fallback baked in.
const HeroCanvas = dynamic(() => import("@/components/canvas/HeroCanvas"), {
  ssr: false,
});

export function Hero({ play }: { play: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollTo } = useLenis();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Foreground drifts up & fades; background parallaxes slower for depth.
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -140]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);

  return (
    <section
      ref={ref}
      className="relative flex h-[100svh] min-h-[640px] w-full items-center overflow-hidden"
    >
      <motion.div style={{ y: bgY, scale: bgScale }} className="absolute inset-0">
        <HeroCanvas />
      </motion.div>

      {/* Legibility gradient over the canvas */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink/40 via-transparent to-ink" />

      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 w-full section-x"
      >
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={play ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 flex items-center gap-4"
        >
          <span className="h-px w-12 bg-accent" />
          <span className="text-eyebrow text-paper-dim">
            Premium Web Design Studio
          </span>
        </motion.div>

        {/* Headline — three deliberate lines, the payoff set in serif italic. */}
        <h1 className="text-hero font-display font-extrabold text-paper">
          <span className="block">
            <AnimatedText text="Websites that" by="char" play={play} stagger={0.02} />
          </span>
          <span className="block">
            <AnimatedText text="feel like" by="char" play={play} delay={0.2} stagger={0.02} />
          </span>
          {/* Serif accent: single gradient span so background-clip:text paints. */}
          <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
            <motion.span
              className="inline-block font-serif text-[1.08em] font-normal italic text-gradient will-change-transform"
              initial={{ y: "115%" }}
              animate={play ? { y: "0%" } : {}}
              transition={{ duration: 1, delay: 0.5, ease: EASE_LUX }}
            >
              experiences.
            </motion.span>
          </span>
        </h1>

        {/* Subline + CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={play ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 flex max-w-5xl flex-col items-start justify-between gap-8 md:flex-row md:items-end"
        >
          <p className="max-w-md text-base leading-relaxed text-paper-dim md:text-lg">
            Southpage crafts fast, cinematic websites for brands that refuse to
            blend in. Strategy, design and engineering under one roof.
          </p>

          <div className="flex items-center gap-4">
            <MagneticButton
              as="button"
              onClick={() => scrollTo("#work")}
              cursorLabel="Explore"
              className="group overflow-hidden rounded-full bg-paper px-7 py-4 text-sm font-semibold text-ink"
            >
              <span className="relative z-10">View our work</span>
            </MagneticButton>
            <MagneticButton
              as="button"
              onClick={() => scrollTo("#contact")}
              className="rounded-full border border-line-strong px-7 py-4 text-sm font-medium text-paper transition-colors hover:border-accent"
            >
              Start a project
            </MagneticButton>
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={play ? { opacity: 1 } : {}}
        transition={{ delay: 1.6, duration: 1 }}
        className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3"
      >
        <span className="text-[10px] uppercase tracking-[0.3em] text-paper-faint">
          Scroll
        </span>
        <span className="relative h-12 w-px overflow-hidden bg-line-strong">
          <motion.span
            className="absolute left-0 top-0 h-4 w-px bg-accent"
            animate={{ y: [-16, 48] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </span>
      </motion.div>
    </section>
  );
}
