"use client";

import { type ChangeEvent } from "react";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  type?: string;
  textarea?: boolean;
  error?: string;
  autoComplete?: string;
};

/**
 * Minimal field with a floating label (pure CSS via :placeholder-shown) and an
 * accent underline that draws in on focus. No box, no chrome — just the line.
 */
export function FloatingField({
  label,
  name,
  value,
  onChange,
  type = "text",
  textarea = false,
  error,
  autoComplete,
}: Props) {
  const base =
    "peer w-full border-b bg-transparent py-4 text-lg text-paper outline-none transition-colors placeholder:text-transparent " +
    (error ? "border-red-400/60" : "border-line-strong focus:border-transparent");

  const labelCls = cn(
    "pointer-events-none absolute left-0 top-4 origin-left text-lg text-paper-dim transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
    "peer-focus:-translate-y-5 peer-focus:scale-75 peer-focus:text-accent",
    "peer-[:not(:placeholder-shown)]:-translate-y-5 peer-[:not(:placeholder-shown)]:scale-75"
  );

  return (
    <div className="relative">
      {textarea ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={label}
          rows={4}
          className={cn(base, "resize-none")}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={label}
          autoComplete={autoComplete}
          className={base}
        />
      )}
      <label htmlFor={name} className={labelCls}>
        {label}
      </label>
      {/* Focus underline */}
      <span className="pointer-events-none absolute bottom-0 left-0 h-px w-0 bg-gradient-to-r from-accent to-violet transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] peer-focus:w-full" />
      {error && <span className="mt-2 block text-xs text-red-400">{error}</span>}
    </div>
  );
}
