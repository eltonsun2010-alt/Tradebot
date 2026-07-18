"use client";

import { useState } from "react";
import { Loader } from "@/components/sections/Loader";
import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/sections/Hero";
import { Work } from "@/components/sections/Work";
import { Studio } from "@/components/sections/Studio";
import { Services } from "@/components/sections/Services";
import { Process } from "@/components/sections/Process";
import { Testimonials } from "@/components/sections/Testimonials";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/layout/Footer";
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
        <Process />
        <Testimonials />
        <Contact />
      </main>

      <Footer />
    </>
  );
}
