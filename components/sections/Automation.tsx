"use client";

import { useReducedMotion } from "framer-motion";
import { useIsMobile } from "@/hooks/useMediaQuery";

/* ==================================================================== *
 * Automation is no longer a section of its own on desktop — it is a
 * chapter of the one ribbon, rendered inside the Light journey
 * (WhySouthpage) as a transformation of the same sculpture. Here we only
 * provide the calm editorial fallback for mobile / reduced motion, where
 * the 3D journey is replaced by stacked lists.
 * ==================================================================== */

const CAPABILITIES = [
  "Workflow Automation",
  "AI Assistants",
  "Business Integrations",
  "Customer Systems",
] as const;

export function Automation() {
  const reduced = useReducedMotion();
  const mobile = useIsMobile();
  // on desktop the ribbon carries Automation inside the Light journey
  if (!mobile && !reduced) return null;
  return <AutomationStacked />;
}

/* --------------- mobile / reduced motion: a calm editorial list --------------- */
function AutomationStacked() {
  return (
    <section id="automation" className="relative border-t border-line bg-ink py-24 section-x">
      <div className="mb-14 text-center">
        <div className="mb-5 flex items-center justify-center gap-4">
          <span className="h-px w-12 bg-violet" />
          <span className="text-eyebrow text-paper-dim">Smart automation</span>
        </div>
        <h2 className="mx-auto max-w-md font-display text-3xl font-extrabold leading-[1.05] tracking-[-0.02em] text-paper">
          One stream. Many systems.
        </h2>
        <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-paper-dim">
          A single connected flow that quietly runs the repetitive work — so no
          enquiry is missed and no opportunity is overlooked.
        </p>
      </div>

      <div className="mx-auto flex max-w-lg flex-col gap-12">
        {CAPABILITIES.map((c, i) => (
          <div key={c} className="text-center">
            <span className="font-display text-xs font-semibold tracking-[0.28em] text-violet">
              0{i + 1}
            </span>
            <h3 className="mt-3 font-display text-[1.9rem] font-extrabold leading-[1.05] tracking-[-0.03em] text-paper">
              {c}
            </h3>
          </div>
        ))}
      </div>

      <p className="mx-auto mt-16 max-w-md text-center font-display text-xl text-paper">
        Complex systems become simple.
      </p>
    </section>
  );
}
