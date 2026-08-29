import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Logo, LogoMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

/** Quiet top bar: wordmark left, one small link right. The real navigation is the pill below. */
export function LandingTopBar({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center justify-between px-5 sm:px-8">
        <Logo className="text-lg" />
        <Link
          href={signedIn ? "/rooms" : "/signin"}
          className="text-sm text-ink-muted transition-colors hover:text-ink"
        >
          {signedIn ? "Your rooms" : "Sign in"}
        </Link>
      </div>
    </div>
  );
}

const LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#stage", label: "The stage" },
  { href: "#expect", label: "Expect" },
];

/** Fixed glass pill at the bottom, like a stage monitor's control strip. */
export function PillNav({ signedIn }: { signedIn: boolean }) {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 sm:bottom-6"
    >
      <div
        className={cn(
          "flex items-center gap-1 rounded-[11px] border border-line bg-[rgba(222,222,222,0.04)] p-1.5 pl-3 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl",
        )}
      >
        <Link href="/" aria-label="Harmoniq home" className="mr-1 flex items-center">
          <LogoMark className="size-5" />
        </Link>
        <ul className="hidden items-center sm:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="rounded-md px-3 py-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <span className="mx-1 hidden h-5 w-px bg-line-strong sm:block" aria-hidden="true" />
        <Link
          href={signedIn ? "/rooms" : "/signup"}
          className="inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-amber px-3.5 text-sm font-medium text-amber-ink transition-colors hover:bg-amber-deep"
        >
          Open a room
          <ArrowRightIcon className="size-4" />
        </Link>
      </div>
    </nav>
  );
}
