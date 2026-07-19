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
import { AnimatedText } from "@/components/ui/AnimatedText";
import { Reveal } from "@/components/ui/Reveal";
import { useIsMobile, useIsTouch } from "@/hooks/useMediaQuery";

const LightHelixCanvas = dynamic(() => import("@/components/canvas/LightHelixCanvas"), {
  ssr: false,
});

const ICONS: ReactNode[] = [
  // 01 Custom Website Design — pen / craft
  <path key="a" d="M4 20l4-1L20 7a2 2 0 0 0-3-3L5 16l-1 4zM14 6l3 3" />,
  // 02 Website Development — code brackets
  <path key="b" d="M8 8l-4 4 4 4M16 8l4 4-4 4M13 5l-2 14" />,
  // 03 Business Automation — gear
  <>
    <circle key="c1" cx="12" cy="12" r="3" />
    <path key="c2" d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" />
  </>,
  // 04 Website Redesign — refresh
  <path key="d" d="M4 12a8 8 0 0 1 13.7-5.6L20 8M20 4v4h-4M20 12a8 8 0 0 1-13.7 5.6L4 16M4 20v-4h4" />,
  // 05 Ongoing Support — lifebuoy
  <>
    <circle key="e1" cx="12" cy="12" r="9" />
    <circle key="e2" cx="12" cy="12" r="3.5" />
    <path key="e3" d="M4.9 4.9l4.6 4.6M14.5 14.5l4.6 4.6M19.1 4.9l-4.6 4.6M9.5 14.5l-4.6 4.6" />
  </>,
];

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const Heading = () => (
  <div>
    <div className="mb-6 flex items-center gap-4">
      <span className="h-px w-12 bg-accent" />
      <span className="text-eyebrow text-paper-dim">What we do</span>
    </div>
    <h2 className="max-w-2xl text-display font-display font-extrabold text-paper">
      <AnimatedText text="Everything your business" by="word" />
      <br />
      <AnimatedText text="needs to stand out online." by="word" delay={0.08} />
    </h2>
  </div>
);

export function Services() {
  const reduced = useReducedMotion();
  const mobile = useIsMobile();

  if (reduced || mobile) return <ServicesFallback showHelix={!reduced} />;
  return <ServicesOrbit />;
}

/* --------------------------- desktop: orbit --------------------------- */
const RADIUS = 340;
const TURNS = 1; // one full circulation of the cards over the section

function ServicesOrbit() {
  const trackRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });

  return (
    <section
      id="services"
      ref={trackRef}
      className="relative border-t border-line"
      style={{ height: "340vh" }}
    >
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden section-x">
        {/* compact heading, pinned top-left */}
        <div className="absolute inset-x-0 top-0 z-40 section-x pt-28">
          <div className="mb-5 flex items-center gap-4">
            <span className="h-px w-12 bg-accent" />
            <span className="text-eyebrow text-paper-dim">What we do</span>
          </div>
          <h2 className="max-w-lg font-display text-3xl font-extrabold leading-[1.06] tracking-[-0.02em] text-paper md:text-4xl">
            Everything your business needs to stand out online.
          </h2>
        </div>

        {/* central light helix */}
        <div className="absolute left-1/2 top-1/2 z-[5] h-[86%] w-[46%] -translate-x-1/2 -translate-y-1/2">
          <LightHelixCanvas eventSource={trackRef} />
        </div>

        {/* orbiting cards */}
        <div className="absolute left-1/2 top-1/2 z-10 [perspective:1500px]">
          <div className="relative [transform-style:preserve-3d]">
            {SERVICES.map((service, i) => (
              <OrbitCard
                key={service.index}
                base={(i / SERVICES.length) * 360}
                progress={scrollYProgress}
                icon={ICONS[i]}
                label={service.index}
                title={service.title}
                body={service.summary}
                features={service.tags}
              />
            ))}
          </div>
        </div>

        {/* scroll hint */}
        <span className="absolute bottom-8 left-1/2 z-40 -translate-x-1/2 text-[10px] uppercase tracking-[0.3em] text-paper-faint">
          Scroll to explore our services
        </span>
      </div>
    </section>
  );
}

