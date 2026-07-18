"use client";

import Link from "next/link";
import { DemoShell, Rise } from "@/components/demos/DemoShell";
import { Img } from "@/components/demos/Img";
import { coffeeConfig, coffeeImg, warm, warmSoft } from "./config";

const C = coffeeConfig.colors;
const serif = { fontFamily: coffeeConfig.fontDisplay };

const roasts = [
  { name: "Sunday Blend", notes: "Cocoa · hazelnut · brown sugar", price: "$18", img: coffeeImg.cup, grad: warm },
  { name: "Ethiopia Guji", notes: "Blueberry · jasmine · honey", price: "$22", img: coffeeImg.pourover, grad: warmSoft },
  { name: "Midnight Oak", notes: "Dark chocolate · cedar · spice", price: "$19", img: coffeeImg.roast, grad: warm },
];

export function CoffeeHome() {
  return (
    <DemoShell config={coffeeConfig}>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-10 md:px-10 md:pt-16">
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
          <Img src={coffeeImg.heroPour} alt="Pouring a fresh cup of coffee" fallback={warm} priority className="aspect-[4/5] w-full" rounded="rounded-[2.5rem]" />
        </div>
      </section>

      {/* Value strip */}
      <section className="mx-auto mt-20 max-w-6xl px-6 md:px-10">
        <div className="grid gap-6 rounded-3xl px-8 py-8 sm:grid-cols-3" style={{ background: C.panel }}>
          {[
            ["Roasted to order", "Never more than 48 hours old"],
            ["Direct trade", "Farmers paid above fair-trade rates"],
            ["Free local delivery", "On bags over $30"],
          ].map(([t, s], i) => (
            <Rise key={t} delay={i * 0.08}>
              <p style={serif} className="text-lg font-semibold">{t}</p>
              <p className="mt-1 text-sm" style={{ color: C.sub }}>{s}</p>
            </Rise>
          ))}
        </div>
      </section>

      {/* Featured roasts */}
      <section className="mx-auto mt-24 max-w-6xl px-6 md:px-10">
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
              <Link href="/demos/coffee/menu" data-cursor="hover" className="block">
                <Img src={r.img} alt={r.name} fallback={r.grad} className="aspect-[4/3] w-full" rounded="rounded-2xl" />
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
              <h2 style={serif} className="mt-4 text-3xl font-semibold leading-tight md:text-5xl">
                A corner shop with a very loud roaster.
              </h2>
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
