"use client";

import { DemoShell, Rise } from "@/components/demos/DemoShell";
import { Img } from "@/components/demos/Img";
import { coffeeConfig, coffeeImg, warm, warmSoft } from "./config";

const C = coffeeConfig.colors;
const serif = { fontFamily: coffeeConfig.fontDisplay };

const beans = [
  { name: "Sunday Blend", origin: "Colombia · Brazil", roast: "Medium", notes: "Cocoa, hazelnut, brown sugar", price: "$18", img: coffeeImg.cup, grad: warm },
  { name: "Ethiopia Guji", origin: "Single origin", roast: "Light", notes: "Blueberry, jasmine, honey", price: "$22", img: coffeeImg.pourover, grad: warmSoft },
  { name: "Midnight Oak", origin: "Sumatra", roast: "Dark", notes: "Dark chocolate, cedar, spice", price: "$19", img: coffeeImg.roast, grad: warm },
  { name: "Morning Post", origin: "Guatemala", roast: "Medium", notes: "Caramel, red apple, almond", price: "$18", img: coffeeImg.table, grad: warmSoft },
  { name: "Decaf du Jour", origin: "Colombia", roast: "Medium", notes: "Toffee, walnut, cocoa", price: "$17", img: coffeeImg.latteArt, grad: warm },
  { name: "Cold Brew Kit", origin: "House blend", roast: "Dark", notes: "Bottle it yourself at home", price: "$24", img: coffeeImg.beans, grad: warmSoft },
];

const brews = [
  ["Pour-over", "V60 · 22g · 360ml · 2:45"],
  ["French press", "30g · 500ml · 4:00"],
  ["Espresso", "18g in · 36g out · 28s"],
  ["Cold brew", "80g · 1L · steep 16h"],
];

export function CoffeeMenu() {
  return (
    <DemoShell config={coffeeConfig}>
      <section className="mx-auto max-w-6xl px-6 pt-10 text-center md:px-10 md:pt-16">
        <Rise>
          <span className="text-xs font-medium uppercase tracking-widest" style={{ color: C.accent }}>The menu</span>
        </Rise>
        <Rise delay={0.05}>
          <h1 style={serif} className="mx-auto mt-4 max-w-3xl text-5xl font-semibold leading-[1.03] md:text-7xl">
            Every bag, roasted this week.
          </h1>
        </Rise>
        <Rise delay={0.1}>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed" style={{ color: C.sub }}>
            Whole bean or ground to order. Subscribe and save 15% — pause or
            change any time.
          </p>
        </Rise>
      </section>

      <section className="mx-auto mt-16 max-w-6xl px-6 md:px-10">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {beans.map((b, i) => (
            <Rise key={b.name} delay={(i % 3) * 0.08}>
              <div className="group flex h-full flex-col rounded-3xl p-4 transition-transform duration-300 hover:-translate-y-1" style={{ background: C.panel }}>
                <Img src={b.img} alt={b.name} fallback={b.grad} className="aspect-[5/4] w-full" rounded="rounded-2xl" />
                <div className="flex flex-1 flex-col px-2 pt-5">
                  <div className="flex items-baseline justify-between">
                    <h3 style={serif} className="text-2xl font-semibold">{b.name}</h3>
                    <span className="text-lg font-semibold" style={{ color: C.accent }}>{b.price}</span>
                  </div>
                  <p className="mt-1 text-sm" style={{ color: C.sub }}>{b.origin} · {b.roast} roast</p>
                  <p className="mt-3 flex-1 text-sm leading-relaxed">{b.notes}</p>
                  <button data-cursor="hover" className="mt-5 rounded-full px-5 py-3 text-sm font-semibold text-white transition-transform group-hover:-translate-y-0.5" style={{ background: C.accent }}>
                    Add to bag
                  </button>
                </div>
              </div>
            </Rise>
          ))}
        </div>
      </section>

      {/* Brew guide */}
      <section className="mx-auto mt-28 max-w-6xl px-6 md:px-10">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <Rise>
              <span className="text-xs font-medium uppercase tracking-widest" style={{ color: C.accent }}>Brew guide</span>
            </Rise>
            <Rise delay={0.05}>
              <h2 style={serif} className="mt-4 text-3xl font-semibold leading-tight md:text-5xl">
                Recipes that actually work at home.
              </h2>
            </Rise>
            <div className="mt-8 divide-y" style={{ borderColor: C.line }}>
              {brews.map(([m, r], i) => (
                <Rise key={m} delay={i * 0.05}>
                  <div className="flex items-center justify-between py-4" style={{ borderTop: i ? `1px solid ${C.line}` : "none" }}>
                    <span style={serif} className="text-xl font-semibold">{m}</span>
                    <span className="text-sm" style={{ color: C.sub }}>{r}</span>
                  </div>
                </Rise>
              ))}
            </div>
          </div>
          <Img src={coffeeImg.pourover} alt="Making a pour-over coffee" fallback={warmSoft} className="aspect-[4/5] w-full" rounded="rounded-[2rem]" />
        </div>
      </section>
    </DemoShell>
  );
}
