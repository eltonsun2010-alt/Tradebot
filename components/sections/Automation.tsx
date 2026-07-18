"use client";

import { motion } from "framer-motion";
import { AUTOMATIONS } from "@/lib/data";
import { AnimatedText } from "@/components/ui/AnimatedText";
import { Reveal } from "@/components/ui/Reveal";
import { MeshBackground } from "@/components/ui/MeshBackground";
import { EASE_LUX } from "@/lib/motion";

const icons = ["⚡", "📅", "🔁", "🗂️", "🔔", "⚙️"];

export function Automation() {
  return (
    <section id="automation" className="relative overflow-hidden border-t border-line py-28 section-x md:py-40">
      <MeshBackground className="opacity-60" opacity={0.6} />

      <div className="relative grid gap-10 md:grid-cols-12 md:items-end">
        <div className="md:col-span-7">
          <div className="mb-6 flex items-center gap-4">
            <span className="h-px w-12 bg-violet" />
            <span className="text-eyebrow text-paper-dim">Smart automation</span>
          </div>
          <h2 className="text-display font-display font-extrabold text-paper">
            <AnimatedText text="Spend less time chasing enquiries." by="word" />{" "}
            <AnimatedText text="More time growing." by="word" delay={0.1} />
          </h2>
        </div>
        <Reveal className="md:col-span-5" delay={0.12}>
          <p className="max-w-md text-base leading-relaxed text-paper-dim md:text-lg">
            Replying to enquiries, confirming appointments, following up, sending
            reminders — it all takes time. Automation takes the repetitive admin
            off your plate. It&rsquo;s not about replacing the personal touch;
            it&rsquo;s about making sure no opportunity is overlooked.
          </p>
        </Reveal>
      </div>

      <div className="relative mt-16">
        <Reveal>
          <p className="text-eyebrow text-violet">What can be automated?</p>
        </Reveal>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {AUTOMATIONS.map((a, i) => (
            <motion.div
              key={a.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: (i % 3) * 0.08, ease: EASE_LUX }}
              className="group rounded-2xl border border-line bg-ink-soft p-7 transition-all duration-500 hover:-translate-y-1 hover:border-line-strong"
            >
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-violet/12 text-2xl">
                {icons[i]}
              </div>
              <h3 className="mt-5 font-display text-lg font-bold text-paper">{a.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-paper-dim">{a.body}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <Reveal delay={0.1}>
        <p className="relative mt-16 text-center font-display text-xl text-paper-dim md:text-2xl">
          Technology shouldn&rsquo;t make your business more complicated.{" "}
          <span className="text-paper">It should make your day easier.</span>
        </p>
      </Reveal>
    </section>
  );
}
