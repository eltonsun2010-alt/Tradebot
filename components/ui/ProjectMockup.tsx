"use client";

import { cn } from "@/lib/utils";

/**
 * Abstract, self-contained project "screenshot". No external images — each
 * mockup is a browser chrome + a gradient layout keyed to the project accent,
 * so previews stay crisp, theme-consistent and weightless for Lighthouse.
 * `variant` (0–5) picks a distinct internal composition.
 */
export function ProjectMockup({
  accent,
  variant = 0,
  className,
}: {
  accent: string;
  variant?: number;
  className?: string;
}) {
  const wash = `radial-gradient(120% 120% at 20% 0%, ${accent}2e, transparent 55%), radial-gradient(100% 100% at 100% 100%, ${accent}1a, transparent 60%), #0b0b0f`;

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden rounded-[10px] border border-line-strong",
        className
      )}
      style={{ background: wash }}
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-1.5 border-b border-line px-3 py-2.5">
        <span className="h-2 w-2 rounded-full bg-white/25" />
        <span className="h-2 w-2 rounded-full bg-white/15" />
        <span className="h-2 w-2 rounded-full bg-white/10" />
        <span
          className="ml-3 h-2.5 flex-1 rounded-full"
          style={{ background: `linear-gradient(90deg, ${accent}40, transparent)` }}
        />
      </div>

      {/* Composition */}
      <div className="relative h-[calc(100%-38px)] w-full p-4">
        {variant % 3 === 0 && <LayoutHero accent={accent} />}
        {variant % 3 === 1 && <LayoutGrid accent={accent} />}
        {variant % 3 === 2 && <LayoutSplit accent={accent} />}
      </div>

      {/* Sheen */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(115deg, rgba(255,255,255,0.06) 0%, transparent 30%, transparent 70%, rgba(255,255,255,0.03) 100%)",
        }}
      />
    </div>
  );
}

function Bar({ w, accent, dim = 0.5 }: { w: string; accent?: string; dim?: number }) {
  return (
    <span
      className="block h-2 rounded-full"
      style={{
        width: w,
        background: accent ?? "rgba(250,250,250,0.14)",
        opacity: accent ? 1 : dim,
      }}
    />
  );
}

function LayoutHero({ accent }: { accent: string }) {
  return (
    <div className="flex h-full flex-col justify-between">
      <div className="space-y-2">
        <Bar w="22%" accent={`${accent}cc`} />
        <div className="pt-2 space-y-2">
          <Bar w="80%" />
          <Bar w="65%" />
          <Bar w="72%" />
        </div>
      </div>
      <div className="flex items-end gap-3">
        <span
          className="h-16 flex-1 rounded-lg"
          style={{ background: `linear-gradient(160deg, ${accent}55, ${accent}12)` }}
        />
        <span className="h-16 flex-1 rounded-lg bg-white/[0.05]" />
      </div>
    </div>
  );
}

function LayoutGrid({ accent }: { accent: string }) {
  return (
    <div className="grid h-full grid-cols-3 grid-rows-2 gap-2.5">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className="rounded-lg"
          style={{
            background:
              i % 4 === 0
                ? `linear-gradient(150deg, ${accent}55, ${accent}10)`
                : "rgba(250,250,250,0.05)",
          }}
        />
      ))}
    </div>
  );
}

function LayoutSplit({ accent }: { accent: string }) {
  return (
    <div className="flex h-full gap-3">
      <div
        className="h-full w-2/5 rounded-lg"
        style={{ background: `linear-gradient(200deg, ${accent}66, ${accent}10)` }}
      />
      <div className="flex flex-1 flex-col justify-center gap-2.5">
        <Bar w="70%" accent={`${accent}bb`} />
        <Bar w="90%" />
        <Bar w="55%" />
        <Bar w="80%" />
        <span className="mt-1 h-6 w-24 rounded-full bg-white/[0.06]" />
      </div>
    </div>
  );
}
