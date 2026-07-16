"use client";

import { useEffect, useRef } from "react";

type Pos = { x: number; y: number };

/**
 * Tracks the pointer without triggering React re-renders.
 * Read `ref.current` inside a rAF loop for buttery, jank-free motion.
 */
export function useMousePosition() {
  const pos = useRef<Pos>({ x: 0, y: 0 });
  const normalized = useRef<Pos>({ x: 0, y: 0 }); // -1..1 from center

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
      normalized.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      };
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return { pos, normalized };
}
