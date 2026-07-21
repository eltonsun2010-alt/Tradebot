"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { useLenis } from "@/components/providers/SmoothScrollProvider";
import { cn } from "@/lib/utils";

/* ==================================================================== *
 * The cinematic navigation. Not a header — a quiet orientation system
 * that lives at the edge of the ribbon world: a thin progress line, a
 * column of section markers that light one at a time, and the current
 * chapter named in fine typography. It tells you where you are and lets
 * you move, without ever competing with the light.
 * ==================================================================== */

const MARKERS = [
  { id: "top", label: "Home" },
  { id: "services", label: "Services" },
  { id: "why", label: "The Light" },
  { id: "automation", label: "Automation" },
  { id: "process", label: "Process" },
  { id: "portfolio", label: "Work" },
  { id: "pricing", label: "Pricing" },
  { id: "faq", label: "FAQ" },
  { id: "contact", label: "Contact" },
] as const;

export function CinematicNav() {
  const { scrollTo } = useLenis();
  const [active, setActive] = useState(0);
  const [entered, setEntered] = useState(false);
  const { scrollYProgress } = useScroll();
  const fill = useSpring(scrollYProgress, { stiffness: 110, damping: 30, mass: 0.3 });

  useEffect(() => {
    const id = window.setTimeout(() => setEntered(true), 400);
    const onScroll = () => {
      // scroll-spy: the active chapter is the last whose start has passed the
      // reading line ~40% down the viewport
      const ref = window.innerHeight * 0.4;
      let a = 0;
      MARKERS.forEach((m, i) => {
        const el = document.getElementById(m.id);
        if (el && el.getBoundingClientRect().top <= ref) a = i;
      });
      setActive(a);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const go = (mid: string) => scrollTo(mid === "top" ? 0 : `#${mid}`);

  return (
    <>
      {/* the wordmark — brand and a way home, a mark in the void, never a bar */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: entered ? 1 : 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        onClick={() => go("top")}
        aria-label="Back to top"
        className="group fixed left-5 top-5 z-[340] flex items-center gap-2 md:left-7 md:top-7"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-50" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
        </span>
        <span className="font-display text-sm font-bold tracking-[0.28em] text-paper/70 transition-colors duration-500 group-hover:text-paper">
          SOUTHPAGE
        </span>
      </motion.button>

      {/* the rail — progress line, section markers, and the active chapter name */}
      <motion.nav
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: entered ? 1 : 0, x: entered ? 0 : 12 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        aria-label="Sections"
        className="fixed right-4 top-1/2 z-[340] -translate-y-1/2 md:right-7"
      >
        <div className="relative flex flex-col items-end gap-4 md:gap-5">
          {/* the faint rail and its glowing progress fill, running the markers */}
          <span aria-hidden className="absolute right-[3.5px] top-1 bottom-1 w-px bg-paper/10" />
          <motion.span
            aria-hidden
            style={{ scaleY: fill }}
            className="absolute right-[3.5px] top-1 bottom-1 w-px origin-top bg-gradient-to-b from-accent via-accent-bright to-violet"
          />

          {MARKERS.map((m, i) => {
            const on = i === active;
            return (
              <button
                key={m.id}
                onClick={() => go(m.id)}
                data-cursor="hover"
                aria-current={on ? "true" : undefined}
                className="group relative flex items-center gap-3 py-1 pl-6"
              >
                {/* chapter name — present for the active section, whispered on hover */}
                <span
                  className={cn(
                    "text-[0.6rem] font-medium uppercase tracking-[0.3em] transition-all duration-500",
                    on
                      ? "translate-x-0 text-paper opacity-100"
                      : "translate-x-1 text-paper-dim opacity-0 group-hover:translate-x-0 group-hover:opacity-70",
                  )}
                >
                  {m.label}
                </span>
                {/* the marker dot, with a soft halo when it is the one you're in */}
                <span className="relative flex h-2 w-2 items-center justify-center">
                  {on && (
                    <motion.span
                      layoutId="nav-halo"
                      className="absolute h-4 w-4 rounded-full bg-accent/25 blur-[3px]"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <span
                    className={cn(
                      "relative rounded-full transition-all duration-500",
                      on ? "h-2 w-2 bg-accent" : "h-1.5 w-1.5 bg-paper/30 group-hover:bg-paper/60",
                    )}
                  />
                </span>
              </button>
            );
          })}
        </div>
      </motion.nav>
    </>
  );
}
