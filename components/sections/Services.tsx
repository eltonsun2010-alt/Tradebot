"use client";

import dynamic from "next/dynamic";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import {
  motion,
  motionValue,
  useAnimationFrame,
  useReducedMotion,
  useSpring,
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

const Heading = () => (
  <>
    <div className="mb-5 flex items-center gap-4">
      <span className="h-px w-12 bg-accent" />
      <span className="text-eyebrow text-paper-dim">What we do</span>
    </div>
    <h2 className="max-w-lg font-display text-3xl font-extrabold leading-[1.06] tracking-[-0.02em] text-paper md:text-4xl">
      Everything your business needs to stand out online.
    </h2>
  </>
);

export function Services() {
  const reduced = useReducedMotion();
  const mobile = useIsMobile();
  if (mobile || reduced) return <ServicesCarousel showHelix={!reduced} />;
  return <ServicesOrbit />;
}

/* ------------------------- desktop: living orbit ------------------------- */
const N = SERVICES.length;
const RX = 300; // horizontal orbit radius
const RZ = 185; // depth radius

function ServicesOrbit() {
  const stageRef = useRef<HTMLElement>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const anyHoveredRef = useRef(false);
  const visibleRef = useRef(true);

  useEffect(() => {
    anyHoveredRef.current = hovered !== null;
  }, [hovered]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => (visibleRef.current = entry.isIntersecting),
      { rootMargin: "120px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const angles = useMemo(
    () => SERVICES.map((_, i) => motionValue((i / N) * Math.PI * 2)),
    []
  );
  const bases = useMemo(() => SERVICES.map((_, i) => (i / N) * Math.PI * 2), []);
  // slightly different speeds so the motion never feels mechanical
  const speeds = useMemo(() => [0.132, 0.116, 0.148, 0.124, 0.138], []);
  const tRef = useRef(0);

  useAnimationFrame((_, delta) => {
    if (!visibleRef.current) return;
    const factor = anyHoveredRef.current ? 0.12 : 1; // ease the orbit while exploring
    tRef.current += (delta / 1000) * factor;
    for (let i = 0; i < angles.length; i += 1) {
      angles[i].set(bases[i] + tRef.current * speeds[i]);
    }
  });

  return (
    <section
      id="services"
      ref={stageRef}
      onMouseLeave={() => setHovered(null)}
      className="relative flex min-h-screen items-center overflow-hidden border-t border-line py-28"
    >
      <div className="absolute inset-x-0 top-0 z-40 section-x pt-28">
        <Heading />
      </div>

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 [perspective:1300px]">
        <div className="relative [transform-style:preserve-3d]">
          {/* helix at the centre of the 3D space (z = 0) so cards sort around it */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[68vh] w-[30vw] min-w-[420px] -translate-x-1/2 -translate-y-1/2"
            style={{ transform: "translate(-50%, -50%) translateZ(0px)" }}
          >
            <LightHelixCanvas eventSource={stageRef} />
          </div>

          {SERVICES.map((service, i) => (
            <OrbitCard
              key={service.index}
              angle={angles[i]}
              isHovered={hovered === i}
              anyHovered={hovered !== null}
              onEnter={() => setHovered(i)}
              icon={ICONS[i]}
              label={service.index}
              title={service.title}
              body={service.summary}
              features={service.tags}
            />
          ))}
        </div>
      </div>

      <span className="absolute bottom-8 left-1/2 z-40 -translate-x-1/2 text-[10px] uppercase tracking-[0.3em] text-paper-faint">
        Hover a card to explore
      </span>
    </section>
  );
}

function OrbitCard({
  angle,
  isHovered,
  anyHovered,
  onEnter,
  icon,
  label,
  title,
  body,
  features,
}: {
  angle: MotionValue<number>;
  isHovered: boolean;
  anyHovered: boolean;
  onEnter: () => void;
  icon: ReactNode;
  label: string;
  title: string;
  body: string;
  features: readonly string[];
}) {
  const pull = useSpring(isHovered ? 1 : 0, { stiffness: 150, damping: 22 });

  const transform = useTransform([angle, pull] as MotionValue<number>[], (input) => {
    const [a, pu] = input as number[];
    const x = Math.sin(a) * RX;
    const d = Math.cos(a);
    const z = d * RZ;
    const ry = -Math.sin(a) * 10; // subtle facing tilt
    const rz = Math.sin(a) * 4; // subtle banking
    const sc = 0.84 + 0.16 * ((d + 1) / 2); // farther = smaller

    const X = x * (1 - pu);
    const Z = z + (RZ + 150 - z) * pu; // pull toward the viewer
    const RY = ry * (1 - pu);
    const RZd = rz * (1 - pu);
    const S = sc + (1.16 - sc) * pu;
    return `translate(-50%, -50%) translate3d(${X.toFixed(1)}px, 0px, ${Z.toFixed(1)}px) rotateY(${RY.toFixed(2)}deg) rotateZ(${RZd.toFixed(2)}deg) scale(${S.toFixed(3)})`;
  });

  // depth brightness/softness — brighter & solid at the front, softer at the back
  const frontOpacity = useTransform([angle, pull] as MotionValue<number>[], (input) => {
    const [a, pu] = input as number[];
    const d = Math.cos(a);
    return Math.max(0.4 + 0.6 * ((d + 1) / 2), pu);
  });

  const pointerEvents = useTransform(angle, (a) =>
    Math.cos(a) > 0.12 ? "auto" : "none"
  ) as unknown as MotionValue<"auto" | "none">;

  return (
    <motion.div
      onMouseEnter={onEnter}
      style={{ transform, opacity: frontOpacity, pointerEvents, backfaceVisibility: "hidden" }}
      className="absolute left-1/2 top-1/2 w-[280px] [transform-style:preserve-3d]"
    >
      {/* dim the non-focused cards while one is being explored */}
      <motion.div
        animate={{ opacity: anyHovered && !isHovered ? 0.42 : 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 22 }}
      >
        <ServiceCard
          icon={icon}
          label={label}
          title={title}
          body={body}
          features={features}
          forceOpen={isHovered}
        />
      </motion.div>
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
        <Heading />
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
        className="absolute inset-x-0 top-0 overflow-hidden rounded-2xl border p-8 transition-[border-color,box-shadow] duration-300"
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
