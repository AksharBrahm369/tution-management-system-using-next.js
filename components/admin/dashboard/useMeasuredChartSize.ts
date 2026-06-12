"use client";

import React, { useState, useCallback, useRef } from "react";

export function useMeasuredChartSize(height: number) {
  const [width, setWidth] = useState(0);
  const observerRef = useRef<ResizeObserver | null>(null);

  const ref = useCallback((element: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (element) {
      const updateWidth = () => {
        const nextWidth = Math.floor(element.getBoundingClientRect().width);
        setWidth(nextWidth > 0 ? nextWidth : 0);
      };

      updateWidth();
      const observer = new ResizeObserver(updateWidth);
      observer.observe(element);
      observerRef.current = observer;
    }
  }, []);

  return [ref, { width, height, isReady: width > 0 }] as const;
}

