import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { UserMenu } from "@/features/auth/user-menu";
import { requireServerUser } from "@/lib/firebase/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireServerUser();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="bar-material sticky top-0 z-40 border-b">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Logo href="/rooms" />
            <nav aria-label="Main" className="hidden items-center gap-1 sm:flex">
              <Link
                href="/rooms"
                className="rounded-md px-3 py-1.5 text-sm text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
              >
                Rooms
              </Link>
            </nav>
          </div>
          <UserMenu user={user} />
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
