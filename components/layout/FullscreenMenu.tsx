"use client";

import { AnimatePresence, motion, type Variants } from "framer-motion";
import { NAV_LINKS, SOCIALS } from "@/lib/data";
import { useLenis } from "@/components/providers/SmoothScrollProvider";
import { EASE_CURTAIN, EASE_LUX } from "@/lib/motion";
import { useEffect } from "react";

const overlay: Variants = {
  hidden: { clipPath: "inset(0 0 100% 0)" },
  visible: {
    clipPath: "inset(0 0 0% 0)",
    transition: { duration: 0.9, ease: EASE_CURTAIN },
  },
  exit: {
    clipPath: "inset(100% 0 0 0)",
    transition: { duration: 0.7, ease: EASE_CURTAIN },
  },
};

const list: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.25 } },
  exit: {},
};

const item: Variants = {
  hidden: { y: "120%" },
  visible: { y: "0%", transition: { duration: 0.8, ease: EASE_LUX } },
  exit: { y: "-120%", transition: { duration: 0.4 } },
};

export function FullscreenMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { scrollTo } = useLenis();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const go = (href: string) => {
    onClose();
    setTimeout(() => scrollTo(href), 500);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          variants={overlay}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-[400] flex flex-col justify-center bg-ink-soft section-x"
        >
          {/* Ambient glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              background:
                "radial-gradient(60% 60% at 80% 20%, rgba(59,130,246,0.14), transparent 60%), radial-gradient(50% 50% at 10% 90%, rgba(124,58,237,0.12), transparent 60%)",
            }}
          />

          <motion.nav
            variants={list}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative"
          >
            <ul className="flex flex-col gap-1 md:gap-2">
              {NAV_LINKS.map((link, i) => (
                <li key={link.href} className="overflow-hidden">
                  <motion.button
                    variants={item}
                    onClick={() => go(link.href)}
                    data-cursor="hover"
                    className="group flex items-baseline gap-6 font-display text-6xl font-bold tracking-[-0.03em] text-paper transition-colors hover:text-accent-bright md:text-8xl"
                  >
                    <span className="font-sans text-sm font-normal tabular-nums text-paper-faint">
                      0{i + 1}
                    </span>
                    <span className="relative inline-block">
                      {link.label}
                      <span className="absolute -bottom-1 left-0 h-[3px] w-0 bg-accent transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-full" />
                    </span>
                  </motion.button>
                </li>
              ))}
            </ul>
          </motion.nav>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.7 } }}
            exit={{ opacity: 0 }}
            className="relative mt-16 flex flex-col gap-8 border-t border-line pt-8 md:flex-row md:items-end md:justify-between"
          >
            <div>
              <p className="text-eyebrow text-paper-faint">Get in touch</p>
              <a
                href="mailto:hello@southpage.studio"
                data-cursor="hover"
                className="mt-2 block font-display text-2xl text-paper transition-colors hover:text-accent-bright md:text-3xl"
              >
                hello@southpage.studio
              </a>
            </div>
            <ul className="flex flex-wrap gap-x-8 gap-y-2">
              {SOCIALS.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    data-cursor="hover"
                    className="text-sm text-paper-dim transition-colors hover:text-paper"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
