"use client";

import { usePathname, useRouter } from "next/navigation";
import { NAV_LINKS } from "@/lib/data";
import { useLenis } from "@/components/providers/SmoothScrollProvider";
import { MagneticButton } from "@/components/ui/MagneticButton";

const SERVICE_LINKS = [
  "Custom Websites",
  "Website Development",
  "Website Redesign",
  "Business Automation",
  "Ongoing Support",
];

export function Footer() {
  const { scrollTo } = useLenis();
  const pathname = usePathname();
  const router = useRouter();

  const goTo = (href: string | number) => {
    if (pathname === "/") scrollTo(href);
    else router.push(typeof href === "number" ? "/" : `/${href}`);
  };

  return (
    <footer className="relative overflow-hidden border-t border-line bg-ink-soft pt-20 section-x">
      <div className="relative grid gap-12 pb-16 md:grid-cols-[1.6fr_1fr_1fr_1.2fr]">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-accent" />
            <span className="font-display text-lg font-bold tracking-[0.02em] text-paper">
              SOUTHPAGE
            </span>
          </div>
          <p className="mt-5 font-display text-base text-paper">
            Modern websites. Thoughtful design. Smart automation.
          </p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-paper-dim">
            We create custom websites and automation systems that help businesses
            present themselves professionally, simplify everyday tasks, and build
            a stronger online presence.
          </p>
        </div>

        {/* Navigation */}
        <nav>
          <p className="text-eyebrow text-paper-faint">Navigation</p>
          <ul className="mt-5 space-y-3">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <button
                  onClick={() => goTo(link.href)}
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

        {/* Services */}
        <div>
          <p className="text-eyebrow text-paper-faint">Services</p>
          <ul className="mt-5 space-y-3">
            {SERVICE_LINKS.map((s) => (
              <li key={s}>
                <button
                  onClick={() => goTo("#services")}
                  data-cursor="hover"
                  className="text-left text-paper-dim transition-colors hover:text-paper"
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <p className="text-eyebrow text-paper-faint">Contact</p>
          <p className="mt-5 font-display text-xl text-paper">Ready to start?</p>
          <p className="mt-2 text-sm text-paper-dim">
            Let&rsquo;s build something you&rsquo;re proud to share.
          </p>
          <MagneticButton
            as="button"
            onClick={() => goTo("#contact")}
            cursorLabel="Say hi"
            className="mt-6 rounded-full border border-line-strong px-6 py-3 text-sm font-medium text-paper transition-colors hover:border-accent"
          >
            Get a Free Quote
          </MagneticButton>
        </div>
      </div>

      {/* Oversized wordmark */}
      <div className="relative border-t border-line pt-10">
        <h2
          aria-hidden
          className="select-none bg-gradient-to-b from-paper/70 to-paper/5 bg-clip-text text-center font-display font-extrabold leading-[0.8] tracking-[-0.04em] text-transparent"
          style={{ fontSize: "clamp(3.5rem, 18vw, 18rem)" }}
        >
          SOUTHPAGE
        </h2>
      </div>

      <div className="flex flex-col items-center justify-between gap-4 border-t border-line py-8 text-sm text-paper-faint md:flex-row">
        <p>© 2026 Southpage. All rights reserved.</p>
        <button
          onClick={() => goTo(0)}
          data-cursor="hover"
          className="group flex items-center gap-2 text-paper-dim transition-colors hover:text-paper"
        >
          Back to top
          <span className="transition-transform duration-300 group-hover:-translate-y-1">↑</span>
        </button>
      </div>
    </footer>
  );
}
