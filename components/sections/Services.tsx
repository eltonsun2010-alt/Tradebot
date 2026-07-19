"use client";

import { useEffect, useMemo, useRef } from "react";
import { useReducedMotion, useScroll } from "framer-motion";
import { SERVICES } from "@/lib/data";
import { useIsMobile } from "@/hooks/useMediaQuery";

/* ==================================================================== *
 * The Light Corridor.
 *
 * The visitor floats slowly forward through an open architecture of
 * light — thin illuminated beams drifting in infinite black. There are
 * no walls. Every so often the corridor opens: a pair of beams separates
 * and an editorial glass panel is revealed between them, one service at
 * a time, before the architecture closes again and the next installation
 * emerges from the dark. Calm, weightless, cinematic.
 * ==================================================================== */

export function Services() {
  const reduced = useReducedMotion();
  const mobile = useIsMobile();
  if (mobile || reduced) return <CorridorStacked />;
  return <LightCorridor />;
}

const N = SERVICES.length;
const PERSPECTIVE = 1500;
const GAP_Z = 2600; // spacing between installations
const LEAD = 2200; // empty corridor before the first
const TAIL = 2400; // and after the last
const TOTAL_Z = LEAD + (N - 1) * GAP_Z + TAIL;
const serviceZ = (i: number) => -(LEAD + i * GAP_Z);

const clamp = (x: number, a: number, b: number) => (x < a ? a : x > b ? b : x);
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

type Beam = { x: number; y: number; z: number; h: number; w: number; hue: number };

