"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { useScroll, useReducedMotion } from "framer-motion";
import { WHY_CARDS } from "@/lib/data";
import { useIsMobile } from "@/hooks/useMediaQuery";

/* ==================================================================== *
 * "The Gallery" — a hushed architectural hall. The camera glides slowly
 * sideways past tall glass monoliths, each one an installation that
 * drifts into a pool of light, holds while it is read, then recedes into
 * darkness as the next arrives. No cards, no grid — negative space,
 * restrained motion, elegant glass and light. A deliberate contrast to
 * the vertical Light Helix, in the same premium language.
 * ==================================================================== */

export function WhySouthpage() {
  const reduced = useReducedMotion();
  const mobile = useIsMobile();
  if (mobile || reduced) return <GalleryStacked />;
  return <Gallery />;
}

const N = WHY_CARDS.length;
const C0 = 0.08;
const C1 = 0.92;

const clamp = (x: number, a: number, b: number) => (x < a ? a : x > b ? b : x);
const smooth = (x: number) => {
  const t = clamp(x, 0, 1);
  return t * t * (3 - 2 * t);
};

function Gallery() {
  const sectionRef = useRef<HTMLElement>(null);
  const hallRef = useRef<HTMLDivElement>(null);
  const monoliths = useRef<(HTMLDivElement | null)[]>([]);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    let raf = 0;
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e: PointerEvent) => {
      mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove);

    const tick = () => {
      const p = scrollYProgress.get();
      const vw = window.innerWidth;
      const gap = Math.min(vw * 0.46, 660);
      const u = clamp((p - C0) / (C1 - C0), -0.12, 1.12);
      const camX = u * (N - 1) * gap;
      const t = performance.now() / 1000;

      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;
      if (hallRef.current) {
        hallRef.current.style.transform = `translate3d(${(-mouse.x * 14).toFixed(1)}px, ${(-mouse.y * 8).toFixed(1)}px, 0)`;
      }

      for (let i = 0; i < N; i += 1) {
        const el = monoliths.current[i];
        if (!el) continue;
        const dx = i * gap - camX; // px from centre of the hall
        const near = clamp(1 - Math.abs(dx) / gap, 0, 1);
        const lit = smooth(near);
        const z = -(1 - lit) * 300; // recede into depth
        const rotY = clamp(dx / gap, -1.3, 1.3) * -15; // turn to face the eye
        const scale = 0.8 + 0.2 * lit;
        const bob = Math.sin(t * 0.5 + i * 1.7) * 5 * (0.4 + 0.6 * lit);
        el.style.transform = `translate(-50%, -50%) translate3d(${dx.toFixed(1)}px, ${bob.toFixed(1)}px, ${z.toFixed(1)}px) rotateY(${rotY.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
        el.style.opacity = (0.12 + 0.88 * lit).toFixed(3);
        el.style.zIndex = String(100 + Math.round(lit * 100));
        el.style.setProperty("--lit", lit.toFixed(3));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, [scrollYProgress]);

  return (
    <section
      id="why"
      ref={sectionRef}
      className="relative border-t border-line bg-ink"
      style={{ height: `${N * 82 + 70}vh` }}
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* dramatic lighting: an overhead pool on centre stage, and a vignette
            that lets the far installations fall into darkness */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(42% 55% at 50% 30%, rgba(120,150,230,0.12), transparent 68%), radial-gradient(60% 45% at 50% 92%, rgba(90,120,200,0.08), transparent 70%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(120% 90% at 50% 45%, transparent 52%, rgba(0,0,0,0.72))" }}
        />

        {/* the exhibition placard — a quiet wall label, top-left */}
        <div className="absolute left-[max(1.5rem,5vw)] top-24 z-[300] max-w-xs">
          <div className="mb-5 flex items-center gap-4">
            <span className="h-px w-12 bg-accent" />
            <span className="text-eyebrow text-paper-dim">Why choose Southpage</span>
          </div>
          <h2 className="font-display text-[clamp(1.9rem,3vw,2.6rem)] font-extrabold leading-[1.05] tracking-[-0.02em] text-paper">
            Built with intention.
          </h2>
          <p className="mt-5 max-w-[15rem] text-sm leading-relaxed text-paper-faint">
            Every decision — typography, spacing, performance — made with purpose.
          </p>
        </div>

        {/* the hall */}
        <div className="absolute inset-0" style={{ perspective: "1600px" }}>
          <div ref={hallRef} className="relative h-full w-full [transform-style:preserve-3d]">
            {WHY_CARDS.map((card, i) => (
              <div
                key={card.title}
                ref={(el) => {
                  monoliths.current[i] = el;
                }}
                className="absolute left-1/2 top-[42%] [transform-style:preserve-3d] will-change-transform"
              >
                <Monolith index={i} title={card.title} body={card.body} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** A tall glass monolith and its floor reflection. */
function Monolith({ index, title, body }: { index: number; title: string; body: string }) {
  return (
    <div className="relative" style={{ width: "clamp(255px, 23vw, 330px)" }}>
      <Slab index={index} title={title} body={body} />
      {/* floor reflection */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-full origin-top overflow-hidden"
        style={{
          height: "58%",
          transform: "scaleY(-1)",
          opacity: "calc(0.16 + 0.2 * var(--lit, 0))",
          WebkitMaskImage: "linear-gradient(to bottom, #000, transparent 86%)",
          maskImage: "linear-gradient(to bottom, #000, transparent 86%)",
          filter: "blur(1px)",
        }}
      >
        <Slab index={index} title={title} body={body} />
      </div>
    </div>
  );
}

function Slab({ index, title, body }: { index: number; title: string; body: string }) {
  return (
    <article
      className="relative flex flex-col overflow-hidden rounded-[1.9rem] p-9"
      style={{
        height: "clamp(430px, 60vh, 540px)",
        background:
          "linear-gradient(158deg, rgba(255,255,255,0.13), rgba(255,255,255,0.035) 55%, rgba(160,190,255,0.06))",
        backdropFilter: "blur(24px) saturate(150%) brightness(1.03)",
        WebkitBackdropFilter: "blur(24px) saturate(150%) brightness(1.03)",
        boxShadow:
          "0 80px 140px -70px rgba(0,0,0,0.95), inset 0 2px 1px rgba(255,255,255,calc(0.24 + 0.28 * var(--lit, 0))), inset 0 0 0 1px rgba(255,255,255,0.07), inset 0 -60px 90px -60px rgba(150,185,255,calc(0.1 + 0.22 * var(--lit, 0)))",
      }}
    >
      {/* light pooling on the top of the glass */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-1/3 h-2/3 bg-gradient-to-b from-white/[0.12] to-transparent" />
      {/* a single raking specular streak */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "linear-gradient(122deg, transparent 40%, rgba(255,255,255,0.07) 50%, transparent 60%)" }}
      />
      {/* brightening when this installation is lit */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: "var(--lit, 0)",
          background: "radial-gradient(120% 80% at 50% 0%, rgba(150,180,255,0.14), transparent 60%)",
        }}
      />

      <span className="relative font-display text-5xl font-extrabold tracking-[-0.02em] text-white/22">
        {String(index + 1).padStart(2, "0")}
      </span>

      <div className="relative mt-auto">
        <span className="block h-px w-10 bg-white/25" />
        <h3 className="mt-6 font-display text-[1.6rem] font-semibold leading-[1.1] tracking-[-0.015em] text-white">
          {title}
        </h3>
        <p className="mt-4 text-[0.86rem] leading-relaxed text-white/55">{body}</p>
      </div>
    </article>
  );
}

/* --------------- mobile / reduced motion: a quiet stacked hall --------------- */
function GalleryStacked() {
  return (
    <section id="why" className="relative border-t border-line bg-ink py-24 section-x">
      <div className="mb-14 max-w-md">
        <div className="mb-5 flex items-center gap-4">
          <span className="h-px w-12 bg-accent" />
          <span className="text-eyebrow text-paper-dim">Why choose Southpage</span>
        </div>
        <h2 className="font-display text-3xl font-extrabold leading-[1.05] tracking-[-0.02em] text-paper">
          Built with intention.
        </h2>
        <p className="mt-5 text-sm leading-relaxed text-paper-faint">
          Every decision — typography, spacing, performance — made with purpose.
        </p>
      </div>
      <div className="flex flex-col gap-6">
        {WHY_CARDS.map((card, i) => (
          <div key={card.title} style={{ "--lit": "0.6" } as CSSProperties}>
            <Slab index={i} title={card.title} body={card.body} />
          </div>
        ))}
      </div>
    </section>
  );
}
