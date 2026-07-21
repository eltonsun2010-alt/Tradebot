"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { FAQS } from "@/lib/data";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useLenis } from "@/components/providers/SmoothScrollProvider";

/* ==================================================================== *
 * The final room — a real 3D exhibition of questions. Every question is
 * an object that already exists in world space, placed deliberately at
 * its own distance, height and angle. The visitor doesn't scroll cards
 * past a viewer; the CAMERA glides through the gallery, approaching each
 * exhibit in turn while the others stand in the distance. The nearest
 * piece turns gently to face you and opens its answer, then quietly
 * returns to rest as you move on. It is where the journey resolves into
 * calm confidence.
 * ==================================================================== */

const N = FAQS.length;
const two = (i: number) => String(i + 1).padStart(2, "0");
const clamp = (x: number, a: number, b: number) => (x < a ? a : x > b ? b : x);
const clamp01 = (x: number) => clamp(x, 0, 1);
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// Every card's deliberate place in the room — winding through depth, side to
// side, up and down, each angled to face the path the camera walks. No grid,
// no symmetry, no line.
const CARDS = [
  { z: -1000, x: -540, y: 40, ry: 27, rx: -2 },
  { z: -2200, x: 560, y: -150, ry: -29, rx: 3 },
  { z: -3400, x: -610, y: 150, ry: 28, rx: -3 },
  { z: -4600, x: 500, y: -50, ry: -25, rx: 2 },
  { z: -5800, x: -430, y: -180, ry: 22, rx: 4 },
  { z: -7000, x: 640, y: 130, ry: -30, rx: -3 },
  { z: -8200, x: -560, y: -30, ry: 26, rx: 2 },
  { z: -9400, x: 470, y: 175, ry: -23, rx: 3 },
];
const CAM_START = 360;
const CAM_END = CARDS[N - 1].z + 560; // rest facing the last exhibit
const CAM_TRAVEL = CAM_START - CAM_END;
const focusScroll = (i: number) => clamp01((CAM_START - (CARDS[i].z + 560)) / CAM_TRAVEL);

export function Faq() {
  const reduced = useReducedMotion();
  const mobile = useIsMobile();
  if (mobile || reduced) return <FaqStacked />;
  return <FaqGallery />;
}

