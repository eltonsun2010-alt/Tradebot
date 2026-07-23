"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import { DemoRibbon } from "@/components/demos/DemoRibbon";

/* ==================================================================== *
 * Café Aurelia — a warm, editorial fine-dining café. High-contrast serif,
 * cream & espresso, terracotta accents. Cinematic parallax, an elegant
 * tabbed menu, alternating signature plates, a soft gallery and a warm
 * reservation. Its own identity — nothing shared with the other demos.
 * ==================================================================== */

const INK = "#2a1a10";
const CREAM = "#f4ede0";
const PAPER = "#efe4d2";
const SUB = "#8a6f52";
const CLAY = "#b8542e";
const OLIVE = "#6c6a43";
const serif = { fontFamily: "var(--font-cormorant), Georgia, serif" } as const;

const grad = "linear-gradient(150deg, #c98a5b, #2a1a10)";

const ease = [0.16, 1, 0.3, 1] as const;
const rise: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.9, delay: i * 0.08, ease } }),
};

function Reveal({ children, i = 0, className }: { children: React.ReactNode; i?: number; className?: string }) {
  return (
    <motion.div variants={rise} custom={i} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} className={className}>
      {children}
    </motion.div>
  );
}

const NAV = [
  { label: "Menu", href: "#menu" },
  { label: "Signatures", href: "#signatures" },
  { label: "Gallery", href: "#gallery" },
  { label: "Visit", href: "#visit" },
];

