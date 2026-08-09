"use client";

import type { PropsWithChildren } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

const easing = [0.22, 1, 0.36, 1] as const;

interface FadeInProps extends PropsWithChildren {
  className?: string;
  delay?: number;
  y?: number;
}

interface PressableProps extends PropsWithChildren {
  className?: string;
}

export function FadeIn({
  children,
  className,
  delay = 0,
  y = 28,
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
      viewport={{ once: true, amount: 0.22 }}
      transition={{
        duration: 0.62,
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
      viewport={{ once: true, amount: 0.2 }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            delayChildren: delay,
            staggerChildren: 0.08,
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
            duration: 0.55,
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
      whileTap={{ scale: 0.9 }}
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
