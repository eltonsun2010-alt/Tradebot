"use client";

import { useRef, type ElementType, type Ref } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Long-form copy that brightens word-by-word as the block scrolls through
 * the viewport — the signature "reading" reveal. Each word maps a slice of
 * the container's scroll progress to opacity, so the sentence lights up in
 * reading order and settles once fully on screen.
 */
export function ScrollRevealText({
  text,
  as = "p",
  className,
}: {
  text: string;
  as?: ElementType;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "end 0.55"],
  });

  const words = text.split(" ");
  const Tag = motion[as as "p"] as typeof motion.p;

  return (
    <Tag
      ref={ref as Ref<HTMLParagraphElement>}
      className={cn("flex flex-wrap", className)}
      aria-label={text}
    >
      {words.map((word, i) => {
        const start = i / words.length;
        const end = start + 1 / words.length;
        return (
          <Word key={i} progress={scrollYProgress} range={[start, end]}>
            {word}
          </Word>
        );
      })}
    </Tag>
  );
}

function Word({
  children,
  progress,
  range,
}: {
  children: string;
  progress: MotionValue<number>;
  range: [number, number];
}) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  return (
    <span className="mr-[0.28em] inline-block" aria-hidden>
      <motion.span style={{ opacity }} className="inline-block will-change-[opacity]">
        {children}
      </motion.span>
    </span>
  );
}
