"use client";

import Link from "next/link";

/** Small fixed chip on every demo — marks it as a demo and returns to the portfolio. */
export function DemoRibbon({ theme = "dark" }: { theme?: "light" | "dark" }) {
  const light = theme === "light";
  return (
    <Link
      href="/#work"
      data-cursor="hover"
      className="fixed bottom-4 left-4 z-[600] flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium shadow-lg backdrop-blur-md transition-transform duration-300 hover:-translate-y-0.5"
      style={{
        background: light ? "rgba(255,255,255,0.72)" : "rgba(10,10,12,0.55)",
        borderColor: light ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.16)",
        color: light ? "#141414" : "#fafafa",
      }}
    >
      <span aria-hidden>←</span>
      <span className="font-semibold">Southpage</span>
      <span style={{ opacity: 0.5 }}>· live demo</span>
    </Link>
  );
}
