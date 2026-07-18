"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Photo with a graceful gradient fallback. The gradient sits behind a real
 * image that fades/scales in once loaded; if the image ever fails, the
 * gradient stays so a slot never looks broken. Reveals on scroll.
 */
export function Img({
  src,
  alt,
  className,
  fallback,
  rounded = "rounded-3xl",
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  fallback: string;
  rounded?: string;
  priority?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={cn("relative overflow-hidden", rounded, className)}
      style={{ background: fallback }}
    >
      {!failed && (
        <motion.img
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          initial={false}
          animate={{ opacity: loaded ? 1 : 0, scale: loaded ? 1 : 1.06 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </motion.div>
  );
}
