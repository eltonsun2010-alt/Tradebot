"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/** Hairline progress indicator pinned to the top edge. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.3,
  });

  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed left-0 top-0 z-[300] h-[2px] w-full origin-left bg-gradient-to-r from-accent via-accent-bright to-violet"
    />
  );
}
