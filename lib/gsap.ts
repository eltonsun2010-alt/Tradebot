"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register plugins exactly once, on the client.
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// A luxury default ease shared across the site.
export const LUX_EASE = "expo.out";
export const LUX_CUBIC = [0.16, 1, 0.3, 1] as const;

export { gsap, ScrollTrigger };
