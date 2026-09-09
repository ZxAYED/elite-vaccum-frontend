"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface CarouselContextProps {
  currentIndex: number;
  direction: number;
  totalSlides: number;
  transitionDuration: number;
  canScrollPrev: boolean;
  canScrollNext: boolean;
  scrollPrev: () => void;
  scrollNext: () => void;
  goToSlide: (index: number) => void;
  orientation?: "horizontal" | "vertical";
}

const CarouselContext = React.createContext<CarouselContextProps | null>(null);

export function useCarousel() {
  const context = React.useContext(CarouselContext);
  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />");
  }
  return context;
}

export interface CarouselProps extends React.HTMLAttributes<HTMLDivElement> {
  autoPlay?: boolean;
  interval?: number; // default 3000 ms
  transitionDuration?: number; // duration of transition in ms, default 700ms
  loop?: boolean;
  orientation?: "horizontal" | "vertical";
  totalSlides?: number;
  onSlideChange?: (index: number) => void;
}

export const Carousel = React.forwardRef<HTMLDivElement, CarouselProps>(
  (
    {
      autoPlay = false,
      interval = 3000,
      transitionDuration = 700,
      loop = true,
      orientation = "horizontal",
      totalSlides: explicitTotalSlides,
      className,
      children,
      onSlideChange,
      ...props
    },
    ref,
  ) => {
    // `direction` drives the enter/exit offsets so a wrap-around still travels
    // one slide width instead of whipping across the whole track.
    const [{ index: currentIndex, direction }, setSlide] = React.useState({
      index: 0,
      direction: 1,
    });
    const [detectedTotalSlides, setDetectedTotalSlides] = React.useState(0);
    const totalSlides = explicitTotalSlides !== undefined ? explicitTotalSlides : detectedTotalSlides;
    const [isHovered, setIsHovered] = React.useState(false);

    const canScrollPrev = loop || currentIndex > 0;
    const canScrollNext = loop || currentIndex < totalSlides - 1;

    const scrollPrev = React.useCallback(() => {
      setSlide((prev) => {
        if (totalSlides <= 0) return { index: 0, direction: -1 };
        const next = prev.index <= 0 ? (loop ? totalSlides - 1 : 0) : prev.index - 1;
        onSlideChange?.(next);
        return { index: next, direction: -1 };
      });
    }, [loop, onSlideChange, totalSlides]);

    const scrollNext = React.useCallback(() => {
      setSlide((prev) => {
        if (totalSlides <= 0) return { index: 0, direction: 1 };
        const next = prev.index >= totalSlides - 1 ? (loop ? 0 : prev.index) : prev.index + 1;
        onSlideChange?.(next);
        return { index: next, direction: 1 };
      });
    }, [loop, onSlideChange, totalSlides]);

    const goToSlide = React.useCallback(
      (index: number) => {
        if (totalSlides <= 0) return;
        const clamped = Math.max(0, Math.min(index, totalSlides - 1));
        setSlide((prev) => {
          onSlideChange?.(clamped);
          return { index: clamped, direction: clamped >= prev.index ? 1 : -1 };
        });
      },
      [onSlideChange, totalSlides],
    );

    // Auto-advance interval
    React.useEffect(() => {
      if (!autoPlay || totalSlides <= 1 || isHovered) return;

      const timer = setInterval(() => {
        setSlide((prev) => {
          const next = prev.index >= totalSlides - 1 ? (loop ? 0 : prev.index) : prev.index + 1;
          onSlideChange?.(next);
          return { index: next, direction: 1 };
        });
      }, interval);

      return () => clearInterval(timer);
    }, [autoPlay, interval, totalSlides, loop, isHovered, onSlideChange]);

    return (
      <CarouselContext.Provider
        value={{
          currentIndex,
          direction,
          totalSlides,
          transitionDuration,
          canScrollPrev,
          canScrollNext,
          scrollPrev,
          scrollNext,
          goToSlide,
          orientation,
        }}
      >
        <div
          ref={ref}
          role="region"
          aria-roledescription="carousel"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={cn("relative focus-visible:outline-none", className)}
          {...props}
        >
          {/* Automatically track number of child slides */}
          <SlideCounter setTotalSlides={setDetectedTotalSlides}>
            {children}
          </SlideCounter>
        </div>
      </CarouselContext.Provider>
    );
  },
);
Carousel.displayName = "Carousel";

