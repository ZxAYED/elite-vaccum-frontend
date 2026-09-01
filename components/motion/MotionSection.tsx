"use client";

import type { PropsWithChildren } from "react";
import { motion, type Variants } from "framer-motion";

interface MotionSectionProps extends PropsWithChildren {
  className?: string;
  delay?: number;
  duration?: number;
  y?: number;
  amount?: number;
  once?: boolean;
  as?: "div" | "section";
}

const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: (delay = 0) => ({
    opacity: 1,
    transition: {
      delayChildren: delay,
      staggerChildren: 0.1,
    },
  }),
};

const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 34 },
  visible: (duration = 0.6) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration,
      ease: [0.21, 0.47, 0.32, 0.98],
    },
  }),
};

export function MotionSection({
  children,
  className,
  delay = 0,
  duration = 0.65,
  y = 34,
  amount = 0.18,
  once = true,
  as = "div",
}: MotionSectionProps) {
  const Comp = as === "section" ? motion.section : motion.div;

  return (
    <Comp
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount }}
      transition={{
        duration,
        delay,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      className={className}
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
  once = true,
}: MotionSectionProps) {
  return (
    <motion.div
      variants={staggerContainerVariants}
      custom={delay}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function MotionStaggerItem({
  children,
  className,
  duration = 0.6,
}: MotionSectionProps) {
  return (
    <motion.div
      variants={staggerItemVariants}
      custom={duration}
      className={className}
    >
      {children}
    </motion.div>
  );
}
