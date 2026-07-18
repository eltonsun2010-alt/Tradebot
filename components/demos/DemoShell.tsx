"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { DemoRibbon } from "./DemoRibbon";

export type DemoConfig = {
  name: string;
  base: string; // "/demos/coffee"
  theme: "light" | "dark";
  fontDisplay?: string; // e.g. "var(--font-fraunces)"
  colors: {
    bg: string;
    ink: string;
    sub: string;
    accent: string;
    onAccent: string; // text colour on accent buttons
    line: string;
    panel: string;
  };
  nav: { label: string; href: string }[];
  cta: { label: string; href: string };
  contact?: { email: string; phone?: string; address?: string };
};

export function DemoShell({
  config,
  children,
}: {
  config: DemoConfig;
  children: ReactNode;
}) {
  const c = config.colors;
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const displayFont = config.fontDisplay
    ? { fontFamily: config.fontDisplay }
    : undefined;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) =>
    href === config.base ? pathname === config.base : pathname === href;

  return (
    <div style={{ background: c.bg, color: c.ink }} className="min-h-screen">
      <DemoRibbon theme={config.theme} />

      {/* Sticky nav */}
      <header
        className="fixed inset-x-0 top-0 z-[500] transition-all duration-300"
        style={{
          background: scrolled ? `${c.bg}ee` : "transparent",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          borderBottom: scrolled ? `1px solid ${c.line}` : "1px solid transparent",
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 md:px-10">
          <Link href={config.base} data-cursor="hover" className="text-xl font-bold" style={displayFont}>
            {config.name}
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            {config.nav.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                data-cursor="hover"
                className="relative transition-opacity hover:opacity-100"
                style={{ color: isActive(l.href) ? c.accent : c.sub }}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href={config.cta.href}
              data-cursor="hover"
              className="hidden rounded-full px-5 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-0.5 sm:inline-block"
              style={{ background: c.accent, color: c.onAccent }}
            >
              {config.cta.label}
            </Link>
            <button
              aria-label="Menu"
              onClick={() => setOpen((v) => !v)}
              data-cursor="hover"
              className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-full md:hidden"
              style={{ border: `1px solid ${c.line}` }}
            >
              <span className="h-px w-4" style={{ background: c.ink }} />
              <span className="h-px w-4" style={{ background: c.ink }} />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden md:hidden"
              style={{ background: c.bg, borderTop: `1px solid ${c.line}` }}
            >
              <div className="flex flex-col gap-1 px-6 py-4">
                {config.nav.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="py-2 text-lg font-medium"
                    style={{ color: c.ink }}
                  >
                    {l.label}
                  </Link>
                ))}
                <Link
                  href={config.cta.href}
                  onClick={() => setOpen(false)}
                  className="mt-2 rounded-full px-5 py-3 text-center text-sm font-semibold"
                  style={{ background: c.accent, color: c.onAccent }}
                >
                  {config.cta.label}
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Page content (padded for the fixed nav) */}
      <main className="pt-20">{children}</main>

      {/* Footer */}
      <footer className="mt-24 px-6 md:px-10" style={{ borderTop: `1px solid ${c.line}` }}>
        <div className="mx-auto grid max-w-6xl gap-10 py-16 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <span className="text-2xl font-bold" style={displayFont}>
              {config.name}
            </span>
            {config.contact?.address && (
              <p className="mt-4 max-w-xs text-sm leading-relaxed" style={{ color: c.sub }}>
                {config.contact.address}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: c.sub }}>
              Explore
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {config.nav.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} style={{ color: c.ink }} className="opacity-80 hover:opacity-100">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: c.sub }}>
              Get in touch
            </p>
            <ul className="mt-4 space-y-2 text-sm" style={{ color: c.ink }}>
              {config.contact?.email && <li>{config.contact.email}</li>}
              {config.contact?.phone && <li>{config.contact.phone}</li>}
            </ul>
          </div>
        </div>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 py-8 text-sm md:flex-row" style={{ borderTop: `1px solid ${c.line}`, color: c.sub }}>
          <span>© 2025 {config.name}</span>
          <span>A Southpage demo · not a real business</span>
        </div>
      </footer>
    </div>
  );
}

/** Scroll-reveal wrapper shared by demo pages. */
export function Rise({
  children,
  delay = 0,
  y = 26,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
