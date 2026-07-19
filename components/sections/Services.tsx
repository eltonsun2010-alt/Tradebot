"use client";

import dynamic from "next/dynamic";
import { useRef, useState, type MouseEvent, type ReactNode } from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { SERVICES } from "@/lib/data";
import { useIsMobile, useIsTouch } from "@/hooks/useMediaQuery";

const LightHelixCanvas = dynamic(() => import("@/components/canvas/LightHelixCanvas"), {
  ssr: false,
});

const ICONS: ReactNode[] = [
  <path key="a" d="M4 20l4-1L20 7a2 2 0 0 0-3-3L5 16l-1 4zM14 6l3 3" />,
  <path key="b" d="M8 8l-4 4 4 4M16 8l4 4-4 4M13 5l-2 14" />,
  <>
    <circle key="c1" cx="12" cy="12" r="3" />
    <path key="c2" d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" />
  </>,
  <path key="d" d="M4 12a8 8 0 0 1 13.7-5.6L20 8M20 4v4h-4M20 12a8 8 0 0 1-13.7 5.6L4 16M4 20v-4h4" />,
  <>
    <circle key="e1" cx="12" cy="12" r="9" />
    <circle key="e2" cx="12" cy="12" r="3.5" />
    <path key="e3" d="M4.9 4.9l4.6 4.6M14.5 14.5l4.6 4.6M19.1 4.9l-4.6 4.6M9.5 14.5l-4.6 4.6" />
  </>,
];

export function Services() {
  const reduced = useReducedMotion();
  const mobile = useIsMobile();
  if (mobile || reduced) return <ServicesCarousel showHelix={!reduced} />;
  return <ServicesJourney />;
}

/* ==================================================================== *
 * Desktop: a scroll-driven journey DOWN a continuous Light Helix.
 * The camera travels down the endlessly-twisting helix as you scroll;
 * each service is a landmark fixed further along it — it emerges from
 * below, rises to the centre where it enlarges, brightens and opens,
 * then drifts away as the next one appears. Only one is ever in focus.
 * ==================================================================== */
const N = SERVICES.length;
const M0 = 0.15; // first landmark
const MSTEP = 0.175; // spacing between landmarks (last ≈ 0.85)
const FOCUS_SHARP = 10; // how quickly focus falls off away from the camera
// Each card is a stationary object bolted to a fixed point on the helix curve.
// Its angle along the path fixes its on-screen offset once; nothing about its
// position animates. The camera (scroll) is what travels — a card is simply
// discovered (faded in) as the camera reaches its point on the path.
const ANG_RATE = Math.PI * 2 * 2.4; // helix turns across the whole journey
const R_CARD = 96; // fixed off-axis offset (kept small → readable)

