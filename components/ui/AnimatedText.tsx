"use client";

import { motion, type Variants } from "framer-motion";
import { type ElementType } from "react";
import { EASE_LUX } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Props = {
  text: string;
  /** Split granularity. */
  by?: "char" | "word";
  as?: ElementType;
  className?: string;
  /** Force play/stop. When omitted, reveals on scroll into view (once). */
  play?: boolean;
  delay?: number;
  stagger?: number;
  once?: boolean;
};

const container = (stagger: number, delay: number): Variants => ({
  hidden: {},
  visible: {
    transition: { staggerChildren: stagger, delayChildren: delay },
  },
});

const child: Variants = {
  hidden: { y: "115%", opacity: 0, filter: "blur(14px)" },
  visible: {
    y: "0%",
    opacity: 1,
    filter: "blur(0px)",
    transition: { duration: 0.9, ease: EASE_LUX },
  },
};

/**
 * Editorial text reveal. Words are masked; each unit rises from below,
 * un-blurring as it lands — the house style for every headline.
 */
export function AnimatedText({
  text,
  by = "word",
  as = "span",
  className,
  play,
  delay = 0,
  stagger = by === "char" ? 0.028 : 0.06,
  once = true,
}: Props) {
  const Tag = motion[as as "span"] as typeof motion.span;
  const words = text.split(" ");

  const animateProps =
    play === undefined
      ? { whileInView: "visible" as const, viewport: { once, amount: 0.6 } }
      : { animate: play ? ("visible" as const) : ("hidden" as const) };

  return (
    <Tag
      className={cn("inline-block", className)}
      variants={container(stagger, delay)}
      initial="hidden"
      {...animateProps}
      aria-label={text}
    >
      {words.map((word, wi) => (
        <span
          key={wi}
          className="relative inline-block overflow-hidden align-top"
          aria-hidden
          style={{ paddingBottom: "0.12em", marginBottom: "-0.12em" }}
        >
          {by === "char" ? (
            word.split("").map((ch, ci) => (
              <motion.span key={ci} variants={child} className="inline-block will-change-transform">
                {ch}
              </motion.span>
            ))
          ) : (
            <motion.span variants={child} className="inline-block will-change-transform">
              {word}
            </motion.span>
          )}
          {wi < words.length - 1 && <span className="inline-block">&nbsp;</span>}
        </span>
      ))}
    </Tag>
  );
}
