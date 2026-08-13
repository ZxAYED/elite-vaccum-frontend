import type { PropsWithChildren } from "react";

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
}

export function FadeIn({
  children,
  className,
  delay: _delay = 0,
  duration: _duration = 0.65,
  amount: _amount = 0.2,
  animateOnLoad: _animateOnLoad = false,
  once: _once = true,
  x: _x = 0,
  y: _y = 24,
}: FadeInProps) {
  void _delay;
  void _duration;
  void _amount;
  void _animateOnLoad;
  void _once;
  void _x;
  void _y;
  return <div className={className}>{children}</div>;
}

export function StaggerGroup({
  children,
  className,
  delay: _delay = 0,
  amount: _amount = 0.2,
  once: _once = true,
}: FadeInProps) {
  void _delay;
  void _amount;
  void _once;
  return <div className={className}>{children}</div>;
}

export function StaggerItem({
  children,
  className,
  duration: _duration = 0.6,
  y: _y = 24,
}: FadeInProps) {
  void _duration;
  void _y;
  return <div className={className}>{children}</div>;
}

export function Pressable({ children, className }: PressableProps) {
  return <div className={cn("inline-flex", className)}>{children}</div>;
}
