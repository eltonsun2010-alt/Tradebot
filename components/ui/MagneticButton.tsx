"use client";

import {
  useRef,
  type ReactNode,
  type MouseEvent,
  type ElementType,
  type ComponentType,
} from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

// Accept arbitrary props so the tag can be a button or an anchor.
type AnyMotionTag = ComponentType<Record<string, unknown>>;

type Props = {
  children: ReactNode;
  className?: string;
  /** Strength of the pull toward the cursor (px at edge). */
  strength?: number;
  as?: ElementType;
  href?: string;
  onClick?: () => void;
  cursorLabel?: string;
};

/**
 * Element that leans toward the pointer while hovered, then springs home.
 * The inner content drifts a little further than the shell for depth.
 */
export function MagneticButton({
  children,
  className,
  strength = 24,
  as = "button",
  href,
  onClick,
  cursorLabel,
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const ix = useMotionValue(0);
  const iy = useMotionValue(0);

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
  };

  // Polymorphic motion element (button by default, anchor when href is given).
  const MotionTag = motion[as as "button"] as unknown as AnyMotionTag;

  return (
    <MotionTag
      ref={ref}
      href={href}
      onClick={onClick}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={{ x: sx, y: sy }}
      data-cursor="hover"
      data-cursor-label={cursorLabel}
      className={cn("relative inline-flex items-center justify-center", className)}
    >
      <motion.span style={{ x: six, y: siy }} className="inline-flex items-center justify-center gap-2">
        {children}
      </motion.span>
    </MotionTag>
  );
}
