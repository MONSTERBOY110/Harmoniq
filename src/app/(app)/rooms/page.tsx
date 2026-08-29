import type { Metadata } from "next";
import { CreateRoomCard, JoinRoomCard } from "@/features/rooms/create-join";
import { RecentRooms } from "@/features/rooms/recent-rooms";
import { listRecentRooms } from "@/features/rooms/server";
import { requireServerUser } from "@/lib/firebase/session";

export const metadata: Metadata = { title: "Rooms" };

export default async function RoomsPage() {
  const user = await requireServerUser("/rooms");
  const recent = await listRecentRooms(user.uid).catch(() => []);
  const firstName = user.displayName?.trim().split(/\s+/)[0];

  return (
    <main className="space-y-10">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-muted">Rooms</p>
        <h1 className="font-display mt-2 text-3xl font-medium text-ink sm:text-4xl">
          {firstName ? `Ready when you are, ${firstName}` : "Ready when you are"}
        </h1>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <CreateRoomCard suggestedName={firstName ? `${firstName}'s room` : "Friday night"} />
        <JoinRoomCard />
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-ink-muted">Recent rooms</h2>
        <RecentRooms rooms={recent} />
      </section>
    </main>
  );
}
