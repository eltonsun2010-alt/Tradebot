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
const FOCUS_SHARP = 8; // how gradually a card resolves as the camera nears it

// A corridor fly-through. Each card is a STATIONARY object at a fixed point deep
// in the spiral (constant transform — it never animates). The camera is a single
// container that translates forward in Z as you scroll; because the cards sit at
// fixed depths, they approach, grow (real perspective) and pass on their own.
const PERSPECTIVE = 1000;
const R_SPIRAL = 120; // radius of the card spiral around the corridor axis
const ANGLE_STEP = 2.3; // radians between consecutive cards along the spiral
const GAP_Z = 820; // world depth between cards
const FOCUS_Z = 430; // depth at which a card sits when the camera is aligned (readable)
const CAM_K = GAP_Z / MSTEP; // camera Z travelled per unit of scroll progress
const FIRST_Z = M0 * CAM_K + FOCUS_Z; // depth of the first card

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

        {/* Landmarks along the corridor. The camera CONTAINER travels forward in
            Z with scroll; the cards inside hold constant positions. */}
        <div className="absolute inset-0" style={{ perspective: `${PERSPECTIVE}px` }}>
          <motion.div
            className="relative h-full [transform-style:preserve-3d]"
            style={{ transform: useTransform(scrollYProgress, (p) => `translateZ(${(p * CAM_K).toFixed(1)}px)`) }}
          >
            {SERVICES.map((service, i) => (
              <JourneyCard
                key={service.index}
                index={i}
                milestone={M0 + i * MSTEP}
                progress={scrollYProgress}
                icon={ICONS[i]}
                label={service.index}
                title={service.title}
                body={service.summary}
                features={service.tags}
              />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function JourneyCard({
  index,
  milestone,
  progress,
  icon,
  label,
  title,
  body,
  features,
}: {
  index: number;
  milestone: number;
  progress: MotionValue<number>;
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
    setFocused(focusOf(p) > 0.5);
  });

  // The card's fixed position deep in the corridor — computed ONCE. This
  // transform NEVER changes; the camera container moving in Z is what makes the
  // card approach, grow (perspective) and pass. No per-card translation.
  const A = index * ANGLE_STEP;
  const X = Math.cos(A) * R_SPIRAL;
  const Y = Math.sin(A) * R_SPIRAL;
  const Z = -(FIRST_Z + index * GAP_Z);
  const yaw = -Math.cos(A) * 10; // a touch of facing inherited from the spiral
  const worldTransform = `translate(-50%, -50%) translate3d(${X.toFixed(1)}px, ${Y.toFixed(1)}px, ${Z.toFixed(1)}px) rotateY(${yaw.toFixed(2)}deg)`;

  // Opacity is the only per-card animation: barely there deep in the distance,
  // resolving as the camera arrives, and clearing quickly once the camera has
  // passed (before perspective would blow the card up). Depth/scale/parallax all
  // come for free from the camera's forward travel.
  const opacity = useTransform(progress, (p) => {
    const rel = milestone - p;
    if (rel < -0.05) return 0; // camera has passed it — gone
    const sharp = rel >= 0 ? 6.5 : 15; // fade in slowly from depth, out quickly
    return Math.min(1, Math.exp(-Math.pow(rel * sharp, 2)) * 1.25);
  });
  const pointerEvents = useTransform(progress, (p) =>
    focusOf(p) > 0.6 ? "auto" : "none"
  ) as unknown as MotionValue<"auto" | "none">;

  return (
    <motion.div
      style={{ transform: worldTransform, opacity, pointerEvents }}
      className="absolute left-1/2 top-1/2 w-[360px]"
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
