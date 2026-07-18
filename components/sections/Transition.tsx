"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/**
 * A "portal" divider: concentric rings that scale and glow as the block passes
 * through the viewport, with a line of microcopy at the centre.
 */
export function Transition({ text }: { text: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.6, 1.15, 0.6]);
  const rot = useTransform(scrollYProgress, [0, 1], [-30, 30]);
  const glow = useTransform(scrollYProgress, [0, 0.5, 1], [0.1, 0.55, 0.1]);

  return (
    <div ref={ref} className="relative flex items-center justify-center overflow-hidden py-28 section-x md:py-36">
      {/* Portal rings */}
      <motion.div
        aria-hidden
        style={{ scale, rotate: rot }}
        className="pointer-events-none absolute grid place-items-center"
      >
        {[560, 420, 300, 200].map((s, i) => (
          <span
            key={s}
            className="absolute rounded-full border"
            style={{
              width: s,
              height: s,
              borderColor: i % 2 ? "rgba(124,58,237,0.18)" : "rgba(59,130,246,0.18)",
            }}
          />
        ))}
      </motion.div>
      <motion.div
        aria-hidden
        style={{ opacity: glow }}
        className="pointer-events-none absolute h-64 w-64 rounded-full blur-3xl"
      >
        <span className="block h-full w-full rounded-full bg-gradient-to-br from-accent to-violet" />
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 max-w-xl text-balance text-center font-display text-2xl font-medium text-paper md:text-4xl"
      >
        {text}
      </motion.p>
    </div>
  );
}
