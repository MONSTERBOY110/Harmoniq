import { MicIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A stage-lit card standing in for the reference's concert photography: one gel colour,
 * a lens flare, film grain, and a caption. No figure is drawn; light is the subject.
 * Purely synthetic, labelled as demo by its parent.
 */
export function StageCard({
  hue,
  caption,
  label,
  landscape,
  className,
}: {
  hue: number;
  caption: string;
  label: string;
  landscape?: boolean;
  className?: string;
}) {
  return (
    <figure className={cn("group", className)}>
      <div
        className={cn(
          "relative overflow-hidden rounded-[6px] border border-line",
          landscape ? "aspect-[13/10]" : "aspect-[4/5]",
        )}
        style={{
          background: [
            // Key light from above, in the gel colour.
            `radial-gradient(90% 55% at 50% 12%, oklch(0.78 0.15 ${hue} / 0.95), oklch(0.6 0.16 ${hue} / 0.55) 35%, transparent 70%)`,
            // Haze filling the room.
            `radial-gradient(120% 80% at 50% 60%, oklch(0.42 0.12 ${hue} / 0.35), transparent 75%)`,
            // A cooler fill bouncing off the floor.
            `radial-gradient(80% 45% at 50% 100%, oklch(0.5 0.14 ${(hue + 200) % 360} / 0.5), transparent 70%)`,
            "#0a0b0b",
          ].join(", "),
        }}
      >
        {/* Lens flare: a hot core and a soft streak. */}
        <div
          aria-hidden="true"
          className="absolute top-[10%] left-1/2 size-[18%] -translate-x-1/2 rounded-full"
          style={{
            background: `radial-gradient(circle, rgba(255,255,255,0.95), oklch(0.9 0.08 ${hue} / 0.6) 40%, transparent 70%)`,
            filter: "blur(2px)",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute top-[13%] left-1/2 h-px w-[140%] -translate-x-1/2"
          style={{
            background: `linear-gradient(90deg, transparent, oklch(0.9 0.08 ${hue} / 0.7), transparent)`,
          }}
        />
        {/* Grain */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.16] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='120' height='120' filter='url(%23n)' opacity='0.6'/></svg>\")",
          }}
        />
        <MicIcon
          aria-hidden="true"
          className="absolute right-[10%] bottom-[10%] size-[14%] -rotate-[20deg] text-ink/80"
        />
        <span className="absolute top-2 left-2 rounded-[4px] bg-ground/70 px-1.5 py-0.5 text-[10px] text-ink backdrop-blur">
          {label}
        </span>
      </div>
      <figcaption className="mt-2 text-xs text-ink">{caption}</figcaption>
    </figure>
  );
}