function SlideCounter({
  children,
  setTotalSlides,
}: {
  children: React.ReactNode;
  setTotalSlides: React.Dispatch<React.SetStateAction<number>>;
}) {
  let count = 0;
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && (child.props as { children?: React.ReactNode })?.children) {
      const nested = (child.props as { children?: React.ReactNode }).children;
      count = React.Children.count(nested);
    }
  });

  React.useEffect(() => {
    setTotalSlides((prev) => (prev !== count ? count : prev));
  }, [count, setTotalSlides]);

  return <>{children}</>;
}

const slideVariants: Variants = {
  enter: (direction: number) => ({
    x: direction >= 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    x: "0%",
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction >= 0 ? "-100%" : "100%",
    opacity: 0,
  }),
};

const fadeVariants: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

export const CarouselContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { currentIndex, direction, transitionDuration } = useCarousel();
  const prefersReducedMotion = useReducedMotion();

  const slides = React.Children.toArray(children);
  const activeSlide = slides[currentIndex] ?? slides[0] ?? null;
  const duration = Math.max(transitionDuration, 1) / 1000;

  return (
    <div
      ref={ref}
      className={cn("relative h-full w-full overflow-hidden rounded-md", className)}
      {...props}
    >
      {/* Invisible sizing layer: keeps intrinsic slide height while the visible
          slides are absolutely positioned so they can cross-animate. */}
      <div aria-hidden inert className="invisible h-full w-full">
        {activeSlide}
      </div>

      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={prefersReducedMotion ? fadeVariants : slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { duration, ease: [0.32, 0.72, 0, 1] },
            opacity: { duration: duration * 0.6, ease: "easeInOut" },
          }}
          className="absolute inset-0 h-full w-full will-change-transform"
        >
          {activeSlide}
        </motion.div>
      </AnimatePresence>
    </div>
  );
});
CarouselContent.displayName = "CarouselContent";

export const CarouselItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      role="group"
      aria-roledescription="slide"
      className={cn("h-full w-full min-w-0", className)}
      {...props}
    />
  );
});
CarouselItem.displayName = "CarouselItem";

export const CarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon-sm", ...props }, ref) => {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel();

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        "pointer-events-auto absolute z-10 size-8 rounded-full border border-teal-700/20 bg-primary text-white shadow-md backdrop-blur-xs disabled:pointer-events-none disabled:opacity-30",
        orientation === "horizontal"
          ? "top-1/2 left-2 -translate-y-1/2"
          : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
        className,
      )}
      disabled={!canScrollPrev}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        scrollPrev();
      }}
      aria-label="Previous image slide"
      {...props}
    >
      <ChevronLeft className="size-4 text-white" />
    </Button>
  );
});
CarouselPrevious.displayName = "CarouselPrevious";

export const CarouselNext = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon-sm", ...props }, ref) => {
  const { orientation, scrollNext, canScrollNext } = useCarousel();

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn(
        "pointer-events-auto absolute z-10 size-8 rounded-full border border-teal-700/20 bg-primary text-white shadow-md backdrop-blur-xs disabled:pointer-events-none disabled:opacity-30",
        orientation === "horizontal"
          ? "top-1/2 right-2 -translate-y-1/2"
          : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
        className,
      )}
      disabled={!canScrollNext}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        scrollNext();
      }}
      aria-label="Next image slide"
      {...props}
    >
      <ChevronRight className="size-4 text-white" />
    </Button>
  );
});
CarouselNext.displayName = "CarouselNext";

export function CarouselIndicators({ className }: { className?: string }) {
  const { currentIndex, totalSlides, goToSlide } = useCarousel();
  if (totalSlides <= 1) return null;

  return (
    <div
      className={cn(
        "pointer-events-auto absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-slate-900/30 px-2 py-1 backdrop-blur-xs",
        className,
      )}
    >
      {Array.from({ length: totalSlides }).map((_, index) => (
        <button
          key={index}
          type="button"
          aria-label={`Go to slide ${index + 1}`}
          aria-current={index === currentIndex}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            goToSlide(index);
          }}
          className="flex h-3 items-center"
        >
          <motion.span
            className="block h-1.5 rounded-full bg-white"
            animate={{
              width: index === currentIndex ? 16 : 6,
              opacity: index === currentIndex ? 1 : 0.6,
            }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
          />
        </button>
      ))}
    </div>
  );
}