function FaqGallery() {
  const sectionRef = useRef<HTMLElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const ansRefs = useRef<(HTMLDivElement | null)[]>([]);
  const { scrollTo } = useLenis();
  const camX = useRef(0);
  const camY = useRef(0);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const sect = sectionRef.current;
      const world = worldRef.current;
      if (sect && world) {
        const vh = window.innerHeight;
        const range = sect.offsetHeight - vh;
        const p = range > 0 ? clamp01(-sect.getBoundingClientRect().top / range) : 0;
        const t = performance.now() / 1000;
        const camZ = CAM_START - p * CAM_TRAVEL;

        // the camera eases toward whichever exhibit it is approaching, so it
        // curves through the room and the composition keeps changing
        let nearest = 0;
        let best = Infinity;
        for (let i = 0; i < N; i += 1) {
          const rel = CARDS[i].z - camZ;
          if (rel < -80) {
            const dist = -rel;
            if (dist < best) { best = dist; nearest = i; }
          }
        }
        const approach = smoothstep(2600, 700, best);
        const tgtX = CARDS[nearest].x * 0.28 * approach + Math.sin(t * 0.11) * 26;
        const tgtY = CARDS[nearest].y * 0.16 * approach + Math.sin(t * 0.09) * 16;
        camX.current += (tgtX - camX.current) * 0.05;
        camY.current += (tgtY - camY.current) * 0.05;

        world.style.transform = `translate3d(${(-camX.current).toFixed(1)}px, ${(-camY.current).toFixed(1)}px, ${(-camZ).toFixed(1)}px)`;

        for (let i = 0; i < N; i += 1) {
          const el = cardRefs.current[i];
          if (!el) continue;
          const c = CARDS[i];
          const rel = c.z - camZ; // <0 in front of the camera
          const dist = -rel;
          // it exists in the world: distant exhibits stay faintly visible; only
          // pieces behind the camera or far past the room drop away
          let op = 0;
          if (rel < -70 && dist < 10500) {
            op = 0.14 + 0.86 * smoothstep(4600, 720, dist);
            op *= smoothstep(-70, -420, rel);        // ease out as it passes behind
            op *= 1 - smoothstep(8600, 10200, dist); // ease out at the far wall
          }
          const near = smoothstep(1700, 540, dist);
          // gentle life, and a subtle turn to face the viewer only when near
          const floatY = Math.sin(t * 0.42 + i * 1.6) * 9 * (1 - near * 0.7);
          const ryDyn = c.ry * (1 - 0.62 * near);
          el.style.opacity = op.toFixed(3);
          el.style.visibility = op < 0.004 ? "hidden" : "visible";
          el.style.transform = `translate(-50%, -50%) translate3d(${c.x}px, ${(c.y + floatY).toFixed(1)}px, ${c.z}px) rotateY(${ryDyn.toFixed(2)}deg) rotateX(${c.rx}deg)`;
          el.style.pointerEvents = i === nearest && near > 0.4 ? "auto" : "none";

          const ans = ansRefs.current[i];
          if (ans) {
            const fo = i === nearest ? smoothstep(1500, 620, dist) : 0;
            const av = smoothstep(0.5, 0.92, fo);
            ans.style.opacity = av.toFixed(3);
            ans.style.maxHeight = `${(av * 44).toFixed(1)}vh`;
          }
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
    scrollTo(sect.offsetTop + focusScroll(i) * range, { duration: 1.5 });
  };

  return (
    <section
      id="faq"
      ref={sectionRef}
      className="relative border-t border-line bg-ink"
      style={{ height: `${N * 92 + 80}vh` }}
    >
      <div className="sticky top-0 h-screen overflow-hidden" style={{ perspective: "1500px", perspectiveOrigin: "50% 45%" }}>
        {/* the gallery air — deep charcoal, a soft ambient pool of light, and a
            vignette that sinks the room into the dark at its edges */}
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(120% 90% at 50% 42%, #0c0d11 0%, #070708 55%, #050506 100%)" }} />
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2" style={{ width: "130vh", height: "130vh", background: "radial-gradient(circle, rgba(150,178,255,0.06) 0%, rgba(120,150,225,0.025) 36%, transparent 66%)" }} />

        {/* the exhibition — a world the camera travels through */}
        <div ref={worldRef} className="absolute left-1/2 top-1/2 h-0 w-0" style={{ transformStyle: "preserve-3d", willChange: "transform" }}>
          {FAQS.map((f, i) => (
            <div
              key={f.q}
              ref={(el) => { cardRefs.current[i] = el; }}
              onClick={() => goTo(i)}
              data-cursor="hover"
              className="absolute left-0 top-0 w-[33rem] max-w-[86vw] cursor-pointer rounded-[1.5rem] border border-white/10 px-10 py-9 will-change-transform"
              style={{
                opacity: 0,
                transformStyle: "preserve-3d",
                // a dark charcoal satin body with a faint top sheen — a designed
                // object that reads cleanly over the depth behind it, not clear glass
                background: "linear-gradient(152deg, rgba(32,35,45,0.72) 0%, rgba(17,19,25,0.6) 55%, rgba(25,28,38,0.68) 100%)",
                boxShadow: "0 48px 100px -34px rgba(0,0,0,0.92), inset 0 1px 0 rgba(255,255,255,0.11), inset 0 0 46px rgba(120,150,225,0.035)",
              }}
            >
              <div className="mb-5 flex items-center gap-4">
                <span className="font-display text-xs font-semibold tracking-[0.3em] text-accent-bright">{two(i)}</span>
                <span className="h-px flex-1 bg-white/10" />
                <span className="text-[0.62rem] tracking-[0.3em] text-paper-faint">{String(N).padStart(2, "0")}</span>
              </div>
              <h3 className="font-display text-[clamp(1.5rem,2.1vw,2.15rem)] font-bold leading-[1.13] tracking-[-0.02em] text-paper">
                {f.q}
              </h3>
              <div ref={(el) => { ansRefs.current[i] = el; }} className="overflow-hidden" style={{ opacity: 0, maxHeight: 0 }}>
                <p className="mt-6 max-w-2xl text-[0.95rem] leading-relaxed text-paper-dim">{f.a}</p>
              </div>
            </div>
          ))}
        </div>

        {/* vignette + the quiet section label, in screen space over the room */}
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(135% 105% at 50% 46%, transparent 44%, rgba(0,0,0,0.9))" }} />
        <div className="pointer-events-none absolute inset-x-0 top-[7vh] flex flex-col items-center text-center">
          <div className="mb-4 flex items-center gap-4">
            <span className="h-px w-12 bg-accent" />
            <span className="text-eyebrow text-paper-dim">Common questions</span>
          </div>
          <p className="text-eyebrow text-paper-faint">Walk through &darr;</p>
        </div>
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
