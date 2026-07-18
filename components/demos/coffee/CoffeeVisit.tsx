"use client";

import { DemoShell, Rise } from "@/components/demos/DemoShell";
import { Img } from "@/components/demos/Img";
import { coffeeConfig, coffeeImg, warm, warmSoft } from "./config";

const C = coffeeConfig.colors;
const serif = { fontFamily: coffeeConfig.fontDisplay };

const hours = [
  ["Monday – Friday", "7:00 – 16:00"],
  ["Saturday", "8:00 – 16:00"],
  ["Sunday", "8:00 – 14:00"],
];

export function CoffeeVisit() {
  return (
    <DemoShell config={coffeeConfig}>
      <section className="mx-auto max-w-6xl px-6 pt-10 md:px-10 md:pt-16">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <Rise>
              <span className="text-xs font-medium uppercase tracking-widest" style={{ color: C.accent }}>Visit us</span>
            </Rise>
            <Rise delay={0.05}>
              <h1 style={serif} className="mt-4 text-5xl font-semibold leading-[1.03] md:text-7xl">
                The door&rsquo;s always open.
              </h1>
            </Rise>
            <Rise delay={0.1}>
              <p className="mt-6 max-w-md text-lg leading-relaxed" style={{ color: C.sub }}>
                Find us on the corner of Maple and Oak. Pull up a stool, watch the
                roaster turn, and let us make you something warm.
              </p>
            </Rise>
            <Rise delay={0.15}>
              <div className="mt-8 space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.sub }}>Address</p>
                  <p className="mt-1 text-lg">42 Maple Street, corner of Oak</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.sub }}>Say hello</p>
                  <p className="mt-1 text-lg">hello@emberandoak.coffee · (555) 210-8890</p>
                </div>
              </div>
            </Rise>
          </div>
          <Img src={coffeeImg.table} alt="A coffee on a café table" fallback={warm} className="aspect-[4/5] w-full" rounded="rounded-[2.5rem]" priority />
        </div>
      </section>

      {/* Hours + map */}
      <section className="mx-auto mt-24 max-w-6xl px-6 md:px-10">
        <div className="grid gap-6 md:grid-cols-[1fr_1.4fr]">
          <Rise>
            <div className="h-full rounded-[2rem] p-8" style={{ background: C.panel }}>
              <h2 style={serif} className="text-2xl font-semibold">Opening hours</h2>
              <div className="mt-6 divide-y" style={{ borderColor: C.line }}>
                {hours.map(([d, h], i) => (
                  <div key={d} className="flex items-center justify-between py-3.5" style={{ borderTop: i ? `1px solid ${C.line}` : "none" }}>
                    <span>{d}</span>
                    <span style={{ color: C.sub }}>{h}</span>
                  </div>
                ))}
              </div>
            </div>
          </Rise>
          <Rise delay={0.08}>
            {/* Stylised map block */}
            <div className="relative aspect-[16/10] overflow-hidden rounded-[2rem]" style={{ background: `linear-gradient(160deg, ${C.panel}, ${C.bg})` }}>
              <div className="absolute inset-0 opacity-40" style={{ backgroundImage: `linear-gradient(${C.line} 1px, transparent 1px), linear-gradient(90deg, ${C.line} 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-full text-white shadow-lg" style={{ background: C.accent }}>●</span>
                <p style={serif} className="mt-3 text-lg font-semibold">Ember &amp; Oak</p>
              </div>
            </div>
          </Rise>
        </div>
      </section>

      {/* Contact form look */}
      <section className="mx-auto mt-24 max-w-3xl px-6 md:px-10">
        <Rise>
          <div className="rounded-[2rem] p-8 md:p-12" style={{ background: C.ink, color: C.bg }}>
            <h2 style={serif} className="text-3xl font-semibold md:text-4xl">Book the space</h2>
            <p className="mt-3 text-base" style={{ color: "#d8c8b4" }}>
              Cuppings, workshops and private mornings — tell us what you have in mind.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <div className="rounded-xl px-4 py-3.5 text-sm" style={{ background: "rgba(255,255,255,0.08)", color: "#d8c8b4" }}>Your name</div>
              <div className="rounded-xl px-4 py-3.5 text-sm" style={{ background: "rgba(255,255,255,0.08)", color: "#d8c8b4" }}>Email</div>
              <div className="rounded-xl px-4 py-3.5 text-sm" style={{ background: "rgba(255,255,255,0.08)", color: "#d8c8b4" }}>What&rsquo;s the occasion?</div>
              <button data-cursor="hover" className="mt-1 rounded-xl px-6 py-3.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5" style={{ background: C.accent }}>
                Send enquiry
              </button>
            </div>
          </div>
        </Rise>
      </section>
    </DemoShell>
  );
}
