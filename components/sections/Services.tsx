"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, type RefObject } from "react";
import { useReducedMotion, useScroll, type MotionValue } from "framer-motion";
import { SERVICES } from "@/lib/data";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { ServiceCard, ICONS } from "@/components/ui/ServiceCard";

const LightHelixCanvas = dynamic(() => import("@/components/canvas/LightHelixCanvas"), {
  ssr: false,
});

export function Services() {
  const reduced = useReducedMotion();
  const mobile = useIsMobile();
  if (mobile || reduced) return <ServicesCarousel showHelix={!reduced} />;
  return <ServicesExhibition />;
}

/* ==================================================================== *
 * Desktop: a cinematic exhibition. The user travels down a thin Light
 * Helix; each service is a chapter that rises out of darkness, holds
 * the whole screen with large editorial type, then falls away before
 * the next one appears. The words are the hero — the helix only guides
 * the eye, brightening for the active chapter and fading everywhere else.
 * ==================================================================== */
const N = SERVICES.length;
const C0 = 0.13; // first chapter centre (leaves room for the intro)
const C1 = 0.9; // last chapter centre
const SLOT = (C1 - C0) / N;

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
function smoothstep(a: number, b: number, x: number) {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}
// a chapter's presence: full in the middle of its slot, gone at the edges,
// with a beat of darkness between chapters so only one is ever on screen
function presence(p: number, i: number) {
  const centre = C0 + (i + 0.5) * SLOT;
  const u = Math.abs(p - centre) / SLOT; // 0 at centre, 0.5 at slot edge
  return 1 - smoothstep(0.32, 0.46, u);
}

