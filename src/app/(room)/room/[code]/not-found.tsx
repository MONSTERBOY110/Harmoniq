import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function RoomNotFound() {
  return (
    <main className="flex flex-1 flex-col">
      <div className="p-6">
        <Logo href="/rooms" />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-muted">No such room</p>
        <h1 className="font-display mt-3 text-3xl font-medium text-ink">
          That code does not open anything
        </h1>
        <p className="mt-3 max-w-sm text-ink-muted">
          Check the six characters with your host. Codes look like ABC-DEF and never use the letters
          I, L, or O.
        </p>
        <Button className="mt-8" size="lg" nativeButton={false} render={<Link href="/rooms" />}>
          Back to rooms
        </Button>
      </div>
    </main>
  );
}
