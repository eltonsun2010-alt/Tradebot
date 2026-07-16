"use client";

import { useMediaQuery } from "./useMediaQuery";

/** True when the visitor asked the OS to minimise motion. */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
