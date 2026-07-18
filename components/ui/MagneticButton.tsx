"use client";

import {
  useRef,
  useState,
  type ReactNode,
  type MouseEvent,
  type ElementType,
  type ComponentType,
} from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { cn } from "@/lib/utils";

type AnyMotionTag = ComponentType<Record<string, unknown>>;

type Props = {
  children: ReactNode;
  className?: string;
  strength?: number;
  as?: ElementType;
  href?: string;
  onClick?: () => void;
  cursorLabel?: string;
  /** Accent used for the soft glow + ripple (default electric blue). */
  glow?: string;
};

/**
 * Button that leans toward the pointer, glows softly on hover, compresses on
 * press and emits a ripple from the click point. The inner content drifts a
 * little further than the shell for depth. Springs keep it satisfying.
 */
export function MagneticButton({
  children,
  className,
  strength = 24,
  as = "button",
  href,
  onClick,
  cursorLabel,
  glow = "rgba(59,130,246,0.55)",
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const ix = useMotionValue(0);
  const iy = useMotionValue(0);
  const [hover, setHover] = useState(false);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  const spring = { stiffness: 200, damping: 15, mass: 0.4 };
  const sx = useSpring(x, spring);
  const sy = useSpring(y, spring);
  const six = useSpring(ix, spring);
  const siy = useSpring(iy, spring);

  const handleMove = (e: MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relX = e.clientX - (rect.left + rect.width / 2);
    const relY = e.clientY - (rect.top + rect.height / 2);
    x.set((relX / rect.width) * strength * 2);
    y.set((relY / rect.height) * strength * 2);
    ix.set((relX / rect.width) * strength);
    iy.set((relY / rect.height) * strength);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
    ix.set(0);
    iy.set(0);
    setHover(false);
  };

  const spawnRipple = (e: MouseEvent) => {
    const el = ref.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      const id = Date.now();
      setRipples((r) => [...r, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
      setTimeout(() => setRipples((r) => r.filter((rp) => rp.id !== id)), 650);
    }
    onClick?.();
  };

  const MotionTag = motion[as as "button"] as unknown as AnyMotionTag;

  return (
    <MotionTag
      ref={ref}
      href={href}
      onClick={spawnRipple}
      onMouseMove={handleMove}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={reset}
      whileTap={{ scale: 0.94 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      style={{ x: sx, y: sy, boxShadow: hover ? `0 10px 34px -8px ${glow}` : "0 0 0 rgba(0,0,0,0)" }}
      data-cursor="hover"
      data-cursor-label={cursorLabel}
      className={cn("relative inline-flex items-center justify-center overflow-hidden", className)}
    >
      <motion.span style={{ x: six, y: siy }} className="relative z-10 inline-flex items-center justify-center gap-2">
        {children}
      </motion.span>

      {/* Ripples */}
      <AnimatePresence>
        {ripples.map((r) => (
          <motion.span
            key={r.id}
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="pointer-events-none absolute h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ left: r.x, top: r.y, background: glow }}
          />
        ))}
      </AnimatePresence>
    </MotionTag>
  );
}
