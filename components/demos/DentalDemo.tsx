"use client";

import { motion } from "framer-motion";
import { DemoRibbon } from "./DemoRibbon";

/* Clean, reassuring dental studio. Palette: white / soft mint / teal. */
const C = {
  bg: "#f1faf9",
  card: "#ffffff",
  ink: "#0f2e33",
  sub: "#5b7c7e",
  teal: "#14b8a6",
  mint: "#cbf3ec",
};
const sans = { fontFamily: "var(--font-poppins), ui-sans-serif, system-ui" };

const services = [
  { icon: "🦷", title: "Check-ups", body: "Gentle six-month exams that keep surprises away." },
  { icon: "✨", title: "Whitening", body: "A brighter smile in a single, comfortable visit." },
  { icon: "🪥", title: "Hygiene", body: "Thorough cleans with zero lectures, we promise." },
  { icon: "🩵", title: "Aligners", body: "Clear, custom aligners tracked from your phone." },
];

function Rise({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function DentalDemo() {
  return (
    <div style={{ ...sans, background: C.bg, color: C.ink }} className="min-h-screen">
      <DemoRibbon theme="light" />

      <div className="mx-auto max-w-6xl px-6 md:px-10">
        {/* Nav */}
        <header className="flex items-center justify-between py-7">
          <span className="flex items-center gap-2 text-xl font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-full text-white" style={{ background: C.teal }}>
              M
            </span>
            Marlowe
          </span>
          <nav className="hidden gap-8 text-sm font-medium md:flex" style={{ color: C.sub }}>
            <a href="#services">Services</a>
            <a href="#trust">Why us</a>
            <a href="#book">Contact</a>
          </nav>
          <a
            href="#book"
            data-cursor="hover"
            className="rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
            style={{ background: C.teal }}
          >
            Book appointment
          </a>
        </header>

        {/* Hero */}
        <section className="grid items-center gap-10 py-12 md:grid-cols-2 md:py-20">
          <div>
            <Rise>
              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold" style={{ background: C.mint, color: C.ink }}>
                <span className="h-2 w-2 rounded-full" style={{ background: C.teal }} />
                Accepting new patients
              </span>
            </Rise>
            <Rise delay={0.05}>
              <h1 className="mt-6 text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
                Dentistry that finally feels <span style={{ color: C.teal }}>calm</span>.
              </h1>
            </Rise>
            <Rise delay={0.1}>
              <p className="mt-6 max-w-md text-lg leading-relaxed" style={{ color: C.sub }}>
                Modern, gentle care in a space designed to lower your shoulders
                the moment you walk in. No judgement — just healthy smiles.
              </p>
            </Rise>
            <Rise delay={0.15}>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href="#book"
                  data-cursor="hover"
                  className="rounded-full px-7 py-3.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                  style={{ background: C.teal }}
                >
                  Book an appointment
                </a>
                <span className="text-sm font-medium" style={{ color: C.sub }}>
                  or call (555) 019-2288
                </span>
              </div>
            </Rise>
          </div>

          {/* Friendly booking card */}
          <Rise delay={0.1}>
            <div className="relative">
              <div
                className="aspect-[4/5] rounded-[2rem]"
                style={{ background: `linear-gradient(160deg, ${C.mint}, ${C.teal})` }}
              />
              <div className="absolute -bottom-5 left-1/2 w-[86%] -translate-x-1/2 rounded-2xl bg-white p-5 shadow-xl">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.sub }}>
                  Next available
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-lg font-bold">Tomorrow · 9:00 AM</span>
                  <span className="rounded-full px-4 py-2 text-xs font-semibold text-white" style={{ background: C.teal }}>
                    Reserve
                  </span>
                </div>
              </div>
            </div>
          </Rise>
        </section>

        {/* Services */}
        <section id="services" className="py-16 md:py-24">
          <Rise>
            <h2 className="max-w-xl text-3xl font-bold leading-tight md:text-5xl">
              Everything your smile needs, under one calm roof.
            </h2>
          </Rise>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((s, i) => (
              <Rise key={s.title} delay={i * 0.07}>
                <div className="h-full rounded-2xl bg-white p-6 transition-transform duration-300 hover:-translate-y-1" style={{ boxShadow: "0 8px 30px rgba(15,46,51,0.06)" }}>
                  <div className="grid h-12 w-12 place-items-center rounded-xl text-2xl" style={{ background: C.mint }}>
                    {s.icon}
                  </div>
                  <h3 className="mt-5 text-xl font-bold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: C.sub }}>
                    {s.body}
                  </p>
                </div>
              </Rise>
            ))}
          </div>
        </section>

        {/* Trust */}
        <section id="trust" className="py-16 md:py-24">
          <Rise>
            <div className="rounded-[2rem] px-8 py-14 md:px-16" style={{ background: C.ink, color: "#fff" }}>
              <div className="grid gap-10 md:grid-cols-3">
                {[
                  ["12k+", "Happy patients"],
                  ["15 yrs", "Caring for the neighbourhood"],
                  ["4.9★", "Average review"],
                ].map(([n, l]) => (
                  <div key={l} className="text-center md:text-left">
                    <div className="text-5xl font-bold" style={{ color: C.teal }}>
                      {n}
                    </div>
                    <div className="mt-2 text-sm" style={{ color: "#9fc4c3" }}>
                      {l}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Rise>
        </section>

        {/* Booking CTA */}
        <section id="book" className="pb-24">
          <Rise>
            <div className="grid gap-8 rounded-[2rem] bg-white p-8 md:grid-cols-2 md:p-12" style={{ boxShadow: "0 12px 40px rgba(15,46,51,0.08)" }}>
              <div>
                <h2 className="text-3xl font-bold leading-tight md:text-4xl">
                  Request an appointment
                </h2>
                <p className="mt-4 text-base leading-relaxed" style={{ color: C.sub }}>
                  Tell us when suits you and we&rsquo;ll confirm within the hour
                  during opening times.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <div className="rounded-xl px-4 py-3.5 text-sm" style={{ background: C.bg, color: C.sub }}>
                  Your name
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl px-4 py-3.5 text-sm" style={{ background: C.bg, color: C.sub }}>
                    Preferred date
                  </div>
                  <div className="rounded-xl px-4 py-3.5 text-sm" style={{ background: C.bg, color: C.sub }}>
                    Phone
                  </div>
                </div>
                <button
                  data-cursor="hover"
                  className="mt-1 rounded-xl px-6 py-3.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                  style={{ background: C.teal }}
                >
                  Request appointment
                </button>
              </div>
            </div>
          </Rise>
        </section>

        {/* Footer */}
        <footer className="flex flex-col items-center justify-between gap-3 py-10 text-sm md:flex-row" style={{ color: C.sub, borderTop: `1px solid ${C.ink}14` }}>
          <span className="font-bold" style={{ color: C.ink }}>
            Marlowe Dental
          </span>
          <span>© 2025 · A Southpage demo</span>
        </footer>
      </div>
    </div>
  );
}
