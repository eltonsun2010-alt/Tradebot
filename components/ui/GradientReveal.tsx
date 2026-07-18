"use client";

import { motion } from "framer-motion";
import { EASE_LUX } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Serif gradient accent with a masked rise reveal.
 *
 * The gradient (background-clip:text) sits on ONE span whose direct child is
 * the text — nesting it over AnimatedText's inline-block word spans stops the
 * clip from painting. The reveal is triggered on the always-visible mask, not
 * the clipped inner span, so whileInView actually fires.
 */
export function GradientReveal({
  text,
  className,
  delay = 0.12,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.span
      className="inline-block"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.6 }}
    >
      <motion.span
        className={cn(
          "inline-block font-serif font-normal italic text-gradient will-change-transform",
          className
        )}
        variants={{
          hidden: { y: "45%", opacity: 0, filter: "blur(10px)" },
          visible: {
            y: "0%",
            opacity: 1,
            filter: "blur(0px)",
            transition: { duration: 0.9, delay, ease: EASE_LUX },
          },
        }}
      >
        {text}
      </motion.span>
    </motion.span>
  );
}
