import type { PropsWithChildren } from "react";

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
  delay: _delay = 0,
  duration: _duration = 0.82,
  y: _y = 42,
  amount: _amount = 0.18,
  once: _once = false,
  as = "div",
}: MotionSectionProps) {
  void _delay;
  void _duration;
  void _y;
  void _amount;
  void _once;
  const StaticComp = as;
  return <StaticComp className={className}>{children}</StaticComp>;
}

export function MotionStagger({
  children,
  className,
  delay: _delay = 0,
  amount: _amount = 0.18,
  once: _once = false,
}: MotionSectionProps) {
  void _delay;
  void _amount;
  void _once;
  return <div className={className}>{children}</div>;
}

export function MotionStaggerItem({
  children,
  className,
  duration: _duration = 0.76,
  y: _y = 34,
}: MotionSectionProps) {
  void _duration;
  void _y;
  return <div className={className}>{children}</div>;
}
