"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AnimatedText } from "@/components/ui/AnimatedText";

/**
 * Premium entrance: wordmark reveal → live 0→100 counter → curtain wipe.
 * Calls onComplete once the panel has fully cleared the viewport.
 */
export function Loader({ onComplete }: { onComplete: () => void }) {
  const [count, setCount] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const done = useRef(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const start = performance.now();
    const DURATION = 1900;
    let raf = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      const eased = 1 - Math.pow(1 - t, 3);
      setCount(Math.round(eased * 100));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else if (!done.current) {
        done.current = true;
        setTimeout(() => setLeaving(true), 400);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[500] flex flex-col items-center justify-center bg-ink"
      initial={{ clipPath: "inset(0 0 0% 0)" }}
      animate={leaving ? { clipPath: "inset(0 0 100% 0)" } : {}}
      transition={{ duration: 1.1, ease: [0.83, 0, 0.17, 1] }}
      onAnimationComplete={() => {
        if (leaving) {
          document.body.style.overflow = "";
          onComplete();
        }
      }}
    >
      <motion.div
        animate={leaving ? { y: -40, opacity: 0 } : {}}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center"
      >
        <AnimatedText
          text="SOUTHPAGE"
          by="char"
          as="h1"
          play
          stagger={0.05}
          className="font-display text-[13vw] font-extrabold leading-none tracking-[-0.04em] sm:text-[9vw] md:text-8xl"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-6 flex items-center gap-4 text-eyebrow text-paper-dim"
        >
          <span>Design Studio</span>
          <span className="h-px w-8 bg-line-strong" />
          <span>Est. 2019</span>
        </motion.div>
      </motion.div>

      {/* Counter + progress line, anchored bottom. */}
      <div className="absolute bottom-8 left-0 right-0 section-x">
        <div className="flex items-end justify-between">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="font-display text-6xl font-bold tabular-nums text-paper md:text-8xl"
          >
            {count}
            <span className="text-2xl text-paper-faint md:text-3xl">%</span>
          </motion.span>
          <span className="mb-2 hidden text-eyebrow text-paper-faint sm:block">
            Crafting the experience
          </span>
        </div>
        <div className="mt-4 h-px w-full bg-line">
          <motion.div
            className="h-full bg-gradient-to-r from-accent to-violet"
            style={{ width: `${count}%` }}
          />
        </div>
      </div>
    </motion.div>
  );
}
