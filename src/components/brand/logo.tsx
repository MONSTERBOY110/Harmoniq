import Link from "next/link";
import { cn } from "@/lib/utils";

/** Three level bars: the mark reads as a small meter, the product's stage lights. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("size-6", className)}
      fill="currentColor"
    >
      <rect x="3" y="10" width="4" height="10" rx="2" className="text-gel-rose" fill="currentColor" />
      <rect x="10" y="4" width="4" height="16" rx="2" className="text-amber" fill="currentColor" />
      <rect x="17" y="8" width="4" height="12" rx="2" className="text-gel-teal" fill="currentColor" />
    </svg>
  );
}

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "font-display-condensed inline-flex items-center gap-2 text-xl font-medium text-ink",
        className,
      )}
      aria-label="Harmoniq home"
    >
      <LogoMark />
      <span>Harmoniq</span>
    </Link>
  );
}
