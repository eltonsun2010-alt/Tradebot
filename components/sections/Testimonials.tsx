"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { TESTIMONIALS } from "@/lib/data";
import { AnimatedText } from "@/components/ui/AnimatedText";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { EASE_LUX } from "@/lib/motion";
import { cn } from "@/lib/utils";

const variants = {
  enter: (dir: number) => ({
    opacity: 0,
    rotateY: dir > 0 ? 40 : -40,
    x: dir > 0 ? 120 : -120,
    z: -240,
  }),
  center: { opacity: 1, rotateY: 0, x: 0, z: 0 },
  exit: (dir: number) => ({
    opacity: 0,
    rotateY: dir > 0 ? -40 : 40,
    x: dir > 0 ? -120 : 120,
    z: -240,
  }),
};

export function Testimonials() {
  const [[index, dir], setIndex] = useState<[number, number]>([0, 0]);
  const [paused, setPaused] = useState(false);
  const t = TESTIMONIALS[index];

  const paginate = useCallback((d: number) => {
    setIndex(([i]) => [
      (i + d + TESTIMONIALS.length) % TESTIMONIALS.length,
      d,
    ]);
  }, []);

  // Autoplay, paused on hover / interaction.
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => paginate(1), 6000);
    return () => clearInterval(id);
  }, [paused, paginate, index]);

  // Pointer tilt applied to the whole deck for parallax depth.
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const spring = { stiffness: 150, damping: 20, mass: 0.5 };
  const rotateY = useSpring(useTransform(px, [0, 1], [10, -10]), spring);
  const rotateX = useSpring(useTransform(py, [0, 1], [-7, 7]), spring);

  const onMove = (e: MouseEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };
  const onLeave = () => {
    px.set(0.5);
    py.set(0.5);
    setPaused(false);
  };

  const dragX = useRef(0);

  return (
    <section
      id="testimonials"
      className="relative overflow-hidden border-t border-line py-28 section-x md:py-40"
    >
      {/* Ambient lighting */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 40%, rgba(59,130,246,0.10), transparent 70%), radial-gradient(40% 40% at 80% 90%, rgba(124,58,237,0.10), transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-5xl text-center">
        <div className="mb-6 flex items-center justify-center gap-4">
          <span className="h-px w-12 bg-accent" />
          <span className="text-eyebrow text-paper-dim">Kind words</span>
          <span className="h-px w-12 bg-accent" />
        </div>
        <h2 className="text-display font-display font-extrabold text-paper">
          <AnimatedText text="Trusted by the" by="word" />{" "}
          <span className="font-serif font-normal italic text-gradient">
            <AnimatedText text="bold." by="word" delay={0.1} />
          </span>
        </h2>

        {/* 3D deck */}
        <div
          className="group relative mt-16 [perspective:1400px]"
          onMouseMove={onMove}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={onLeave}
        >
          <motion.div
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            className="relative mx-auto h-[420px] max-w-2xl md:h-[380px]"
          >
            {/* Ghost cards for depth */}
            <div
              aria-hidden
              className="absolute inset-x-6 top-6 h-full rounded-3xl border border-line bg-ink-raised/40"
              style={{ transform: "translateZ(-120px) scale(0.94)" }}
            />
            <div
              aria-hidden
              className="absolute inset-x-3 top-3 h-full rounded-3xl border border-line bg-ink-raised/60"
              style={{ transform: "translateZ(-60px) scale(0.97)" }}
            />

            <AnimatePresence mode="popLayout" custom={dir} initial={false}>
              <motion.article
                key={index}
                custom={dir}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.7, ease: EASE_LUX }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragStart={(_, info) => (dragX.current = info.point.x)}
                onDragEnd={(_, info) => {
                  const dx = info.point.x - dragX.current;
                  if (dx < -60) paginate(1);
                  else if (dx > 60) paginate(-1);
                }}
                className="glass absolute inset-0 flex cursor-grab flex-col justify-between rounded-3xl p-8 text-left active:cursor-grabbing md:p-12"
                style={{ transformStyle: "preserve-3d" }}
              >
                <span
                  aria-hidden
                  className="font-serif text-7xl leading-none text-accent/70"
                >
                  &ldquo;
                </span>
                <p className="-mt-6 font-display text-xl font-medium leading-snug text-paper md:text-3xl">
                  {t.quote}
                </p>
                <div className="mt-8 flex items-center gap-4">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-accent to-violet font-display text-sm font-bold text-paper">
                    {t.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                  <div>
                    <p className="font-display font-semibold text-paper">
                      {t.name}
                    </p>
                    <p className="text-sm text-paper-dim">{t.role}</p>
                  </div>
                </div>
              </motion.article>
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Controls */}
        <div className="mt-12 flex items-center justify-center gap-6">
          <MagneticButton
            as="button"
            onClick={() => paginate(-1)}
            strength={14}
            className="grid h-12 w-12 place-items-center rounded-full border border-line-strong text-paper transition-colors hover:border-accent"
          >
            <Chevron dir="left" />
          </MagneticButton>

          <div className="flex items-center gap-2">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex([i, i > index ? 1 : -1])}
                data-cursor="hover"
                aria-label={`Testimonial ${i + 1}`}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-500",
                  i === index ? "w-8 bg-accent" : "w-1.5 bg-line-strong"
                )}
              />
            ))}
          </div>

          <MagneticButton
            as="button"
            onClick={() => paginate(1)}
            strength={14}
            className="grid h-12 w-12 place-items-center rounded-full border border-line-strong text-paper transition-colors hover:border-accent"
          >
            <Chevron dir="right" />
          </MagneticButton>
        </div>
      </div>
    </section>
  );
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className={dir === "left" ? "rotate-180" : ""}
    >
      <path
        d="M6 3l5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
