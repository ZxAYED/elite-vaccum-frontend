"use client";

import type { PropsWithChildren } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

const sectionEase = [0.22, 1, 0.36, 1] as const;

interface MotionSectionProps extends PropsWithChildren {
  className?: string;
  delay?: number;
  duration?: number;
  y?: number;
  amount?: number;
  once?: boolean;
  as?: "div" | "section";
}

export function MotionSection({
  children,
  className,
  delay = 0,
  duration = 0.82,
  y = 42,
  amount = 0.18,
  once = false,
  as = "div",
}: MotionSectionProps) {
  const reduceMotion = useReducedMotion();
  const Comp = as === "section" ? motion.section : motion.div;

  if (reduceMotion) {
    const StaticComp = as;
    return <StaticComp className={className}>{children}</StaticComp>;
  }

  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y, filter: "blur(10px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ amount, once }}
      transition={{ duration, delay, ease: sectionEase }}
    >
      {children}
    </Comp>
  );
}

export function MotionStagger({
  children,
  className,
  delay = 0,
  amount = 0.18,
  once = false,
}: MotionSectionProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ amount, once }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            delayChildren: delay,
            staggerChildren: 0.16,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function MotionStaggerItem({
  children,
  className,
  duration = 0.76,
  y = 34,
}: MotionSectionProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y, filter: "blur(8px)" },
        visible: {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: { duration, ease: sectionEase },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
