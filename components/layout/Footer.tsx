"use client";

import { NAV_LINKS, SOCIALS } from "@/lib/data";
import { useLenis } from "@/components/providers/SmoothScrollProvider";
import { MagneticButton } from "@/components/ui/MagneticButton";

export function Footer() {
  const { scrollTo } = useLenis();
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-line bg-ink-soft pt-20 section-x">
      <div className="relative grid gap-12 pb-20 md:grid-cols-[1.4fr_1fr_1fr]">
        {/* Brand + CTA */}
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-accent" />
            <span className="font-display text-lg font-bold text-paper">
              Southpage
            </span>
          </div>
          <p className="mt-6 max-w-xs text-base leading-relaxed text-paper-dim">
            A design studio crafting fast, cinematic websites for brands that
            refuse to blend in.
          </p>
          <MagneticButton
            as="button"
            onClick={() => scrollTo("#contact")}
            cursorLabel="Say hi"
            className="mt-8 rounded-full border border-line-strong px-6 py-3 text-sm font-medium text-paper transition-colors hover:border-accent"
          >
            Start a project
          </MagneticButton>
        </div>

        {/* Sitemap */}
        <nav>
          <p className="text-eyebrow text-paper-faint">Sitemap</p>
          <ul className="mt-5 space-y-3">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <button
                  onClick={() => scrollTo(link.href)}
                  data-cursor="hover"
                  className="group relative text-paper-dim transition-colors hover:text-paper"
                >
                  {link.label}
                  <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-accent transition-all duration-300 group-hover:w-full" />
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Socials */}
        <div>
          <p className="text-eyebrow text-paper-faint">Elsewhere</p>
          <ul className="mt-5 space-y-3">
            {SOCIALS.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  data-cursor="hover"
                  className="group relative text-paper-dim transition-colors hover:text-paper"
                >
                  {s.label}
                  <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-accent transition-all duration-300 group-hover:w-full" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Oversized wordmark */}
      <div className="relative border-t border-line pt-10">
        <h2
          aria-hidden
          className="select-none bg-gradient-to-b from-paper/70 to-paper/5 bg-clip-text text-center font-display font-extrabold leading-[0.8] tracking-[-0.04em] text-transparent"
          style={{ fontSize: "clamp(4rem, 20vw, 20rem)" }}
        >
          Southpage
        </h2>
      </div>

      {/* Bottom bar */}
      <div className="flex flex-col items-center justify-between gap-4 border-t border-line py-8 text-sm text-paper-faint md:flex-row">
        <p>© {year} Southpage Studio. All rights reserved.</p>
        <p>Design &amp; build in-house.</p>
        <button
          onClick={() => scrollTo(0)}
          data-cursor="hover"
          className="group flex items-center gap-2 text-paper-dim transition-colors hover:text-paper"
        >
          Back to top
          <span className="transition-transform duration-300 group-hover:-translate-y-1">
            ↑
          </span>
        </button>
      </div>
    </footer>
  );
}
