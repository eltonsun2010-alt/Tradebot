"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Img } from "@/components/demos/Img";
import { DemoRibbon } from "@/components/demos/DemoRibbon";

/* ==================================================================== *
 * Northgate Electrical — a trusted local electrician. Deep navy + safety
 * amber, strong industrial grotesque. Built to generate enquiries: a
 * draggable before/after slider, clear services, guarantees, reviews,
 * service areas and a prominent quote form, with a sticky call button.
 * ==================================================================== */

const NAVY = "#0e2942";
const NAVY_DEEP = "#0a1f33";
const AMBER = "#f6a723";
const BG = "#f4f6f9";
const INK = "#15222f";
const SUB = "#5b6b7b";
const sans = { fontFamily: "var(--font-archivo), system-ui, sans-serif" } as const;

const lf = (k: string, lock: number) => `https://loremflickr.com/1200/900/${k}?lock=${lock}`;
const grad = "linear-gradient(150deg, #1f4c72, #0a1f33)";
const ease = [0.16, 1, 0.3, 1] as const;

const NAV = [
  { label: "Services", href: "#services" },
  { label: "Our Work", href: "#work" },
  { label: "Why Us", href: "#why" },
  { label: "Reviews", href: "#reviews" },
  { label: "Areas", href: "#areas" },
];

function Reveal({ children, i = 0, className }: { children: React.ReactNode; i?: number; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.7, delay: i * 0.08, ease }} className={className}>
      {children}
    </motion.div>
  );
}

