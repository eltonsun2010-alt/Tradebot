"use client";

import { useRef, useState, type MouseEvent, type ReactNode } from "react";
import { motion } from "framer-motion";
import { WHY_CARDS } from "@/lib/data";
import { AnimatedText } from "@/components/ui/AnimatedText";
import { Reveal } from "@/components/ui/Reveal";
import { useIsTouch } from "@/hooks/useMediaQuery";

const ICONS: ReactNode[] = [
  <path key="a" d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z" />,
  <path key="b" d="M13 2 4.5 13H11l-1 9 8.5-11H12l1-9z" />,
  <><rect key="c1" x="3" y="4" width="18" height="12" rx="1.5" /><path key="c2" d="M9 20h6M12 16v4" /></>,
  <path key="d" d="M4 5h16v11H9l-4 4V5z" />,
  <path key="e" d="M3 17l6-6 4 4 8-8M15 7h6v6" />,
  <path key="f" d="M12 3l7 6-7 12L5 9z" />,
];

export function WhySouthpage() {
  return (
    <section id="why" className="relative border-t border-line py-28 section-x md:py-40">
      <div className="grid gap-10 md:grid-cols-12 md:items-end">
        <div className="md:col-span-7">
          <div className="mb-6 flex items-center gap-4">
            <span className="h-px w-12 bg-accent" />
            <span className="text-eyebrow text-paper-dim">Why choose Southpage</span>
          </div>
          <h2 className="text-display font-display font-extrabold text-paper">
            <AnimatedText text="Built with intention." by="word" />
            <br />
            <AnimatedText text="Designed to last." by="word" delay={0.08} />
          </h2>
        </div>
        <Reveal className="md:col-span-5" delay={0.12}>
          <p className="max-w-md text-base leading-relaxed text-paper-dim md:text-lg">
            Great websites aren&rsquo;t created by accident. Every decision — from
            typography and spacing to performance and functionality — is made with
            purpose. Our goal is simple: create websites you&rsquo;re proud to share.
          </p>
        </Reveal>
      </div>

      <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {WHY_CARDS.map((card, i) => (
          <RevealCard key={card.title} index={i} icon={ICONS[i]} title={card.title} body={card.body} />
        ))}
      </div>
    </section>
  );
}

function RevealCard({
  index,
  icon,
  title,
  body,
}: {
  index: number;
  icon: ReactNode;
  title: string;
  body: string;
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
      className="group relative overflow-hidden rounded-2xl border p-8 transition-colors duration-200"
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
          background: "radial-gradient(240px circle at var(--mx) var(--my), rgba(96,165,250,0.14), transparent 60%)",
        }}
      />

      <div className="relative">
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
          <span className="font-display text-3xl font-bold text-paper-faint">
            0{index + 1}
          </span>
        </div>

        <h3 className="mt-7 font-display text-xl font-bold text-paper">{title}</h3>

        {/* Description reveals on hover (always shown on touch) */}
        <motion.div
          animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0, y: open ? 0 : 8 }}
          transition={spring}
          className="overflow-hidden"
        >
          <p className="pt-3 text-sm leading-relaxed text-paper-dim">{body}</p>
          <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-accent-bright">
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
