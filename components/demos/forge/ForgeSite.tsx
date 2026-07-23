"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValue, animate, useScroll, useTransform } from "framer-motion";
import { Img } from "@/components/demos/Img";
import { DemoRibbon } from "@/components/demos/DemoRibbon";

/* ==================================================================== *
 * FORGE — a high-energy strength studio. Near-black, volt-lime, heavy
 * condensed display. Kinetic marquee, scroll-triggered counters, a bold
 * asymmetric hero, membership tiers, a weekly timetable and coaches. Its
 * own loud personality — nothing shared with the other demos.
 * ==================================================================== */

const BG = "#0b0b0d";
const PANEL = "#141417";
const VOLT = "#ccff33";
const SUB = "#a3a3ad";
const display = { fontFamily: "var(--font-anton), Impact, sans-serif" } as const;
const cond = { fontFamily: "var(--font-barlow), sans-serif" } as const;

const lf = (k: string, lock: number) => `https://loremflickr.com/1200/1400/${k}?lock=${lock}`;
const grad = "linear-gradient(150deg, #2a2d16, #0b0b0d)";
const ease = [0.16, 1, 0.3, 1] as const;

const NAV = [
  { label: "Membership", href: "#membership" },
  { label: "Timetable", href: "#timetable" },
  { label: "Coaches", href: "#coaches" },
  { label: "Results", href: "#results" },
];

function Reveal({ children, i = 0, className }: { children: React.ReactNode; i?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 34 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, delay: i * 0.07, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const mv = useMotionValue(0);
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, to, { duration: 1.6, ease: [0.22, 1, 0.36, 1], onUpdate: (v) => setVal(v) });
    return () => controls.stop();
  }, [inView, to, mv]);
  return <span ref={ref}>{Math.round(val).toLocaleString()}{suffix}</span>;
}