function ServicesExhibition() {
  const sectionRef = useRef<HTMLElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const chapters = useRef<(HTMLDivElement | null)[]>([]);
  const activity = useRef(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const p = scrollYProgress.get();
      let maxV = 0;
      for (let i = 0; i < N; i += 1) {
        const v = presence(p, i);
        if (v > maxV) maxV = v;
        const el = chapters.current[i];
        if (el) {
          const centre = C0 + (i + 0.5) * SLOT;
          const u = (p - centre) / SLOT; // signed position within the slot
          const ty = -u * 70; // words drift gently upward as the eye passes
          const scale = 0.968 + 0.032 * v;
          el.style.opacity = v.toFixed(3);
          el.style.filter = `blur(${((1 - v) * 4).toFixed(2)}px)`;
          el.style.transform = `translate3d(0, ${ty.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
          el.style.pointerEvents = v > 0.6 ? "auto" : "none";
        }
      }
      activity.current = maxV;
      if (glowRef.current) glowRef.current.style.opacity = (maxV * 0.9).toFixed(3);
      if (introRef.current) {
        const io = 1 - smoothstep(0.03, 0.085, p);
        introRef.current.style.opacity = io.toFixed(3);
        introRef.current.style.transform = `translateY(${(-40 * smoothstep(0, 0.09, p)).toFixed(1)}px)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [scrollYProgress]);

  const glow = useRef({ get: () => activity.current }).current;

  return (
    <section
      id="services"
      ref={sectionRef}
      className="relative border-t border-line bg-ink"
      style={{ height: `${N * 118 + 60}vh` }}
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* the guiding thread of light */}
        <LightHelixCanvas eventSource={sectionRef} scroll={scrollYProgress} glow={glow} />

        {/* the pool of light that lifts the active chapter out of the dark */}
        <div
          ref={glowRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0"
          style={{
            background:
              "radial-gradient(46% 42% at 34% 48%, rgba(96,132,224,0.16), transparent 72%)",
          }}
        />

        {/* intro — the entrance to the exhibition */}
        <div ref={introRef} className="pointer-events-none absolute inset-0 flex items-center section-x">
          <div className="max-w-2xl">
            <div className="mb-6 flex items-center gap-4">
              <span className="h-px w-12 bg-accent" />
              <span className="text-eyebrow text-paper-dim">What we do</span>
            </div>
            <h2 className="font-display text-[clamp(2.4rem,6vw,4.5rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-paper">
              Everything your business needs to stand out online.
            </h2>
            <p className="mt-8 text-eyebrow text-paper-faint">Scroll to travel the exhibition &darr;</p>
          </div>
        </div>

        {/* the chapters — one dominates at a time */}
        {SERVICES.map((service, i) => (
          <Chapter
            key={service.index}
            ref={(el) => {
              chapters.current[i] = el;
            }}
            service={service}
          />
        ))}

        {/* an ultra-quiet chapter index, bottom-left */}
        <ChapterIndex progress={scrollYProgress} />
      </div>
    </section>
  );
}

function Chapter({
  service,
  ref,
}: {
  service: (typeof SERVICES)[number];
  ref: RefObject<HTMLDivElement | null> | ((el: HTMLDivElement | null) => void);
}) {
  return (
    <div
      ref={ref}
      className="absolute inset-0 flex items-center opacity-0 section-x will-change-[opacity,transform,filter]"
    >
      <div className="max-w-3xl">
        <div className="mb-7 flex items-center gap-4">
          <span className="font-display text-sm font-semibold tracking-[0.1em] text-accent-bright">
            {service.index}
          </span>
          <span className="h-px w-10 bg-line-strong" />
          <span className="text-eyebrow text-paper-faint">
            {service.index} / {String(N).padStart(2, "0")}
          </span>
        </div>

        <h3 className="font-display text-[clamp(2.9rem,8vw,6.5rem)] font-extrabold leading-[0.96] tracking-[-0.035em] text-paper">
          {service.title}
        </h3>

        <p className="mt-9 max-w-md text-base leading-relaxed text-paper-dim">
          {service.summary}
        </p>

        <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
          {service.tags.map((t) => (
            <span key={t} className="text-[11px] uppercase tracking-[0.24em] text-paper-faint">
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/** A whisper-quiet current-chapter marker — orientation without clutter. */
function ChapterIndex({ progress }: { progress: MotionValue<number> }) {
  const rails = useRef<(HTMLSpanElement | null)[]>([]);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const p = progress.get();
      for (let i = 0; i < N; i += 1) {
        const el = rails.current[i];
        if (el) el.style.opacity = (0.16 + presence(p, i) * 0.84).toFixed(3);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [progress]);

  return (
    <div className="pointer-events-none absolute bottom-10 left-[max(1.5rem,5vw)] flex items-center gap-2.5">
      {SERVICES.map((s, i) => (
        <span
          key={s.index}
          ref={(el) => {
            rails.current[i] = el;
          }}
          className="h-[2px] w-7 rounded-full bg-paper opacity-20"
        />
      ))}
    </div>
  );
}

/* --------------------- mobile: horizontal carousel --------------------- */
function ServicesCarousel({ showHelix }: { showHelix: boolean }) {
  const ref = useRef<HTMLElement>(null);
  return (
    <section id="services" ref={ref} className="relative overflow-hidden border-t border-line py-24">
      {showHelix && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[52vh] opacity-50"
          style={{
            WebkitMaskImage: "radial-gradient(70% 60% at 50% 25%, #000 25%, transparent 78%)",
            maskImage: "radial-gradient(70% 60% at 50% 25%, #000 25%, transparent 78%)",
          }}
        >
          <LightHelixCanvas eventSource={ref} />
        </div>
      )}
      <div className="relative section-x">
        <div className="mb-5 flex items-center gap-4">
          <span className="h-px w-12 bg-accent" />
          <span className="text-eyebrow text-paper-dim">What we do</span>
        </div>
        <h2 className="max-w-lg font-display text-3xl font-extrabold leading-[1.06] tracking-[-0.02em] text-paper md:text-4xl">
          Everything your business needs to stand out online.
        </h2>
      </div>
      <div className="relative mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-[max(1.25rem,5vw)] pb-6 [scrollbar-width:none]">
        {SERVICES.map((service, i) => (
          <div key={service.index} className="w-[82%] shrink-0 snap-center sm:w-[60%]">
            <ServiceCard
              icon={ICONS[i]}
              label={service.index}
              title={service.title}
              body={service.summary}
              features={service.tags}
              forceOpen
            />
          </div>
        ))}
      </div>
    </section>
  );
}
