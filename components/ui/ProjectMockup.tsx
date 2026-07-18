"use client";

import { cn } from "@/lib/utils";

/**
 * Abstract, self-contained project "screenshot". No external images — each
 * mockup is a browser chrome + a layout tuned to the project's industry, keyed
 * to its accent, so every preview reads as a distinct site. `layout` selects
 * the composition (dashboard, portfolio, editorial, commerce, analytics, estate).
 */
export function ProjectMockup({
  accent,
  layout = "dashboard",
  className,
}: {
  accent: string;
  layout?: string;
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

      <div className="relative h-[calc(100%-38px)] w-full p-4">
        {layout === "dashboard" && <Dashboard accent={accent} />}
        {layout === "portfolio" && <Portfolio accent={accent} />}
        {layout === "editorial" && <Editorial accent={accent} />}
        {layout === "commerce" && <Commerce accent={accent} />}
        {layout === "analytics" && <Analytics accent={accent} />}
        {layout === "estate" && <Estate accent={accent} />}
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

/* ----------------------------- shared bits ----------------------------- */

function Bar({ w, accent }: { w: string; accent?: string }) {
  return (
    <span
      className="block h-2 rounded-full"
      style={{ width: w, background: accent ?? "rgba(250,250,250,0.14)" }}
    />
  );
}

function Panel({
  accent,
  className,
  strong = false,
  children,
}: {
  accent: string;
  className?: string;
  strong?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn("rounded-lg", className)}
      style={{
        background: strong
          ? `linear-gradient(150deg, ${accent}55, ${accent}12)`
          : "rgba(250,250,250,0.05)",
      }}
    >
      {children}
    </div>
  );
}

/* --------- Fintech: balance card + line chart + transactions --------- */
function Dashboard({ accent }: { accent: string }) {
  return (
    <div className="flex h-full gap-3">
      <div className="flex w-1/3 flex-col gap-2">
        <Panel accent={accent} strong className="flex-1 p-2.5">
          <Bar w="55%" accent={`${accent}cc`} />
          <span className="mt-2 block h-4 w-4/5 rounded bg-white/70" />
        </Panel>
        <Panel accent={accent} className="flex-1" />
      </div>
      <div className="flex flex-1 flex-col gap-2.5">
        <Panel accent={accent} className="relative flex-1 overflow-hidden p-2">
          <svg viewBox="0 0 120 40" preserveAspectRatio="none" className="h-full w-full">
            <polyline
              points="0,30 20,24 40,28 60,14 80,20 100,8 120,12"
              fill="none"
              stroke={accent}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <polygon points="0,30 20,24 40,28 60,14 80,20 100,8 120,12 120,40 0,40" fill={`${accent}22`} />
          </svg>
        </Panel>
        <div className="space-y-1.5">
          <Row accent={accent} />
          <Row accent={accent} />
        </div>
      </div>
    </div>
  );
}

function Row({ accent }: { accent: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-4 w-4 rounded-full" style={{ background: `${accent}55` }} />
      <Bar w="50%" />
      <span className="ml-auto h-2 w-8 rounded-full bg-white/20" />
    </div>
  );
}

/* --------- Architecture: tall block + stacked + caption --------- */
function Portfolio({ accent }: { accent: string }) {
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-1 gap-3">
        <Panel accent={accent} strong className="w-3/5" />
        <div className="flex flex-1 flex-col gap-3">
          <Panel accent={accent} className="flex-1" />
          <Panel accent={accent} className="flex-1" />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Bar w="30%" accent={`${accent}bb`} />
        <Bar w="15%" />
      </div>
    </div>
  );
}

/* --------- Travel: hero + thumbnail row + text --------- */
function Editorial({ accent }: { accent: string }) {
  return (
    <div className="flex h-full flex-col gap-2.5">
      <Panel accent={accent} strong className="relative flex-1 overflow-hidden p-2.5">
        <div className="absolute bottom-2.5 left-2.5 space-y-1.5">
          <span className="block h-3 w-24 rounded bg-white/80" />
          <Bar w="60px" />
        </div>
      </Panel>
      <div className="grid grid-cols-3 gap-2.5">
        <Panel accent={accent} className="h-8" />
        <Panel accent={accent} className="h-8" strong />
        <Panel accent={accent} className="h-8" />
      </div>
    </div>
  );
}

/* --------- Fashion: product cards + prices --------- */
function Commerce({ accent }: { accent: string }) {
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <Bar w="22%" accent={`${accent}cc`} />
        <div className="flex gap-1.5">
          <span className="h-2 w-2 rounded-full bg-white/25" />
          <span className="h-2 w-2 rounded-full bg-white/15" />
        </div>
      </div>
      <div className="grid flex-1 grid-cols-3 gap-2.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <Panel accent={accent} strong={i === 1} className="flex-1" />
            <Bar w="70%" />
            <Bar w="40%" accent={`${accent}88`} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* --------- SaaS: stat tiles + bar chart --------- */
function Analytics({ accent }: { accent: string }) {
  const bars = [40, 65, 50, 80, 60, 95];
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="grid grid-cols-3 gap-2.5">
        {[0, 1, 2].map((i) => (
          <Panel key={i} accent={accent} strong={i === 0} className="p-2">
            <span className="block h-3 w-8 rounded bg-white/70" />
            <Bar w="70%" accent={`${accent}66`} />
          </Panel>
        ))}
      </div>
      <Panel accent={accent} className="flex flex-1 items-end gap-2 p-2.5">
        {bars.map((h, i) => (
          <span
            key={i}
            className="flex-1 rounded-t"
            style={{
              height: `${h}%`,
              background: i === bars.length - 1 ? accent : `${accent}44`,
            }}
          />
        ))}
      </Panel>
    </div>
  );
}

/* --------- Property: map block + listing cards --------- */
function Estate({ accent }: { accent: string }) {
  return (
    <div className="flex h-full gap-3">
      <Panel accent={accent} strong className="relative w-1/2 overflow-hidden">
        <span
          className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full ring-4"
          style={{ background: accent, boxShadow: `0 0 0 4px ${accent}33` }}
        />
      </Panel>
      <div className="flex flex-1 flex-col gap-2.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <Panel accent={accent} className="h-8 w-10 shrink-0" strong={i === 0} />
            <div className="flex-1 space-y-1.5">
              <Bar w="80%" />
              <Bar w="45%" accent={`${accent}77`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