export function ForgeSite() {
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 30);
    on(); window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <div style={{ background: BG, color: "#f4f4f5" }} className="min-h-screen overflow-x-hidden">
      <DemoRibbon theme="dark" />

      {/* ── Nav ── */}
      <header className="fixed inset-x-0 top-0 z-[500] transition-all duration-300" style={{ background: scrolled ? "rgba(11,11,13,0.85)" : "transparent", backdropFilter: scrolled ? "blur(10px)" : "none", borderBottom: `1px solid ${scrolled ? "rgba(255,255,255,0.08)" : "transparent"}` }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-10">
          <a href="#top" data-cursor="hover" className="flex items-center gap-2 text-2xl tracking-wide" style={display}>
            <span className="inline-block h-3 w-3 rotate-45" style={{ background: VOLT }} />FORGE
          </a>
          <nav className="hidden items-center gap-8 text-sm font-semibold uppercase tracking-wider md:flex" style={cond}>
            {NAV.map((l) => (
              <a key={l.href} href={l.href} data-cursor="hover" className="text-zinc-300 transition-colors hover:text-white">{l.label}</a>
            ))}
          </nav>
          <a href="#membership" data-cursor="hover" className="rounded-sm px-5 py-2.5 text-sm font-bold uppercase tracking-wider transition-transform hover:-translate-y-0.5" style={{ background: VOLT, color: "#0b0b0d", ...cond }}>Join now</a>
        </div>
      </header>

      {/* ── Hero ── */}
      <section id="top" ref={heroRef} className="relative min-h-[100svh] overflow-hidden pt-24">
        <motion.div style={{ y: imgY }} className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0" style={{ background: grad }} />
          <img src={lf("gym,barbell", 61)} alt="" className="h-full w-full object-cover opacity-40" onError={(e) => (e.currentTarget.style.display = "none")} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(11,11,13,0.95) 0%, rgba(11,11,13,0.5) 55%, rgba(11,11,13,0.85) 100%)" }} />
        </motion.div>

        <div className="relative z-10 mx-auto flex min-h-[calc(100svh-6rem)] max-w-7xl flex-col justify-center px-6 md:px-10">
          <motion.p initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease }} className="mb-4 flex items-center gap-3 text-sm font-bold uppercase tracking-[0.3em]" style={{ color: VOLT, ...cond }}>
            <span className="h-px w-10" style={{ background: VOLT }} />Strength &amp; conditioning
          </motion.p>
          <h1 className="text-[clamp(3.5rem,15vw,12rem)] uppercase leading-[0.82]" style={display}>
            <motion.span initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease }} className="block">Train loud.</motion.span>
            <motion.span initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.12, ease }} className="block" style={{ color: VOLT }}>Move fast.</motion.span>
            <motion.span initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.24, ease }} className="block">Feel unstoppable.</motion.span>
          </h1>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.5 }} className="mt-10 flex max-w-xl flex-wrap items-center gap-4">
            <a href="#membership" data-cursor="hover" className="rounded-sm px-8 py-4 text-base font-bold uppercase tracking-wider transition-transform hover:-translate-y-0.5" style={{ background: VOLT, color: BG, ...cond }}>Start 7-day trial</a>
            <a href="#timetable" data-cursor="hover" className="rounded-sm border px-8 py-4 text-base font-bold uppercase tracking-wider transition-colors hover:bg-white/5" style={{ borderColor: "rgba(255,255,255,0.25)", ...cond }}>See classes</a>
          </motion.div>
        </div>
      </section>

      {/* ── Kinetic marquee ── */}
      <div className="overflow-hidden border-y py-5" style={{ borderColor: "rgba(255,255,255,0.08)", background: VOLT }}>
        <motion.div animate={{ x: ["0%", "-50%"] }} transition={{ duration: 22, repeat: Infinity, ease: "linear" }} className="flex whitespace-nowrap">
          {Array.from({ length: 2 }).map((_, r) => (
            <div key={r} className="flex items-center">
              {["Strength", "Conditioning", "Hyrox", "Olympic Lifting", "Mobility", "Community"].map((w) => (
                <span key={r + w} className="mx-6 text-3xl uppercase md:text-4xl" style={{ ...display, color: BG }}>{w} <span className="mx-4">✦</span></span>
              ))}
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── Stats ── */}
      <section id="results" className="mx-auto max-w-7xl px-6 py-24 md:px-10 md:py-28">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {[
            { n: 2400, s: "+", l: "Members trained" },
            { n: 38, s: "", l: "Weekly classes" },
            { n: 14, s: "", l: "Elite coaches" },
            { n: 96, s: "%", l: "Renew each year" },
          ].map((st, i) => (
            <Reveal key={st.l} i={i} className="border-l pl-5" >
              <div className="text-[clamp(2.6rem,7vw,5rem)] leading-none" style={{ ...display, color: VOLT }}>
                <Counter to={st.n} suffix={st.s} />
              </div>
              <p className="mt-2 text-sm font-semibold uppercase tracking-wider" style={{ color: SUB, ...cond }}>{st.l}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Membership ── */}
      <section id="membership" className="mx-auto max-w-7xl px-6 py-24 md:px-10 md:py-28">
        <Reveal>
          <h2 className="text-[clamp(2.4rem,7vw,5rem)] uppercase leading-[0.9]" style={display}>Pick your <span style={{ color: VOLT }}>weapon</span></h2>
          <p className="mt-4 max-w-lg text-lg" style={{ color: SUB }}>No lock-ins. No sign-up fee. Cancel anytime — but you won&rsquo;t want to.</p>
        </Reveal>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {PLANS.map((p, i) => (
            <Reveal key={p.name} i={i}>
              <div className="flex h-full flex-col rounded-2xl p-8 transition-transform hover:-translate-y-1" style={{ background: p.featured ? VOLT : PANEL, color: p.featured ? BG : "#f4f4f5", border: `1px solid ${p.featured ? VOLT : "rgba(255,255,255,0.08)"}` }}>
                {p.featured && <span className="mb-4 w-fit rounded-full bg-black/15 px-3 py-1 text-xs font-bold uppercase tracking-wider" style={cond}>Most popular</span>}
                <h3 className="text-2xl uppercase" style={{ ...display }}>{p.name}</h3>
                <div className="mt-4 flex items-end gap-1">
                  <span className="text-5xl" style={display}>${p.price}</span>
                  <span className="mb-1 text-sm font-semibold" style={{ opacity: 0.7, ...cond }}>/{p.per}</span>
                </div>
                <ul className="mt-7 flex-1 space-y-3 text-sm">
                  {p.perks.map((x) => (
                    <li key={x} className="flex items-start gap-2.5"><span className="mt-0.5" style={{ color: p.featured ? BG : VOLT }}>▸</span>{x}</li>
                  ))}
                </ul>
                <a href="#top" data-cursor="hover" className="mt-8 rounded-sm py-3.5 text-center text-sm font-bold uppercase tracking-wider transition-opacity hover:opacity-90" style={{ background: p.featured ? BG : VOLT, color: p.featured ? VOLT : BG, ...cond }}>Choose {p.name}</a>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Timetable ── */}
      <section id="timetable" className="py-24 md:py-28" style={{ background: PANEL }}>
        <div className="mx-auto max-w-7xl px-6 md:px-10">
          <Reveal><h2 className="text-[clamp(2.4rem,7vw,5rem)] uppercase leading-[0.9]" style={display}>Weekly <span style={{ color: VOLT }}>timetable</span></h2></Reveal>
          <div className="mt-12 overflow-x-auto">
            <div className="grid min-w-[720px] grid-cols-[80px_repeat(6,1fr)] gap-2 text-sm">
              <div />
              {DAYS.map((d) => (
                <div key={d} className="pb-3 text-center text-xs font-bold uppercase tracking-wider" style={{ color: SUB, ...cond }}>{d}</div>
              ))}
              {TIMETABLE.map((row) => (
                <div key={row.time} className="contents">
                  <div className="flex items-center text-xs font-bold uppercase" style={{ color: SUB, ...cond }}>{row.time}</div>
                  {row.slots.map((s, i) => (
                    <div key={i} className="rounded-lg p-3 text-center transition-transform hover:scale-[1.03]" style={{ background: s ? (s.hot ? VOLT : "rgba(255,255,255,0.05)") : "transparent", color: s?.hot ? BG : "#f4f4f5", border: s ? "none" : "1px dashed rgba(255,255,255,0.06)" }}>
                      {s ? (<><div className="text-sm font-bold uppercase" style={cond}>{s.name}</div><div className="text-[0.7rem] opacity-70">{s.coach}</div></>) : <span className="text-xs opacity-20">—</span>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Coaches ── */}
      <section id="coaches" className="mx-auto max-w-7xl px-6 py-24 md:px-10 md:py-28">
        <Reveal><h2 className="text-[clamp(2.4rem,7vw,5rem)] uppercase leading-[0.9]">Your <span style={{ color: VOLT, ...display }}>coaches</span></h2></Reveal>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {COACHES.map((co, i) => (
            <Reveal key={co.name} i={i}>
              <div className="group">
                <div className="relative overflow-hidden rounded-2xl">
                  <Img src={lf(co.k, co.lock)} alt={co.name} fallback={grad} rounded="rounded-2xl" className="h-72 w-full grayscale transition-all duration-500 group-hover:grayscale-0" />
                  <div className="absolute inset-x-0 bottom-0 h-24" style={{ background: "linear-gradient(180deg, transparent, rgba(11,11,13,0.9))" }} />
                </div>
                <h3 className="mt-4 text-2xl uppercase" style={display}>{co.name}</h3>
                <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: VOLT, ...cond }}>{co.role}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Success story ── */}
      <section className="mx-auto max-w-7xl px-6 pb-24 md:px-10 md:pb-28">
        <div className="grid items-center gap-10 rounded-3xl p-8 md:grid-cols-2 md:p-14" style={{ background: PANEL }}>
          <Reveal>
            <div className="text-6xl" style={{ ...display, color: VOLT }}>&ldquo;</div>
            <p className="text-2xl leading-snug md:text-3xl" style={cond}>I walked in unable to do a single pull-up. Ten months later I deadlifted double bodyweight. FORGE didn&rsquo;t just change my training — it changed how I show up everywhere.</p>
            <p className="mt-6 text-sm font-bold uppercase tracking-wider" style={{ color: SUB, ...cond }}>Maya R. · Member since 2023</p>
          </Reveal>
          <Reveal i={1}>
            <Img src={lf("woman,gym", 66)} alt="Success story" fallback={grad} rounded="rounded-2xl" className="h-80 w-full md:h-96" />
          </Reveal>
        </div>
      </section>

      {/* ── CTA / contact ── */}
      <section id="contact" className="px-6 py-24 text-center md:py-32" style={{ background: VOLT, color: BG }}>
        <Reveal>
          <h2 className="mx-auto max-w-4xl text-[clamp(2.6rem,9vw,7rem)] uppercase leading-[0.85]" style={display}>Your first session is on us</h2>
          <p className="mx-auto mt-6 max-w-md text-lg font-semibold" style={cond}>Book a free intro. We&rsquo;ll assess, plan and put you on the floor the same week.</p>
          <a href="#top" data-cursor="hover" className="mt-9 inline-block rounded-sm px-10 py-4 text-base font-bold uppercase tracking-wider transition-transform hover:-translate-y-0.5" style={{ background: BG, color: VOLT, ...cond }}>Claim your trial</a>
          <p className="mt-8 text-sm font-semibold" style={{ ...cond, opacity: 0.7 }}>84 Iron Yard, Eastside · train@forge.fit · (555) 900-3312</p>
        </Reveal>
      </section>

      <footer className="px-6 py-8 text-center text-xs font-semibold uppercase tracking-wider" style={{ color: SUB, ...cond }}>
        © 2025 FORGE Strength · A Southpage demo, not a real business
      </footer>
    </div>
  );
}

const PLANS = [
  { name: "Flex", price: 29, per: "wk", featured: false, perks: ["8 classes / month", "Full gym floor access", "App workout tracking", "Cancel anytime"] },
  { name: "Unlimited", price: 44, per: "wk", featured: true, perks: ["Unlimited classes", "Open gym 24/7", "Monthly InBody scan", "Nutrition guidance", "Bring-a-friend Fridays"] },
  { name: "Performance", price: 69, per: "wk", featured: false, perks: ["Everything in Unlimited", "2 PT sessions / month", "Personalised programming", "Recovery suite access"] },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TIMETABLE = [
  { time: "6 AM", slots: [{ name: "Strength", coach: "Deniz" }, { name: "Hyrox", coach: "Sol", hot: true }, { name: "Strength", coach: "Deniz" }, { name: "Conditioning", coach: "Amara" }, { name: "Strength", coach: "Deniz" }, null] },
  { time: "12 PM", slots: [{ name: "Mobility", coach: "Rhea" }, null, { name: "Olympic", coach: "Kai" }, null, { name: "Mobility", coach: "Rhea" }, { name: "Open Gym", coach: "" }] },
  { time: "6 PM", slots: [{ name: "Conditioning", coach: "Amara", hot: true }, { name: "Strength", coach: "Deniz" }, { name: "Hyrox", coach: "Sol" }, { name: "Olympic", coach: "Kai", hot: true }, null, { name: "Community WOD", coach: "All" }] },
];

const COACHES = [
  { name: "Deniz K.", role: "Head Strength", k: "trainer,gym,man", lock: 51 },
  { name: "Amara O.", role: "Conditioning", k: "trainer,fitness,woman", lock: 52 },
  { name: "Kai T.", role: "Olympic Lifting", k: "weightlifting,gym", lock: 53 },
  { name: "Sol M.", role: "Hyrox Coach", k: "athlete,running", lock: 54 },
];
