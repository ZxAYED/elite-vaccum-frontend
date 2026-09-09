"use client";

import { useEffect, useState } from "react";

/**
 * Defers a fast-changing value (a search box) so it can be used as a query
 * parameter without firing a request per keystroke.
 *
 * The `setState` here runs from a timer callback, not synchronously in the
 * effect body, which is what the React Compiler's `set-state-in-effect` rule
 * forbids.
 */
export function useDebouncedValue<T>(value: T, delayMs = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
