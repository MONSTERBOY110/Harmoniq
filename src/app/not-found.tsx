import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col">
      <div className="p-6">
        <Logo />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-ink-muted">(404)</p>
        <h1 className="font-display mt-4 text-3xl text-ink sm:text-4xl">No song on this page.</h1>
        <p className="mt-3 max-w-sm text-ink-muted">
          The address does not exist. Rooms live at /room/ followed by a six-character code.
        </p>
        <Button className="mt-8" nativeButton={false} render={<Link href="/" />}>
          Back to the start
        </Button>
      </div>
    </main>
  );
}
