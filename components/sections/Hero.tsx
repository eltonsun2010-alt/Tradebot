"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { AnimatedText } from "@/components/ui/AnimatedText";
import { GradientReveal } from "@/components/ui/GradientReveal";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { useLenis } from "@/components/providers/SmoothScrollProvider";

const HeroCanvas = dynamic(() => import("@/components/canvas/HeroCanvas"), {
  ssr: false,
});

const TRUST = [
  "Custom-built for your business",
  "Mobile-first & lightning fast",
  "Designed to grow with you",
];

export function Hero({ play }: { play: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollTo } = useLenis();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -140]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);

  return (
    <section
      ref={ref}
      id="top"
      className="relative flex min-h-[100svh] w-full items-center overflow-hidden py-28"
    >
      <motion.div style={{ y: bgY, scale: bgScale }} className="absolute inset-0">
        <HeroCanvas />
      </motion.div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink/40 via-transparent to-ink" />

      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 w-full section-x"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={play ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 flex items-center gap-4"
        >
          <span className="h-px w-12 bg-accent" />
          <span className="text-eyebrow text-paper-dim">
            Premium Websites &amp; Smart Automation
          </span>
        </motion.div>

        <h1 className="max-w-5xl text-hero font-display font-extrabold text-paper">
          <span className="block">
            <AnimatedText text="Your website should be" by="word" play={play} />
          </span>
          <span className="block">
            <AnimatedText text="closing deals" by="word" play={play} delay={0.25} />{" "}
            <GradientReveal text="while you're not looking." delay={0.4} />
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={play ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 1, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 max-w-xl text-base leading-relaxed text-paper-dim md:text-lg"
        >
          Your website is often the first impression your business makes — and
          first impressions matter. We build custom websites and smart automation
          systems that help you build trust, simplify enquiries, and present your
          business with confidence.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={play ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 1.15, ease: [0.16, 1, 0.3, 1] }}
          className="mt-9 flex flex-wrap items-center gap-4"
        >
          <MagneticButton
            as="button"
            onClick={() => scrollTo("#contact")}
            cursorLabel="Let's go"
            className="rounded-full bg-paper px-7 py-4 text-sm font-semibold text-ink"
          >
            Start Your Project
          </MagneticButton>
          <MagneticButton
            as="button"
            onClick={() => scrollTo("#portfolio")}
            className="rounded-full border border-line-strong px-7 py-4 text-sm font-medium text-paper transition-colors hover:border-accent"
          >
            View Our Work
          </MagneticButton>
        </motion.div>

        <motion.ul
          initial={{ opacity: 0 }}
          animate={play ? { opacity: 1 } : {}}
          transition={{ duration: 1, delay: 1.4 }}
          className="mt-10 flex flex-wrap gap-x-8 gap-y-3"
        >
          {TRUST.map((t) => (
            <li key={t} className="flex items-center gap-2 text-sm text-paper-dim">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-accent/15 text-[11px] text-accent-bright">
                ✓
              </span>
              {t}
            </li>
          ))}
        </motion.ul>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={play ? { opacity: 1 } : {}}
        transition={{ delay: 1.8, duration: 1 }}
        className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3"
      >
        <span className="text-[10px] uppercase tracking-[0.3em] text-paper-faint">
          Scroll to explore
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
