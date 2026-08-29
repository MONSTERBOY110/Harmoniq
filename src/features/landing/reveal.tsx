"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Reveals its children (or `[data-reveal]` descendants, staggered) once they scroll into view.
 * Content is visible by default; motion is added only when the visitor allows it.
 */
export function Reveal({
  children,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "ol" | "ul";
}) {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const root = scope.current;
        if (!root) return;
        const targets = root.querySelectorAll("[data-reveal]");
        gsap.from(targets.length ? targets : root, {
          y: 24,
          opacity: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.08,
          scrollTrigger: { trigger: root, start: "top 82%", once: true },
        });
      });
    },
    { scope },
  );

  return (
    // @ts-expect-error dynamic tag with a shared ref type
    <Tag ref={scope} className={cn(className)}>
      {children}
    </Tag>
  );
}
