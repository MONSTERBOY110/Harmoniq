import type { Metadata } from "next";
import { UserAvatar } from "@/components/brand/user-avatar";
import { Separator } from "@/components/ui/separator";
import { DisplayNameForm } from "@/features/auth/display-name-form";
import { requireServerUser } from "@/lib/firebase/session";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireServerUser("/settings");

  return (
    <main className="max-w-2xl">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-muted">Settings</p>
      <h1 className="font-display mt-2 text-3xl font-medium text-ink">Your account</h1>

      <section className="mt-8 flex items-center gap-4">
        <UserAvatar
          uid={user.uid}
          name={user.displayName}
          email={user.email}
          photoURL={user.photoURL}
          className="size-14 text-xl"
        />
        <div>
          <p className="font-medium text-ink">{user.displayName ?? "Singer"}</p>
          <p className="text-sm text-ink-muted">{user.email}</p>
          <p className="mt-1 text-xs text-ink-faint">
            Your picture comes from Google when you sign in with it. Otherwise we use your initials.
          </p>
        </div>
      </section>

      <Separator className="my-8" />

      <section>
        <h2 className="text-lg font-semibold text-ink">Display name</h2>
        <div className="mt-4">
          <DisplayNameForm initialName={user.displayName ?? ""} />
        </div>
      </section>
    </main>
  );
}
