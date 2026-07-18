"use client";

import { motion } from "framer-motion";
import { DemoRibbon } from "./DemoRibbon";

/* High-energy strength studio. Palette: near-black / electric lime. */
const C = {
  bg: "#0b0c0e",
  panel: "#141519",
  line: "rgba(255,255,255,0.08)",
  lime: "#bef264",
  text: "#f4f5f4",
  sub: "#8a8d93",
};
const display = {
  fontFamily: "var(--font-anton), Impact, sans-serif",
  textTransform: "uppercase" as const,
  letterSpacing: "0.01em",
};

const classes = [
  { n: "01", name: "Strength", time: "50 min", desc: "Barbell fundamentals, progressive overload." },
  { n: "02", name: "Conditioning", time: "45 min", desc: "Engines built with sleds, bikes and grit." },
  { n: "03", name: "HIIT", time: "30 min", desc: "All gas. Short, brutal, effective." },
];

const plans = [
  { name: "Drop-in", price: "$22", per: "/ class", feats: ["Any single class", "No commitment", "Gear included"], hot: false },
  { name: "Unlimited", price: "$149", per: "/ month", feats: ["Unlimited classes", "Free InBody scan", "Bring-a-friend passes"], hot: true },
  { name: "Team", price: "$99", per: "/ month", feats: ["12 classes / month", "Coaching app", "Recovery lounge"], hot: false },
];

function Rise({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function FitnessDemo() {
  return (
    <div style={{ background: C.bg, color: C.text }} className="min-h-screen">
      <DemoRibbon theme="dark" />

      <div className="mx-auto max-w-6xl px-6 md:px-10">
        {/* Nav */}
        <header className="flex items-center justify-between py-7">
          <span style={display} className="text-2xl">
            Pulse
          </span>
          <nav className="hidden gap-8 text-sm font-medium md:flex" style={{ color: C.sub }}>
            <a href="#classes">Classes</a>
            <a href="#stats">Studio</a>
            <a href="#pricing">Pricing</a>
          </nav>
          <a
            href="#pricing"
            data-cursor="hover"
            className="rounded-full px-5 py-2.5 text-sm font-bold text-black transition-transform hover:-translate-y-0.5"
            style={{ background: C.lime }}
          >
            Join now
          </a>
        </header>

        {/* Hero */}
        <section className="relative py-16 md:py-24">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full blur-3xl"
            style={{ background: `${C.lime}22` }}
          />
          <Rise>
            <p className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: C.lime }}>
              Strength &amp; conditioning · downtown
            </p>
          </Rise>
          <Rise delay={0.05}>
            <h1 style={display} className="mt-6 text-[19vw] leading-[0.82] md:text-[11rem]">
              Train
              <br />
              <span style={{ color: C.lime }}>loud.</span>
            </h1>
          </Rise>
          <div className="mt-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <Rise delay={0.1}>
              <p className="max-w-md text-lg leading-relaxed" style={{ color: C.sub }}>
                Coach-led group training that actually gets you stronger. Turn
                up, switch off, and let us handle the hard part.
              </p>
            </Rise>
            <Rise delay={0.15}>
              <a
                href="#pricing"
                data-cursor="hover"
                className="inline-block rounded-full px-8 py-4 text-sm font-bold text-black transition-transform hover:-translate-y-0.5"
                style={{ background: C.lime }}
              >
                First class free →
              </a>
            </Rise>
          </div>
        </section>

        {/* Classes */}
        <section id="classes" className="border-t py-8 md:py-12" style={{ borderColor: C.line }}>
          {classes.map((c, i) => (
            <Rise key={c.name} delay={i * 0.06}>
              <div
                className="group grid grid-cols-[auto_1fr_auto] items-center gap-6 border-b py-8 transition-colors"
                style={{ borderColor: C.line }}
              >
                <span className="text-sm tabular-nums" style={{ color: C.sub }}>
                  {c.n}
                </span>
                <div>
                  <h3 style={display} className="text-4xl md:text-6xl">
                    {c.name}
                  </h3>
                  <p className="mt-2 text-sm" style={{ color: C.sub }}>
                    {c.desc}
                  </p>
                </div>
                <span
                  className="rounded-full border px-4 py-2 text-xs font-semibold transition-colors group-hover:border-transparent"
                  style={{ borderColor: C.line, color: C.text }}
                >
                  {c.time}
                </span>
              </div>
            </Rise>
          ))}
        </section>

        {/* Stats */}
        <section id="stats" className="grid gap-8 py-16 sm:grid-cols-3 md:py-24">
          {[
            ["60+", "Classes / week"],
            ["14", "Certified coaches"],
            ["2.4k", "Members strong"],
          ].map(([n, l], i) => (
            <Rise key={l} delay={i * 0.08}>
              <div className="rounded-3xl p-8" style={{ background: C.panel }}>
                <div style={display} className="text-6xl md:text-7xl" >
                  <span style={{ color: C.lime }}>{n}</span>
                </div>
                <div className="mt-3 text-sm" style={{ color: C.sub }}>
                  {l}
                </div>
              </div>
            </Rise>
          ))}
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-16 md:py-24">
          <Rise>
            <h2 style={display} className="text-5xl md:text-7xl">
              Pick your <span style={{ color: C.lime }}>pace</span>
            </h2>
          </Rise>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {plans.map((p, i) => (
              <Rise key={p.name} delay={i * 0.08}>
                <div
                  className="flex h-full flex-col rounded-3xl p-8"
                  style={{
                    background: p.hot ? C.lime : C.panel,
                    color: p.hot ? "#0b0c0e" : C.text,
                  }}
                >
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ opacity: 0.7 }}>
                    {p.name}
                  </span>
                  <div className="mt-4 flex items-end gap-1">
                    <span style={display} className="text-5xl">
                      {p.price}
                    </span>
                    <span className="mb-1 text-sm" style={{ opacity: 0.7 }}>
                      {p.per}
                    </span>
                  </div>
                  <ul className="mt-6 flex-1 space-y-3 text-sm">
                    {p.feats.map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <span style={{ color: p.hot ? "#0b0c0e" : C.lime }}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    data-cursor="hover"
                    className="mt-8 rounded-full px-6 py-3.5 text-sm font-bold transition-transform hover:-translate-y-0.5"
                    style={{
                      background: p.hot ? "#0b0c0e" : C.lime,
                      color: p.hot ? C.lime : "#0b0c0e",
                    }}
                  >
                    Get started
                  </button>
                </div>
              </Rise>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="flex flex-col items-center justify-between gap-3 border-t py-10 text-sm md:flex-row" style={{ borderColor: C.line, color: C.sub }}>
          <span style={display} className="text-lg text-white">
            Pulse
          </span>
          <span>© 2025 · A Southpage demo</span>
        </footer>
      </div>
    </div>
  );
}
