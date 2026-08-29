"use client";

import { CheckIcon } from "lucide-react";
import { SINGER_COLORS } from "@/lib/singers/colors";
import { cn } from "@/lib/utils";

type Props = {
  value: string | null;
  /** Colours other people in the room already use. Still selectable, just marked. */
  taken: Set<string>;
  onChange: (key: string) => void;
  className?: string;
};

/** Eight stage gels. The one you pick lights up the lines that are yours to sing. */
export function ColorPicker({ value, taken, onChange, className }: Props) {
  return (
    <div role="radiogroup" aria-label="Your colour on stage" className={cn("flex flex-wrap gap-2", className)}>
      {SINGER_COLORS.map((color) => {
        const selected = value === color.key;
        const used = taken.has(color.key) && !selected;
        return (
          <button
            key={color.key}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`${color.name}${used ? ", taken by someone else" : ""}`}
            title={color.name}
            onClick={() => onChange(color.key)}
            className={cn(
              "relative flex size-9 items-center justify-center rounded-full border-2 transition-transform duration-150 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-95",
              selected ? "scale-110 border-ink" : "border-transparent hover:scale-105",
              used && "opacity-45",
            )}
            style={{ backgroundColor: color.hex, color: color.ink }}
          >
            {selected ? <CheckIcon className="size-4" strokeWidth={3} /> : null}
          </button>
        );
      })}
    </div>
  );
}
