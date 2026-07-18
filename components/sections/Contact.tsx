"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AnimatedText } from "@/components/ui/AnimatedText";
import { GradientReveal } from "@/components/ui/GradientReveal";
import { FloatingField } from "@/components/ui/FloatingField";
import { Reveal } from "@/components/ui/Reveal";
import { MeshBackground } from "@/components/ui/MeshBackground";
import { EASE_LUX } from "@/lib/motion";

type Status = "idle" | "sending" | "sent";
type Fields = { name: string; business: string; email: string; phone: string; message: string };
const EMPTY: Fields = { name: "", business: "", email: "", phone: "", message: "" };

export function Contact() {
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Partial<Fields>>({});
  const [status, setStatus] = useState<Status>("idle");

  const update = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFields((f) => ({ ...f, [name]: value }));
    if (errors[name as keyof Fields]) setErrors((p) => ({ ...p, [name]: undefined }));
  };

  const validate = () => {
    const next: Partial<Fields> = {};
    if (!fields.name.trim()) next.name = "Please add your name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) next.email = "Enter a valid email";
    if (fields.message.trim().length < 10) next.message = "Tell us a little more";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (status !== "idle") return;
    if (!validate()) return;
    setStatus("sending");
    setTimeout(() => {
      setStatus("sent");
      setFields(EMPTY);
      setTimeout(() => setStatus("idle"), 3500);
    }, 1400);
  };

  return (
    <section id="contact" className="relative overflow-hidden border-t border-line py-28 section-x md:py-40">
      <MeshBackground className="opacity-70" opacity={0.7} />

      <div className="relative grid gap-16 md:grid-cols-2 md:gap-24">
        {/* Invitation */}
        <div>
          <div className="mb-6 flex items-center gap-4">
            <span className="h-px w-12 bg-accent" />
            <span className="text-eyebrow text-paper-dim">Let&rsquo;s build something great</span>
          </div>
          <h2 className="font-display text-4xl font-extrabold leading-[1.08] tracking-[-0.02em] text-paper sm:text-5xl lg:text-6xl">
            <AnimatedText text="Your next customer is already searching." by="word" />{" "}
            <GradientReveal text="Let's make them like what they find." delay={0.1} />
          </h2>

          <p className="mt-8 max-w-md text-base leading-relaxed text-paper-dim md:text-lg">
            Launching your first business, replacing an outdated website, or
            streamlining enquiries with automation — we&rsquo;d love to help.
            Every project starts with a conversation. No pressure, no jargon.
          </p>

          <div className="mt-12 space-y-6">
            <div>
              <p className="text-eyebrow text-paper-faint">Email</p>
              <a href="mailto:Contact.southpage@gmail.com" data-cursor="hover" className="mt-1 block font-display text-xl text-paper transition-colors hover:text-accent-bright md:text-2xl">
                Contact.southpage@gmail.com
              </a>
            </div>
            <div>
              <p className="text-eyebrow text-paper-faint">Phone</p>
              <a href="tel:0432691898" data-cursor="hover" className="mt-1 block font-display text-xl text-paper transition-colors hover:text-accent-bright md:text-2xl">
                0432 691 898
              </a>
            </div>
            <p className="flex items-center gap-2 text-sm text-paper-dim">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
              </span>
              Usually responds within 24 hours.
            </p>
          </div>
        </div>

        {/* Form */}
        <Reveal delay={0.1}>
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-8">
            <FloatingField label="Name" name="name" value={fields.name} onChange={update} error={errors.name} autoComplete="name" />
            <FloatingField label="Business" name="business" value={fields.business} onChange={update} autoComplete="organization" />
            <div className="grid gap-8 sm:grid-cols-2">
              <FloatingField label="Email" name="email" type="email" value={fields.email} onChange={update} error={errors.email} autoComplete="email" />
              <FloatingField label="Phone" name="phone" type="tel" value={fields.phone} onChange={update} autoComplete="tel" />
            </div>
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
        </Reveal>
      </div>
    </section>
  );
}

function SubmitButton({ status }: { status: Status }) {
  const label = status === "sending" ? "Sending" : status === "sent" ? "Message sent" : "Start Your Project";
  return (
    <button
      type="submit"
      data-cursor="hover"
      disabled={status !== "idle"}
      className="group relative mt-2 inline-flex h-14 items-center justify-center gap-3 self-start overflow-hidden rounded-full bg-paper px-8 text-sm font-semibold text-ink transition-colors disabled:cursor-default"
    >
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
            {status === "idle" && "→"}
            {status === "sending" && <span className="h-3.5 w-3.5 animate-spin rounded-full border border-current border-t-transparent" />}
            {status === "sent" && "✓"}
          </motion.span>
        </AnimatePresence>
      </span>
    </button>
  );
}