function OrbitCard({
  base,
  progress,
  icon,
  label,
  title,
  body,
  features,
}: {
  base: number;
  progress: MotionValue<number>;
  icon: ReactNode;
  label: string;
  title: string;
  body: string;
  features: readonly string[];
}) {
  const angleDeg = (p: number) => base - p * TURNS * 360;
  const [front, setFront] = useState(base === 0);

  useMotionValueEvent(progress, "change", (p) => {
    const f = Math.cos((angleDeg(p) * Math.PI) / 180);
    setFront(f > 0.9);
  });

  const transform = useTransform(progress, (p) => {
    const a = angleDeg(p);
    const f = Math.cos((a * Math.PI) / 180);
    const s = 0.78 + 0.22 * Math.max(0, f);
    return `translate(-50%, -50%) rotateY(${a}deg) translateZ(${RADIUS}px) scale(${s})`;
  });
  const opacity = useTransform(progress, (p) => {
    const f = Math.cos((angleDeg(p) * Math.PI) / 180);
    return 0.08 + 0.92 * smoothstep(-0.25, 0.85, f);
  });
  const zIndex = useTransform(progress, (p) => {
    const f = Math.cos((angleDeg(p) * Math.PI) / 180);
    return f > 0.05 ? 12 + Math.round(f * 12) : 1;
  });
  const pointerEvents = useTransform(progress, (p) => {
    const f = Math.cos((angleDeg(p) * Math.PI) / 180);
    return f > 0.85 ? "auto" : "none";
  }) as unknown as MotionValue<"auto" | "none">;

  return (
    <motion.div
      className="absolute left-1/2 top-1/2 w-[300px] [transform-style:preserve-3d]"
      style={{ transform, opacity, zIndex, pointerEvents, backfaceVisibility: "hidden" }}
    >
      <ServiceCard icon={icon} label={label} title={title} body={body} features={features} forceOpen={front} />
    </motion.div>
  );
}

/* ------------------- mobile / reduced-motion fallback ------------------- */
function ServicesFallback({ showHelix }: { showHelix: boolean }) {
  const ref = useRef<HTMLElement>(null);
  return (
    <section id="services" ref={ref} className="relative overflow-hidden border-t border-line py-28 section-x md:py-40">
      {showHelix && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[70vh] opacity-60"
          style={{
            WebkitMaskImage: "radial-gradient(70% 60% at 50% 30%, #000 30%, transparent 80%)",
            maskImage: "radial-gradient(70% 60% at 50% 30%, #000 30%, transparent 80%)",
          }}
        >
          <LightHelixCanvas eventSource={ref} />
        </div>
      )}
      <div className="relative">
        <Heading />
        <div className="mt-14 mx-auto grid max-w-md gap-5">
          {SERVICES.map((service, i) => (
            <Reveal key={service.index} delay={(i % 2) * 0.08}>
              <ServiceCard
                index={i}
                icon={ICONS[i]}
                label={service.index}
                title={service.title}
                body={service.summary}
                features={service.tags}
              />
            </Reveal>
          ))}
        </div>
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
  index?: number;
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
      {/* Ghost keeps the collapsed height */}
      <div aria-hidden className="invisible p-8">
        <Header icon={icon} label={label} open={false} />
        <h3 className="mt-7 font-display text-xl font-bold">{title}</h3>
      </div>

      <motion.article
        ref={ref}
        onMouseMove={touch ? undefined : onMove}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        data-cursor="hover"
        animate={{ zIndex: open ? 30 : 1 }}
        className="absolute inset-x-0 top-0 overflow-hidden rounded-2xl border p-8 transition-colors duration-200"
        style={{
          borderColor: open ? "rgba(59,130,246,0.4)" : "var(--color-line)",
          background: open
            ? "linear-gradient(160deg, rgba(59,130,246,0.10), rgba(124,58,237,0.06)), #0a0a0c"
            : "#0a0a0c",
          boxShadow: open ? "0 26px 70px -28px rgba(59,130,246,0.55)" : "0 20px 50px -30px rgba(0,0,0,0.9)",
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
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={{
            opacity: hover ? 0.5 : 0,
            backgroundImage: "radial-gradient(rgba(255,255,255,0.55) 1px, transparent 1.4px)",
            backgroundSize: "9px 9px",
            WebkitMaskImage: "radial-gradient(180px circle at var(--mx) var(--my), #000 0%, transparent 55%)",
            maskImage: "radial-gradient(180px circle at var(--mx) var(--my), #000 0%, transparent 55%)",
          }}
        />

        <div className="relative">
          <Header icon={icon} label={label} open={open} />
          <h3 className="mt-7 font-display text-xl font-bold text-paper">{title}</h3>

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
              <motion.span animate={{ x: open ? 0 : -8, opacity: open ? 1 : 0 }} transition={spring}>
                Learn more
              </motion.span>
              <motion.span animate={{ x: open ? 0 : -10, opacity: open ? 1 : 0 }} transition={{ ...spring, delay: open ? 0.05 : 0 }}>
                →
              </motion.span>
            </span>
          </motion.div>
        </div>
      </motion.article>
    </div>
  );
}
