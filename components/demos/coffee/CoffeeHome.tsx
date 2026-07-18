"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useScroll,
  useTransform,
} from "framer-motion";
import { DemoShell, Rise } from "@/components/demos/DemoShell";
import { Img } from "@/components/demos/Img";
import { Counter } from "@/components/ui/Counter";
import { coffeeConfig, coffeeImg, warm, warmSoft } from "./config";

const C = coffeeConfig.colors;
const serif = { fontFamily: coffeeConfig.fontDisplay };

const roasts = [
  { name: "Sunday Blend", notes: "Cocoa · hazelnut · brown sugar", price: "$18", img: coffeeImg.roastCocoa, grad: warm },
  { name: "Ethiopia Guji", notes: "Blueberry · jasmine · honey", price: "$22", img: coffeeImg.roastBerry, grad: warmSoft },
  { name: "Midnight Oak", notes: "Dark chocolate · cedar · spice", price: "$19", img: coffeeImg.roastDark, grad: warm },
];

const stats = [
  { v: 10, s: "", l: "Years roasting" },
  { v: 24, s: "", l: "Origins poured" },
  { v: 50, s: "k", l: "Bags shipped" },
  { v: 4, s: ".9★", l: "Average rating" },
];

const steps = [
  ["Source", "We fly out, cup hundreds of lots, and buy only the coffees that earn their place."],
  ["Roast", "Tiny batches on a 1970s drum roaster, dialled in by ear, nose and stopwatch."],
  ["Rest", "Beans rest three to five days so the flavours settle before they ever reach you."],
  ["Brew", "Every bag ships with the recipe that makes it sing — no guesswork at home."],
];

const faqs = [
  ["Do you ship nationwide?", "Yes — free on orders over $30, a flat $5 otherwise. Everything is roasted to order and leaves us within 48 hours."],
  ["Whole bean or ground?", "Either. Tell us your brew method at checkout and we'll grind to match, or keep it whole and grind fresh at home."],
  ["How fresh is the coffee?", "We roast the morning we ship. Look for the roast date stamped on the bottom of every bag."],
  ["Can I subscribe?", "Absolutely. Pick a cadence, save 15%, and skip, swap or cancel any time from your account."],
];

