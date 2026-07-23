"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import { Img } from "@/components/demos/Img";
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

const lf = (k: string, lock: number) => `https://loremflickr.com/1100/1400/${k}?lock=${lock}`;
const grad = "linear-gradient(150deg, #c98a5b, #2a1a10)";
const gradSoft = "linear-gradient(150deg, #e5c8a6, #a07f56)";

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
          <img src={lf("coffee,cafe,espresso", 71)} alt="" className="h-full w-full object-cover opacity-90" onError={(e) => ((e.currentTarget.style.display = "none"))} />
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
            { k: "cafe,interior", h: "h-72 md:h-96", span: "md:row-span-2", lock: 81 },
            { k: "coffee,latte", h: "h-40 md:h-44", span: "", lock: 82 },
            { k: "pastry,croissant", h: "h-40 md:h-44", span: "", lock: 83 },
            { k: "cafe,table,breakfast", h: "h-40 md:h-48", span: "md:col-span-2", lock: 84 },
            { k: "coffee,beans", h: "h-52 md:h-60", span: "", lock: 85 },
            { k: "barista,coffee", h: "h-52 md:h-60", span: "", lock: 86 },
            { k: "cake,dessert", h: "h-52 md:h-60", span: "md:col-span-2", lock: 87 },
          ].map((g) => (
            <div key={g.lock} className={`group relative overflow-hidden rounded-2xl ${g.span}`}>
              <Img src={lf(g.k, g.lock)} alt="Aurelia" fallback={gradSoft} rounded="rounded-2xl" className={`${g.h} w-full transition-transform duration-700 group-hover:scale-105`} />
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
              <Img src={lf("cafe,street,shopfront", 88)} alt="Aurelia storefront" fallback={grad} rounded="rounded-none" className="h-56 w-full" />
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
  { name: "The Aurelia Board", note: "Whipped ricotta, honeycomb, stone fruit and warm sourdough — made to share, slowly.", k: "breakfast,board,cheese", lock: 91, tag: "House favourite" },
  { name: "Saffron Croissant", note: "Our three-day laminated croissant, glazed in saffron and finished with candied orange.", k: "croissant,pastry", lock: 92, tag: "Bakery" },
  { name: "Barrel-Aged Cold Brew", note: "Steeped 18 hours, rested in oak. Notes of dark cocoa, fig and a whisper of vanilla.", k: "coldbrew,coffee", lock: 93, tag: "Coffee bar" },
];

function SignatureRow({ s, flip }: { s: (typeof SIGNATURES)[number]; flip: boolean }) {
  return (
    <div className={`grid items-center gap-8 md:grid-cols-2 md:gap-16 ${flip ? "md:[direction:rtl]" : ""}`}>
      <div className="md:[direction:ltr]">
        <Img src={lf(s.k, s.lock)} alt={s.name} fallback={gradSoft} rounded="rounded-3xl" className="h-80 w-full md:h-[30rem]" />
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