function LightCorridor() {
  const sectionRef = useRef<HTMLElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const beamsRef = useRef<(HTMLDivElement | null)[]>([]);
  const gateL = useRef<(HTMLDivElement | null)[]>([]);
  const gateR = useRef<(HTMLDivElement | null)[]>([]);
  const panels = useRef<(HTMLDivElement | null)[]>([]);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // a calm, non-repeating scatter of drifting beams down the corridor
  const beams = useMemo<Beam[]>(() => {
    let s = 20260119;
    const rnd = () => {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    };
    const arr: Beam[] = [];
    const count = 26;
    for (let k = 0; k < count; k += 1) {
      const side = k % 2 === 0 ? -1 : 1;
      let z = -((k + 0.5) * (TOTAL_Z / count)) + (rnd() - 0.5) * 360;
      // keep the corridor lights clear of the installations behind the panels
      for (let i = 0; i < N; i += 1) {
        if (Math.abs(z - serviceZ(i)) < 780) z += z < serviceZ(i) ? -820 : 820;
      }
      arr.push({
        x: side * (150 + rnd() * 300),
        y: (rnd() - 0.5) * 150,
        z,
        h: 42 + rnd() * 40, // vh
        w: 2 + rnd() * 1.6,
        hue: rnd(),
      });
    }
    return arr;
  }, []);

  useEffect(() => {
    let raf = 0;
    let camZ = 0;
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e: PointerEvent) => {
      mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove);

    const tick = () => {
      const p = scrollYProgress.get();
      const target = p * TOTAL_Z;
      // inertia — slow, expensive glide
      camZ += (target - camZ) * 0.055;
      const t = performance.now() / 1000;

      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;
      const rotY = mouse.x * 1.6 + Math.sin(t * 0.08) * 0.5;
      const rotX = -mouse.y * 1.0 + Math.sin(t * 0.06) * 0.3;

      if (worldRef.current) {
        worldRef.current.style.transform = `translateZ(${camZ.toFixed(1)}px) rotateY(${rotY.toFixed(3)}deg) rotateX(${rotX.toFixed(3)}deg)`;
      }

      // drifting beams — emerge from the dark, glide past, fade away
      for (let k = 0; k < beams.length; k += 1) {
        const el = beamsRef.current[k];
        if (!el) continue;
        const b = beams[k];
        const d = b.z + camZ;
        const o = smoothstep(-3400, -1500, d) * (1 - smoothstep(150, 650, d));
        el.style.opacity = (o * 0.6).toFixed(3);
        const sway = Math.sin(t * 0.14 + k) * 6;
        el.style.transform = `translate(-50%, -50%) translate3d(${(b.x + sway).toFixed(1)}px, ${b.y.toFixed(1)}px, ${b.z.toFixed(1)}px)`;
      }

      // installations — the corridor opens to present each one
      let activity = 0;
      for (let i = 0; i < N; i += 1) {
        const d = serviceZ(i) + camZ; // <0 ahead, 0 = centred, >0 passed
        const sep = smoothstep(-1500, -120, d);
        const reveal = smoothstep(-1250, -260, d) * (1 - smoothstep(140, 360, d));
        // the gates emerge with their own installation and are hidden until then,
        // so a distant installation never bleeds light through the active panel
        const gateO = smoothstep(-1950, -1150, d) * (1 - smoothstep(220, 620, d));
        activity = Math.max(activity, reveal);
        const gap = 70 + sep * 300;
        const drift = Math.sin(t * 0.12 + i * 2) * 5;
        const gl = gateL.current[i];
        const gr = gateR.current[i];
        const pn = panels.current[i];
        if (gl) {
          gl.style.opacity = gateO.toFixed(3);
          gl.style.transform = `translate(-50%, -50%) translate3d(${(-gap).toFixed(1)}px, ${drift.toFixed(1)}px, ${serviceZ(i)}px)`;
        }
        if (gr) {
          gr.style.opacity = gateO.toFixed(3);
          gr.style.transform = `translate(-50%, -50%) translate3d(${gap.toFixed(1)}px, ${(-drift).toFixed(1)}px, ${serviceZ(i)}px)`;
        }
        if (pn) {
          pn.style.opacity = reveal.toFixed(3);
          pn.style.filter = `blur(${((1 - reveal) * 4).toFixed(2)}px)`;
          pn.style.transform = `translate(-50%, -50%) translate3d(0px, ${(drift * 0.6).toFixed(1)}px, ${serviceZ(i) + 140}px)`;
          pn.style.pointerEvents = reveal > 0.7 ? "auto" : "none";
        }
      }

      if (glowRef.current) glowRef.current.style.opacity = (0.22 + activity * 0.6).toFixed(3);
      if (introRef.current) {
        const io = 1 - smoothstep(0.015, 0.07, p);
        introRef.current.style.opacity = io.toFixed(3);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, [scrollYProgress, beams]);

  return (
    <section
      id="services"
      ref={sectionRef}
      className="relative border-t border-line bg-ink"
      style={{ height: `${N * 108 + 90}vh` }}
    >
      <div className="sticky top-0 h-screen overflow-hidden bg-ink">
        {/* soft volumetric light on centre stage + a deep vignette */}
        <div
          ref={glowRef}
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(40% 46% at 50% 48%, rgba(150,180,255,0.12), transparent 70%), radial-gradient(24% 30% at 50% 46%, rgba(255,255,255,0.06), transparent 70%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(120% 95% at 50% 48%, transparent 46%, rgba(0,0,0,0.82))" }}
        />

        {/* the corridor, in real 3D */}
        <div className="absolute inset-0" style={{ perspective: `${PERSPECTIVE}px` }}>
          <div ref={worldRef} className="relative h-full w-full [transform-style:preserve-3d]">
            {beams.map((b, k) => (
              <div
                key={`beam-${k}`}
                ref={(el) => {
                  beamsRef.current[k] = el;
                }}
                className="absolute left-1/2 top-1/2 opacity-0"
              >
                <BeamGlyph h={b.h} w={b.w} hue={b.hue} />
              </div>
            ))}

            {SERVICES.map((service, i) => (
              <div key={service.index} className="contents">
                <div
                  ref={(el) => {
                    gateL.current[i] = el;
                  }}
                  className="absolute left-1/2 top-1/2 opacity-0"
                >
                  <BeamGlyph h={78} w={3.2} hue={0.5} gate />
                </div>
                <div
                  ref={(el) => {
                    gateR.current[i] = el;
                  }}
                  className="absolute left-1/2 top-1/2 opacity-0"
                >
                  <BeamGlyph h={78} w={3.2} hue={0.5} gate />
                </div>
                <div
                  ref={(el) => {
                    panels.current[i] = el;
                  }}
                  className="absolute left-1/2 top-1/2 opacity-0 will-change-[opacity,transform,filter]"
                >
                  <Panel index={service.index} title={service.title} body={service.summary} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* the entrance label */}
        <div ref={introRef} className="pointer-events-none absolute inset-x-0 top-24 flex flex-col items-center text-center section-x">
          <div className="mb-5 flex items-center gap-4">
            <span className="h-px w-12 bg-accent" />
            <span className="text-eyebrow text-paper-dim">What we do</span>
          </div>
          <h2 className="max-w-2xl font-display text-[clamp(2rem,4vw,3.2rem)] font-extrabold leading-[1.05] tracking-[-0.02em] text-paper">
            Every service, a light installation.
          </h2>
          <p className="mt-6 text-eyebrow text-paper-faint">Float through the corridor &darr;</p>
        </div>
      </div>
    </section>
  );
}

/** A single beam of light — a bright core wrapped in a soft volumetric glow. */
function BeamGlyph({ h, w, hue, gate = false }: { h: number; w: number; hue: number; gate?: boolean }) {
  const tint = hue > 0.6 ? "rgba(200,216,255," : "rgba(255,255,255,";
  return (
    <div className="relative" style={{ height: `${h}vh`, width: `${w}px` }}>
      {/* wide soft glow — the volumetric halo */}
      <div
        aria-hidden
        className="absolute left-1/2 top-0 h-full -translate-x-1/2"
        style={{
          width: `${w * (gate ? 26 : 20)}px`,
          background: `linear-gradient(to bottom, transparent, ${tint}${gate ? 0.14 : 0.09}) 20%, ${tint}${gate ? 0.14 : 0.09}) 80%, transparent)`,
          filter: "blur(13px)",
        }}
      />
      {/* soft core */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `linear-gradient(to bottom, transparent, ${tint}${gate ? 0.8 : 0.55}) 18%, ${tint}${gate ? 0.8 : 0.55}) 82%, transparent)`,
          boxShadow: `0 0 ${gate ? 26 : 18}px ${tint}${gate ? 0.5 : 0.3})`,
        }}
      />
    </div>
  );
}

/** A floating editorial glass panel — a luxury exhibit, not a UI card. */
function Panel({ index, title, body }: { index: string; title: string; body: string }) {
  return (
    <article
      className="relative overflow-hidden"
      style={{
        width: "min(34rem, 82vw)",
        borderRadius: "1.6rem",
        padding: "2.85rem 2.7rem",
        border: "1px solid rgba(255,255,255,0.16)",
        background:
          "linear-gradient(158deg, rgba(20,24,34,0.52), rgba(12,15,22,0.42) 55%, rgba(32,44,74,0.44))",
        backdropFilter: "blur(24px) saturate(150%)",
        WebkitBackdropFilter: "blur(24px) saturate(150%)",
        boxShadow:
          "0 60px 120px -60px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.28), inset 0 0 50px -20px rgba(170,200,255,0.2)",
      }}
    >
      {/* soft top reflection */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-1/3 h-2/3 bg-gradient-to-b from-white/[0.10] to-transparent" />

      <span className="relative block font-display text-xs font-semibold tracking-[0.28em] text-accent-bright">
        {index}
      </span>
      <h3 className="relative mt-6 font-display text-[clamp(1.85rem,3vw,2.45rem)] font-extrabold leading-[1.04] tracking-[-0.03em] text-white">
        {title}
      </h3>
      <p className="relative mt-6 max-w-sm text-[0.92rem] leading-relaxed text-white/60">{body}</p>
      <a
        href="#contact"
        className="relative mt-9 inline-flex items-center gap-2 text-sm font-medium text-white/85 transition-colors hover:text-white"
      >
        Explore the service
        <span aria-hidden className="text-accent-bright">&rarr;</span>
      </a>
    </article>
  );
}

/* --------------- mobile / reduced motion: a calm editorial list --------------- */
function CorridorStacked() {
  return (
    <section id="services" className="relative border-t border-line bg-ink py-24 section-x">
      <div className="mb-16 text-center">
        <div className="mb-5 flex items-center justify-center gap-4">
          <span className="h-px w-12 bg-accent" />
          <span className="text-eyebrow text-paper-dim">What we do</span>
        </div>
        <h2 className="mx-auto max-w-md font-display text-3xl font-extrabold leading-[1.05] tracking-[-0.02em] text-paper">
          Every service, a light installation.
        </h2>
      </div>
      <div className="mx-auto flex max-w-lg flex-col gap-14">
        {SERVICES.map((service) => (
          <div key={service.index} className="text-center">
            <span className="font-display text-xs font-semibold tracking-[0.28em] text-accent-bright">
              {service.index}
            </span>
            <h3 className="mt-4 font-display text-[2rem] font-extrabold leading-[1.05] tracking-[-0.03em] text-paper">
              {service.title}
            </h3>
            <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-paper-dim">{service.summary}</p>
            <a href="#contact" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-accent-bright">
              Explore the service <span aria-hidden>&rarr;</span>
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
