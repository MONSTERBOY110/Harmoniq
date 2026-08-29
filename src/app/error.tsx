"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col">
      <div className="p-6">
        <Logo />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-ink-muted">(Something broke)</p>
        <h1 className="font-display mt-4 text-3xl text-ink sm:text-4xl">The stage lights tripped.</h1>
        <p className="mt-3 max-w-sm text-ink-muted">
          This page hit an error. Trying again usually fixes it; if not, head back to your rooms.
        </p>
        {error.digest ? (
          <p className="mt-2 font-mono text-xs text-ink-faint">ref {error.digest}</p>
        ) : null}
        <div className="mt-8 flex gap-3">
          <Button onClick={reset}>Try again</Button>
          <Button variant="outline" nativeButton={false} render={<Link href="/rooms" />}>
            Back to rooms
          </Button>
        </div>
      </div>
    </main>
  );
}