export function CoffeeHome() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -70]);

  return (
    <DemoShell config={coffeeConfig}>
      {/* Hero */}
      <section ref={heroRef} className="mx-auto max-w-6xl px-6 pt-10 md:px-10 md:pt-16">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <Rise>
              <span className="inline-block rounded-full px-3 py-1 text-xs font-medium uppercase tracking-widest" style={{ background: C.panel, color: C.sub }}>
                Small-batch roastery · est. 2016
              </span>
            </Rise>
            <Rise delay={0.05}>
              <h1 style={serif} className="mt-6 text-5xl font-semibold leading-[1.02] md:text-7xl">
                Coffee, roasted with{" "}
                <span style={{ color: C.accent, fontStyle: "italic" }}>patience</span>.
              </h1>
            </Rise>
            <Rise delay={0.1}>
              <p className="mt-6 max-w-md text-lg leading-relaxed" style={{ color: C.sub }}>
                We roast in tiny batches, by hand, the morning we ship. No rush,
                no shortcuts — just coffee that tastes like someone cared.
              </p>
            </Rise>
            <Rise delay={0.15}>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link href="/demos/coffee/menu" data-cursor="hover" className="rounded-full px-7 py-3.5 text-sm font-semibold transition-transform hover:-translate-y-0.5" style={{ background: C.ink, color: "#fff" }}>
                  Shop our beans
                </Link>
                <Link href="/demos/coffee/visit" data-cursor="hover" className="text-sm font-medium underline underline-offset-4" style={{ color: C.sub }}>
                  Find our café →
                </Link>
              </div>
            </Rise>
          </div>
          <motion.div style={{ y: heroY }}>
            <Img src={coffeeImg.heroPour} alt="Pouring a fresh cup of coffee" fallback={warm} priority className="aspect-[4/5] w-full" rounded="rounded-[2.5rem]" />
          </motion.div>
        </div>
      </section>

      {/* Marquee */}
      <Marquee />

      {/* Stats */}
      <section className="mx-auto mt-20 max-w-6xl px-6 md:px-10">
        <div className="grid grid-cols-2 gap-8 rounded-[2rem] px-8 py-12 md:grid-cols-4" style={{ background: C.panel }}>
          {stats.map((s, i) => (
            <Rise key={s.l} delay={i * 0.08}>
              <Counter value={s.v} suffix={s.s} className="block text-5xl font-semibold md:text-6xl" />
              <p className="mt-2 text-sm" style={{ color: C.sub }}>{s.l}</p>
            </Rise>
          ))}
        </div>
      </section>

      {/* Why unique — bento */}
      <section className="mx-auto mt-28 max-w-6xl px-6 md:px-10">
        <Rise>
          <span className="text-xs font-medium uppercase tracking-widest" style={{ color: C.accent }}>Why it&rsquo;s different</span>
          <h2 style={serif} className="mt-4 max-w-2xl text-3xl font-semibold leading-tight md:text-5xl">
            Small enough to care about every single bag.
          </h2>
        </Rise>
        <div className="mt-10 grid gap-5 md:grid-cols-3 md:grid-rows-2">
          <Rise className="md:row-span-2">
            <Img src={coffeeImg.beans} alt="Fresh coffee beans" fallback={warm} className="h-full min-h-[280px] w-full" rounded="rounded-3xl" />
          </Rise>
          {[
            ["Roasted to order", "Never a warehouse. Your beans are roasted the morning they ship."],
            ["Direct from farmers", "We buy straight from growers, paid well above fair-trade rates."],
            ["By hand, every batch", "One person, one roaster, checking colour and smell by eye."],
            ["A recipe in every bag", "The exact numbers to brew it perfectly, printed on the label."],
          ].map(([t, s], i) => (
            <Rise key={t} delay={i * 0.06}>
              <div className="flex h-full flex-col justify-between rounded-3xl p-6" style={{ background: C.panel }}>
                <span className="text-2xl" style={{ color: C.accent }}>0{i + 1}</span>
                <div className="mt-8">
                  <p style={serif} className="text-xl font-semibold">{t}</p>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: C.sub }}>{s}</p>
                </div>
              </div>
            </Rise>
          ))}
        </div>
      </section>

      {/* How we make it — steps */}
      <section className="mx-auto mt-28 max-w-6xl px-6 md:px-10">
        <Rise>
          <h2 style={serif} className="text-3xl font-semibold md:text-5xl">From cherry to cup.</h2>
        </Rise>
        <div className="mt-12 grid gap-8 md:grid-cols-4">
          {steps.map(([t, s], i) => (
            <Rise key={t} delay={i * 0.08}>
              <div className="relative">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full text-sm font-bold text-white" style={{ background: C.accent }}>
                    {i + 1}
                  </span>
                  {i < steps.length - 1 && <span className="hidden h-px flex-1 md:block" style={{ background: C.line }} />}
                </div>
                <h3 style={serif} className="mt-5 text-2xl font-semibold">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: C.sub }}>{s}</p>
              </div>
            </Rise>
          ))}
        </div>
      </section>

      {/* Featured roasts */}
      <section className="mx-auto mt-28 max-w-6xl px-6 md:px-10">
        <Rise>
          <div className="flex items-end justify-between">
            <h2 style={serif} className="text-3xl font-semibold md:text-5xl">This week&rsquo;s roasts</h2>
            <Link href="/demos/coffee/menu" data-cursor="hover" className="hidden text-sm font-medium underline underline-offset-4 md:block" style={{ color: C.accent }}>
              See full menu →
            </Link>
          </div>
        </Rise>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {roasts.map((r, i) => (
            <Rise key={r.name} delay={i * 0.08}>
              <Link href="/demos/coffee/menu" data-cursor="hover" className="group block">
                <div className="overflow-hidden rounded-2xl">
                  <motion.div whileHover={{ scale: 1.04 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
                    <Img src={r.img} alt={r.name} fallback={r.grad} className="aspect-[4/3] w-full" rounded="rounded-2xl" />
                  </motion.div>
                </div>
                <div className="mt-4 flex items-baseline justify-between">
                  <h3 style={serif} className="text-2xl font-semibold">{r.name}</h3>
                  <span className="text-lg font-semibold" style={{ color: C.accent }}>{r.price}</span>
                </div>
                <p className="mt-1 text-sm" style={{ color: C.sub }}>{r.notes}</p>
              </Link>
            </Rise>
          ))}
        </div>
      </section>

      {/* Story teaser */}
      <section className="mx-auto mt-28 max-w-6xl px-6 md:px-10">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <Img src={coffeeImg.cafe} alt="Inside the Ember & Oak café" fallback={warmSoft} className="aspect-square w-full" rounded="rounded-[2rem]" />
          <div>
            <Rise>
              <span className="text-xs font-medium uppercase tracking-widest" style={{ color: C.accent }}>Our story</span>
            </Rise>
            <Rise delay={0.05}>
              <h2 style={serif} className="mt-4 text-3xl font-semibold leading-tight md:text-5xl">A corner shop with a very loud roaster.</h2>
            </Rise>
            <Rise delay={0.1}>
              <p className="mt-6 text-lg leading-relaxed" style={{ color: C.sub }}>
                It started with one secondhand roaster and a stubborn belief that
                good coffee shouldn&rsquo;t be complicated. Ten years later we
                still roast on the same street, for the same neighbours.
              </p>
            </Rise>
            <Rise delay={0.15}>
              <Link href="/demos/coffee/about" data-cursor="hover" className="mt-8 inline-block rounded-full px-6 py-3 text-sm font-semibold" style={{ background: C.accent, color: "#fff" }}>
                Read our story
              </Link>
            </Rise>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto mt-28 max-w-3xl px-6 md:px-10">
        <Rise>
          <h2 style={serif} className="text-3xl font-semibold md:text-5xl">Questions, answered.</h2>
        </Rise>
        <div className="mt-10">
          {faqs.map(([q, a], i) => (
            <Rise key={q} delay={i * 0.04}>
              <Faq q={q} a={a} last={i === faqs.length - 1} />
            </Rise>
          ))}
        </div>
      </section>

      {/* Contact / address */}
      <section className="mx-auto mt-28 max-w-6xl px-6 md:px-10">
        <div className="grid gap-6 md:grid-cols-2">
          <Rise>
            <div className="flex h-full flex-col justify-between rounded-[2rem] p-8 md:p-10" style={{ background: C.panel }}>
              <div>
                <span className="text-xs font-medium uppercase tracking-widest" style={{ color: C.accent }}>Come say hi</span>
                <h2 style={serif} className="mt-3 text-3xl font-semibold leading-tight md:text-4xl">Find us on the corner.</h2>
              </div>
              <div className="mt-8 space-y-5 text-sm">
                <Detail label="Address" value="42 Maple Street, corner of Oak" />
                <Detail label="Hours" value="Mon–Fri 7–16 · Sat 8–16 · Sun 8–14" />
                <Detail label="Email" value="hello@emberandoak.coffee" />
                <Detail label="Phone" value="(555) 210-8890" />
              </div>
            </div>
          </Rise>
          <Rise delay={0.08}>
            <div className="relative aspect-square overflow-hidden rounded-[2rem] md:aspect-auto" style={{ background: `linear-gradient(160deg, ${C.panel}, ${C.bg})` }}>
              <div className="absolute inset-0 opacity-40" style={{ backgroundImage: `linear-gradient(${C.line} 1px, transparent 1px), linear-gradient(90deg, ${C.line} 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <motion.span
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                  className="grid h-12 w-12 place-items-center rounded-full text-white shadow-lg"
                  style={{ background: C.accent }}
                >
                  ●
                </motion.span>
                <p style={serif} className="mt-3 text-lg font-semibold">Ember &amp; Oak</p>
              </div>
            </div>
          </Rise>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto mt-28 max-w-6xl px-6 md:px-10">
        <Rise>
          <div className="overflow-hidden rounded-[2.5rem] px-8 py-16 text-center md:px-16 md:py-24" style={{ background: C.ink, color: C.bg }}>
            <h2 style={serif} className="mx-auto max-w-2xl text-4xl font-semibold leading-tight md:text-6xl">Come sit a while.</h2>
            <p className="mx-auto mt-5 max-w-md text-lg" style={{ color: "#d8c8b4" }}>Open 7am–4pm, every day. 42 Maple Street, corner of Oak.</p>
            <Link href="/demos/coffee/visit" data-cursor="hover" className="mt-8 inline-block rounded-full px-8 py-4 text-sm font-semibold transition-transform hover:-translate-y-0.5" style={{ background: C.accent, color: "#fff" }}>
              Plan your visit
            </Link>
          </div>
        </Rise>
      </section>
    </DemoShell>
  );
}

function Marquee() {
  const items = ["Single origin", "Small batch", "Roasted to order", "Direct trade", "By hand", "Since 2016"];
  const row = [...items, ...items];
  return (
    <div className="mt-16 overflow-hidden border-y py-5" style={{ borderColor: C.line }}>
      <motion.div
        className="flex whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
      >
        {row.map((t, i) => (
          <span key={i} className="mx-6 flex items-center gap-6 text-2xl md:text-3xl" style={serif}>
            {t}
            <span style={{ color: C.accent }}>✦</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

function Faq({ q, a, last }: { q: string; a: string; last: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: last ? "none" : `1px solid ${C.line}` }}>
      <button
        onClick={() => setOpen((v) => !v)}
        data-cursor="hover"
        className="flex w-full items-center justify-between gap-6 py-6 text-left"
      >
        <span style={serif} className="text-xl font-semibold md:text-2xl">{q}</span>
        <motion.span animate={{ rotate: open ? 45 : 0 }} className="text-2xl" style={{ color: C.accent }}>
          +
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-base leading-relaxed" style={{ color: C.sub }}>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.sub }}>{label}</p>
      <p className="mt-1 text-base" style={{ color: C.ink }}>{value}</p>
    </div>
  );
}