export function TradeSite() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 30);
    on(); window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <div style={{ background: BG, color: INK, ...sans }} className="min-h-screen overflow-x-hidden">
      <DemoRibbon theme="light" />

      {/* ── Top trust bar + nav ── */}
      <div className="hidden w-full py-2 text-center text-xs font-semibold text-white md:block" style={{ background: NAVY_DEEP }}>
        ⚡ Licensed &amp; insured · 24/7 emergency call-outs · Fixed-price quotes · Rated 4.9★ by 300+ locals
      </div>
      <header className="fixed inset-x-0 top-0 z-[500] transition-all duration-300" style={{ background: scrolled ? "rgba(255,255,255,0.96)" : "rgba(255,255,255,0)", backdropFilter: scrolled ? "blur(10px)" : "none", boxShadow: scrolled ? "0 6px 24px -12px rgba(14,41,66,0.25)" : "none" }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5 md:px-10">
          <a href="#top" data-cursor="hover" className="flex items-center gap-2.5 text-xl font-extrabold" style={{ color: scrolled ? NAVY : "#fff" }}>
            <span className="grid h-9 w-9 place-items-center rounded-lg text-lg" style={{ background: AMBER, color: NAVY }}>⚡</span>
            Northgate<span style={{ color: AMBER }}>.</span>
          </a>
          <nav className="hidden items-center gap-7 text-sm font-semibold md:flex" style={{ color: scrolled ? INK : "rgba(255,255,255,0.9)" }}>
            {NAV.map((l) => (<a key={l.href} href={l.href} data-cursor="hover" className="transition-opacity hover:opacity-70">{l.label}</a>))}
          </nav>
          <div className="flex items-center gap-3">
            <a href="tel:5553380192" data-cursor="hover" className="hidden text-sm font-extrabold sm:block" style={{ color: scrolled ? NAVY : "#fff" }}>(555) 338-0192</a>
            <a href="#quote" data-cursor="hover" className="rounded-lg px-4 py-2.5 text-sm font-bold transition-transform hover:-translate-y-0.5" style={{ background: AMBER, color: NAVY }}>Free quote</a>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section id="top" className="relative overflow-hidden pt-28 md:pt-36" style={{ background: NAVY }}>
        <div className="absolute inset-0 opacity-25" style={{ background: grad }} />
        <div className="pointer-events-none absolute -right-20 top-10 hidden h-[34rem] w-[34rem] rounded-full md:block" style={{ background: `radial-gradient(circle, ${AMBER}22, transparent 60%)` }} />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 md:grid-cols-[1.1fr_0.9fr] md:px-10 md:pb-28">
          <div>
            <motion.span initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }} className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider" style={{ background: "rgba(246,167,35,0.16)", color: AMBER }}>
              Local electricians you can trust
            </motion.span>
            <motion.h1 initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1, ease }} className="mt-6 text-[clamp(2.6rem,6.5vw,4.6rem)] font-extrabold leading-[0.98] text-white">
              Power done <span style={{ color: AMBER }}>properly</span> — the first time.
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2, ease }} className="mt-6 max-w-lg text-lg leading-relaxed text-slate-300">
              From fuse-board upgrades to full rewires and EV chargers — Northgate delivers clean, certified electrical work with upfront pricing and tidy finishes.
            </motion.p>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.35 }} className="mt-8 flex flex-wrap gap-4">
              <a href="#quote" data-cursor="hover" className="rounded-lg px-7 py-4 text-base font-bold transition-transform hover:-translate-y-0.5" style={{ background: AMBER, color: NAVY }}>Get a free quote</a>
              <a href="tel:5553380192" data-cursor="hover" className="rounded-lg border px-7 py-4 text-base font-bold text-white transition-colors hover:bg-white/10" style={{ borderColor: "rgba(255,255,255,0.25)" }}>Call (555) 338-0192</a>
            </motion.div>
            <div className="mt-9 flex flex-wrap gap-x-8 gap-y-3 text-sm font-semibold text-slate-300">
              {["Fully licensed", "£5m insured", "12-month guarantee", "No call-out fee"].map((t) => (
                <span key={t} className="flex items-center gap-2"><span style={{ color: AMBER }}>✓</span>{t}</span>
              ))}
            </div>
          </div>
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, delay: 0.2, ease }}>
            <Img src={lf("electrician,work", 41)} alt="Northgate electrician at work" fallback={grad} rounded="rounded-3xl" className="h-80 w-full md:h-[30rem]" priority />
          </motion.div>
        </div>
      </section>

      {/* ── Services ── */}
      <section id="services" className="mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-28">
        <Reveal>
          <span className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: AMBER }}>What we do</span>
          <h2 className="mt-3 text-[clamp(2rem,5vw,3.2rem)] font-extrabold leading-tight" style={{ color: NAVY }}>Electrical services, sorted.</h2>
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s, i) => (
            <Reveal key={s.title} i={i % 3}>
              <div className="group h-full rounded-2xl bg-white p-7 transition-all hover:-translate-y-1" style={{ boxShadow: "0 10px 30px -18px rgba(14,41,66,0.25)", border: "1px solid rgba(14,41,66,0.06)" }}>
                <div className="grid h-12 w-12 place-items-center rounded-xl text-2xl transition-colors" style={{ background: "rgba(246,167,35,0.14)" }}>{s.icon}</div>
                <h3 className="mt-5 text-xl font-bold" style={{ color: NAVY }}>{s.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed" style={{ color: SUB }}>{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Before / After ── */}
      <section id="work" className="py-20 md:py-28" style={{ background: NAVY }}>
        <div className="mx-auto max-w-6xl px-6 md:px-10">
          <Reveal>
            <span className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: AMBER }}>Recent projects</span>
            <h2 className="mt-3 text-[clamp(2rem,5vw,3.2rem)] font-extrabold leading-tight text-white">See the difference.</h2>
            <p className="mt-3 max-w-lg text-slate-300">Drag the handle to reveal the before &amp; after on a real consumer-unit upgrade.</p>
          </Reveal>
          <Reveal i={1} className="mt-10">
            <BeforeAfter beforeK="wiring,old" afterK="electrical,panel" />
          </Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {PROJECTS.map((p, i) => (
              <Reveal key={p.t} i={i}>
                <div className="overflow-hidden rounded-2xl bg-white/5">
                  <Img src={lf(p.k, p.lock)} alt={p.t} fallback={grad} rounded="rounded-none" className="h-44 w-full" />
                  <div className="p-4"><h4 className="font-bold text-white">{p.t}</h4><p className="text-sm text-slate-400">{p.loc}</p></div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why us ── */}
      <section id="why" className="mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-28">
        <div className="grid gap-12 md:grid-cols-2 md:gap-20">
          <Reveal>
            <span className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: AMBER }}>Why Northgate</span>
            <h2 className="mt-3 text-[clamp(2rem,5vw,3.2rem)] font-extrabold leading-[1.02]" style={{ color: NAVY }}>The safe pair of hands your home deserves.</h2>
            <p className="mt-5 max-w-md leading-relaxed" style={{ color: SUB }}>We treat your home like our own — dust sheets down, cables tidy, and a full certificate when we&rsquo;re done. No surprises, no mess, no jargon.</p>
            <a href="#quote" data-cursor="hover" className="mt-8 inline-block rounded-lg px-7 py-3.5 text-sm font-bold transition-transform hover:-translate-y-0.5" style={{ background: NAVY, color: "#fff" }}>Request your quote</a>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2">
            {WHY.map((w, i) => (
              <Reveal key={w.t} i={i}>
                <div className="h-full rounded-2xl bg-white p-6" style={{ border: "1px solid rgba(14,41,66,0.06)" }}>
                  <div className="text-3xl font-extrabold" style={{ color: AMBER }}>{w.stat}</div>
                  <h4 className="mt-2 font-bold" style={{ color: NAVY }}>{w.t}</h4>
                  <p className="mt-1.5 text-sm leading-relaxed" style={{ color: SUB }}>{w.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Reviews ── */}
      <section id="reviews" className="py-20 md:py-24" style={{ background: "#eef2f6" }}>
        <div className="mx-auto max-w-6xl px-6 md:px-10">
          <Reveal><h2 className="text-[clamp(2rem,5vw,3rem)] font-extrabold" style={{ color: NAVY }}>Trusted by hundreds of neighbours</h2></Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {REVIEWS.map((r, i) => (
              <Reveal key={r.name} i={i}>
                <div className="flex h-full flex-col rounded-2xl bg-white p-6" style={{ boxShadow: "0 10px 30px -20px rgba(14,41,66,0.3)" }}>
                  <div style={{ color: AMBER }}>★★★★★</div>
                  <p className="mt-3 flex-1 leading-relaxed" style={{ color: INK }}>&ldquo;{r.quote}&rdquo;</p>
                  <p className="mt-4 text-sm font-bold" style={{ color: NAVY }}>{r.name} <span className="font-normal" style={{ color: SUB }}>· {r.loc}</span></p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Service areas ── */}
      <section id="areas" className="mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-24">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <Reveal>
            <span className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: AMBER }}>Where we work</span>
            <h2 className="mt-3 text-[clamp(2rem,5vw,3rem)] font-extrabold leading-tight" style={{ color: NAVY }}>Covering the whole county.</h2>
            <p className="mt-4 max-w-md leading-relaxed" style={{ color: SUB }}>Based in Northgate, we cover a 25-mile radius with same-week appointments and 24/7 emergency cover.</p>
            <div className="mt-7 flex flex-wrap gap-2.5">
              {AREAS.map((a) => (<span key={a} className="rounded-full bg-white px-4 py-2 text-sm font-semibold" style={{ color: NAVY, border: "1px solid rgba(14,41,66,0.1)" }}>{a}</span>))}
            </div>
          </Reveal>
          <Reveal i={1}>
            <div className="relative overflow-hidden rounded-3xl" style={{ background: NAVY, aspectRatio: "4/3" }}>
              <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
              {[["28%", "34%"], ["55%", "48%"], ["40%", "62%"], ["68%", "30%"], ["50%", "72%"]].map(([l, t], i) => (
                <span key={i} className="absolute h-3 w-3 rounded-full" style={{ left: l, top: t, background: AMBER, boxShadow: `0 0 0 6px rgba(246,167,35,0.2)` }} />
              ))}
              <div className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-2xl" style={{ background: AMBER, color: NAVY }}>⚡</div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Quote form ── */}
      <section id="quote" className="py-20 md:py-28" style={{ background: NAVY_DEEP }}>
        <div className="mx-auto grid max-w-6xl gap-12 px-6 md:grid-cols-[0.9fr_1.1fr] md:px-10">
          <Reveal>
            <h2 className="text-[clamp(2rem,5vw,3.2rem)] font-extrabold leading-[1.02] text-white">Get your free, no-obligation quote.</h2>
            <p className="mt-5 max-w-md leading-relaxed text-slate-300">Tell us what you need and we&rsquo;ll be back within one business hour with a fixed price. Emergency? Call us any time, day or night.</p>
            <div className="mt-8 space-y-4">
              {[["📞", "(555) 338-0192", "Mon–Sun, 24/7"], ["✉", "quotes@northgate.electric", "Replies within the hour"], ["📍", "Unit 7, Northgate Trade Park", "Serving the whole county"]].map(([ic, a, b]) => (
                <div key={a} className="flex items-center gap-4">
                  <span className="grid h-11 w-11 place-items-center rounded-xl text-lg" style={{ background: "rgba(246,167,35,0.14)" }}>{ic}</span>
                  <div><div className="font-bold text-white">{a}</div><div className="text-sm text-slate-400">{b}</div></div>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal i={1}>
            <QuoteForm />
          </Reveal>
        </div>
      </section>

      <footer className="px-6 py-8 text-center text-sm" style={{ background: NAVY_DEEP, color: "rgba(255,255,255,0.5)", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        © 2025 Northgate Electrical · A Southpage demo, not a real business
      </footer>

      {/* ── Sticky mobile call button ── */}
      <a href="tel:5553380192" data-cursor="hover" className="fixed bottom-4 right-4 z-[550] flex items-center gap-2 rounded-full px-5 py-3.5 text-sm font-bold shadow-xl transition-transform hover:-translate-y-0.5 md:hidden" style={{ background: AMBER, color: NAVY }}>
        📞 Call now
      </a>
    </div>
  );
}

/* --------------------------- before / after --------------------------- */
function BeforeAfter({ beforeK, afterK }: { beforeK: string; afterK: string }) {
  const [pos, setPos] = useState(50);
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const move = (clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)));
  };
  useEffect(() => {
    const up = () => (dragging.current = false);
    const mv = (e: PointerEvent) => dragging.current && move(e.clientX);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointermove", mv);
    return () => { window.removeEventListener("pointerup", up); window.removeEventListener("pointermove", mv); };
  }, []);

  return (
    <div
      ref={ref}
      className="relative aspect-[16/9] w-full cursor-ew-resize select-none overflow-hidden rounded-3xl"
      onPointerDown={(e) => { dragging.current = true; move(e.clientX); }}
    >
      {/* after (base) */}
      <img src={lf(afterK, 46)} alt="After" className="absolute inset-0 h-full w-full object-cover" style={{ background: grad }} onError={(e) => (e.currentTarget.style.opacity = "0")} />
      <span className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold" style={{ color: NAVY }}>AFTER</span>
      {/* before (clipped) */}
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <img src={lf(beforeK, 47)} alt="Before" className="absolute inset-0 h-full w-full object-cover" style={{ background: "linear-gradient(150deg,#3a3f45,#14181c)" }} onError={(e) => (e.currentTarget.style.opacity = "0")} />
        <span className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white">BEFORE</span>
      </div>
      {/* handle */}
      <div className="absolute inset-y-0" style={{ left: `${pos}%` }}>
        <div className="absolute inset-y-0 -translate-x-1/2" style={{ width: 2, background: "#fff" }} />
        <div className="absolute top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full shadow-lg" style={{ background: AMBER, color: NAVY }}>
          <span className="text-lg font-black">⇔</span>
        </div>
      </div>
    </div>
  );
}

function QuoteForm() {
  const [sent, setSent] = useState(false);
  const field = "w-full rounded-xl px-4 py-3.5 text-sm outline-none transition-all bg-white/5 text-white placeholder:text-slate-500 focus:bg-white/10";
  const border = { border: "1px solid rgba(255,255,255,0.12)" };
  if (sent) {
    return (
      <div className="grid h-full min-h-72 place-items-center rounded-3xl p-10 text-center" style={{ background: "rgba(246,167,35,0.1)", border: "1px solid rgba(246,167,35,0.3)" }}>
        <div>
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full text-2xl" style={{ background: AMBER, color: NAVY }}>✓</div>
          <h3 className="mt-5 text-2xl font-extrabold text-white">Request received</h3>
          <p className="mt-2 text-slate-300">Thanks — we&rsquo;ll call you back within the hour with a fixed price.</p>
        </div>
      </div>
    );
  }
  return (
    <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="rounded-3xl p-7 md:p-8" style={{ background: "rgba(255,255,255,0.03)", ...border }}>
      <div className="grid gap-4 sm:grid-cols-2">
        <input required placeholder="Full name" className={field} style={border} />
        <input required placeholder="Phone number" className={field} style={border} />
      </div>
      <input required type="email" placeholder="Email address" className={`${field} mt-4`} style={border} />
      <select className={`${field} mt-4`} style={border}>
        <option style={{ color: "#000" }}>What do you need?</option>
        {["Consumer-unit upgrade", "Full / partial rewire", "EV charger install", "Lighting & sockets", "Fault finding", "Emergency call-out", "Something else"].map((o) => <option key={o} style={{ color: "#000" }}>{o}</option>)}
      </select>
      <textarea rows={3} placeholder="Tell us a little about the job…" className={`${field} mt-4 resize-none`} style={border} />
      <button type="submit" data-cursor="hover" className="mt-5 w-full rounded-xl py-4 text-base font-bold transition-transform hover:-translate-y-0.5" style={{ background: AMBER, color: NAVY }}>Get my free quote →</button>
      <p className="mt-3 text-center text-xs text-slate-400">No spam. No obligation. We reply within one business hour.</p>
    </form>
  );
}

const SERVICES = [
  { icon: "🔌", title: "Rewires & Upgrades", body: "Full and partial rewires, consumer-unit replacements and fuse-board upgrades to modern safety standards." },
  { icon: "💡", title: "Lighting & Sockets", body: "Downlights, feature lighting, extra sockets and USB points — designed, fitted and certified." },
  { icon: "🚗", title: "EV Charger Installs", body: "OZEV-approved home chargers, sited and wired for the fastest safe charge on your driveway." },
  { icon: "🔍", title: "Fault Finding", body: "Tripping circuits and dead sockets diagnosed fast, with a clear fix and a fixed price before we start." },
  { icon: "🏠", title: "Landlord Certificates", body: "EICR inspections and reports that keep your rental compliant and your tenants safe." },
  { icon: "⚠️", title: "24/7 Emergencies", body: "Lost power or a burning smell? We’re on call around the clock across the county." },
];

const PROJECTS = [
  { t: "Full house rewire", loc: "Elmwood · 3-bed semi", k: "cables,wiring", lock: 42 },
  { t: "Kitchen lighting", loc: "Riverside · new build", k: "kitchen,lighting", lock: 43 },
  { t: "EV charger fit", loc: "Northgate · driveway", k: "electric,car", lock: 44 },
];

const WHY = [
  { stat: "4.9★", t: "Rated by locals", body: "300+ reviews across Google and Checkatrade from homeowners just like you." },
  { stat: "12mo", t: "Workmanship guarantee", body: "Every job backed in writing, with certificates lodged the same day." },
  { stat: "60min", t: "Quote turnaround", body: "Fixed-price quotes back within one business hour — no waiting around." },
  { stat: "0", t: "Hidden costs", body: "The price we quote is the price you pay. No surprises on the invoice." },
];

const REVIEWS = [
  { name: "Sarah T.", loc: "Elmwood", quote: "Turned up on time, dust sheets down, and rewired the whole house in three days. Spotless finish." },
  { name: "James P.", loc: "Riverside", quote: "Diagnosed a fault two other electricians missed. Fair price and genuinely lovely to deal with." },
  { name: "Priya M.", loc: "Northgate", quote: "Installed our EV charger the same week we called. Tidy cable runs and everything explained clearly." },
];

const AREAS = ["Northgate", "Elmwood", "Riverside", "Ashford", "Kingsley", "Whitmore", "Bexley Green", "Harlow End", "Oakfield", "Stonebridge"];
