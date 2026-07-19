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
const FOCUS_SHARP = 11; // how quickly focus falls off away from centre
const VSPAN = 2650; // px a card travels vertically per unit of journey
const RX = 235; // horizontal swing of the spiral
const Z_NEAR = 130; // toward the camera at focus
const Z_FAR = 300; // pushed away when travelling

function ServicesJourney() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // drives the helix travel (camera position along the strand)
  const helixScroll = useTransform(scrollYProgress, (p) => p * 1.5);
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

  const transform = useTransform(progress, (p) => {
    const rel = milestone - p; // >0 → still ahead/below, <0 → passed/above
    const f = Math.exp(-Math.pow(rel * FOCUS_SHARP, 2)); // 1 at centre

    const th = baseAngle + p * Math.PI * 2 * 1.5; // swings with the helix twist
    const x = Math.sin(th) * RX * (1 - f * 0.92); // slides to centre at focus
    const y = rel * VSPAN; // rises up through the viewport
    const z = f * Z_NEAR - (1 - f) * Z_FAR; // comes near at focus, far otherwise

    const yaw = Math.sin(th) * 20 * (1 - f); // straightens to face camera at focus
    const pitch = -rel * 10 * (1 - f);
    const s = 0.5 + 0.68 * f;

    return `translate(-50%, -50%) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) rotateY(${yaw.toFixed(2)}deg) rotateX(${pitch.toFixed(2)}deg) scale(${s.toFixed(3)})`;
  });

  const opacity = useTransform(progress, (p) => Math.min(1, focusOf(p) * 1.15));
  const pointerEvents = useTransform(progress, (p) =>
    focusOf(p) > 0.6 ? "auto" : "none"
  ) as unknown as MotionValue<"auto" | "none">;

  return (
    <motion.div
      style={{ transform, opacity, pointerEvents }}
      className="absolute left-1/2 top-1/2 w-[300px]"
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
        animate={{ rotate: open ? 10 : 0, scale: open ? 1.06 : 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 22 }}
        className="grid h-12 w-12 place-items-center rounded-xl"
        style={{ background: "rgba(59,130,246,0.12)" }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          {icon}
        </svg>
      </motion.span>
      <motion.span animate={{ opacity: open ? 1 : 0.35 }} className="font-display text-3xl font-bold text-paper-faint">
        {label}
      </motion.span>
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
      <div aria-hidden className="invisible p-6">
        <Header icon={icon} label={label} open={false} />
        <h3 className="mt-6 font-display text-lg font-bold">{title}</h3>
      </div>

      <motion.article
        ref={ref}
        onMouseMove={touch ? undefined : onMove}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        data-cursor="hover"
        className="absolute inset-x-0 top-0 overflow-hidden rounded-2xl border p-6 transition-[border-color,box-shadow] duration-300"
        style={{
          borderColor: open ? "rgba(59,130,246,0.45)" : "var(--color-line)",
          background: open
            ? "linear-gradient(160deg, rgba(59,130,246,0.12), rgba(124,58,237,0.06)), #0a0a0c"
            : "#0a0a0c",
          boxShadow: forceOpen
            ? "0 34px 90px -30px rgba(59,130,246,0.7), 0 0 60px -20px rgba(96,165,250,0.4)"
            : open
              ? "0 26px 70px -28px rgba(59,130,246,0.5)"
              : "0 20px 50px -30px rgba(0,0,0,0.9)",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 transition-opacity duration-200"
          style={{
            opacity: hover ? 1 : 0,
            background: "radial-gradient(260px circle at var(--mx) var(--my), rgba(96,165,250,0.16), transparent 60%)",
          }}
        />

        <div className="relative">
          <Header icon={icon} label={label} open={open} />
          <h3 className="mt-6 font-display text-lg font-bold text-paper">{title}</h3>

          <motion.div
            initial={false}
            animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
            transition={spring}
            className="overflow-hidden"
          >
            <p className="pt-4 text-sm leading-relaxed text-paper-dim">{body}</p>
            <ul className="mt-5 space-y-2.5">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-paper">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent/15 text-[11px] text-accent-bright">
                    ✓
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-accent-bright">
              Learn more →
            </span>
          </motion.div>
        </div>
      </motion.article>
    </div>
  );
}
