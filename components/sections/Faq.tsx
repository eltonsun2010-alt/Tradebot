"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { FAQS } from "@/lib/data";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useLenis } from "@/components/providers/SmoothScrollProvider";

/* ==================================================================== *
 * The final room — a quiet luxury gallery of questions. Each question is
 * a floating satin card in a dark, softly-lit space. As the visitor moves
 * through, one card at a time glides to the centre, straightens, and opens
 * its answer in calm typography; the others rest nearby as soft context.
 * Nothing spins, nothing rushes — the composure is the point. It is where
 * the journey resolves into confidence.
 * ==================================================================== */

const N = FAQS.length;
const two = (i: number) => String(i + 1).padStart(2, "0");
const clamp = (x: number, a: number, b: number) => (x < a ? a : x > b ? b : x);
const clamp01 = (x: number) => clamp(x, 0, 1);
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export function Faq() {
  const reduced = useReducedMotion();
  const mobile = useIsMobile();
  if (mobile || reduced) return <FaqStacked />;
  return <FaqGallery />;
}

// where each card rests while it is not the centre of attention — a curated,
// asymmetric scatter (never a grid), varied in side, height, depth and tilt
const SPOTS = [
  { x: -19, y: -7, s: 0.64, r: -5 },
  { x: 21, y: 9, s: 0.6, r: 4 },
  { x: -24, y: 13, s: 0.61, r: 6 },
  { x: 17, y: -13, s: 0.63, r: -4 },
  { x: -15, y: 15, s: 0.58, r: 5 },
  { x: 24, y: -9, s: 0.6, r: -6 },
  { x: -21, y: -15, s: 0.62, r: 4 },
  { x: 18, y: 14, s: 0.6, r: -5 },
];

