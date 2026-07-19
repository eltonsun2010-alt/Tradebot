"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { AnimatedText } from "@/components/ui/AnimatedText";
import { GradientReveal } from "@/components/ui/GradientReveal";
import { Reveal } from "@/components/ui/Reveal";

const LightHelixCanvas = dynamic(() => import("@/components/canvas/LightHelixCanvas"), {
  ssr: false,
});

export function LightHelixSection() {
  const ref = useRef<HTMLElement>(null);

  return (
    <section
      ref={ref}
      className="relative flex min-h-[88svh] w-full items-center overflow-hidden border-t border-line py-28 md:py-36"
    >
      {/* Helix occupies the right ~half and fades softly into the background */}
      <div
        className="absolute inset-y-0 right-0 w-full md:w-[55%]"
        style={{
          WebkitMaskImage:
            "radial-gradient(78% 76% at 62% 50%, #000 42%, transparent 82%)",
          maskImage:
            "radial-gradient(78% 76% at 62% 50%, #000 42%, transparent 82%)",
        }}
      >
        <LightHelixCanvas eventSource={ref} />
      </div>

      {/* Left-side wash keeps the copy crisp over the glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink via-ink/70 to-transparent md:via-ink/30"
      />

      <div className="relative z-10 w-full section-x">
        <div className="max-w-xl">
          <div className="mb-6 flex items-center gap-4">
            <span className="h-px w-12 bg-accent" />
            <span className="text-eyebrow text-paper-dim">The Southpage signature</span>
          </div>
          <h2 className="font-display text-4xl font-extrabold leading-[1.08] tracking-[-0.02em] text-paper sm:text-5xl lg:text-6xl">
            <AnimatedText text="Precision you can" by="word" />{" "}
            <GradientReveal text="see and feel." delay={0.1} />
          </h2>
          <Reveal delay={0.12}>
            <p className="mt-8 max-w-md text-base leading-relaxed text-paper-dim md:text-lg">
              Striking design and quiet, intelligent systems — engineered together
              until the result feels effortless. That balance is what makes a
              Southpage build unmistakably ours.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
