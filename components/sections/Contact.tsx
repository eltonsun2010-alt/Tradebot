"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AnimatedText } from "@/components/ui/AnimatedText";
import { GradientReveal } from "@/components/ui/GradientReveal";
import { FloatingField } from "@/components/ui/FloatingField";
import { EASE_LUX } from "@/lib/motion";

type Status = "idle" | "sending" | "sent";
type Fields = { name: string; email: string; message: string };

const EMPTY: Fields = { name: "", email: "", message: "" };

export function Contact() {
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Partial<Fields>>({});
  const [status, setStatus] = useState<Status>("idle");

  const update = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFields((f) => ({ ...f, [name]: value }));
    if (errors[name as keyof Fields])
      setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const next: Partial<Fields> = {};
    if (!fields.name.trim()) next.name = "Please add your name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email))
      next.email = "Enter a valid email";
    if (fields.message.trim().length < 10)
      next.message = "Tell us a little more";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (status !== "idle") return;
    if (!validate()) return;
    setStatus("sending");
    // No backend in this demo — simulate the round-trip, then celebrate.
    setTimeout(() => {
      setStatus("sent");
      setFields(EMPTY);
      setTimeout(() => setStatus("idle"), 3200);
    }, 1400);
  };

  return (
    <section
      id="contact"
      className="relative overflow-hidden border-t border-line py-28 section-x md:py-40"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(50% 60% at 15% 0%, rgba(59,130,246,0.10), transparent 60%), radial-gradient(45% 50% at 100% 100%, rgba(124,58,237,0.10), transparent 60%)",
        }}
      />

      <div className="relative grid gap-16 md:grid-cols-2 md:gap-24">
        {/* Left — invitation */}
        <div>
          <div className="mb-6 flex items-center gap-4">
            <span className="h-px w-12 bg-accent" />
            <span className="text-eyebrow text-paper-dim">Start a project</span>
          </div>
          <h2 className="text-display font-display font-extrabold text-paper">
            <AnimatedText text="Let’s make" by="word" />
            <br />
            <GradientReveal text="something rare." className="text-[1.05em]" />
          </h2>

          <p className="mt-8 max-w-md text-base leading-relaxed text-paper-dim md:text-lg">
            Tell us where you want to go. We reply to every enquiry within one
            working day.
          </p>

          <div className="mt-12 space-y-6">
            <div>
              <p className="text-eyebrow text-paper-faint">Email</p>
              <a
                href="mailto:hello@southpage.studio"
                data-cursor="hover"
                className="mt-1 block font-display text-xl text-paper transition-colors hover:text-accent-bright md:text-2xl"
              >
                hello@southpage.studio
              </a>
            </div>
            <div>
              <p className="text-eyebrow text-paper-faint">Studio</p>
              <p className="mt-1 font-display text-xl text-paper md:text-2xl">
                Remote · London · New York
              </p>
            </div>
          </div>
        </div>

        {/* Right — form */}
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-8">
          <FloatingField
            label="Your name"
            name="name"
            value={fields.name}
            onChange={update}
            error={errors.name}
            autoComplete="name"
          />
          <FloatingField
            label="Email address"
            name="email"
            type="email"
            value={fields.email}
            onChange={update}
            error={errors.email}
            autoComplete="email"
          />
          <FloatingField
            label="Tell us about your project"
            name="message"
            value={fields.message}
            onChange={update}
            error={errors.message}
            textarea
          />

          <SubmitButton status={status} />
        </form>
      </div>
    </section>
  );
}

function SubmitButton({ status }: { status: Status }) {
  const label =
    status === "sending"
      ? "Sending"
      : status === "sent"
        ? "Message sent"
        : "Send message";

  return (
    <button
      type="submit"
      data-cursor="hover"
      disabled={status !== "idle"}
      className="group relative mt-2 inline-flex h-14 items-center justify-center gap-3 self-start overflow-hidden rounded-full bg-paper px-8 text-sm font-semibold text-ink transition-colors disabled:cursor-default"
    >
      {/* Hover fill sweep */}
      <span className="absolute inset-0 origin-left scale-x-0 bg-gradient-to-r from-accent to-violet transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100 group-disabled:scale-x-0" />
      <span className="relative z-10 flex items-center gap-2 transition-colors duration-300 group-hover:text-paper">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={label}
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -12, opacity: 0 }}
            transition={{ duration: 0.28, ease: EASE_LUX }}
            className="flex items-center gap-2"
          >
            {label}
            {status === "idle" && <Arrow />}
            {status === "sending" && <Spinner />}
            {status === "sent" && <Check />}
          </motion.span>
        </AnimatePresence>
      </span>
    </button>
  );
}

function Arrow() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
      <path
        d="M3.5 11.5 11.5 3.5M11.5 3.5H5.5M11.5 3.5V9.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Spinner() {
  return (
    <span className="h-3.5 w-3.5 animate-spin rounded-full border border-current border-t-transparent" />
  );
}

function Check() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
      <motion.path
        d="M3 8l3 3 6-7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, ease: EASE_LUX }}
      />
    </svg>
  );
}
