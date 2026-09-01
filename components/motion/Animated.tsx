"use client";

import type { PropsWithChildren } from "react";
import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

interface FadeInProps extends PropsWithChildren {
  className?: string;
  delay?: number;
  duration?: number;
  amount?: number;
  once?: boolean;
  animateOnLoad?: boolean;
  x?: number;
  y?: number;
}

interface PressableProps extends PropsWithChildren {
  className?: string;
  scaleHover?: number;
  scaleTap?: number;
}

interface HoverCardProps extends PropsWithChildren {
  className?: string;
  yOffset?: number;
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
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: [0.21, 0.47, 0.32, 0.98],
    },
  },
};

export function FadeIn({
  children,
  className,
  delay = 0,
  duration = 0.65,
  amount = 0.2,
  animateOnLoad = false,
  once = true,
  x = 0,
  y = 24,
}: FadeInProps) {
  if (animateOnLoad) {
    return (
      <motion.div
        initial={{ opacity: 0, x, y }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{
          duration,
          delay,
          ease: [0.21, 0.47, 0.32, 0.98],
        }}
        className={className}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, amount }}
      transition={{
        duration,
        delay,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerGroup({
  children,
  className,
  delay = 0,
  amount = 0.15,
  once = true,
}: FadeInProps) {
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

export function StaggerItem({
  children,
  className,
}: FadeInProps) {
  return (
    <motion.div variants={staggerItemVariants} className={className}>
      {children}
    </motion.div>
  );
}

export function Pressable({
  children,
  className,
  scaleHover = 1.03,
  scaleTap = 0.96,
}: PressableProps) {
  return (
    <motion.div
      whileHover={{ scale: scaleHover }}
      whileTap={{ scale: scaleTap }}
      transition={{ type: "spring", stiffness: 450, damping: 20 }}
      className={cn("inline-flex", className)}
    >
      {children}
    </motion.div>
  );
}

export function HoverCard({
  children,
  className,
  yOffset = -6,
}: HoverCardProps) {
  return (
    <motion.div
      whileHover={{ y: yOffset }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export { motion };
