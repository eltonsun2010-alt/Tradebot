"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import { CONCEPTS } from "@/lib/data";
import { AnimatedText } from "@/components/ui/AnimatedText";
import { Reveal } from "@/components/ui/Reveal";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { ProjectMockup } from "@/components/ui/ProjectMockup";
import { useLenis } from "@/components/providers/SmoothScrollProvider";
import { useIsTouch } from "@/hooks/useMediaQuery";

const LAYOUTS = ["editorial", "analytics", "portfolio", "dashboard"];

type Concept = (typeof CONCEPTS)[number];
type Rect = { top: number; left: number; width: number; height: number };
type Active = { concept: Concept; layout: string; rect: Rect };

export function Portfolio() {
  const { scrollTo } = useLenis();
  const [active, setActive] = useState<Active | null>(null);

  return (
    <section id="portfolio" className="relative border-t border-line py-28 section-x md:py-40">
      <div className="grid gap-8 md:grid-cols-12 md:items-end">
        <div className="md:col-span-8">
          <div className="mb-6 flex items-center gap-4">
            <span className="text-eyebrow text-accent">Selected work</span>
            <span className="h-px w-12 bg-line-strong" />
          </div>
          <h2 className="text-display font-display font-extrabold text-paper">
            <AnimatedText text="Designed to demonstrate" by="word" />
            <br />
            <AnimatedText text="what's possible." by="word" delay={0.08} />
          </h2>
        </div>
        <Reveal className="md:col-span-4" delay={0.12}>
          <p className="max-w-sm text-base leading-relaxed text-paper-dim md:text-lg">
            As Southpage grows, this portfolio grows with it. Until then, these
            concept projects show our approach to modern web design, UX and
            development.
          </p>
        </Reveal>
      </div>

      <div className="mt-16 grid gap-8 md:grid-cols-2">
        {CONCEPTS.map((c, i) => (
          <Reveal key={c.title} delay={(i % 2) * 0.1}>
            <TiltCard
              concept={c}
              layout={LAYOUTS[i]}
              hidden={active?.concept.title === c.title}
              onOpen={(rect) => setActive({ concept: c, layout: LAYOUTS[i], rect })}
            />
          </Reveal>
        ))}
      </div>

      <div className="mt-14 flex justify-center">
        <MagneticButton
          as="button"
          onClick={() => scrollTo("#contact")}
          cursorLabel="Let's talk"
          className="rounded-full border border-line-strong px-8 py-4 text-sm font-medium text-paper transition-colors hover:border-accent"
        >
          See more projects
        </MagneticButton>
      </div>

      <PortfolioPortal active={active} onClose={() => setActive(null)} />
    </section>
  );
}

function TiltCard({
  concept,
  layout,
  hidden,
  onOpen,
}: {
  concept: Concept;
  layout: string;
  hidden: boolean;
  onOpen: (rect: Rect) => void;
}) {
  const { title, words, body, accent, demo } = concept;
  const touch = useIsTouch();
  const ref = useRef<HTMLDivElement>(null);
  const rx = useSpring(useMotionValue(0), { stiffness: 150, damping: 18 });
  const ry = useSpring(useMotionValue(0), { stiffness: 150, damping: 18 });

  const onMove = (e: MouseEvent) => {
    if (touch || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * 12);
    rx.set(-py * 12);
  };
  const reset = () => {
    rx.set(0);
    ry.set(0);
  };

  const open = () => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    onOpen({ top: r.top, left: r.left, width: r.width, height: r.height });
  };

  const handleClick = (e: MouseEvent) => {
    e.preventDefault();
    open();
  };

  const inner = (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      style={{
        rotateX: rx,
        rotateY: ry,
        transformStyle: "preserve-3d",
        opacity: hidden ? 0 : 1,
      }}
      className="group relative rounded-3xl border border-line bg-ink-soft p-4 [perspective:1000px]"
    >
      <div style={{ transform: "translateZ(30px)" }}>
        <div
          className="relative overflow-hidden rounded-2xl p-3"
          style={{ background: `linear-gradient(160deg, ${accent}22, transparent)` }}
        >
          <div className="aspect-[16/10] w-full">
            <ProjectMockup accent={accent} layout={layout} />
          </div>
        </div>

        <div className="flex items-end justify-between px-3 pb-2 pt-6">
          <div>
            <div className="flex flex-wrap gap-2">
              {words.map((w) => (
                <span
                  key={w}
                  className="rounded-full border border-line-strong px-3 py-1 text-xs text-paper-dim"
                >
                  {w}
                </span>
              ))}
            </div>
            <h3 className="mt-4 font-display text-3xl font-bold text-paper md:text-4xl">
              {title}
            </h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-paper-dim">
              {body}
            </p>
          </div>
          <span
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-paper transition-all duration-500 group-hover:scale-110"
            style={{ background: accent, color: "#050505" }}
          >
            →
          </span>
        </div>

        <span
          className="absolute right-6 top-6 rounded-full px-3 py-1 text-[11px] font-semibold"
          style={{
            background: demo ? "#fafafa" : "rgba(250,250,250,0.1)",
            color: demo ? "#050505" : "#a1a1aa",
          }}
        >
          {demo ? "Live demo" : "Concept"}
        </span>
      </div>
    </motion.div>
  );

  // The card is always clickable — it opens the portal. Demo cards get a real
  // <a> underneath (right-click / open-in-new-tab still works); the click is
  // intercepted so we can play the portal transition before navigating.
  return demo ? (
    <Link href={demo} onClick={handleClick} data-cursor="view" data-cursor-label="Open">
      {inner}
    </Link>
  ) : (
    <button type="button" onClick={open} data-cursor="view" data-cursor-label="Preview" className="block w-full text-left">
      {inner}
    </button>
  );
}

