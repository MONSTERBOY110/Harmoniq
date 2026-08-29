"use client";

import { useEffect, useRef, type RefObject } from "react";

/** A ref that always holds the latest value, updated after render (never during it). */
export function useLatest<T>(value: T): RefObject<T> {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  });
  return ref;
}
