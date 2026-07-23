"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValue, animate, useScroll, useTransform } from "framer-motion";
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
          <HeroGraphic />
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
                <div className="relative h-72 overflow-hidden rounded-2xl">
                  <CoachTile disc={co.disc} i={i} />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24" style={{ background: "linear-gradient(180deg, transparent, rgba(11,11,13,0.9))" }} />
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
            <div className="h-80 w-full overflow-hidden rounded-2xl md:h-96">
              <DeadliftScene />
            </div>
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

/* ------------------------- FORGE bespoke artwork ------------------------- */
// Controlled, on-brand vector art in place of unverifiable stock photos — bold,
// energetic, black + volt. Every subject is exactly right, on every load.
const anton = { fontFamily: "var(--font-anton), Impact, sans-serif" } as const;

function HeroGraphic() {
  return (
    <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full opacity-90" aria-hidden>
      <defs>
        <pattern id="fgHalftone" width="26" height="26" patternUnits="userSpaceOnUse">
          <circle cx="4" cy="4" r="2.4" fill="#ccff33" opacity="0.10" />
        </pattern>
      </defs>
      <rect width="1440" height="900" fill="url(#fgHalftone)" />
      {/* bold diagonal energy streaks, right side */}
      <g opacity="0.16">
        <polygon points="900,0 1040,0 720,900 580,900" fill="#ccff33" />
        <polygon points="1120,0 1180,0 900,900 840,900" fill="#ccff33" />
      </g>
      {/* a large loaded barbell, receding right */}
      <g transform="translate(1050 470)" opacity="0.9">
        <rect x="-360" y="-14" width="720" height="28" rx="14" fill="#20222a" />
        <g fill="#2a2d16" stroke="#ccff33" strokeWidth="4">
          <circle cx="-250" cy="0" r="120" /><circle cx="250" cy="0" r="120" />
        </g>
        <g fill="#171a10" stroke="#ccff33" strokeWidth="3">
          <circle cx="-250" cy="0" r="150" opacity="0.35" /><circle cx="250" cy="0" r="150" opacity="0.35" />
        </g>
        <rect x="-330" y="-20" width="26" height="40" rx="4" fill="#33361c" />
        <rect x="304" y="-20" width="26" height="40" rx="4" fill="#33361c" />
      </g>
    </svg>
  );
}

function DiscGlyph({ disc }: { disc: string }) {
  const V = "#ccff33";
  if (disc === "kettlebell") {
    return (
      <g>
        <path d="M138 150 a22 22 0 0 1 44 0" fill="none" stroke={V} strokeWidth="13" strokeLinecap="round" />
        <circle cx="160" cy="172" r="42" fill={V} />
        <circle cx="160" cy="176" r="13" fill="#141417" />
      </g>
    );
  }
  if (disc === "olympic") {
    return (
      <g fill={V}>
        <rect x="66" y="150" width="188" height="12" rx="6" />
        <rect x="80" y="128" width="18" height="56" rx="5" /><rect x="62" y="136" width="13" height="40" rx="4" />
        <rect x="222" y="128" width="18" height="56" rx="5" /><rect x="245" y="136" width="13" height="40" rx="4" />
        <g opacity="0.9">
          <path d="M132 118 l 28 -22 l 28 22" fill="none" stroke={V} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M132 96 l 28 -22 l 28 22" fill="none" stroke={V} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />
        </g>
      </g>
    );
  }
  if (disc === "sled") {
    return (
      <g>
        <g fill={V}>
          <path d="M104 182 L236 182 L216 158 L124 158 Z" />
          <rect x="150" y="98" width="12" height="64" rx="4" />
          <rect x="128" y="94" width="56" height="12" rx="6" />
        </g>
        <g stroke={V} strokeWidth="7" strokeLinecap="round" opacity="0.85">
          <line x1="58" y1="150" x2="96" y2="150" /><line x1="48" y1="172" x2="92" y2="172" /><line x1="60" y1="194" x2="98" y2="194" />
        </g>
      </g>
    );
  }
  // barbell (default / strength)
  return (
    <g fill={V}>
      <rect x="60" y="150" width="200" height="12" rx="6" />
      <rect x="80" y="124" width="18" height="64" rx="5" /><rect x="60" y="134" width="13" height="44" rx="4" />
      <rect x="222" y="124" width="18" height="64" rx="5" /><rect x="247" y="134" width="13" height="44" rx="4" />
    </g>
  );
}

