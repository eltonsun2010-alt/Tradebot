"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DemoRibbon } from "@/components/demos/DemoRibbon";

/* ==================================================================== *
 * Meridian Advisory — a premium wealth & financial advisory. Minimal,
 * confident, editorial. Warm paper, deep ink, a single restrained
 * evergreen accent, a refined serif and generous whitespace. Elegant,
 * near-still motion — the calm of a brand you trust with everything.
 * ==================================================================== */

const PAPER = "#f4f2ec";
const INK = "#181a1c";
const SUB = "#63666b";
const LINE = "rgba(24,26,28,0.12)";
const ACCENT = "#1f5f4f";
const serif = { fontFamily: "var(--font-newsreader), Georgia, serif" } as const;

const ease = [0.16, 1, 0.3, 1] as const;

const NAV = [
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Process", href: "#process" },
  { label: "Results", href: "#results" },
  { label: "FAQ", href: "#faq" },
];

function Reveal({ children, i = 0, className }: { children: React.ReactNode; i?: number; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.35 }} transition={{ duration: 0.9, delay: i * 0.08, ease }} className={className}>
      {children}
    </motion.div>
  );
}

export function MeridianSite() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on(); window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <div style={{ background: PAPER, color: INK }} className="min-h-screen overflow-x-hidden">
      <DemoRibbon theme="light" />

      {/* ── Nav (thin, letter-spaced) ── */}
      <header className="fixed inset-x-0 top-0 z-[500] transition-all duration-500" style={{ background: scrolled ? `${PAPER}f2` : "transparent", backdropFilter: scrolled ? "blur(8px)" : "none", borderBottom: `1px solid ${scrolled ? LINE : "transparent"}` }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 md:px-10">
          <a href="#top" data-cursor="hover" className="text-lg tracking-[0.02em]" style={{ ...serif, fontWeight: 500 }}>
            Meridian<span style={{ color: ACCENT }}>.</span>
          </a>
          <nav className="hidden items-center gap-9 text-[0.72rem] font-medium uppercase tracking-[0.18em] md:flex" style={{ color: SUB }}>
            {NAV.map((l) => (<a key={l.href} href={l.href} data-cursor="hover" className="transition-colors hover:text-[color:var(--ink)]" style={{ ["--ink" as string]: INK }}>{l.label}</a>))}
          </nav>
          <a href="#contact" data-cursor="hover" className="rounded-full border px-5 py-2 text-[0.72rem] font-medium uppercase tracking-[0.16em] transition-colors hover:bg-[#181a1c] hover:text-[#f4f2ec]" style={{ borderColor: INK }}>
            Book a call
          </a>
        </div>
      </header>

      {/* ── Hero ── */}
      <section id="top" className="mx-auto max-w-6xl px-6 pb-16 pt-40 md:px-10 md:pb-24 md:pt-52">
        <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease }} className="text-[0.72rem] font-medium uppercase tracking-[0.28em]" style={{ color: ACCENT }}>
          Wealth &amp; financial advisory · Est. 1998
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.1, delay: 0.12, ease }} className="mt-7 max-w-4xl text-[clamp(2.6rem,7vw,5.4rem)] leading-[1.04] tracking-[-0.01em]" style={{ ...serif, fontWeight: 400 }}>
          Considered advice for the decisions that <em style={{ color: ACCENT }}>compound</em>.
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.28, ease }} className="mt-8 max-w-xl text-lg leading-relaxed" style={{ color: SUB }}>
          Meridian is an independent advisory firm helping founders, families and executives grow and protect wealth — with clarity, discretion and a genuinely long-term view.
        </motion.p>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.45 }} className="mt-10 flex flex-wrap items-center gap-6">
          <a href="#contact" data-cursor="hover" className="rounded-full px-7 py-3.5 text-sm font-semibold transition-transform hover:-translate-y-0.5" style={{ background: INK, color: PAPER }}>Arrange an introduction</a>
          <a href="#services" data-cursor="hover" className="text-sm font-semibold underline decoration-1 underline-offset-4 transition-opacity hover:opacity-60">How we help →</a>
        </motion.div>

        {/* quiet trust row */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.6 }} className="mt-16 grid grid-cols-2 gap-8 border-t pt-10 sm:grid-cols-4" style={{ borderColor: LINE }}>
          {[["£3.4bn", "Assets advised"], ["27 yrs", "Independent"], ["98%", "Client retention"], ["4", "Global offices"]].map(([n, l]) => (
            <div key={l}>
              <div className="text-[clamp(1.8rem,4vw,2.6rem)] leading-none" style={{ ...serif, fontWeight: 500 }}>{n}</div>
              <div className="mt-2 text-[0.72rem] font-medium uppercase tracking-[0.16em]" style={{ color: SUB }}>{l}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── About ── */}
      <section id="about" className="mx-auto max-w-6xl px-6 py-24 md:px-10 md:py-32">
        <div className="grid gap-14 md:grid-cols-[1fr_1fr] md:gap-20">
          <Reveal>
            <div className="h-[26rem] w-full overflow-hidden rounded-[2rem] md:h-[34rem]"><MeridianScene /></div>
          </Reveal>
          <Reveal i={1} className="flex flex-col justify-center">
            <span className="text-[0.72rem] font-medium uppercase tracking-[0.28em]" style={{ color: ACCENT }}>Who we are</span>
            <h2 className="mt-5 text-[clamp(1.9rem,4.4vw,3rem)] leading-[1.14]" style={{ ...serif, fontWeight: 400 }}>
              Independent by principle. Personal by design.
            </h2>
            <p className="mt-6 leading-relaxed" style={{ color: SUB }}>
              We hold no products of our own and answer to no one but our clients. That independence lets us give advice that is genuinely yours — built around your life, your family and the timeline that matters to you.
            </p>
            <p className="mt-4 leading-relaxed" style={{ color: SUB }}>
              Every client works with a dedicated partner and a small, senior team. No hand-offs, no call centres — just people who know your name and your numbers.
            </p>
            <div className="mt-9 flex flex-wrap gap-x-10 gap-y-4">
              {["Fee-only", "Fiduciary", "Discreet"].map((t) => (
                <span key={t} className="flex items-center gap-2 text-sm font-semibold"><span className="h-1.5 w-1.5 rounded-full" style={{ background: ACCENT }} />{t}</span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Services ── */}
      <section id="services" className="py-24 md:py-32" style={{ background: "#eceae3" }}>
        <div className="mx-auto max-w-6xl px-6 md:px-10">
          <Reveal className="max-w-2xl">
            <span className="text-[0.72rem] font-medium uppercase tracking-[0.28em]" style={{ color: ACCENT }}>What we do</span>
            <h2 className="mt-5 text-[clamp(2rem,5vw,3.4rem)] leading-[1.08]" style={{ ...serif, fontWeight: 400 }}>A complete advisory relationship, not a product.</h2>
          </Reveal>
          <div className="mt-14 grid gap-px overflow-hidden rounded-2xl md:grid-cols-2" style={{ background: LINE }}>
            {SERVICES.map((s, i) => (
              <Reveal key={s.t} i={i % 2}>
                <div className="h-full p-9 md:p-11" style={{ background: PAPER }}>
                  <div className="flex items-baseline gap-4">
                    <span className="text-sm tabular-nums" style={{ ...serif, color: ACCENT }}>{String(i + 1).padStart(2, "0")}</span>
                    <h3 className="text-2xl" style={{ ...serif, fontWeight: 500 }}>{s.t}</h3>
                  </div>
                  <p className="mt-4 leading-relaxed" style={{ color: SUB }}>{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Process ── */}
      <section id="process" className="mx-auto max-w-6xl px-6 py-24 md:px-10 md:py-32">
        <Reveal className="max-w-2xl">
          <span className="text-[0.72rem] font-medium uppercase tracking-[0.28em]" style={{ color: ACCENT }}>How it works</span>
          <h2 className="mt-5 text-[clamp(2rem,5vw,3.4rem)] leading-[1.08]" style={{ ...serif, fontWeight: 400 }}>A calm, deliberate path to clarity.</h2>
        </Reveal>
        <div className="mt-16 space-y-px" style={{ background: LINE }}>
          {PROCESS.map((p, i) => (
            <Reveal key={p.t} i={i}>
              <div className="grid grid-cols-[auto_1fr] items-baseline gap-6 py-8 md:grid-cols-[120px_1fr_1.4fr] md:gap-12" style={{ background: PAPER }}>
                <span className="text-[clamp(2rem,4vw,3.2rem)] tabular-nums" style={{ ...serif, color: ACCENT, fontWeight: 400 }}>{String(i + 1).padStart(2, "0")}</span>
                <h3 className="text-2xl md:text-[1.7rem]" style={{ ...serif, fontWeight: 500 }}>{p.t}</h3>
                <p className="col-span-2 leading-relaxed md:col-span-1" style={{ color: SUB }}>{p.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Case studies / results ── */}
      <section id="results" className="py-24 md:py-32" style={{ background: INK, color: PAPER }}>
        <div className="mx-auto max-w-6xl px-6 md:px-10">
          <Reveal className="max-w-2xl">
            <span className="text-[0.72rem] font-medium uppercase tracking-[0.28em]" style={{ color: "#8fd0bf" }}>Selected outcomes</span>
            <h2 className="mt-5 text-[clamp(2rem,5vw,3.4rem)] leading-[1.08]" style={{ ...serif, fontWeight: 400 }}>Results measured over decades, not quarters.</h2>
          </Reveal>
          <div className="mt-14 grid gap-px overflow-hidden rounded-2xl md:grid-cols-3" style={{ background: "rgba(255,255,255,0.12)" }}>
            {CASES.map((c, i) => (
              <Reveal key={c.metric} i={i}>
                <div className="h-full p-9 md:p-10" style={{ background: INK }}>
                  <div className="text-[clamp(2.6rem,6vw,4rem)] leading-none" style={{ ...serif, fontWeight: 500, color: "#8fd0bf" }}>{c.metric}</div>
                  <p className="mt-2 text-sm font-semibold uppercase tracking-[0.14em]" style={{ color: "rgba(244,242,236,0.6)" }}>{c.label}</p>
                  <p className="mt-6 leading-relaxed" style={{ color: "rgba(244,242,236,0.8)" }}>{c.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonial ── */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center md:py-32">
        <Reveal>
          <p className="text-[clamp(1.6rem,3.6vw,2.6rem)] leading-[1.3]" style={{ ...serif, fontWeight: 400 }}>
            &ldquo;For fifteen years Meridian has been the steadiest voice in every important decision we&rsquo;ve made — through a business sale, a move abroad, and passing things to our children. I cannot imagine navigating any of it without them.&rdquo;
          </p>
        </Reveal>
        <Reveal i={1}>
          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: SUB }}>Eleanor V. · Private client, London</p>
        </Reveal>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 md:py-28" style={{ background: "#eceae3" }}>
        <div className="mx-auto max-w-3xl px-6 md:px-10">
          <Reveal><h2 className="text-[clamp(2rem,5vw,3rem)] leading-tight" style={{ ...serif, fontWeight: 400 }}>Questions, answered plainly.</h2></Reveal>
          <div className="mt-12">
            {FAQ.map((f, i) => (<FaqRow key={f.q} f={f} i={i} />))}
          </div>
        </div>
      </section>

      {/* ── Contact ── */}
      <section id="contact" className="mx-auto max-w-6xl px-6 py-24 md:px-10 md:py-32">
        <div className="grid gap-14 md:grid-cols-2 md:gap-20">
          <Reveal>
            <span className="text-[0.72rem] font-medium uppercase tracking-[0.28em]" style={{ color: ACCENT }}>Begin</span>
            <h2 className="mt-5 text-[clamp(2.2rem,5.5vw,3.6rem)] leading-[1.05]" style={{ ...serif, fontWeight: 400 }}>Arrange a private introduction.</h2>
            <p className="mt-6 max-w-md leading-relaxed" style={{ color: SUB }}>A first conversation is complimentary and entirely confidential. We&rsquo;ll listen, share how we&rsquo;d approach your situation, and only proceed if it&rsquo;s the right fit for both of us.</p>
            <div className="mt-9 space-y-1 text-sm" style={{ color: INK }}>
              <p>advisory@meridian.partners</p>
              <p>+44 (0)20 7946 0192</p>
              <p style={{ color: SUB }}>18 Bishopsgate, London · Zurich · Singapore · New York</p>
            </div>
          </Reveal>
          <Reveal i={1}>
            <ContactForm />
          </Reveal>
        </div>
      </section>

      <footer className="px-6 pb-10 md:px-10" style={{ borderTop: `1px solid ${LINE}` }}>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 py-10 text-sm md:flex-row" style={{ color: SUB }}>
          <span className="text-lg" style={{ ...serif, color: INK }}>Meridian Advisory</span>
          <span>© 2025 Meridian Advisory · A Southpage demo, not a real business</span>
        </div>
      </footer>
    </div>
  );
}

/* A restrained architectural line study in place of unverifiable stock — a calm,
   premium image that always renders, in the house evergreen and ink. */
function MeridianScene() {
  return (
    <svg viewBox="0 0 520 680" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="mrBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2b4a41" /><stop offset="1" stopColor="#151b1c" /></linearGradient>
      </defs>
      <rect width="520" height="680" fill="url(#mrBg)" />
      {/* faint moon */}
      <circle cx="120" cy="130" r="46" fill="#e9e4d6" opacity="0.10" />
      {/* two refined towers, fine window grid */}
      <g stroke="#e9e4d6" strokeOpacity="0.16" strokeWidth="1.5" fill="none">
        <rect x="150" y="150" width="150" height="530" />
        <rect x="322" y="250" width="120" height="430" />
        {Array.from({ length: 12 }).map((_, r) => (<line key={`a${r}`} x1="150" y1={186 + r * 42} x2="300" y2={186 + r * 42} />))}
        {Array.from({ length: 3 }).map((_, c) => (<line key={`av${c}`} x1={188 + c * 38} y1="150" x2={188 + c * 38} y2="680" />))}
        {Array.from({ length: 9 }).map((_, r) => (<line key={`b${r}`} x1="322" y1={286 + r * 42} x2="442" y2={286 + r * 42} />))}
        {Array.from({ length: 2 }).map((_, c) => (<line key={`bv${c}`} x1={362 + c * 40} y1="250" x2={362 + c * 40} y2="680" />))}
      </g>
      {/* lit windows — a few evergreen/gold accents */}
      <g fill="#c9b06a" opacity="0.5">
        <rect x="189" y="228" width="36" height="30" /><rect x="227" y="354" width="36" height="30" /><rect x="151" y="480" width="36" height="30" />
      </g>
      <g fill="#1f5f4f" opacity="0.55"><rect x="363" y="328" width="38" height="30" /><rect x="403" y="454" width="38" height="30" /></g>
      {/* thin accent line + horizon */}
      <line x1="60" y1="620" x2="460" y2="620" stroke="#e9e4d6" strokeOpacity="0.14" strokeWidth="1.5" />
      <rect x="60" y="150" width="4" height="470" fill="#1f5f4f" opacity="0.6" />
    </svg>
  );
}

function FaqRow({ f, i }: { f: { q: string; a: string }; i: number }) {
  const [open, setOpen] = useState(i === 0);
  return (
    <div className="border-b" style={{ borderColor: LINE }}>
      <button onClick={() => setOpen((v) => !v)} data-cursor="hover" className="flex w-full items-center justify-between gap-6 py-6 text-left">
        <span className="text-xl md:text-2xl" style={{ ...serif, fontWeight: 500 }}>{f.q}</span>
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border transition-transform" style={{ borderColor: LINE, transform: open ? "rotate(45deg)" : "none", color: ACCENT }}>+</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease }} className="overflow-hidden">
            <p className="pb-7 pr-14 leading-relaxed" style={{ color: SUB }}>{f.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ContactForm() {
  const [sent, setSent] = useState(false);
  const field = "w-full border-b bg-transparent px-0 py-3 text-sm outline-none transition-colors";
  const bs = { borderColor: LINE } as const;
  if (sent) {
    return (
      <div className="grid h-full min-h-72 place-items-center rounded-[2rem] p-10 text-center" style={{ border: `1px solid ${LINE}` }}>
        <div>
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full text-xl" style={{ background: ACCENT, color: PAPER }}>✓</div>
          <h3 className="mt-5 text-2xl" style={{ ...serif, fontWeight: 500 }}>Thank you</h3>
          <p className="mt-2" style={{ color: SUB }}>A partner will be in touch within two business days.</p>
        </div>
      </div>
    );
  }
  return (
    <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="rounded-[2rem] p-8 md:p-10" style={{ background: PAPER, border: `1px solid ${LINE}` }}>
      <div className="grid gap-6 sm:grid-cols-2">
        <input required placeholder="First name" className={field} style={bs} />
        <input required placeholder="Last name" className={field} style={bs} />
      </div>
      <input required type="email" placeholder="Email" className={`${field} mt-6`} style={bs} />
      <select className={`${field} mt-6`} style={bs}>
        <option>How can we help?</option>
        {["Wealth management", "Retirement & pensions", "Business exit / sale", "Estate & succession", "Tax planning", "A general conversation"].map((o) => <option key={o}>{o}</option>)}
      </select>
      <textarea rows={3} placeholder="Anything you'd like us to know (optional)" className={`${field} mt-6 resize-none`} style={bs} />
      <button type="submit" data-cursor="hover" className="mt-8 w-full rounded-full py-4 text-sm font-semibold transition-transform hover:-translate-y-0.5" style={{ background: INK, color: PAPER }}>Request an introduction</button>
    </form>
  );
}

const SERVICES = [
  { t: "Wealth Management", body: "Discretionary and advisory portfolios built around your goals, your tax position and your appetite for risk — reviewed continuously, never left to drift." },
  { t: "Retirement Planning", body: "A clear, funded picture of the life you want later, and the confidence that the numbers behind it hold up in every scenario." },
  { t: "Business & Exit", body: "Guidance for founders through raising, scaling and — when the time comes — selling, so a lifetime of work converts into lasting personal wealth." },
  { t: "Estate & Succession", body: "Thoughtful structuring so wealth passes to the people and causes you care about, with as little friction and tax as the law allows." },
];

const PROCESS = [
  { t: "Discovery", body: "We start by understanding your life, not your paperwork — what you have, what you want, and what keeps you up at night." },
  { t: "Strategy", body: "A written plan mapping every asset, goal and risk into one coherent picture, stress-tested against markets, tax and time." },
  { t: "Implementation", body: "We put the plan quietly into motion — accounts, structures and investments — coordinating with your accountant and solicitor." },
  { t: "Stewardship", body: "Regular reviews and an always-open line, so the plan evolves as your life does. This is where the relationship really begins." },
];

const CASES = [
  { metric: "+41%", label: "5-yr net return", body: "Rebuilt a concentrated founder portfolio into a diversified, tax-efficient structure ahead of a company sale." },
  { metric: "£2.1m", label: "Tax mitigated", body: "Restructured a family estate across two generations, preserving the family home and business for succession." },
  { metric: "0 stress", label: "Retirement funded", body: "Turned an uncertain pension picture into a clear, fully-funded plan an executive couple could finally relax into." },
];

const FAQ = [
  { q: "Who do you typically work with?", a: "Founders, senior executives and families — usually with investable assets from £500k upward — who want a single, trusted adviser rather than a collection of product salespeople." },
  { q: "How are you paid?", a: "We are fee-only. You pay us a transparent fee, and we earn nothing from the products we recommend. That keeps our advice genuinely aligned with your interests." },
  { q: "Are you independent?", a: "Entirely. We are not owned by a bank or fund house and hold no in-house products, so we can recommend whatever is genuinely best for you across the whole market." },
  { q: "What happens in the first meeting?", a: "We listen. There's no pitch and no cost — just a confidential conversation about where you are and where you'd like to be, and an honest view on whether we can help." },
  { q: "How often will we speak?", a: "Formally, at least twice a year, with a full plan review annually. Informally, whenever you need us — a dedicated partner is always a call or email away." },
];
