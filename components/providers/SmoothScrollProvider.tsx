"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

type LenisCtx = {
  lenis: Lenis | null;
  scrollTo: (target: string | number | HTMLElement, opts?: object) => void;
  stop: () => void;
  start: () => void;
};

const Ctx = createContext<LenisCtx>({
  lenis: null,
  scrollTo: () => {},
  stop: () => {},
  start: () => {},
});

export const useLenis = () => useContext(Ctx);

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    // Respect reduced-motion: skip momentum entirely.
    if (reduced) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo.out
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
    });
    lenisRef.current = lenis;

    // Drive Lenis from GSAP's ticker so ScrollTrigger stays in sync.
    lenis.on("scroll", ScrollTrigger.update);
    const onRaf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(onRaf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(onRaf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reduced]);

  const scrollTo: LenisCtx["scrollTo"] = (target, opts) => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(target, { offset: -20, ...opts });
    } else if (typeof target === "string") {
      document.querySelector(target)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const stop = () => {
    lenisRef.current?.stop();
    document.documentElement.classList.add("lenis-stopped");
  };
  const start = () => {
    lenisRef.current?.start();
    document.documentElement.classList.remove("lenis-stopped");
  };

  return (
    <Ctx.Provider value={{ lenis: lenisRef.current, scrollTo, stop, start }}>
      {children}
    </Ctx.Provider>
  );
}
