"use client";

import { useEffect, useRef, useState } from "react";
import { useIsTouch } from "@/hooks/useMediaQuery";
import { lerp } from "@/lib/utils";

/**
 * Bespoke cursor: a precise dot + a soft lagging ring.
 * Elements opt into states via `data-cursor="view|hover|hidden"`
 * and an optional `data-cursor-label`.
 */
export function Cursor() {
  const touch = useIsTouch();
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  const [label, setLabel] = useState("");
  const [state, setState] = useState<"default" | "hover" | "view" | "hidden">(
    "default"
  );

  const target = useRef({ x: -100, y: -100 });
  const ring = useRef({ x: -100, y: -100 });
  const dot = useRef({ x: -100, y: -100 });
  const visible = useRef(false);

  useEffect(() => {
    if (touch) return;
    document.documentElement.classList.add("has-custom-cursor");

    const onMove = (e: PointerEvent) => {
      target.current = { x: e.clientX, y: e.clientY };
      if (!visible.current) {
        visible.current = true;
        ring.current = { ...target.current };
        dot.current = { ...target.current };
      }
      const el = (e.target as HTMLElement)?.closest<HTMLElement>("[data-cursor]");
      if (el) {
        setState((el.dataset.cursor as typeof state) || "hover");
        setLabel(el.dataset.cursorLabel || "");
      } else {
        setState("default");
        setLabel("");
      }
    };

    const onLeave = () => (visible.current = false);

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    let raf = 0;
    const render = () => {
      dot.current.x = lerp(dot.current.x, target.current.x, 0.9);
      dot.current.y = lerp(dot.current.y, target.current.y, 0.9);
      ring.current.x = lerp(ring.current.x, target.current.x, 0.16);
      ring.current.y = lerp(ring.current.y, target.current.y, 0.16);

      if (dotRef.current)
        dotRef.current.style.transform = `translate3d(${dot.current.x}px, ${dot.current.y}px, 0) translate(-50%, -50%)`;
      if (ringRef.current)
        ringRef.current.style.transform = `translate3d(${ring.current.x}px, ${ring.current.y}px, 0) translate(-50%, -50%)`;
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      document.documentElement.classList.remove("has-custom-cursor");
    };
  }, [touch]);

  if (touch) return null;

  const ringSize =
    state === "view" ? 88 : state === "hover" ? 56 : state === "hidden" ? 0 : 34;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[9999]">
      {/* Precise dot */}
      <div
        ref={dotRef}
        className="fixed left-0 top-0 h-1.5 w-1.5 rounded-full bg-paper mix-blend-difference transition-opacity duration-300"
        style={{ opacity: state === "view" || state === "hidden" ? 0 : 1 }}
      />
      {/* Lagging ring */}
      <div
        ref={ringRef}
        className="fixed left-0 top-0 flex items-center justify-center rounded-full transition-[width,height,background-color,border-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          width: ringSize,
          height: ringSize,
          border:
            state === "view"
              ? "1px solid transparent"
              : "1px solid rgba(250,250,250,0.6)",
          backgroundColor:
            state === "view" ? "var(--color-accent)" : "transparent",
          mixBlendMode: state === "view" ? "normal" : "difference",
        }}
      >
        <span
          ref={labelRef}
          className="font-display text-[10px] font-semibold uppercase tracking-[0.18em] text-paper transition-opacity duration-300"
          style={{ opacity: state === "view" && label ? 1 : 0 }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}
