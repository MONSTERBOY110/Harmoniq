import { Logo } from "@/components/brand/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <aside className="gel-wash relative hidden flex-col justify-between overflow-hidden p-10 lg:flex">
        <Logo />
        <div className="max-w-xl">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-muted">Now singing</p>
          <p className="font-lyric mt-4 text-3xl leading-tight text-ink-faint xl:text-4xl">
            Somewhere a room is waiting
          </p>
          <p
            className="font-lyric mt-2 text-3xl leading-tight text-transparent xl:text-4xl"
            style={{
              backgroundImage:
                "linear-gradient(90deg, var(--amber) 0 58%, var(--ink-faint) 58%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
            }}
          >
            for a song you never sing alone
          </p>
          <p className="font-lyric mt-2 text-3xl leading-tight text-ink-faint/60 xl:text-4xl">
            share the code, count it in
          </p>
        </div>
        <p className="text-sm text-ink-muted">A room, a code, a song. Sing together on a call.</p>
      </aside>
      <main className="flex flex-col px-6 py-8 sm:px-12">
        <div className="lg:hidden">
          <Logo />
        </div>
        <div className="flex flex-1 items-center justify-center py-10">{children}</div>
      </main>
    </div>
  );
}
