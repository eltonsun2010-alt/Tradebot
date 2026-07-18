"use client";

import { AnimatedText } from "@/components/ui/AnimatedText";
import { ScrollRevealText } from "@/components/ui/ScrollRevealText";
import { Reveal } from "@/components/ui/Reveal";

const BODY = [
  "Before someone books your service, requests a quote, or walks through your door, chances are they've already visited your website.",
  "Within seconds, they're deciding whether your business feels professional, reliable, and worth choosing.",
  "A thoughtfully designed website doesn't just look good — it builds confidence, answers questions, and makes it easier for people to take the next step.",
];

export function Trust() {
  return (
    <section id="trust" className="relative border-t border-line py-28 section-x md:py-40">
      <div className="grid gap-12 md:grid-cols-12">
        <div className="md:col-span-5">
          <div className="mb-6 flex items-center gap-4">
            <span className="h-px w-12 bg-accent" />
            <span className="text-eyebrow text-paper-dim">Why it matters</span>
          </div>
          <h2 className="font-display text-4xl font-extrabold leading-[1.06] tracking-[-0.02em] text-paper md:text-5xl lg:text-[3.4rem]">
            <AnimatedText text="People decide whether to trust you long before they contact you." by="word" />
          </h2>
        </div>

        <div className="md:col-span-7 md:pt-2">
          <div className="space-y-6">
            {BODY.map((p, i) => (
              <ScrollRevealText
                key={i}
                text={p}
                className="text-xl leading-relaxed text-paper md:text-2xl"
              />
            ))}
          </div>
          <Reveal delay={0.1}>
            <p className="mt-10 border-l-2 border-accent pl-6 font-display text-xl font-medium italic text-paper-dim md:text-2xl">
              Your website should be your hardest-working employee — representing
              your business every hour of every day.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