function CoachTile({ disc, i }: { disc: string; i: number }) {
  const gid = `fgCoach${i}`;
  return (
    <svg viewBox="0 0 320 300" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-105" aria-hidden>
      <defs>
        <linearGradient id={`${gid}bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#191b20" /><stop offset="1" stopColor="#0c0c0e" />
        </linearGradient>
        <pattern id={`${gid}dots`} width="15" height="15" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1.5" fill="#ccff33" opacity="0.10" />
        </pattern>
      </defs>
      <rect width="320" height="300" fill={`url(#${gid}bg)`} />
      <rect width="320" height="300" fill={`url(#${gid}dots)`} />
      {/* volt corner wedge */}
      <polygon points="0,300 130,300 0,190" fill="#ccff33" opacity="0.14" />
      {/* big index */}
      <text x="24" y="86" style={anton} fontSize="86" fill="#ccff33" opacity="0.16">{String(i + 1).padStart(2, "0")}</text>
      {/* discipline glyph */}
      <DiscGlyph disc={disc} />
    </svg>
  );
}

function DeadliftScene() {
  return (
    <svg viewBox="0 0 640 480" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="fgDl" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#17181c" /><stop offset="1" stopColor="#0b0b0d" />
        </linearGradient>
        <pattern id="fgDlDots" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="4" cy="4" r="2" fill="#ccff33" opacity="0.08" />
        </pattern>
      </defs>
      <rect width="640" height="480" fill="url(#fgDl)" />
      <rect width="640" height="480" fill="url(#fgDlDots)" />
      <polygon points="0,480 220,480 60,0 0,0" fill="#ccff33" opacity="0.06" />
      {/* platform */}
      <rect x="60" y="330" width="520" height="10" rx="4" fill="#2a2d33" />
      {/* loaded barbell */}
      <g>
        <rect x="150" y="252" width="340" height="16" rx="8" fill="#c9ced6" />
        <g fill="#2a2d16" stroke="#ccff33" strokeWidth="5">
          <circle cx="205" cy="260" r="66" /><circle cx="435" cy="260" r="66" />
        </g>
        <g fill="#0f1109"><circle cx="205" cy="260" r="16" /><circle cx="435" cy="260" r="16" /></g>
        <rect x="256" y="248" width="20" height="24" rx="4" fill="#3a3f22" />
        <rect x="364" y="248" width="20" height="24" rx="4" fill="#3a3f22" />
      </g>
      {/* PR flash */}
      <g transform="translate(510 120)">
        <circle r="52" fill="#ccff33" />
        <text x="0" y="-2" textAnchor="middle" style={anton} fontSize="30" fill="#0b0b0d">PR</text>
        <text x="0" y="24" textAnchor="middle" style={{ fontFamily: "var(--font-barlow), sans-serif" }} fontSize="12" fontWeight="700" fill="#0b0b0d">2× BW</text>
      </g>
      {/* up energy chevrons */}
      <g fill="none" stroke="#ccff33" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" opacity="0.8">
        <path d="M300 180 l20 -20 l20 20" /><path d="M300 150 l20 -20 l20 20" opacity="0.5" />
      </g>
    </svg>
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
  { name: "Deniz K.", role: "Head Strength", disc: "barbell" },
  { name: "Amara O.", role: "Conditioning", disc: "kettlebell" },
  { name: "Kai T.", role: "Olympic Lifting", disc: "olympic" },
  { name: "Sol M.", role: "Hyrox Coach", disc: "sled" },
] as const;
