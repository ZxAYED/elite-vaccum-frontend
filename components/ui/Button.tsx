import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-control)] text-sm font-medium transition-[background-color,border-color,color,box-shadow,opacity,transform] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)] aria-invalid:border-[var(--destructive)]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_20px_40px_-28px_rgba(28,79,80,0.72)] hover:opacity-95",
        destructive:
          "bg-[var(--destructive)] text-white hover:opacity-90",
        outline:
          "border bg-[var(--surface)] shadow-xs hover:bg-[var(--brand-soft)] hover:text-primary",
        secondary:
          "bg-secondary text-secondary-foreground hover:opacity-90",
        ghost:
          "hover:bg-[var(--brand-soft)] hover:text-primary",
        link: "text-primary underline-offset-4 hover:underline",
        soft:
          "bg-[var(--brand-soft)] text-primary shadow-none hover:bg-[#dff0ec]",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        sm: "h-9 gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-11 px-6 has-[>svg]:px-4",
        pill: "h-12 px-6 text-[15px] font-semibold has-[>svg]:px-5",
        icon: "size-10",
        "icon-sm": "size-8",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
