import { Loader2Icon } from "lucide-react";
import { Logo } from "@/components/brand/logo";

export default function RoomLoading() {
  return (
    <main className="flex flex-1 flex-col" aria-busy="true" aria-label="Opening the room">
      <div className="p-6">
        <Logo href="/rooms" />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-ink-muted">
        <Loader2Icon className="size-5 animate-spin text-amber" />
        <p className="text-sm">Opening the room</p>
      </div>
    </main>
  );
}