const EASE = [0.16, 1, 0.3, 1] as const;

function PortfolioPortal({
  active,
  onClose,
}: {
  active: Active | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const { stop, start } = useLenis();
  const [vw, setVw] = useState(0);
  const [vh, setVh] = useState(0);
  const [expanded, setExpanded] = useState(false);

  // Lock background scroll while the portal is open.
  useEffect(() => {
    if (!active) return;
    setVw(window.innerWidth);
    setVh(window.innerHeight);
    stop();
    return () => start();
  }, [active, stop, start]);

  // Reset the "expanded" flag whenever a new portal opens/closes.
  useEffect(() => {
    if (!active) setExpanded(false);
  }, [active]);

  // Reduced motion: skip the animation entirely — navigate or bail out.
  useEffect(() => {
    if (!active || !reduced) return;
    if (active.concept.demo) router.push(active.concept.demo);
    else onClose();
  }, [active, reduced, router, onClose]);

  // Escape closes a concept preview.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, onClose]);

  if (reduced) return null;

  const rect = active?.rect;
  const concept = active?.concept;

  return (
    <AnimatePresence>
      {active && rect && concept && (
        <motion.div key="portal-root" className="fixed inset-0 z-[80]">
          {/* Blurred backdrop */}
          <motion.div
            aria-hidden
            className="absolute inset-0"
            style={{ background: "rgba(5,5,7,0.72)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            onClick={onClose}
          />

          {/* Expanding card → fullscreen portal */}
          <motion.div
            className="absolute overflow-hidden shadow-2xl"
            style={{ background: "#0a0a0c", willChange: "top, left, width, height" }}
            initial={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height, borderRadius: 24 }}
            animate={{ top: 0, left: 0, width: vw, height: vh, borderRadius: 0 }}
            exit={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height, borderRadius: 24, opacity: 0 }}
            transition={{ duration: 0.62, ease: EASE }}
            onAnimationComplete={() => {
              setExpanded(true);
              // Demo cards morph into the real page once fully expanded.
              if (concept.demo) {
                window.setTimeout(() => router.push(concept.demo as string), 240);
              }
            }}
          >
            {/* Accent wash */}
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background: `radial-gradient(80% 60% at 50% 0%, ${concept.accent}22, transparent 60%), radial-gradient(60% 60% at 100% 100%, ${concept.accent}14, transparent 60%)`,
              }}
            />

            {/* The mockup scaling up to fill the portal */}
            <div className="absolute inset-0 grid place-items-center p-6 md:p-16">
              <motion.div
                className="w-full max-w-5xl"
                initial={{ scale: 0.96, opacity: 0.6 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, ease: EASE }}
              >
                <div className="aspect-[16/10] w-full">
                  <ProjectMockup accent={concept.accent} layout={active.layout} />
                </div>
              </motion.div>
            </div>

            {/* Title / meta that fades in, then out as we hand off */}
            <motion.div
              className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 p-8 text-center md:p-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25, ease: EASE }}
            >
              <div className="flex flex-wrap justify-center gap-2">
                {concept.words.map((w) => (
                  <span key={w} className="rounded-full border border-line-strong px-3 py-1 text-xs text-paper-dim">
                    {w}
                  </span>
                ))}
              </div>
              <h3 className="font-display text-4xl font-extrabold text-paper md:text-6xl">
                {concept.title}
              </h3>
              {concept.demo ? (
                <p className="flex items-center gap-2 text-sm text-paper-dim">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border border-current border-t-transparent" />
                  {expanded ? "Opening live demo…" : "Loading…"}
                </p>
              ) : (
                <p className="max-w-md text-sm leading-relaxed text-paper-dim">{concept.body}</p>
              )}
            </motion.div>

            {/* Close (concept previews only — demo cards navigate away) */}
            {!concept.demo && (
              <motion.button
                type="button"
                onClick={onClose}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                data-cursor="hover"
                aria-label="Close preview"
                className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full border border-line-strong bg-ink-soft/80 text-paper transition-colors hover:border-accent md:right-8 md:top-8"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </motion.button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
