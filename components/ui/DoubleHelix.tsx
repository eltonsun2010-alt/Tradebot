"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A glowing radiant-blue double helix. Two mirrored sine strands weave down
 * the full height of the container with DNA-style rungs between them and a
 * light pulse flowing along each strand. Sits behind the service cards, which
 * dock along it. Purely decorative — pointer-events off, aria-hidden.
 */
export function DoubleHelix() {
  const ref = useRef<HTMLDivElement>(null);
  const [{ w, h }, setDim] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setDim({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const cx = w / 2;
  const amp = Math.min(w * 0.34, 300);
  // ~one crossover per ~320px so a card roughly sits at each waist
  const halfTurns = Math.max(3, Math.round(h / 320));
  const k = (halfTurns * Math.PI) / (h || 1);

  const strand = (phase: number) => {
    const N = Math.max(24, Math.round(h / 10));
    let d = "";
    for (let i = 0; i <= N; i += 1) {
      const y = (i / N) * h;
      const x = cx + amp * Math.sin(y * k + phase);
      d += (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1) + " ";
    }
    return d;
  };

  const rungs: { x1: number; x2: number; y: number; o: number }[] = [];
  const R = Math.max(10, Math.round(h / 46));
  for (let i = 1; i < R; i += 1) {
    const y = (i / R) * h;
    const x1 = cx + amp * Math.sin(y * k);
    const x2 = cx + amp * Math.sin(y * k + Math.PI);
    rungs.push({ x1, x2, y, o: Math.abs(Math.sin(y * k)) });
  }

  const pathA = strand(0);
  const pathB = strand(Math.PI);

  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-0">
      {w > 0 && h > 0 && (
        <svg width={w} height={h} className="absolute inset-0" style={{ overflow: "visible" }}>
          <defs>
            <linearGradient id="helix-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#3b82f6" />
              <stop offset="0.5" stopColor="#7cc0ff" />
              <stop offset="1" stopColor="#3b82f6" />
            </linearGradient>
            <filter id="helix-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="6" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g filter="url(#helix-glow)">
            {/* rungs — fade to nothing where the strands cross */}
            {rungs.map((r, i) => (
              <line
                key={i}
                x1={r.x1}
                y1={r.y}
                x2={r.x2}
                y2={r.y}
                stroke="#60a5fa"
                strokeWidth={1 + 1.6 * r.o}
                opacity={0.1 + 0.5 * r.o}
              />
            ))}

            {/* base strands */}
            <path d={pathA} fill="none" stroke="url(#helix-grad)" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
            <path d={pathB} fill="none" stroke="url(#helix-grad)" strokeWidth="3" strokeLinecap="round" opacity="0.9" />

            {/* radiant flowing pulse */}
            <path d={pathA} className="helix-flow" fill="none" stroke="#dbeafe" strokeWidth="3.4" strokeLinecap="round" strokeDasharray="10 280" />
            <path d={pathB} className="helix-flow-2" fill="none" stroke="#dbeafe" strokeWidth="3.4" strokeLinecap="round" strokeDasharray="10 280" />
          </g>
        </svg>
      )}
    </div>
  );
}