export function CafeSite() {
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const heroFade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  if (typeof window !== "undefined") {
    window.onscroll = () => setScrolled(window.scrollY > 40);
  }

  return (
    <div style={{ background: CREAM, color: INK }} className="min-h-screen overflow-x-hidden">
      <DemoRibbon theme="light" />

      {/* ── Nav: centred wordmark with split links ── */}
      <header
        className="fixed inset-x-0 top-0 z-[500] transition-all duration-500"
        style={{
          background: scrolled ? `${CREAM}f2` : "transparent",
          backdropFilter: scrolled ? "blur(10px)" : "none",
          borderBottom: `1px solid ${scrolled ? "rgba(42,26,16,0.12)" : "transparent"}`,
        }}
      >
        <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-6 py-5 md:px-10">
          <nav className="hidden items-center gap-7 text-[0.82rem] font-medium tracking-wide md:flex" style={{ color: scrolled ? INK : "#f4ede0" }}>
            {NAV.slice(0, 2).map((l) => (
              <a key={l.href} href={l.href} data-cursor="hover" className="opacity-80 transition-opacity hover:opacity-100">{l.label}</a>
            ))}
          </nav>
          <a href="#top" data-cursor="hover" className="text-center text-2xl leading-none md:text-3xl" style={{ ...serif, color: scrolled ? INK : "#f4ede0", fontWeight: 600, letterSpacing: "0.02em" }}>
            Aurelia
          </a>
          <div className="hidden items-center justify-end gap-7 md:flex">
            <nav className="flex items-center gap-7 text-[0.82rem] font-medium tracking-wide" style={{ color: scrolled ? INK : "#f4ede0" }}>
              {NAV.slice(2).map((l) => (
                <a key={l.href} href={l.href} data-cursor="hover" className="opacity-80 transition-opacity hover:opacity-100">{l.label}</a>
              ))}
            </nav>
            <a href="#visit" data-cursor="hover" className="rounded-full px-5 py-2 text-[0.8rem] font-semibold transition-transform hover:-translate-y-0.5" style={{ background: CLAY, color: "#fff" }}>
              Reserve
            </a>
          </div>
          {/* mobile wordmark already centred; simple reserve on the right */}
          <a href="#visit" className="justify-self-end rounded-full px-4 py-1.5 text-xs font-semibold md:hidden" style={{ background: CLAY, color: "#fff" }}>Reserve</a>
        </div>
      </header>

      {/* ── Cinematic hero ── */}
      <section id="top" ref={heroRef} className="relative h-[100svh] w-full overflow-hidden">
        <motion.div style={{ y: heroY, scale: heroScale, background: grad }} className="absolute inset-0">
          <CafeArt kind="hero" />
        </motion.div>
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(20,12,7,0.55) 0%, rgba(20,12,7,0.15) 35%, rgba(20,12,7,0.65) 100%)" }} />
        <motion.div style={{ opacity: heroFade }} className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-end px-6 pb-[12vh] md:px-10">
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.2, ease }} className="mb-5 text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "#e8c9a0" }}>
            Est. 2014 · Corner of Vine &amp; Maple
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.1, delay: 0.35, ease }} className="max-w-4xl text-[clamp(3.2rem,11vw,9rem)] leading-[0.92] text-[#f7efe2]" style={{ ...serif, fontWeight: 500 }}>
            Slow mornings,<br /><em style={{ color: "#f0b489" }}>rich</em> with ritual.
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.55, ease }} className="mt-7 max-w-md text-[1.02rem] leading-relaxed text-[#e9ddca]">
            A neighbourhood café where single-origin coffee meets a seasonal kitchen — roasted, baked and plated in-house, every day.
          </motion.p>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.8 }} className="mt-9 flex flex-wrap items-center gap-4">
            <a href="#menu" data-cursor="hover" className="rounded-full px-7 py-3.5 text-sm font-semibold transition-transform hover:-translate-y-0.5" style={{ background: "#f4ede0", color: INK }}>Explore the menu</a>
            <a href="#visit" data-cursor="hover" className="rounded-full border px-7 py-3.5 text-sm font-semibold text-[#f4ede0] transition-colors hover:bg-white/10" style={{ borderColor: "rgba(255,255,255,0.5)" }}>Book a table</a>
          </motion.div>
        </motion.div>
        <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-[#e9ddca]/70">
          <span className="text-[0.7rem] uppercase tracking-[0.3em]">Scroll</span>
        </div>
      </section>

      {/* ── Atmosphere strip ── */}
      <section className="mx-auto max-w-5xl px-6 py-24 text-center md:px-10 md:py-32">
        <Reveal>
          <span className="text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: CLAY }}>The Aurelia way</span>
        </Reveal>
        <Reveal i={1}>
          <p className="mx-auto mt-8 max-w-3xl text-[clamp(1.6rem,3.6vw,2.7rem)] leading-[1.28]" style={{ ...serif, fontWeight: 500 }}>
            We believe the best days begin unhurried. Beans roasted on Tuesdays, bread proved overnight, and a room that asks you to stay a little longer than you planned.
          </p>
        </Reveal>
        <Reveal i={2}>
          <div className="mx-auto mt-12 h-px w-24" style={{ background: CLAY }} />
        </Reveal>
      </section>

      {/* ── Featured menu (tabbed) ── */}
      <MenuSection />

      {/* ── Signature dishes ── */}
      <section id="signatures" className="mx-auto max-w-6xl px-6 py-24 md:px-10 md:py-32">
        <Reveal>
          <div className="flex items-end justify-between gap-6">
            <h2 className="text-[clamp(2.2rem,6vw,4rem)] leading-none" style={{ ...serif, fontWeight: 500 }}>Signature plates</h2>
            <span className="hidden text-sm md:block" style={{ color: SUB }}>Changing with the season</span>
          </div>
        </Reveal>
        <div className="mt-16 flex flex-col gap-20 md:gap-28">
          {SIGNATURES.map((s, i) => (
            <SignatureRow key={s.name} s={s} flip={i % 2 === 1} />
          ))}
        </div>
      </section>

      {/* ── Gallery ── */}
      <section id="gallery" className="px-6 py-16 md:px-10 md:py-24">
        <Reveal className="mx-auto mb-12 max-w-6xl">
          <span className="text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: CLAY }}>The room</span>
          <h2 className="mt-4 text-[clamp(2rem,5vw,3.4rem)] leading-none" style={{ ...serif, fontWeight: 500 }}>A little corner of warmth</h2>
        </Reveal>
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {[
            { kind: "interior", h: "h-72 md:h-96", span: "md:row-span-2" },
            { kind: "latte", h: "h-40 md:h-44", span: "" },
            { kind: "croissant", h: "h-40 md:h-44", span: "" },
            { kind: "brunch", h: "h-40 md:h-48", span: "md:col-span-2" },
            { kind: "beans", h: "h-52 md:h-60", span: "" },
            { kind: "barista", h: "h-52 md:h-60", span: "" },
            { kind: "cake", h: "h-52 md:h-60", span: "md:col-span-2" },
          ].map((g) => (
            <div key={g.kind} className={`group relative overflow-hidden rounded-2xl ${g.span}`}>
              <div className={`${g.h} w-full transition-transform duration-700 group-hover:scale-105`}>
                <CafeArt kind={g.kind} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonial ── */}
      <section className="px-6 py-24 md:py-32" style={{ background: PAPER }}>
        <div className="mx-auto max-w-4xl text-center">
          <Reveal>
            <div className="mb-8 text-5xl" style={{ ...serif, color: CLAY }}>&ldquo;</div>
          </Reveal>
          <Reveal i={1}>
            <p className="text-[clamp(1.5rem,3.4vw,2.4rem)] leading-[1.32]" style={{ ...serif, fontWeight: 500 }}>
              The kind of place you build a week around. The flat white is faultless and the sourdough alone is worth the walk across town.
            </p>
          </Reveal>
          <Reveal i={2}>
            <p className="mt-8 text-sm font-semibold uppercase tracking-[0.3em]" style={{ color: SUB }}>Harper Lane · Food &amp; Wine Weekly</p>
          </Reveal>
        </div>
      </section>

      {/* ── Visit: reservation + hours ── */}
      <section id="visit" className="mx-auto max-w-6xl px-6 py-24 md:px-10 md:py-32">
        <div className="grid gap-14 md:grid-cols-2 md:gap-20">
          <Reveal>
            <span className="text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: CLAY }}>Reserve a table</span>
            <h2 className="mt-4 text-[clamp(2rem,5vw,3.2rem)] leading-[1.02]" style={{ ...serif, fontWeight: 500 }}>Join us for something slow.</h2>
            <p className="mt-5 max-w-md leading-relaxed" style={{ color: SUB }}>Walk-ins are always welcome, but weekends fill fast. Book ahead and we&rsquo;ll have the good seats waiting.</p>
            <ReservationForm />
          </Reveal>

          <Reveal i={1}>
            <div className="overflow-hidden rounded-3xl" style={{ border: "1px solid rgba(42,26,16,0.12)" }}>
              <div className="h-56 w-full"><CafeArt kind="storefront" /></div>
              <div className="p-8" style={{ background: CREAM }}>
                <h3 className="text-2xl" style={{ ...serif, fontWeight: 600 }}>Find us</h3>
                <p className="mt-3 leading-relaxed" style={{ color: SUB }}>128 Vine Street, corner of Maple<br />Riverside District</p>
                <div className="mt-7 space-y-2.5 border-t pt-6 text-sm" style={{ borderColor: "rgba(42,26,16,0.12)" }}>
                  {HOURS.map((h) => (
                    <div key={h.d} className="flex items-baseline justify-between">
                      <span className="font-medium">{h.d}</span>
                      <span className="mx-3 flex-1 border-b border-dotted" style={{ borderColor: "rgba(42,26,16,0.25)" }} />
                      <span style={{ color: SUB }}>{h.t}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-7 flex flex-wrap gap-x-6 gap-y-1 text-sm" style={{ color: INK }}>
                  <span>hello@aurelia.cafe</span>
                  <span>(555) 240-1188</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="px-6 pb-10 md:px-10" style={{ borderTop: "1px solid rgba(42,26,16,0.12)" }}>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 py-10 text-sm md:flex-row" style={{ color: SUB }}>
          <span className="text-2xl" style={{ ...serif, color: INK, fontWeight: 600 }}>Aurelia</span>
          <span>© 2025 Café Aurelia · A Southpage demo, not a real business</span>
        </div>
      </footer>
    </div>
  );
}

/* --------------------------------- menu --------------------------------- */
const MENU: Record<string, { name: string; note: string; price: string }[]> = {
  Coffee: [
    { name: "Aurelia Espresso", note: "cocoa · toasted almond · brown sugar", price: "4.0" },
    { name: "Flat White", note: "silk microfoam, double ristretto", price: "4.8" },
    { name: "Hand Pour-Over", note: "rotating single origin, brewed to order", price: "6.5" },
    { name: "Iced Maple Latte", note: "grade-A maple, oat or whole", price: "5.9" },
    { name: "Cortado", note: "equal parts, warm and round", price: "4.2" },
  ],
  Kitchen: [
    { name: "Soft Eggs & Sourdough", note: "cultured butter, chilli honey, herbs", price: "14" },
    { name: "Wild Mushroom Toast", note: "thyme cream, aged pecorino", price: "16" },
    { name: "Smoked Salmon Plate", note: "crème fraîche, capers, dill", price: "18" },
    { name: "Seasonal Grain Bowl", note: "roast squash, feta, pumpkin seeds", price: "15" },
  ],
  Pastry: [
    { name: "Brown-Butter Croissant", note: "laminated over three days", price: "5.5" },
    { name: "Pistachio Escargot", note: "orange blossom, sea salt", price: "6.5" },
    { name: "Basque Cheesecake", note: "burnt top, vanilla bean", price: "7.0" },
    { name: "Morning Bun", note: "cardamom sugar, citrus zest", price: "5.0" },
  ],
};

function MenuSection() {
  const tabs = Object.keys(MENU);
  const [tab, setTab] = useState(tabs[0]);
  return (
    <section id="menu" className="py-24 md:py-32" style={{ background: INK, color: CREAM }}>
      <div className="mx-auto max-w-5xl px-6 md:px-10">
        <Reveal>
          <div className="flex flex-col items-center text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.4em]" style={{ color: "#f0b489" }}>Featured menu</span>
            <h2 className="mt-4 text-[clamp(2.4rem,6vw,4.2rem)] leading-none text-[#f4ede0]" style={{ ...serif, fontWeight: 500 }}>Roasted &amp; baked in-house</h2>
          </div>
        </Reveal>

        <div className="mt-12 flex justify-center gap-2">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              data-cursor="hover"
              className="rounded-full px-5 py-2 text-sm font-semibold transition-all"
              style={{
                background: tab === t ? "#f0b489" : "transparent",
                color: tab === t ? INK : "#e9ddca",
                border: `1px solid ${tab === t ? "#f0b489" : "rgba(240,180,137,0.35)"}`,
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <motion.div key={tab} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }} className="mx-auto mt-12 max-w-2xl">
          {MENU[tab].map((m, i) => (
            <motion.div
              key={m.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.06, ease }}
              className="flex items-baseline gap-4 border-b py-5"
              style={{ borderColor: "rgba(240,180,137,0.16)" }}
            >
              <div className="flex-1">
                <h3 className="text-xl md:text-2xl" style={{ ...serif, fontWeight: 600, color: "#f4ede0" }}>{m.name}</h3>
                <p className="mt-1 text-sm" style={{ color: "#c9b79a" }}>{m.note}</p>
              </div>
              <span className="text-lg" style={{ ...serif, color: "#f0b489" }}>{m.price}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

const SIGNATURES = [
  { name: "The Aurelia Board", note: "Whipped ricotta, honeycomb, stone fruit and warm sourdough — made to share, slowly.", kind: "board", tag: "House favourite" },
  { name: "Saffron Croissant", note: "Our three-day laminated croissant, glazed in saffron and finished with candied orange.", kind: "saffron", tag: "Bakery" },
  { name: "Barrel-Aged Cold Brew", note: "Steeped 18 hours, rested in oak. Notes of dark cocoa, fig and a whisper of vanilla.", kind: "coldbrew", tag: "Coffee bar" },
] as const;

/* ------------------------- Café Aurelia bespoke artwork ------------------------- */
// Warm editorial illustrations in place of unverifiable stock photos — every
// plate matches the menu item it sits beside, in the house palette, every load.
const C = {
  cream: "#f4ede0", sand: "#e7d4b6", milk: "#f9f2e6", clay: "#b8542e", terra: "#cf7a4f",
  peach: "#f0c39a", olive: "#7d7a4e", espresso: "#3a2416", deep: "#2a1a10", gold: "#d99a4e", ink: "#2a1a10",
};

export function CafeArt({ kind }: { kind: string }) {
  const box = (w: number, h: number, children: React.ReactNode, bg = C.cream) => (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden>
      <rect width={w} height={h} fill={bg} />
      {children}
    </svg>
  );

  if (kind === "hero") {
    return box(1440, 900, (
      <>
        <defs><linearGradient id="cfHero" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d8b184" /><stop offset="0.55" stopColor="#a9743f" /><stop offset="1" stopColor="#4a2f1c" /></linearGradient></defs>
        <rect width="1440" height="900" fill="url(#cfHero)" />
        {/* pendant lamps */}
        {[420, 720, 1020].map((x) => (<g key={x}><line x1={x} y1="0" x2={x} y2="150" stroke="#2a1a10" strokeWidth="4" /><circle cx={x} cy="176" r="30" fill="#2a1a10" /><circle cx={x} cy="182" r="20" fill="#ffd9a0" opacity="0.9" /><ellipse cx={x} cy="230" rx="120" ry="90" fill="#ffdca6" opacity="0.14" /></g>))}
        {/* back shelf with jars */}
        <rect x="120" y="330" width="1200" height="10" fill="#3a2416" opacity="0.5" />
        {[180, 260, 340, 1060, 1140, 1220].map((x, i) => (<rect key={x} x={x} y={286 - (i % 2) * 8} width="46" height="52" rx="6" fill="#e7d4b6" opacity="0.5" />))}
        {/* counter */}
        <rect x="0" y="560" width="1440" height="340" fill="#3a2416" />
        <rect x="0" y="560" width="1440" height="14" fill="#5a3a22" />
        {/* espresso machine */}
        <g transform="translate(520 430)"><rect width="360" height="130" rx="12" fill="#c9873f" /><rect y="-40" width="360" height="46" rx="8" fill="#a5692c" /><g fill="#3a2416"><rect x="60" y="96" width="40" height="40" rx="4" /><rect x="260" y="96" width="40" height="40" rx="4" /></g><circle cx="180" cy="40" r="16" fill="#f4ede0" /></g>
        {/* a cup with steam on the counter */}
        <g transform="translate(1050 590)"><path d="M0 20 h96 v34 a48 48 0 0 1 -96 0 z" fill="#f4ede0" /><path d="M96 26 a20 20 0 0 1 0 40" fill="none" stroke="#f4ede0" strokeWidth="9" /><ellipse cx="48" cy="20" rx="48" ry="12" fill="#6f4a2c" /><g stroke="#f4ede0" strokeWidth="5" strokeLinecap="round" opacity="0.5" fill="none"><path d="M34 4 q -10 -18 4 -34" /><path d="M62 4 q -10 -18 4 -34" /></g></g>
      </>
    ));
  }

  if (kind === "interior") {
    return box(320, 600, (
      <>
        <rect width="320" height="600" fill={C.sand} />
        {/* arched window with warm light */}
        <path d="M60 120 a100 100 0 0 1 200 0 v240 H60 Z" fill={C.milk} />
        <path d="M60 120 a100 100 0 0 1 200 0 v240 H60 Z" fill="none" stroke={C.espresso} strokeWidth="6" />
        <line x1="160" y1="26" x2="160" y2="360" stroke={C.espresso} strokeWidth="5" /><line x1="60" y1="200" x2="260" y2="200" stroke={C.espresso} strokeWidth="5" />
        {/* plant */}
        <g transform="translate(250 372)"><rect x="-22" y="0" width="44" height="40" rx="6" fill={C.clay} /><g fill={C.olive}><path d="M0 0 q -34 -46 -8 -84 q 22 34 8 84" /><path d="M0 0 q 34 -40 12 -80 q -20 30 -12 80" /><path d="M0 0 q 4 -54 -2 -74 q 8 30 2 74" /></g></g>
        {/* round table + cup */}
        <ellipse cx="150" cy="470" rx="120" ry="26" fill={C.espresso} />
        <rect x="140" y="470" width="20" height="90" fill={C.deep} />
        <g transform="translate(120 440)"><path d="M0 8 h60 v18 a30 30 0 0 1 -60 0 z" fill={C.cream} /><ellipse cx="30" cy="8" rx="30" ry="7" fill="#6f4a2c" /></g>
      </>
    ));
  }

  if (kind === "latte") {
    return box(300, 300, (
      <>
        <rect width="300" height="300" fill={C.peach} />
        <circle cx="150" cy="150" r="104" fill={C.milk} />
        <circle cx="150" cy="150" r="86" fill="#8a5a34" />
        {/* leaf latte art */}
        <g fill={C.milk} opacity="0.92"><path d="M150 92 C 138 120 138 150 150 208 C 162 150 162 120 150 92 Z" /><g><path d="M150 120 q -26 6 -34 22 q 22 -2 34 -12 Z" /><path d="M150 138 q -22 6 -30 20 q 20 -2 30 -10 Z" /><path d="M150 120 q 26 6 34 22 q -22 -2 -34 -12 Z" /><path d="M150 138 q 22 6 30 20 q -20 -2 -30 -10 Z" /></g></g>
      </>
    ), C.peach);
  }

  if (kind === "croissant" || kind === "saffron") {
    const glaze = kind === "saffron";
    return box(300, 300, (
      <>
        <rect width="300" height="300" fill={glaze ? "#efe0c4" : C.cream} />
        <ellipse cx="150" cy="200" rx="120" ry="26" fill="#00000010" />
        <g transform="translate(150 160)">
          <path d="M-96 24 C -70 -26 -30 -34 0 -30 C 30 -34 70 -26 96 24 C 60 12 40 22 30 4 C 22 20 8 20 0 6 C -8 20 -22 20 -30 4 C -40 22 -60 12 -96 24 Z" fill={glaze ? C.gold : "#c98a44"} stroke={C.espresso} strokeWidth="3" />
          <g stroke={C.espresso} strokeWidth="2" opacity="0.4" fill="none"><path d="M-60 6 q 6 8 2 16" /><path d="M-30 -8 q 6 10 2 18" /><path d="M0 -14 v20" /><path d="M30 -8 q -6 10 -2 18" /><path d="M60 6 q -6 8 -2 16" /></g>
          {glaze && <g fill="#a8451f"><circle cx="-20" cy="-6" r="3" /><circle cx="14" cy="-2" r="3" /><circle cx="42" cy="8" r="2.5" /><circle cx="-48" cy="10" r="2.5" /></g>}
        </g>
        {glaze && <ellipse cx="150" cy="150" rx="150" ry="30" fill="#f6b24d" opacity="0.08" />}
      </>
    ));
  }

  if (kind === "brunch") {
    return box(400, 220, (
      <>
        <rect width="400" height="220" fill={C.sand} />
        {/* plate */}
        <circle cx="180" cy="120" r="92" fill={C.milk} /><circle cx="180" cy="120" r="92" fill="none" stroke="#0000000f" strokeWidth="8" />
        {/* toast */}
        <rect x="120" y="96" width="80" height="52" rx="10" fill="#d9a45f" />
        {/* eggs */}
        <g><circle cx="200" cy="112" r="26" fill={C.milk} /><circle cx="200" cy="112" r="11" fill={C.gold} /><circle cx="236" cy="140" r="22" fill={C.milk} /><circle cx="236" cy="140" r="9" fill={C.gold} /></g>
        {/* herbs */}
        <g fill={C.olive}><circle cx="150" cy="150" r="4" /><circle cx="170" cy="160" r="4" /><circle cx="210" cy="158" r="4" /></g>
        {/* cutlery + cup */}
        <rect x="300" y="60" width="8" height="120" rx="4" fill="#b9b09c" /><rect x="322" y="60" width="8" height="120" rx="4" fill="#b9b09c" />
        <g transform="translate(300 150)"><path d="M0 6 h56 v14 a28 28 0 0 1 -56 0 z" fill={C.cream} /><ellipse cx="28" cy="6" rx="28" ry="6" fill="#6f4a2c" /></g>
      </>
    ));
  }

  if (kind === "beans") {
    return box(300, 300, (
      <>
        <rect width="300" height="300" fill={C.espresso} />
        {/* scoop */}
        <path d="M60 150 a70 70 0 0 0 140 0 z" fill="#caa06a" />
        <rect x="196" y="140" width="90" height="18" rx="9" fill="#caa06a" />
        {/* beans pile */}
        {Array.from({ length: 26 }).map((_, i) => { const a = i * 0.61; const r = 30 + (i % 5) * 9; const x = 130 + Math.cos(a) * r; const y = 150 + Math.sin(a) * r * 0.7; return (<g key={i} transform={`translate(${x} ${y}) rotate(${(i * 47) % 180})`}><ellipse rx="11" ry="7" fill="#5a3620" /><path d="M0 -7 Q 3 0 0 7" stroke="#2a1a10" strokeWidth="1.5" fill="none" /></g>); })}
      </>
    ), C.espresso);
  }

  if (kind === "barista") {
    return box(300, 300, (
      <>
        <rect width="300" height="300" fill={C.terra} />
        {/* pour-over: gooseneck kettle pouring into a dripper */}
        <g transform="translate(150 150)">
          {/* kettle */}
          <g transform="translate(-6 -96)"><rect x="-58" y="0" width="90" height="56" rx="14" fill={C.deep} /><path d="M32 14 q 46 2 40 54" fill="none" stroke={C.deep} strokeWidth="10" strokeLinecap="round" /><rect x="-40" y="-16" width="54" height="12" rx="6" fill={C.deep} /></g>
          {/* pour stream */}
          <path d="M72 -26 q 2 40 -18 66" fill="none" stroke={C.cream} strokeWidth="5" strokeLinecap="round" opacity="0.85" />
          {/* dripper + cup */}
          <path d="M6 40 L94 40 L74 92 L26 92 Z" fill={C.cream} />
          <path d="M18 92 h64 v18 a32 32 0 0 1 -64 0 z" fill={C.milk} />
        </g>
        <g stroke={C.cream} strokeWidth="4" strokeLinecap="round" opacity="0.4" fill="none"><path d="M150 96 q -8 -14 3 -26" /></g>
      </>
    ), C.terra);
  }

  if (kind === "cake") {
    return box(400, 260, (
      <>
        <rect width="400" height="260" fill={C.cream} />
        <ellipse cx="200" cy="200" rx="150" ry="26" fill="#00000010" />
        {/* plate */}
        <ellipse cx="200" cy="196" rx="150" ry="24" fill={C.milk} />
        {/* cake slice */}
        <g transform="translate(150 78)">
          <path d="M0 110 L0 40 L140 20 L140 100 Z" fill="#8a5a34" />
          <path d="M0 40 L140 20 L140 34 L0 54 Z" fill="#f4d7bf" />
          <path d="M0 68 L140 48 L140 62 L0 82 Z" fill="#f4d7bf" />
          <path d="M0 40 L140 20 L150 30 L14 52 Z" fill={C.terra} />
          <circle cx="70" cy="12" r="8" fill={C.clay} />
        </g>
        {/* fork */}
        <g transform="translate(322 120)" fill="#b9b09c"><rect x="0" y="0" width="7" height="90" rx="3" /><rect x="-9" y="0" width="4" height="26" /><rect x="12" y="0" width="4" height="26" /></g>
      </>
    ));
  }

  if (kind === "storefront") {
    return box(400, 224, (
      <>
        <rect width="400" height="224" fill="#b9c7c0" />
        {/* building */}
        <rect x="30" y="40" width="340" height="184" fill={C.cream} />
        {/* sign */}
        <rect x="30" y="40" width="340" height="34" fill={C.espresso} /><text x="200" y="64" textAnchor="middle" fill={C.cream} style={{ fontFamily: "var(--font-cormorant), serif", fontWeight: 600 }} fontSize="22" letterSpacing="4">AURELIA</text>
        {/* awning */}
        <g>{Array.from({ length: 8 }).map((_, i) => (<rect key={i} x={30 + i * 42.5} y="80" width="42.5" height="26" fill={i % 2 ? C.clay : "#e7d4b6"} />))}<rect x="30" y="104" width="340" height="6" fill={C.espresso} opacity="0.4" /></g>
        {/* door + windows */}
        <rect x="176" y="130" width="48" height="94" fill={C.espresso} /><rect x="182" y="140" width="36" height="50" fill="#8fb0c4" opacity="0.7" />
        <rect x="60" y="130" width="90" height="70" fill="#8fb0c4" opacity="0.6" stroke={C.espresso} strokeWidth="3" />
        <rect x="250" y="130" width="90" height="70" fill="#8fb0c4" opacity="0.6" stroke={C.espresso} strokeWidth="3" />
        {/* outdoor table */}
        <g transform="translate(96 206)"><rect x="-2" y="-16" width="4" height="16" fill={C.espresso} /><ellipse cx="0" cy="-16" rx="18" ry="5" fill={C.espresso} /></g>
      </>
    ));
  }

  if (kind === "board") {
    return box(400, 520, (
      <>
        <rect width="400" height="520" fill={C.sand} />
        {/* wooden board */}
        <rect x="40" y="120" width="320" height="300" rx="24" fill="#a06a3c" />
        <rect x="40" y="120" width="320" height="300" rx="24" fill="none" stroke="#7c4e28" strokeWidth="4" />
        <g stroke="#8a5a30" strokeWidth="2" opacity="0.5"><line x1="60" y1="180" x2="340" y2="180" /><line x1="60" y1="280" x2="340" y2="280" /><line x1="60" y1="360" x2="340" y2="360" /></g>
        {/* ricotta bowl */}
        <g transform="translate(150 210)"><ellipse rx="56" ry="40" fill="#e9ddc4" /><ellipse cy="-6" rx="46" ry="26" fill={C.milk} /><path d="M-20 -12 q 20 -14 40 0" stroke={C.gold} strokeWidth="4" fill="none" /></g>
        {/* honeycomb */}
        <g transform="translate(266 214)" fill={C.gold}><polygon points="0,-24 21,-12 21,12 0,24 -21,12 -21,-12" /><polygon points="0,-24 21,-12 21,12 0,24 -21,12 -21,-12" fill="none" stroke="#b9812f" strokeWidth="2" /></g>
        {/* figs / stone fruit */}
        <g><circle cx="120" cy="330" r="22" fill="#7a3b57" /><path d="M120 308 l0 -10" stroke={C.olive} strokeWidth="4" /><circle cx="176" cy="352" r="18" fill="#c25a3a" /><circle cx="150" cy="368" r="14" fill="#8a3f5c" /></g>
        {/* sourdough slices */}
        <g transform="translate(280 350)"><ellipse rx="46" ry="30" fill="#d9a45f" /><ellipse rx="34" ry="20" fill="#efc98f" /></g>
        <g transform="translate(300 300)"><ellipse rx="40" ry="26" fill="#d9a45f" /><ellipse rx="29" ry="17" fill="#efc98f" /></g>
      </>
    ));
  }

  if (kind === "coldbrew") {
    return box(400, 520, (
      <>
        <defs><linearGradient id="cfCB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7c5230" /><stop offset="1" stopColor="#2a1a10" /></linearGradient></defs>
        <rect width="400" height="520" fill="url(#cfCB)" />
        {/* oak barrel hint */}
        <g transform="translate(300 300)" opacity="0.5"><rect x="-70" y="-90" width="140" height="200" rx="34" fill="#6b4423" /><rect x="-72" y="-58" width="144" height="12" fill="#3a2416" /><rect x="-72" y="46" width="144" height="12" fill="#3a2416" /></g>
        {/* tall glass */}
        <g transform="translate(150 120)">
          <rect x="-56" y="0" width="112" height="280" rx="16" fill="#d9c7a8" opacity="0.28" />
          <rect x="-56" y="70" width="112" height="210" rx="16" fill="#3a1f12" />
          {/* ice cubes */}
          <g fill="#ffffff" opacity="0.22"><rect x="-40" y="86" width="34" height="34" rx="6" transform="rotate(12 -23 103)" /><rect x="6" y="104" width="34" height="34" rx="6" transform="rotate(-8 23 121)" /><rect x="-20" y="150" width="34" height="34" rx="6" transform="rotate(6 -3 167)" /></g>
          {/* straw */}
          <rect x="24" y="-30" width="12" height="300" rx="6" fill={C.clay} transform="rotate(8 30 120)" />
        </g>
      </>
    ), C.deep);
  }

  return box(300, 300, <rect width="300" height="300" fill={C.sand} />);
}

function SignatureRow({ s, flip }: { s: (typeof SIGNATURES)[number]; flip: boolean }) {
  return (
    <div className={`grid items-center gap-8 md:grid-cols-2 md:gap-16 ${flip ? "md:[direction:rtl]" : ""}`}>
      <div className="md:[direction:ltr]">
        <div className="h-80 w-full overflow-hidden rounded-3xl md:h-[30rem]"><CafeArt kind={s.kind} /></div>
      </div>
      <Reveal className="md:[direction:ltr]">
        <span className="text-xs font-semibold uppercase tracking-[0.35em]" style={{ color: CLAY }}>{s.tag}</span>
        <h3 className="mt-4 text-[clamp(1.9rem,4vw,3rem)] leading-[1.05]" style={{ ...serif, fontWeight: 500 }}>{s.name}</h3>
        <p className="mt-5 max-w-md text-[1.05rem] leading-relaxed" style={{ color: SUB }}>{s.note}</p>
        <div className="mt-7 h-px w-16" style={{ background: OLIVE }} />
      </Reveal>
    </div>
  );
}

const HOURS = [
  { d: "Monday – Friday", t: "7:00 – 16:00" },
  { d: "Saturday", t: "8:00 – 17:00" },
  { d: "Sunday", t: "8:00 – 15:00" },
];

function ReservationForm() {
  const [sent, setSent] = useState(false);
  const field = "w-full rounded-xl border bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:border-[#b8542e]";
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); setSent(true); }}
      className="mt-8 space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <input required placeholder="Date" onFocus={(e) => (e.target.type = "date")} className={field} style={{ borderColor: "rgba(42,26,16,0.2)", color: INK }} />
        <input required placeholder="Time" onFocus={(e) => (e.target.type = "time")} className={field} style={{ borderColor: "rgba(42,26,16,0.2)", color: INK }} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <select className={field} style={{ borderColor: "rgba(42,26,16,0.2)", color: INK }}>
          <option>2 guests</option><option>1 guest</option><option>3 guests</option><option>4 guests</option><option>5+ guests</option>
        </select>
        <input required placeholder="Name" className={field} style={{ borderColor: "rgba(42,26,16,0.2)", color: INK }} />
      </div>
      <input required type="email" placeholder="Email" className={field} style={{ borderColor: "rgba(42,26,16,0.2)", color: INK }} />
      <button type="submit" data-cursor="hover" className="w-full rounded-xl py-3.5 text-sm font-semibold transition-transform hover:-translate-y-0.5" style={{ background: sent ? OLIVE : CLAY, color: "#fff" }}>
        {sent ? "Table requested — see you soon ✓" : "Request a table"}
      </button>
    </form>
  );
}
