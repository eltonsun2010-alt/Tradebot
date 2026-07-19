"use client";

import { useRef, useState, type MouseEvent, type ReactNode } from "react";
import { motion } from "framer-motion";
import { useIsTouch } from "@/hooks/useMediaQuery";

export const ICONS: ReactNode[] = [
  <path key="a" d="M4 20l4-1L20 7a2 2 0 0 0-3-3L5 16l-1 4zM14 6l3 3" />,
  <path key="b" d="M8 8l-4 4 4 4M16 8l4 4-4 4M13 5l-2 14" />,
  <>
    <circle key="c1" cx="12" cy="12" r="3" />
    <path key="c2" d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" />
  </>,
  <path key="d" d="M4 12a8 8 0 0 1 13.7-5.6L20 8M20 4v4h-4M20 12a8 8 0 0 1-13.7 5.6L4 16M4 20v-4h4" />,
  <>
    <circle key="e1" cx="12" cy="12" r="9" />
    <circle key="e2" cx="12" cy="12" r="3.5" />
    <path key="e3" d="M4.9 4.9l4.6 4.6M14.5 14.5l4.6 4.6M19.1 4.9l-4.6 4.6M9.5 14.5l-4.6 4.6" />
  </>,
];

function Header({ icon, label, open }: { icon: ReactNode; label: string; open: boolean }) {
  return (
    <div className="flex items-start justify-between">
      <motion.span
        animate={{ scale: open ? 1.04 : 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 24 }}
        className="grid h-12 w-12 place-items-center rounded-xl border transition-colors duration-300"
        style={{
          background: open ? "rgba(120,170,255,0.14)" : "rgba(255,255,255,0.06)",
          borderColor: open ? "rgba(150,190,255,0.3)" : "rgba(255,255,255,0.1)",
        }}
      >
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={open ? "#a9c8ff" : "#c3ccda"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          {icon}
        </svg>
      </motion.span>
      <span className="font-display text-2xl font-semibold text-white/25">{label}</span>
    </div>
  );
}

export function ServiceCard({
  icon,
  label,
  title,
  body,
  features,
  forceOpen = false,
}: {
  icon: ReactNode;
  label: string;
  title: string;
  body: string;
  features: readonly string[];
  forceOpen?: boolean;
}) {
  const touch = useIsTouch();
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const open = touch || hover || forceOpen;

  const onMove = (e: MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  const spring = { type: "spring" as const, stiffness: 260, damping: 30 };

  return (
      <motion.article
        ref={ref}
        onMouseMove={touch ? undefined : onMove}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        data-cursor="hover"
        className="relative overflow-hidden rounded-[2rem] p-7 transition-shadow duration-500"
        style={{
          background: "linear-gradient(157deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04) 60%, rgba(255,255,255,0.07))",
          backdropFilter: "blur(28px) saturate(150%) brightness(1.04)",
          WebkitBackdropFilter: "blur(28px) saturate(150%) brightness(1.04)",
          boxShadow: open
            ? "0 70px 130px -60px rgba(0,0,0,0.92), inset 0 1.5px 1px rgba(255,255,255,0.4), inset 0 0 0 1px rgba(255,255,255,0.09), inset 0 -30px 60px -40px rgba(180,205,255,0.14)"
            : "0 44px 100px -60px rgba(0,0,0,0.85), inset 0 1.5px 1px rgba(255,255,255,0.28), inset 0 0 0 1px rgba(255,255,255,0.06)",
        }}
      >
        <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-1/4 h-2/3 bg-gradient-to-b from-white/[0.10] to-transparent" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: "linear-gradient(118deg, transparent 34%, rgba(255,255,255,0.06) 47%, transparent 58%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={{
            opacity: hover ? 1 : 0,
            background: "radial-gradient(320px circle at var(--mx) var(--my), rgba(255,255,255,0.10), transparent 60%)",
          }}
        />

        <div className="relative">
          <Header icon={icon} label={label} open={open} />
          <h3 className="mt-7 font-display text-[1.35rem] font-medium tracking-[-0.01em] text-white">{title}</h3>

          <motion.div
            initial={false}
            animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
            transition={spring}
            className="overflow-hidden"
          >
            <p className="pt-4 text-[0.82rem] leading-relaxed text-white/55">{body}</p>
            <ul className="mt-5 space-y-2.5">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-3 text-[0.82rem] text-white/80">
                  <span className="h-1 w-1 rounded-full bg-white/50" />
                  {f}
                </li>
              ))}
            </ul>
            <span className="mt-6 inline-flex items-center gap-2 text-[0.8rem] font-medium text-white/70">
              Learn more <span aria-hidden className="text-white/40">&rarr;</span>
            </span>
          </motion.div>
        </div>
      </motion.article>
  );
}
