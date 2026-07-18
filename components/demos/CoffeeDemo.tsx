"use client";

import { motion } from "framer-motion";
import { DemoRibbon } from "./DemoRibbon";

/* Warm, editorial coffee roaster. Palette: cream / espresso / terracotta. */
const C = {
  cream: "#f6efe3",
  card: "#efe4d2",
  espresso: "#2b1c13",
  terracotta: "#c65f3f",
  oak: "#8a6d4b",
};
const serif = { fontFamily: "var(--font-fraunces), Georgia, serif" };

const roasts = [
  { name: "Sunday Blend", origin: "Colombia · Brazil", notes: "Cocoa, hazelnut, brown sugar", price: "$18" },
  { name: "Ethiopia Guji", origin: "Single origin", notes: "Blueberry, jasmine, honey", price: "$22" },
  { name: "Midnight Oak", origin: "Sumatra · dark roast", notes: "Dark chocolate, cedar, spice", price: "$19" },
];

function Rise({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function CoffeeDemo() {
  return (
    <div style={{ background: C.cream, color: C.espresso }} className="min-h-screen">
      <DemoRibbon theme="light" />

      <div className="mx-auto max-w-6xl px-6 md:px-10">
        {/* Nav */}
        <header className="flex items-center justify-between py-8">
          <span style={serif} className="text-xl font-semibold tracking-tight">
            Ember&nbsp;&amp;&nbsp;Oak
          </span>
          <nav className="hidden gap-8 text-sm md:flex" style={{ color: C.oak }}>
            <a href="#roasts">Beans</a>
            <a href="#story">Story</a>
            <a href="#visit">Visit</a>
          </nav>
          <a
            href="#roasts"
            data-cursor="hover"
            className="rounded-full px-5 py-2.5 text-sm font-medium text-white transition-transform hover:-translate-y-0.5"
            style={{ background: C.terracotta }}
          >
            Order beans
          </a>
        </header>

        {/* Hero */}
        <section className="grid items-center gap-10 py-12 md:grid-cols-2 md:py-20">
          <div>
            <Rise>
              <span
                className="inline-block rounded-full px-3 py-1 text-xs font-medium uppercase tracking-widest"
                style={{ background: C.card, color: C.oak }}
              >
                Small-batch roastery · est. 2016
              </span>
            </Rise>
            <Rise delay={0.05}>
              <h1 style={serif} className="mt-6 text-5xl font-semibold leading-[1.02] md:text-7xl">
                Coffee, roasted with{" "}
                <span style={{ color: C.terracotta, fontStyle: "italic" }}>patience</span>.
              </h1>
            </Rise>
            <Rise delay={0.1}>
              <p className="mt-6 max-w-md text-lg leading-relaxed" style={{ color: C.oak }}>
                We roast in tiny batches, by hand, the morning we ship. No rush,
                no shortcuts — just coffee that tastes like someone cared.
              </p>
            </Rise>
            <Rise delay={0.15}>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href="#roasts"
                  data-cursor="hover"
                  className="rounded-full px-7 py-3.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                  style={{ background: C.espresso }}
                >
                  Shop our beans
                </a>
                <a href="#visit" className="text-sm font-medium underline underline-offset-4" style={{ color: C.oak }}>
                  Find our café →
                </a>
              </div>
            </Rise>
          </div>

          <Rise delay={0.1}>
            <CoffeeArt />
          </Rise>
        </section>

        {/* Roasts */}
        <section id="roasts" className="py-16 md:py-24">
          <Rise>
            <div className="flex items-end justify-between">
              <h2 style={serif} className="text-3xl font-semibold md:text-5xl">
                This week&rsquo;s roasts
              </h2>
              <span className="hidden text-sm md:block" style={{ color: C.oak }}>
                Roasted Mondays &amp; Thursdays
              </span>
            </div>
          </Rise>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {roasts.map((r, i) => (
              <Rise key={r.name} delay={i * 0.08}>
                <div
                  className="flex h-full flex-col rounded-3xl p-7 transition-transform duration-300 hover:-translate-y-1"
                  style={{ background: C.card }}
                >
                  <div
                    className="mb-6 h-32 rounded-2xl"
                    style={{ background: `radial-gradient(120% 120% at 30% 20%, ${C.terracotta}, ${C.espresso})` }}
                  />
                  <h3 style={serif} className="text-2xl font-semibold">
                    {r.name}
                  </h3>
                  <p className="mt-1 text-sm" style={{ color: C.oak }}>
                    {r.origin}
                  </p>
                  <p className="mt-4 text-sm leading-relaxed" style={{ color: C.espresso }}>
                    {r.notes}
                  </p>
                  <div className="mt-6 flex items-center justify-between pt-4" style={{ borderTop: `1px solid ${C.oak}33` }}>
                    <span className="text-lg font-semibold">{r.price}</span>
                    <span
                      data-cursor="hover"
                      className="rounded-full px-4 py-2 text-xs font-semibold text-white"
                      style={{ background: C.terracotta }}
                    >
                      Add to bag
                    </span>
                  </div>
                </div>
              </Rise>
            ))}
          </div>
        </section>

        {/* Story */}
        <section id="story" className="grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
          <Rise>
            <div
              className="aspect-square rounded-[2rem]"
              style={{ background: `linear-gradient(160deg, ${C.oak}, ${C.espresso})` }}
            />
          </Rise>
          <Rise delay={0.08}>
            <div>
              <span className="text-xs font-medium uppercase tracking-widest" style={{ color: C.terracotta }}>
                Our story
              </span>
              <h2 style={serif} className="mt-4 text-3xl font-semibold leading-tight md:text-5xl">
                A corner shop with a very loud roaster.
              </h2>
              <p className="mt-6 text-lg leading-relaxed" style={{ color: C.oak }}>
                It started with one secondhand roaster and a stubborn belief that
                good coffee shouldn&rsquo;t be complicated. Ten years later we
                still roast on the same street, for the same neighbours.
              </p>
              <div className="mt-8 grid grid-cols-3 gap-6">
                {[
                  ["10", "Years roasting"],
                  ["24", "Origins poured"],
                  ["1", "Very loud roaster"],
                ].map(([n, l]) => (
                  <div key={l}>
                    <div style={serif} className="text-4xl font-semibold" >
                      {n}
                    </div>
                    <div className="mt-1 text-xs" style={{ color: C.oak }}>
                      {l}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Rise>
        </section>

        {/* Visit / CTA */}
        <section id="visit" className="pb-24">
          <Rise>
            <div
              className="overflow-hidden rounded-[2.5rem] px-8 py-16 text-center md:px-16 md:py-24"
              style={{ background: C.espresso, color: C.cream }}
            >
              <h2 style={serif} className="mx-auto max-w-2xl text-4xl font-semibold leading-tight md:text-6xl">
                Come sit a while.
              </h2>
              <p className="mx-auto mt-5 max-w-md text-lg" style={{ color: "#d8c8b4" }}>
                Open 7am–4pm, every day. 42 Maple Street, corner of Oak.
              </p>
              <a
                href="#"
                data-cursor="hover"
                className="mt-8 inline-block rounded-full px-8 py-4 text-sm font-semibold transition-transform hover:-translate-y-0.5"
                style={{ background: C.terracotta, color: "#fff" }}
              >
                Get directions
              </a>
            </div>
          </Rise>
        </section>

        {/* Footer */}
        <footer className="flex flex-col items-center justify-between gap-3 py-10 text-sm md:flex-row" style={{ color: C.oak, borderTop: `1px solid ${C.oak}33` }}>
          <span style={serif} className="text-base font-semibold" >
            Ember &amp; Oak
          </span>
          <span>© 2025 · A Southpage demo</span>
        </footer>
      </div>
    </div>
  );
}

/* Composed coffee illustration — cup, saucer, steam, beans. */
function CoffeeArt() {
  return (
    <div
      className="relative mx-auto grid aspect-square w-full max-w-md place-items-center rounded-[2.5rem]"
      style={{ background: `radial-gradient(120% 120% at 70% 10%, ${C.card}, ${C.cream})` }}
    >
      <svg viewBox="0 0 240 240" className="w-3/4" fill="none">
        {/* steam */}
        <path d="M104 44c-10-10 6-18-2-30M124 44c-10-10 6-18-2-30M144 44c-10-10 6-18-2-30"
          stroke={C.oak} strokeWidth="4" strokeLinecap="round" opacity="0.6" />
        {/* cup */}
        <path d="M60 92h108v40a54 54 0 0 1-54 54 54 54 0 0 1-54-54V92Z" fill={C.espresso} />
        <path d="M168 100h14a24 24 0 0 1 0 48h-8" stroke={C.espresso} strokeWidth="10" strokeLinecap="round" />
        {/* coffee surface */}
        <ellipse cx="114" cy="96" rx="52" ry="12" fill={C.terracotta} />
        {/* saucer */}
        <ellipse cx="114" cy="196" rx="82" ry="16" fill={C.oak} opacity="0.35" />
      </svg>
    </div>
  );
}
