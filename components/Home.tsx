"use client";

import { useState } from "react";
import { Loader } from "@/components/sections/Loader";
import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/sections/Hero";
import { Work } from "@/components/sections/Work";
import { Studio } from "@/components/sections/Studio";
import { Services } from "@/components/sections/Services";
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
        <Work />
        <Studio />
        <Services />

        {/* Anchor stubs — replaced by full sections in the next milestones. */}
        <section
          id="process"
          className="relative flex min-h-[50vh] items-center justify-center border-t border-line section-x"
        >
          <p className="max-w-xl text-center font-display text-2xl text-paper-dim md:text-3xl">
            <span className="text-paper">Process</span>,{" "}
            <span className="text-paper">Testimonials</span> and{" "}
            <span className="text-paper">Contact</span> — crafted next.
          </p>
        </section>
        <section id="contact" className="h-px" aria-hidden />
      </main>
    </>
  );
}