function FaqGallery() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const ansRefs = useRef<(HTMLDivElement | null)[]>([]);
  const ambientRef = useRef<HTMLDivElement>(null);
  const { scrollTo } = useLenis();

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const sect = sectionRef.current;
      if (sect) {
        const vh = window.innerHeight;
        const vw = window.innerWidth;
        const range = sect.offsetHeight - vh;
        const pos = range > 0 ? clamp01(-sect.getBoundingClientRect().top / range) : 0;
        const focus = pos * (N - 1);
        const t = performance.now() / 1000;

        for (let i = 0; i < N; i += 1) {
          const el = cardRefs.current[i];
          if (!el) continue;
          const d = focus - i; // 0 at centre, >0 already passed, <0 upcoming
          const ad = Math.abs(d);
          const fo = clamp01(1 - ad); // focus weight, only near the centre
          const gate = smoothstep(2.7, 1.15, ad); // a few neighbours, then nothing
          // gentle, ever-present float — slow and small, never a spin
          const floatY = Math.sin(t * 0.5 + i * 1.7) * 0.7 * (1 - fo * 0.6);
          const floatR = Math.sin(t * 0.4 + i * 2.1) * 0.5 * (1 - fo);
          // rest at the curated spot; glide to centre as it takes focus
          const x = SPOTS[i].x * (1 - fo);
          const y = SPOTS[i].y * (1 - fo) - d * 3.2 + floatY;
          const scale = SPOTS[i].s + (0.94 - SPOTS[i].s) * fo;
          const rot = SPOTS[i].r * (1 - fo) + floatR;
          const op = (0.24 + 0.76 * fo) * gate;
          const blur = (1 - fo) * 2.6 * gate;
          const xpx = (x / 100) * vw;
          const ypx = (y / 100) * vh;
          el.style.transform = `translate3d(calc(-50% + ${xpx.toFixed(1)}px), calc(-50% + ${ypx.toFixed(1)}px), 0) scale(${scale.toFixed(3)}) rotate(${rot.toFixed(2)}deg)`;
          el.style.opacity = op.toFixed(3);
          el.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "none";
          el.style.zIndex = String(200 + Math.round(fo * 100) - Math.round(ad));
          el.style.pointerEvents = fo > 0.4 ? "auto" : "none";
          const ans = ansRefs.current[i];
          if (ans) {
            const av = smoothstep(0.55, 0.92, fo);
            ans.style.opacity = av.toFixed(3);
            ans.style.maxHeight = `${(av * 42).toFixed(1)}vh`;
          }
        }
        if (ambientRef.current) {
          // the soft ambient pool of light breathes very gently
          ambientRef.current.style.opacity = (0.5 + 0.12 * Math.sin(t * 0.3)).toFixed(3);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const goTo = (i: number) => {
    const sect = sectionRef.current;
    if (!sect) return;
    const range = sect.offsetHeight - window.innerHeight;
    scrollTo(sect.offsetTop + (i / (N - 1)) * range, { duration: 1.4 });
  };

  return (
    <section
      id="faq"
      ref={sectionRef}
      className="relative border-t border-line bg-ink"
      style={{ height: `${N * 82 + 60}vh` }}
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* the gallery air — a deep charcoal wash, a soft pool of ambient light,
            and a vignette that sinks the room into the dark at its edges */}
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(120% 90% at 50% 42%, #0c0d11 0%, #070708 55%, #050506 100%)" }} />
        <div
          ref={ambientRef}
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2"
          style={{ width: "120vh", height: "120vh", opacity: 0.5, background: "radial-gradient(circle, rgba(150,178,255,0.07) 0%, rgba(120,150,225,0.03) 34%, transparent 64%)" }}
        />
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(130% 100% at 50% 44%, transparent 46%, rgba(0,0,0,0.86))" }} />

        {/* the quiet section label */}
        <div className="pointer-events-none absolute inset-x-0 top-[7vh] flex flex-col items-center text-center">
          <div className="mb-4 flex items-center gap-4">
            <span className="h-px w-12 bg-accent" />
            <span className="text-eyebrow text-paper-dim">Common questions</span>
          </div>
          <p className="text-eyebrow text-paper-faint">Drift through &darr;</p>
        </div>

        {/* the floating cards */}
        {FAQS.map((f, i) => (
          <div
            key={f.q}
            ref={(el) => { cardRefs.current[i] = el; }}
            onClick={() => goTo(i)}
            data-cursor="hover"
            className="absolute left-1/2 top-[46%] w-[min(40rem,86vw)] cursor-pointer rounded-[1.5rem] border border-white/10 px-9 py-8 will-change-transform md:px-12 md:py-11"
            style={{
              opacity: 0,
              background: "linear-gradient(152deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.018) 55%, rgba(255,255,255,0.035) 100%)",
              boxShadow: "0 40px 90px -34px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.09), inset 0 0 0 1px rgba(255,255,255,0.01)",
              backdropFilter: "blur(7px)",
              WebkitBackdropFilter: "blur(7px)",
            }}
          >
            <div className="mb-5 flex items-center gap-4">
              <span className="font-display text-xs font-semibold tracking-[0.3em] text-accent-bright">{two(i)}</span>
              <span className="h-px flex-1 bg-white/10" />
              <span className="text-[0.62rem] tracking-[0.3em] text-paper-faint">{String(N).padStart(2, "0")}</span>
            </div>
            <h3 className="font-display text-[clamp(1.45rem,2.5vw,2.3rem)] font-bold leading-[1.12] tracking-[-0.02em] text-paper">
              {f.q}
            </h3>
            <div
              ref={(el) => { ansRefs.current[i] = el; }}
              className="overflow-hidden"
              style={{ opacity: 0, maxHeight: 0 }}
            >
              <p className="mt-6 max-w-xl text-[0.97rem] leading-relaxed text-paper-dim">{f.a}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* --------------- mobile / reduced motion: a calm reading catalogue --------------- */
function FaqStacked() {
  return (
    <section id="faq" className="relative border-t border-line bg-ink py-24 section-x">
      <div className="mb-16 text-center">
        <div className="mb-5 flex items-center justify-center gap-4">
          <span className="h-px w-12 bg-accent" />
          <span className="text-eyebrow text-paper-dim">Common questions</span>
        </div>
        <h2 className="mx-auto max-w-md font-display text-3xl font-extrabold leading-[1.05] tracking-[-0.02em] text-paper">
          The honest answers.
        </h2>
      </div>
      <div className="mx-auto flex max-w-2xl flex-col gap-12">
        {FAQS.map((f, i) => (
          <div key={f.q} className="border-b border-line pb-10">
            <span className="font-display text-xs font-semibold tracking-[0.28em] text-accent-bright">{two(i)}</span>
            <h3 className="mt-4 font-display text-xl font-bold leading-[1.2] tracking-[-0.01em] text-paper md:text-2xl">
              {f.q}
            </h3>
            <p className="mt-4 text-base leading-relaxed text-paper-dim">{f.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
