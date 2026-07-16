"use client";

import { useState } from "react";
import { Loader } from "@/components/sections/Loader";
import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/sections/Hero";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

export function Home() {
  const reduced = usePrefersReducedMotion();
  // Skip the loader entirely for reduced-motion visitors.
  const [loaded, setLoaded] = useState(reduced);

  return (
    <>
      {!loaded && <Loader onComplete={() => setLoaded(true)} />}

      <Navbar />

      <main>
        <Hero play={loaded} />

        {/* Anchor stubs — replaced by full sections in the next milestones. */}
        <section
          id="work"
          className="relative flex min-h-[60vh] items-center justify-center border-t border-line section-x"
        >
          <p className="max-w-xl text-center font-display text-2xl text-paper-dim md:text-3xl">
            The rest of the experience —{" "}
            <span className="text-paper">Work, Studio, Services, Process</span>{" "}
            and <span className="text-paper">Contact</span> — is being crafted
            section by section.
          </p>
        </section>
        <section id="contact" className="h-px" aria-hidden />
      </main>
    </>
  );
}
