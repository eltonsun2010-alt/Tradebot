"use client";

import { motion } from "framer-motion";
import { WHY_CARDS } from "@/lib/data";
import { AnimatedText } from "@/components/ui/AnimatedText";
import { Reveal } from "@/components/ui/Reveal";
import { EASE_LUX } from "@/lib/motion";

export function WhySouthpage() {
  return (
    <section id="why" className="relative border-t border-line py-28 section-x md:py-40">
      <div className="grid gap-10 md:grid-cols-12 md:items-end">
        <div className="md:col-span-7">
          <div className="mb-6 flex items-center gap-4">
            <span className="h-px w-12 bg-accent" />
            <span className="text-eyebrow text-paper-dim">Why choose Southpage</span>
          </div>
          <h2 className="text-display font-display font-extrabold text-paper">
            <AnimatedText text="Built with intention." by="word" />
            <br />
            <AnimatedText text="Designed to last." by="word" delay={0.08} />
          </h2>
        </div>
        <Reveal className="md:col-span-5" delay={0.12}>
          <p className="max-w-md text-base leading-relaxed text-paper-dim md:text-lg">
            Great websites aren&rsquo;t created by accident. Every decision — from
            typography and spacing to performance and functionality — is made with
            purpose. Our goal is simple: create websites you&rsquo;re proud to share.
          </p>
        </Reveal>
      </div>

      <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {WHY_CARDS.map((card, i) => (
          <motion.article
            key={card.title}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, delay: (i % 3) * 0.08, ease: EASE_LUX }}
            className="group relative overflow-hidden rounded-2xl border border-line bg-ink-soft p-8 transition-colors duration-500 hover:border-line-strong"
          >
            {/* Object-reveal on hover: accent wash + rising sheen */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 translate-y-full bg-gradient-to-t from-accent/10 to-transparent transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0"
            />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="font-display text-4xl font-bold text-paper-faint transition-colors duration-500 group-hover:text-accent">
                  0{i + 1}
                </span>
                <span className="translate-x-3 text-accent opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100">
                  ↗
                </span>
              </div>
              <h3 className="mt-8 font-display text-xl font-bold text-paper">
                {card.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-paper-dim">
                {card.body}
              </p>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
