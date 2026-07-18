"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Project } from "@/lib/data";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AnimatedText } from "@/components/ui/AnimatedText";
import { GradientReveal } from "@/components/ui/GradientReveal";
import { Reveal } from "@/components/ui/Reveal";
import { Counter } from "@/components/ui/Counter";
import { ProjectMockup } from "@/components/ui/ProjectMockup";

export function ProjectDetail({
  project,
  next,
}: {
  project: Project;
  next: Project;
}) {
  return (
    <>
      <Navbar immediate />

      <main className="pt-[var(--header-h)]">
        {/* Hero */}
        <section className="relative overflow-hidden section-x pt-16 md:pt-24">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(60% 50% at 20% 0%, ${project.accent}22, transparent 60%)`,
            }}
          />
          <div className="relative">
            <Link
              href="/#work"
              data-cursor="hover"
              className="group inline-flex items-center gap-2 text-sm text-paper-dim transition-colors hover:text-paper"
            >
              <span className="transition-transform duration-300 group-hover:-translate-x-1">
                ←
              </span>
              All work
            </Link>

            <div className="mt-10 flex items-center gap-3 text-eyebrow text-paper-dim">
              <span className="h-2 w-2 rounded-full" style={{ background: project.accent }} />
              {project.category}
              <span className="h-px w-8 bg-line-strong" />
              {project.year}
            </div>

            <h1 className="mt-6 text-hero font-display font-extrabold text-paper">
              <AnimatedText text={project.title} by="char" play stagger={0.03} />
            </h1>
            <div className="mt-2 text-display font-display">
              <GradientReveal text={project.tagline} className="text-[0.5em] leading-tight" />
            </div>
          </div>
        </section>

        {/* Hero mockup */}
        <section className="section-x mt-16 md:mt-24">
          <Reveal>
            <div
              className="relative mx-auto aspect-[16/10] w-full max-w-5xl rounded-2xl p-3 md:p-5"
              style={{ background: `linear-gradient(160deg, ${project.accent}22, transparent)` }}
            >
              <ProjectMockup accent={project.accent} layout={project.layout} />
            </div>
          </Reveal>
        </section>

        {/* Overview + meta */}
        <section className="section-x mt-24 md:mt-36">
          <div className="grid gap-12 md:grid-cols-[1.5fr_1fr] md:gap-20">
            <div>
              <p className="text-eyebrow text-accent">Overview</p>
              <p className="mt-6 font-display text-2xl leading-snug text-paper md:text-3xl">
                {project.overview}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-8 border-t border-line pt-8 md:border-l md:border-t-0 md:pl-12 md:pt-0">
              <Meta label="Client" values={[project.client]} />
              <Meta label="Timeframe" values={[project.timeframe]} />
              <Meta label="Services" values={project.services} />
              <Meta label="Deliverables" values={project.deliverables} />
            </div>
          </div>
        </section>

        {/* Results */}
        <section className="section-x mt-24 md:mt-32">
          <div className="grid grid-cols-1 gap-10 border-y border-line py-14 sm:grid-cols-3">
            {project.results.map((r, i) => (
              <Reveal key={r.label} delay={i * 0.08} className="text-center sm:text-left">
                <Counter
                  value={r.value}
                  suffix={r.suffix}
                  className="block font-display text-6xl font-bold tabular-nums tracking-[-0.03em] text-paper md:text-7xl"
                />
                <p className="mt-3 text-sm text-paper-dim">{r.label}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Story */}
        <section className="section-x mt-24 md:mt-36">
          <div className="mx-auto max-w-3xl space-y-16">
            <Story label="The challenge" body={project.challenge} />
            <Story label="Our approach" body={project.approach} accent={project.accent} />
            <Story label="The outcome" body={project.outcome} />
          </div>
        </section>

        {/* Next project */}
        <section className="section-x mt-28 md:mt-40">
          <Link
            href={`/work/${next.id}`}
            data-cursor="view"
            data-cursor-label="View"
            className="group block border-t border-line py-16 text-center"
          >
            <p className="text-eyebrow text-paper-faint">Next project</p>
            <h2 className="mt-6 inline-flex items-center gap-5 font-display text-5xl font-extrabold tracking-[-0.02em] text-paper transition-colors group-hover:text-accent-bright md:text-8xl">
              {next.title}
              <span
                className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-line-strong transition-transform duration-500 group-hover:translate-x-2"
                style={{ borderColor: `${next.accent}66` }}
              >
                →
              </span>
            </h2>
            <p className="mt-4 text-sm text-paper-dim">{next.category}</p>
          </Link>
        </section>
      </main>

      <Footer />
    </>
  );
}

function Meta({ label, values }: { label: string; values: readonly string[] }) {
  return (
    <div>
      <p className="text-eyebrow text-paper-faint">{label}</p>
      <ul className="mt-3 space-y-1">
        {values.map((v) => (
          <li key={v} className="text-sm text-paper md:text-base">
            {v}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Story({
  label,
  body,
  accent,
}: {
  label: string;
  body: string;
  accent?: string;
}) {
  return (
    <Reveal>
      <div className="flex items-center gap-4">
        <span
          className="h-px w-10"
          style={{ background: accent ?? "var(--color-line-strong)" }}
        />
        <p className="text-eyebrow text-paper-dim">{label}</p>
      </div>
      <motion.p className="mt-6 text-xl leading-relaxed text-paper-dim md:text-2xl">
        {body}
      </motion.p>
    </Reveal>
  );
}
