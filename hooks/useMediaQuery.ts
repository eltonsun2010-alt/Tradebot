"use client";

import { useEffect, useState } from "react";

/** Subscribe to a CSS media query. SSR-safe (returns `false` first paint). */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

export const useIsMobile = () => useMediaQuery("(max-width: 768px)");
export const useIsTouch = () => useMediaQuery("(pointer: coarse)");
