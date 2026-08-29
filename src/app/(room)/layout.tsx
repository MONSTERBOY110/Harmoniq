// Rooms are full-bleed: no app header, the room shell owns the whole viewport.
export default function RoomLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-dvh flex-col">{children}</div>;
}
