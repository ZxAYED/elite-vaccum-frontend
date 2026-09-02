"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-[background-color,border-color,color,box-shadow,opacity] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)] aria-invalid:border-[var(--destructive)] select-none cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_4px_14px_-2px_rgba(28,79,80,0.35)] hover:bg-primary/95",
        destructive:
          "bg-[var(--destructive)] text-white hover:opacity-90 shadow-xs",
        outline:
          "border border-slate-200 bg-white text-slate-800 shadow-xs hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-xs",
        ghost:
          "hover:bg-[var(--brand-soft)] hover:text-primary",
        link: "text-primary underline-offset-4 hover:underline",
        soft:
          "bg-[var(--brand-soft)] text-primary shadow-none hover:bg-[#dff0ec]",
      },
      size: {
        default: "h-12 px-6 py-3 text-sm sm:text-base has-[>svg]:px-5",
        sm: "h-9.5 gap-1.5 px-4 py-2 text-xs sm:text-sm has-[>svg]:px-3",
        lg: "h-13 px-8 py-3.5 text-base has-[>svg]:px-6",
        pill: "h-12 px-6 py-3 rounded-full text-sm sm:text-base has-[>svg]:px-5",
        icon: "size-11",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const MotionSlot = motion.create(Slot);

export interface ButtonProps
  extends Omit<
      React.ButtonHTMLAttributes<HTMLButtonElement>,
      "onAnimationStart" | "onDragStart" | "onDragEnd" | "onDrag"
    >,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    if (asChild) {
      return (
        <MotionSlot
          ref={ref as React.Ref<HTMLElement>}
          data-slot="button"
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 450, damping: 25 }}
          className={cn(buttonVariants({ variant, size, className }))}
          {...(props as Record<string, unknown>)}
        />
      );
    }

    return (
      <motion.button
        ref={ref}
        data-slot="button"
        whileHover={{ scale: 1.015 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 450, damping: 25 }}
        className={cn(buttonVariants({ variant, size, className }))}
        {...(props as Record<string, unknown>)}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
