"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Easing function — ease-out cubic.
 */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Animated number counter from `start` to `end` over `duration` milliseconds.
 * Uses requestAnimationFrame + easing for smooth animation.
 * Resets and re-animates when `end` or `duration` changes.
 *
 * @param end - Target value to animate to
 * @param duration - Animation duration in ms (default: 1000)
 * @param start - Starting value (default: 0)
 * @param enabled - Whether the animation is active (default: true)
 * @returns Current animated value (not rounded — caller decides precision)
 */
export function useCountUp(
  end: number,
  duration: number = 1000,
  start: number = 0,
  enabled: boolean = true
): number {
  const [value, setValue] = useState(start);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const startValueRef = useRef(start);

  useEffect(() => {
    if (!enabled) {
      setValue(end);
      return;
    }

    // Capture the value we're animating from
    startValueRef.current = value;
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);
      const currentValue =
        startValueRef.current + (end - startValueRef.current) * easedProgress;

      setValue(currentValue);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
    // We intentionally use `value` at effect setup time via ref; don't re-run on `value`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [end, duration, enabled]);

  return value;
}
