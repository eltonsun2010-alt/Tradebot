"use client";

import { useRef, useState, type MouseEvent } from "react";
import { motion } from "framer-motion";
import { SERVICES } from "@/lib/data";
import { AnimatedText } from "@/components/ui/AnimatedText";
import { Reveal } from "@/components/ui/Reveal";
import { EASE_LUX } from "@/lib/motion";
import { useIsTouch } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

export function Services() {
  const touch = useIsTouch();
  // Desktop: hover drives the open panel (default first). Touch: tap toggles.
  const [active, setActive] = useState<number | null>(0);

  return (
    <section
      id="services"
      className="relative border-t border-line py-28 section-x md:py-40"
    >
      <div className="grid gap-8 md:grid-cols-12 md:items-end">
        <div className="md:col-span-8">
          <div className="mb-6 flex items-center gap-4">
            <span className="h-px w-12 bg-accent" />
            <span className="text-eyebrow text-paper-dim">What we do</span>
          </div>
          <h2 className="text-display font-display font-extrabold text-paper">
            <AnimatedText text="Everything your business" by="word" />
            <br />
            <AnimatedText text="needs to stand out online." by="word" delay={0.08} />
          </h2>
        </div>
        <Reveal className="md:col-span-4" delay={0.15}>
          <p className="max-w-sm text-base leading-relaxed text-paper-dim md:text-lg">
            From first design to ongoing care — one team handling everything your
            business needs to look sharp and run smoothly online.
          </p>
        </Reveal>
      </div>

      <ul
        className="mt-16 border-t border-line md:mt-24"
        onMouseLeave={() => !touch && setActive(0)}
      >
        {SERVICES.map((service, i) => (
          <ServicePanel
            key={service.index}
            service={service}
            active={active === i}
            onEnter={() => !touch && setActive(i)}
            onClick={() =>
              touch && setActive((prev) => (prev === i ? null : i))
            }
          />
        ))}
      </ul>
    </section>
  );
}

type Service = (typeof SERVICES)[number];

function ServicePanel({
  service,
  active,
  onEnter,
  onClick,
}: {
  service: Service;
  active: boolean;
  onEnter: () => void;
  onClick: () => void;
}) {
  const ref = useRef<HTMLLIElement>(null);

  // Feed cursor position to a CSS var so the light pool tracks the pointer.
  const onMove = (e: MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <li
      ref={ref}
      onMouseEnter={onEnter}
      onMouseMove={onMove}
      onClick={onClick}
      data-cursor="hover"
      className="group relative overflow-hidden border-b border-line"
    >
      {/* Cursor-tracked light pool */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 transition-opacity duration-500",
          active ? "opacity-100" : "opacity-0"
        )}
        style={{
          background:
            "radial-gradient(500px circle at var(--mx) var(--my), rgba(59,130,246,0.10), transparent 45%)",
        }}
      />
      {/* Growing accent rail */}
      <span
        aria-hidden
        className={cn(
          "absolute left-0 top-0 w-px origin-top bg-gradient-to-b from-accent to-violet transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
          active ? "scale-y-100" : "scale-y-0"
        )}
        style={{ height: "100%" }}
      />

      <div className="relative flex items-start gap-5 py-8 md:gap-10 md:py-10">
        <span
          className={cn(
            "mt-2 font-display text-sm tabular-nums transition-colors duration-500 md:text-base",
            active ? "text-accent" : "text-paper-faint"
          )}
        >
          {service.index}
        </span>

        <div className="flex-1">
          <div className="flex items-center justify-between gap-4">
            <h3
              className={cn(
                "font-display text-3xl font-bold tracking-[-0.02em] text-paper transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:text-5xl",
                active && "md:translate-x-2"
              )}
            >
              {service.title}
            </h3>
            <Sign active={active} />
          </div>

          {/* Expanding detail */}
          <motion.div
            initial={false}
            animate={{ height: active ? "auto" : 0, opacity: active ? 1 : 0 }}
            transition={{ duration: 0.55, ease: EASE_LUX }}
            className="overflow-hidden"
          >
            <div className="grid gap-6 pt-6 md:grid-cols-[1fr_auto] md:items-end md:gap-10">
              <p className="max-w-xl text-base leading-relaxed text-paper-dim md:text-lg">
                {service.summary}
              </p>
              <div className="flex flex-wrap gap-2">
                {service.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-line-strong px-3 py-1.5 text-xs text-paper-dim"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </li>
  );
}

/** Plus that rotates into a minus when the panel opens. */
function Sign({ active }: { active: boolean }) {
  return (
    <span className="relative mt-2 flex h-6 w-6 shrink-0 items-center justify-center">
      <span className="absolute h-px w-4 bg-paper-dim" />
      <span
        className={cn(
          "absolute h-4 w-px bg-paper-dim transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
          active && "rotate-90"
        )}
      />
    </span>
  );
}
