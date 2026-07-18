"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { NAV_LINKS } from "@/lib/data";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { FullscreenMenu } from "./FullscreenMenu";
import { useLenis } from "@/components/providers/SmoothScrollProvider";
import { cn } from "@/lib/utils";

export function Navbar({ immediate = false }: { immediate?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollTo } = useLenis();
  const pathname = usePathname();
  const router = useRouter();
  const onHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // On home: smooth-scroll to the section. Off home: route home, then to it.
  const goTo = (href: string) => {
    if (onHome) scrollTo(href);
    else router.push(`/${href}`);
  };
  const goHome = () => {
    if (onHome) scrollTo(0);
    else router.push("/");
  };

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, delay: immediate ? 0.2 : 2.6, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "fixed inset-x-0 top-0 z-[350] section-x transition-all duration-500",
          scrolled ? "py-3" : "py-6"
        )}
      >
        <div
          className={cn(
            "flex items-center justify-between rounded-full px-4 py-1 transition-all duration-500",
            scrolled ? "glass" : "bg-transparent"
          )}
        >
          {/* Logo */}
          <button
            onClick={goHome}
            data-cursor="hover"
            className="group flex items-center gap-2 py-2"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
            </span>
            <span className="font-display text-lg font-bold tracking-[0.04em] text-paper">
              SOUTHPAGE
            </span>
          </button>

          {/* Desktop links */}
          <nav className="hidden items-center gap-9 lg:flex">
            {NAV_LINKS.map((link) => (
              <button
                key={link.href}
                onClick={() => goTo(link.href)}
                data-cursor="hover"
                className="group relative py-1 text-sm text-paper-dim transition-colors hover:text-paper"
              >
                {link.label}
                <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-accent transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-full" />
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <MagneticButton
              as="button"
              onClick={() => goTo("#contact")}
              cursorLabel="Say hi"
              className="hidden rounded-full border border-line-strong px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:border-accent sm:inline-flex"
            >
              Get a Free Quote
            </MagneticButton>

            {/* Menu toggle */}
            <button
              onClick={() => setOpen((v) => !v)}
              data-cursor="hover"
              aria-label={open ? "Close menu" : "Open menu"}
              className="relative z-[420] flex h-11 w-11 flex-col items-center justify-center gap-[5px] rounded-full border border-line-strong transition-colors hover:border-accent"
            >
              <span
                className={cn(
                  "block h-px w-4 bg-paper transition-all duration-300",
                  open && "translate-y-[3px] rotate-45"
                )}
              />
              <span
                className={cn(
                  "block h-px w-4 bg-paper transition-all duration-300",
                  open && "-translate-y-[3px] -rotate-45"
                )}
              />
            </button>
          </div>
        </div>
      </motion.header>

      <FullscreenMenu open={open} onClose={() => setOpen(false)} />
    </>
  );
}
