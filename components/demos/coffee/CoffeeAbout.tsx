"use client";

import { DemoShell, Rise } from "@/components/demos/DemoShell";
import { Img } from "@/components/demos/Img";
import { coffeeConfig, coffeeImg, warm, warmSoft } from "./config";

const C = coffeeConfig.colors;
const serif = { fontFamily: coffeeConfig.fontDisplay };

const timeline = [
  ["2016", "One secondhand roaster in a garage on Maple Street."],
  ["2018", "The café opens. The neighbours finally forgive the smell of Saturdays."],
  ["2021", "Direct-trade partnerships with three farms across Colombia and Ethiopia."],
  ["2025", "Still the same street, same roaster, same stubborn standards."],
];

export function CoffeeAbout() {
  return (
    <DemoShell config={coffeeConfig}>
      <section className="mx-auto max-w-6xl px-6 pt-10 md:px-10 md:pt-16">
        <Rise>
          <span className="text-xs font-medium uppercase tracking-widest" style={{ color: C.accent }}>Our story</span>
        </Rise>
        <Rise delay={0.05}>
          <h1 style={serif} className="mt-4 max-w-4xl text-5xl font-semibold leading-[1.03] md:text-7xl">
            We roast for the people who walk past every morning.
          </h1>
        </Rise>
      </section>

      <section className="mx-auto mt-14 max-w-6xl px-6 md:px-10">
        <Img src={coffeeImg.cafe} alt="The Ember & Oak café" fallback={warm} className="aspect-[16/9] w-full" rounded="rounded-[2rem]" priority />
      </section>

      <section className="mx-auto mt-20 max-w-3xl px-6 md:px-10">
        <Rise>
          <p className="text-2xl leading-relaxed" style={{ color: C.ink }}>
            Ember &amp; Oak began with a simple frustration: coffee had become
            complicated. Endless jargon, precious rituals, prices to match.
          </p>
        </Rise>
        <Rise delay={0.05}>
          <p className="mt-6 text-lg leading-relaxed" style={{ color: C.sub }}>
            We wanted the opposite — coffee you could trust without a glossary.
            So we bought a tired old roaster, learned it inch by inch, and started
            roasting small enough that every bag could be checked by hand. That
            hasn&rsquo;t changed. It never will.
          </p>
        </Rise>
      </section>

      {/* Timeline */}
      <section className="mx-auto mt-24 max-w-4xl px-6 md:px-10">
        <div className="space-y-10">
          {timeline.map(([y, t], i) => (
            <Rise key={y} delay={i * 0.05}>
              <div className="grid grid-cols-[64px_1fr] gap-6 md:grid-cols-[100px_1fr]">
                <span style={serif} className="text-2xl font-semibold">{y}</span>
                <p className="text-lg leading-relaxed" style={{ color: C.sub, borderTop: `1px solid ${C.line}`, paddingTop: 8 }}>{t}</p>
              </div>
            </Rise>
          ))}
        </div>
      </section>

      {/* Values + image */}
      <section className="mx-auto mt-24 max-w-6xl px-6 md:px-10">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <Rise>
              <h2 style={serif} className="text-3xl font-semibold leading-tight md:text-5xl">What we won&rsquo;t compromise on.</h2>
            </Rise>
            <div className="mt-8 grid grid-cols-2 gap-8">
              {[
                ["Fresh", "Roasted the morning we ship — never a warehouse."],
                ["Fair", "Farmers paid above fair-trade, every harvest."],
                ["Honest", "No jargon, no upsell, no nonsense."],
                ["Local", "Same street, same neighbours, ten years on."],
              ].map(([t, s], i) => (
                <Rise key={t} delay={i * 0.06}>
                  <p style={serif} className="text-xl font-semibold">{t}</p>
                  <p className="mt-1 text-sm leading-relaxed" style={{ color: C.sub }}>{s}</p>
                </Rise>
              ))}
            </div>
          </div>
          <Img src={coffeeImg.roast} alt="Freshly roasted coffee beans" fallback={warmSoft} className="aspect-[4/5] w-full" rounded="rounded-[2rem]" />
        </div>
      </section>
    </DemoShell>
  );
}
