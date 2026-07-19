"use client";

import { useRef, useState, type MouseEvent, type ReactNode } from "react";
import { motion } from "framer-motion";
import { SERVICES } from "@/lib/data";
import { AnimatedText } from "@/components/ui/AnimatedText";
import { Reveal } from "@/components/ui/Reveal";
import { useIsTouch } from "@/hooks/useMediaQuery";

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

export function Services() {
  return (
    <section id="services" className="relative border-t border-line py-28 section-x md:py-40">
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

      <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 md:mt-20">
        {SERVICES.map((service, i) => (
          <RevealCard
            key={service.index}
            index={i}
            icon={ICONS[i]}
            label={service.index}
            title={service.title}
            body={service.summary}
            tags={service.tags}
          />
        ))}
      </div>
    </section>
  );
}

function RevealCard({
  index,
  icon,
  label,
  title,
  body,
  tags,
}: {
  index: number;
  icon: ReactNode;
  label: string;
  title: string;
  body: string;
  tags: readonly string[];
}) {
  const touch = useIsTouch();
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const open = touch || hover;

  const onMove = (e: MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  const spring = { type: "spring" as const, stiffness: 320, damping: 26 };

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay: (index % 3) * 0.07, ease: [0.16, 1, 0.3, 1] }}
      onMouseMove={touch ? undefined : onMove}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      data-cursor="hover"
      className="group relative flex flex-col overflow-hidden rounded-2xl border p-8 transition-colors duration-200"
      style={{
        borderColor: hover ? "rgba(59,130,246,0.4)" : "var(--color-line)",
        background: hover
          ? "linear-gradient(160deg, rgba(59,130,246,0.08), rgba(124,58,237,0.05)), #0a0a0c"
          : "#0a0a0c",
        boxShadow: hover ? "0 20px 60px -30px rgba(59,130,246,0.5)" : "none",
      }}
    >
      {/* Cursor-following radial light */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-200"
        style={{
          opacity: hover ? 1 : 0,
          background:
            "radial-gradient(240px circle at var(--mx) var(--my), rgba(96,165,250,0.14), transparent 60%)",
        }}
      />

      <div className="relative flex flex-1 flex-col">
        <div className="flex items-center justify-between">
          <motion.span
            animate={{ rotate: open ? 10 : 0, scale: open ? 1.05 : 1 }}
            transition={spring}
            className="grid h-12 w-12 place-items-center rounded-xl"
            style={{ background: "rgba(59,130,246,0.12)" }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              {icon}
            </svg>
          </motion.span>
          <span className="font-display text-3xl font-bold text-paper-faint">{label}</span>
        </div>

        <h3 className="mt-7 font-display text-xl font-bold text-paper">{title}</h3>

        {/* Description + tags reveal on hover (always shown on touch) */}
        <motion.div
          animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0, y: open ? 0 : 8 }}
          transition={spring}
          className="overflow-hidden"
        >
          <p className="pt-3 text-sm leading-relaxed text-paper-dim">{body}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="rounded-full border border-line-strong px-3 py-1 text-xs text-paper-dim">
                {tag}
              </span>
            ))}
          </div>
          <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-accent-bright">
            <motion.span animate={{ x: open ? 0 : -8, opacity: open ? 1 : 0 }} transition={spring}>
              Learn more
            </motion.span>
            <motion.span animate={{ x: open ? 0 : -10, opacity: open ? 1 : 0 }} transition={{ ...spring, delay: open ? 0.04 : 0 }}>
              →
            </motion.span>
          </span>
        </motion.div>
      </div>
    </motion.article>
  );
}
