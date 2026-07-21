"use client";

import { useState } from "react";
import { Loader } from "@/components/sections/Loader";
import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/sections/Hero";
import { Trust } from "@/components/sections/Trust";
import { Services } from "@/components/sections/Services";
import { WhySouthpage } from "@/components/sections/WhySouthpage";
import { Transition } from "@/components/sections/Transition";
import { Automation } from "@/components/sections/Automation";
import { Process } from "@/components/sections/Process";
import { Portfolio } from "@/components/sections/Portfolio";
import { Pricing } from "@/components/sections/Pricing";
import { Faq } from "@/components/sections/Faq";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/layout/Footer";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

export function Home() {
  const reduced = usePrefersReducedMotion();
  const [loaded, setLoaded] = useState(reduced);

  return (
    <>
      {!loaded && <Loader onComplete={() => setLoaded(true)} />}

      <Navbar />

      <main>
        <Hero play={loaded} />
        <Trust />
        <Services />
        {/* the Why journey flows straight into Automation — one connected
            scroll of the same ribbon of light, no break between them */}
        <WhySouthpage />
        <Automation />
        <Process />
        <Portfolio />
        <Pricing />
        <Transition text="Questions are normal. Here are a few we hear most often." />
        <Faq />
        <Contact />
      </main>

      <Footer />
    </>
  );
}