function ServicesJourney() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // drives the helix travel — the camera moving down the strand IS the animation
  const helixScroll = useTransform(scrollYProgress, (p) => p * 2.6);
  // intro heading fades out once the journey begins
  const introOpacity = useTransform(scrollYProgress, [0, 0.06, 0.12], [1, 1, 0]);
  const introY = useTransform(scrollYProgress, [0, 0.12], [0, -40]);

  return (
    <section
      id="services"
      ref={sectionRef}
      className="relative border-t border-line"
      style={{ height: `${N * 100 + 60}vh` }}
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* The endless helix — the road */}
        <div
          className="absolute inset-0"
          style={{
            WebkitMaskImage: "linear-gradient(to bottom, transparent, #000 16%, #000 84%, transparent)",
            maskImage: "linear-gradient(to bottom, transparent, #000 16%, #000 84%, transparent)",
          }}
        >
          <LightHelixCanvas eventSource={sectionRef} scroll={helixScroll} />
        </div>

        {/* Intro heading — the top of the helix, before the first landmark */}
        <motion.div style={{ opacity: introOpacity, y: introY }} className="absolute inset-x-0 top-0 z-40 section-x pt-28">
          <div className="mb-5 flex items-center gap-4">
            <span className="h-px w-12 bg-accent" />
            <span className="text-eyebrow text-paper-dim">What we do</span>
          </div>
          <h2 className="max-w-lg font-display text-3xl font-extrabold leading-[1.06] tracking-[-0.02em] text-paper md:text-4xl">
            Everything your business needs to stand out online.
          </h2>
          <p className="mt-6 text-sm text-paper-faint">Scroll to travel the helix &darr;</p>
        </motion.div>

        {/* Landmarks along the helix */}
        <div className="absolute inset-0 [perspective:1000px]">
          <div className="relative h-full [transform-style:preserve-3d]">
            {SERVICES.map((service, i) => (
              <JourneyCard
                key={service.index}
                milestone={M0 + i * MSTEP}
                progress={scrollYProgress}
                baseAngle={(i / N) * Math.PI * 2}
                icon={ICONS[i]}
                label={service.index}
                title={service.title}
                body={service.summary}
                features={service.tags}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function JourneyCard({
  milestone,
  progress,
  baseAngle,
  icon,
  label,
  title,
  body,
  features,
}: {
  milestone: number;
  progress: MotionValue<number>;
  baseAngle: number;
  icon: ReactNode;
  label: string;
  title: string;
  body: string;
  features: readonly string[];
}) {
  const [focused, setFocused] = useState(false);

  const focusOf = (p: number) => {
    const rel = milestone - p;
    return Math.exp(-Math.pow(rel * FOCUS_SHARP, 2));
  };

  useMotionValueEvent(progress, "change", (p) => {
    setFocused(focusOf(p) > 0.55);
  });

  // Fixed point on the helix curve — computed ONCE, never animated.
  const A = milestone * ANG_RATE + baseAngle;
  const X = Math.cos(A) * R_CARD;
  const yawBase = Math.sin(A) * 12; // facing inherited from the path (constant)

  // No translation. The card holds its position; only opacity, a whisper of
  // scale, and a slight tilt (from the camera's position relative to it) change.
  const transform = useTransform(progress, (p) => {
    const rel = milestone - p; // where the camera is relative to this fixed card
    const f = Math.exp(-Math.pow(rel * FOCUS_SHARP, 2));
    const pitch = rel * 10; // slight rotation adjustment as the camera passes
    const s = 0.965 + 0.05 * f; // very subtle scale
    return `translate(-50%, -50%) translateX(${X.toFixed(1)}px) rotateY(${yawBase.toFixed(2)}deg) rotateX(${pitch.toFixed(2)}deg) scale(${s.toFixed(3)})`;
  });

  const opacity = useTransform(progress, (p) => Math.min(1, focusOf(p) * 1.25));
  const pointerEvents = useTransform(progress, (p) =>
    focusOf(p) > 0.6 ? "auto" : "none"
  ) as unknown as MotionValue<"auto" | "none">;

  return (
    <motion.div
      style={{ transform, opacity, pointerEvents }}
      className="absolute left-1/2 top-1/2 w-[320px]"
    >
      <ServiceCard icon={icon} label={label} title={title} body={body} features={features} forceOpen={focused} />
    </motion.div>
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

/* ------------------------------ the card ------------------------------ */
function Header({ icon, label, open }: { icon: ReactNode; label: string; open: boolean }) {
  return (
    <div className="flex items-start justify-between">
      <motion.span
        animate={{ scale: open ? 1.04 : 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 24 }}
        className="grid h-12 w-12 place-items-center rounded-xl border transition-colors duration-300"
        style={{
          background: open ? "rgba(120,170,255,0.14)" : "rgba(255,255,255,0.06)",
          borderColor: open ? "rgba(150,190,255,0.3)" : "rgba(255,255,255,0.1)",
        }}
      >
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={open ? "#a9c8ff" : "#c3ccda"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          {icon}
        </svg>
      </motion.span>
      <span className="font-display text-2xl font-semibold text-white/25">{label}</span>
    </div>
  );
}

function ServiceCard({
  icon,
  label,
  title,
  body,
  features,
  forceOpen = false,
}: {
  icon: ReactNode;
  label: string;
  title: string;
  body: string;
  features: readonly string[];
  forceOpen?: boolean;
}) {
  const touch = useIsTouch();
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const open = touch || hover || forceOpen;

  const onMove = (e: MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  const spring = { type: "spring" as const, stiffness: 260, damping: 30 };

  return (
    <div className="relative">
      <div aria-hidden className="invisible p-7">
        <Header icon={icon} label={label} open={false} />
        <h3 className="mt-7 font-display text-[1.35rem] font-medium">{title}</h3>
      </div>

      <motion.article
        ref={ref}
        onMouseMove={touch ? undefined : onMove}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        data-cursor="hover"
        className="absolute inset-x-0 top-0 overflow-hidden rounded-[2rem] p-7 transition-shadow duration-500"
        style={{
          // real frosted-glass slab: translucent body + heavy blur, and the
          // "edges" are made of light (inset highlights), not a drawn border.
          background: "linear-gradient(157deg, rgba(255,255,255,0.11), rgba(255,255,255,0.035) 60%, rgba(255,255,255,0.06))",
          backdropFilter: "blur(28px) saturate(150%) brightness(1.04)",
          WebkitBackdropFilter: "blur(28px) saturate(150%) brightness(1.04)",
          boxShadow: open
            ? "0 70px 130px -60px rgba(0,0,0,0.92), inset 0 1.5px 1px rgba(255,255,255,0.4), inset 0 0 0 1px rgba(255,255,255,0.09), inset 0 -30px 60px -40px rgba(180,205,255,0.14)"
            : "0 44px 100px -60px rgba(0,0,0,0.85), inset 0 1.5px 1px rgba(255,255,255,0.28), inset 0 0 0 1px rgba(255,255,255,0.06)",
        }}
      >
        {/* broad soft top reflection (light pooling on the glass) */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-1/4 h-2/3 bg-gradient-to-b from-white/[0.10] to-transparent" />
        {/* faint diagonal specular streak, like light raking across glass */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: "linear-gradient(118deg, transparent 34%, rgba(255,255,255,0.06) 47%, transparent 58%)" }}
        />
        {/* soft light following the cursor */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={{
            opacity: hover ? 1 : 0,
            background: "radial-gradient(320px circle at var(--mx) var(--my), rgba(255,255,255,0.10), transparent 60%)",
          }}
        />

        <div className="relative">
          <Header icon={icon} label={label} open={open} />
          <h3 className="mt-7 font-display text-[1.35rem] font-medium tracking-[-0.01em] text-white">{title}</h3>

          <motion.div
            initial={false}
            animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
            transition={spring}
            className="overflow-hidden"
          >
            <p className="pt-4 text-[0.82rem] leading-relaxed text-white/55">{body}</p>
            <ul className="mt-5 space-y-2.5">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-3 text-[0.82rem] text-white/80">
                  <span className="h-1 w-1 rounded-full bg-white/50" />
                  {f}
                </li>
              ))}
            </ul>
            <span className="mt-6 inline-flex items-center gap-2 text-[0.8rem] font-medium text-white/70">
              Learn more <span aria-hidden className="text-white/40">&rarr;</span>
            </span>
          </motion.div>
        </div>
      </motion.article>
    </div>
  );
}
