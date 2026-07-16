import type { Transition } from "framer-motion";

// Cubic-bezier eases as fixed-length tuples so Framer Motion's types accept them.
export const EASE_LUX: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const EASE_CURTAIN: [number, number, number, number] = [0.83, 0, 0.17, 1];
export const EASE_INOUT: [number, number, number, number] = [0.65, 0, 0.35, 1];

export const lux = (duration = 1, delay = 0): Transition => ({
  duration,
  delay,
  ease: EASE_LUX,
});
