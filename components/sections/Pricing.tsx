"use client";

import { motion } from "framer-motion";
import { PRICING } from "@/lib/data";
import { AnimatedText } from "@/components/ui/AnimatedText";
import { Reveal } from "@/components/ui/Reveal";
import { MeshBackground } from "@/components/ui/MeshBackground";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { useLenis } from "@/components/providers/SmoothScrollProvider";
import { EASE_LUX } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function Pricing() {
  const { scrollTo } = useLenis();
  return (
    <section id="pricing" className="relative overflow-hidden border-t border-line py-28 section-x md:py-40">
      <MeshBackground className="opacity-50" opacity={0.5} />
      <div className="relative mx-auto max-w-3xl text-center">
        <div className="mb-6 flex items-center justify-center gap-4">
          <span className="h-px w-12 bg-accent" />
          <span className="text-eyebrow text-paper-dim">Simple pricing</span>
          <span className="h-px w-12 bg-accent" />
        </div>
        <h2 className="text-display font-display font-extrabold text-paper">
          <AnimatedText text="Choose the package that's right for you." by="word" />
        </h2>
        <Reveal delay={0.1}>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-paper-dim md:text-lg">
            Whether you&rsquo;re launching your first website or looking to save
            time with automation, there&rsquo;s a package to suit. Need something
            more customised? We&rsquo;re happy to provide a personalised quote.
          </p>
        </Reveal>
      </div>

      <div className="relative mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-2">
        {PRICING.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, delay: i * 0.1, ease: EASE_LUX }}
            className={cn(
              "relative flex flex-col rounded-[1.75rem] border p-8 md:p-10",
              p.featured
                ? "border-transparent"
                : "border-line bg-ink-soft"
            )}
            style={
              p.featured
                ? { background: "linear-gradient(160deg, rgba(59,130,246,0.14), rgba(124,58,237,0.10)), #0a0a0c", borderColor: "rgba(59,130,246,0.4)" }
                : undefined
            }
          >
            {p.featured && (
              <span className="absolute right-8 top-8 rounded-full bg-accent px-3 py-1 text-[11px] font-semibold text-ink">
                Most popular
              </span>
            )}
            <h3 className="font-display text-xl font-bold text-paper">{p.name}</h3>
            <div className="mt-4 flex items-end gap-2">
              <span className="text-sm text-paper-dim">from</span>
              <span className="font-display text-5xl font-extrabold text-paper">${p.price}</span>
              <span className="mb-1 text-sm text-paper-dim">{p.currency}</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-paper-dim">{p.tagline}</p>

            <ul className="mt-8 flex-1 space-y-3">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-paper">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent/15 text-[11px] text-accent-bright">
                    ✓
                  </span>
                  {f}
                </li>
              ))}
            </ul>

            <p className="mt-8 rounded-xl bg-white/[0.03] p-4 text-xs leading-relaxed text-paper-dim">
              <span className="font-semibold text-paper-dim">Best for — </span>
              {p.best}
            </p>

            <MagneticButton
              as="button"
              onClick={() => scrollTo("#contact")}
              className={cn(
                "mt-6 w-full rounded-full px-6 py-4 text-sm font-semibold transition-colors",
                p.featured
                  ? "bg-paper text-ink"
                  : "border border-line-strong text-paper hover:border-accent"
              )}
            >
              {p.cta}
            </MagneticButton>
          </motion.div>
        ))}
      </div>

      <Reveal delay={0.1} className="relative">
        <p className="mx-auto mt-12 max-w-xl text-center text-sm leading-relaxed text-paper-dim">
          Not sure which package is right for you? Let&rsquo;s have a conversation
          and recommend the best fit. No hidden fees. No unnecessary extras. Just
          solutions tailored to your business.
        </p>
      </Reveal>
    </section>
  );
}
