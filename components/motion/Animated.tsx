"use client";

import type { PropsWithChildren } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

const easing = [0.22, 1, 0.36, 1] as const;

interface FadeInProps extends PropsWithChildren {
  className?: string;
  delay?: number;
  duration?: number;
  amount?: number;
  once?: boolean;
  y?: number;
}

interface PressableProps extends PropsWithChildren {
  className?: string;
}

export function FadeIn({
  children,
  className,
  delay = 0,
  duration = 0.72,
  amount = 0.24,
  once = true,
  y = 30,
}: FadeInProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount }}
      transition={{
        duration,
        delay,
        ease: easing,
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerGroup({
  children,
  className,
  delay = 0,
  amount = 0.22,
  once = true,
}: FadeInProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            delayChildren: delay,
            staggerChildren: 0.1,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  duration = 0.68,
  y = 28,
}: FadeInProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration,
            ease: easing,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function Pressable({ children, className }: PressableProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={cn("inline-flex", className)}>{children}</div>;
  }

  return (
    <motion.div
      className={cn("inline-flex", className)}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{
        type: "spring",
        stiffness: 380,
        damping: 24,
        mass: 0.8,
      }}
    >
      {children}
    </motion.div>
  );
}
