"use client";

import { useEffect, useState } from "react";

interface ScrollPosition {
  scrollY: number;
  isScrolled: boolean;
}

/**
 * Tracks window scroll position with throttled updates for performance.
 * @param throttleMs - Throttle interval in ms (default: 100)
 * @returns { scrollY, isScrolled } — current scroll Y and whether page is scrolled past 0
 */
export function useScrollPosition(throttleMs: number = 100): ScrollPosition {
  const [scrollPosition, setScrollPosition] = useState<ScrollPosition>({
    scrollY: 0,
    isScrolled: false,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    let ticking = false;
    let lastRun = 0;

    const handleScroll = () => {
      const now = Date.now();
      if (now - lastRun < throttleMs) {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(() => {
            const y = window.scrollY;
            setScrollPosition({ scrollY: y, isScrolled: y > 0 });
            ticking = false;
            lastRun = now;
          });
        }
        return;
      }
      const y = window.scrollY;
      setScrollPosition({ scrollY: y, isScrolled: y > 0 });
      lastRun = now;
    };

    // Set initial
    const initialY = window.scrollY;
    setScrollPosition({ scrollY: initialY, isScrolled: initialY > 0 });

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [throttleMs]);

  return scrollPosition;
}
