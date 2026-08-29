"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRightIcon,
  HeadphonesIcon,
  MicVocalIcon,
  MinusIcon,
  PauseIcon,
  PlusIcon,
  SkipForwardIcon,
  TimerResetIcon,
  UsersRoundIcon,
  VideoOffIcon,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { RoomCodeInput } from "@/features/rooms/room-code-input";
import { SINGER_COLORS } from "@/lib/singers/colors";
import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";
import { AUDIO_ENABLED, VIDEO_ENABLED } from "@/features/call/feature";

/* ------------------------------------------------------------------ */
/* Statement: three big light lines, the label's "about" register      */
/* ------------------------------------------------------------------ */

export function Statement() {
  return (
    <section id="how" className="mx-auto w-full max-w-[1400px] px-5 py-24 sm:px-8 lg:py-36" aria-label="What Harmoniq is">
      <Reveal>
        <p
          data-reveal
          className="font-display max-w-5xl text-[clamp(2rem,5vw,4.5rem)] leading-[1.05] text-ink"
        >
          Open a room, share a code,
          <br />
          <span className="text-ink-muted">search any song on YouTube,</span>
          <br />
          and sing it together
          <br />
          <span className="text-ink-muted">with lyrics that keep time.</span>
        </p>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Setlist: the real sequence, numbered like a songbook                */
/* ------------------------------------------------------------------ */

const STEPS = [
  {
    title: "Open a room",
    body: "One click. You are the host: you control the song, the order, and the timing.",
    visual: <CodeChipMock />,
  },
  {
    title: "Share the code",
    body: "Six letters or a link. Friends join from any browser, pick a colour, and check their mic.",
    visual: <ColourRowMock />,
  },
  {
    title: "Search any song",
    body: "Type a song in any language. Harmoniq finds the karaoke version on YouTube.",
    visual: <SearchRowMock />,
  },
  {
    title: "Sing together",
    body: "Everyone hears the same beat at the same moment, with the lyrics lit up as they come.",
    visual: <SweepMock />,
  },
];

export function Setlist() {
  return (
    <section className="mx-auto w-full max-w-[1400px] px-5 pb-24 sm:px-8 lg:pb-36" aria-labelledby="setlist-heading">
      <h2 id="setlist-heading" className="sr-only">
        The setlist
      </h2>
      <Reveal as="ol" className="divide-y divide-line border-y border-line">
        {STEPS.map((step, index) => (
          <li
            key={step.title}
            data-reveal
            className="grid items-center gap-4 py-6 sm:grid-cols-[4rem_1fr] lg:grid-cols-[6rem_minmax(0,1fr)_minmax(0,20rem)] lg:gap-10 lg:py-8"
          >
            <span className="font-mono text-sm text-ink-muted tabular">{String(index + 1).padStart(2, "0")}</span>
            <div className="min-w-0">
              <h3 className="font-display text-2xl text-ink sm:text-3xl">{step.title}</h3>
              <p className="mt-1.5 max-w-xl text-sm text-ink-muted sm:text-base">{step.body}</p>
            </div>
            <div className="relative sm:col-start-2 lg:col-start-3 lg:justify-self-end">
              <div className="inline-flex rounded-[8px] border border-line bg-surface p-3" aria-hidden="true">
                {step.visual}
              </div>
            </div>
          </li>
        ))}
      </Reveal>
    </section>
  );
}

function CodeChipMock() {
  return (
    <div className="inline-flex items-center gap-2 rounded-[6px] border border-line bg-surface px-3 py-1.5">
      <span className="font-mono text-sm tracking-[0.18em] text-ink tabular">K7Q-M2X</span>
      <span className="text-[10px] text-ink-faint">copy</span>
    </div>
  );
}

function ColourRowMock() {
  return (
    <div className="flex items-center gap-1.5" aria-hidden="true">
      {SINGER_COLORS.slice(0, 6).map((c, i) => (
        <span
          key={c.key}
          className={cn("size-6 rounded-full border-2", i === 1 ? "scale-110 border-ink" : "border-transparent")}
          style={{ backgroundColor: c.hex }}
        />
      ))}
    </div>
  );
}

function SearchRowMock() {
  return (
    <div className="w-full rounded-[6px] border border-line bg-surface p-2" aria-hidden="true">
      <div className="flex items-center gap-2">
        <div className="aspect-video w-14 rounded-[3px] bg-[radial-gradient(60%_60%_at_50%_30%,oklch(0.6_0.14_200/0.9),#0a0b0b)]" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-ink">Kesariya (Karaoke Version)</p>
          <p className="truncate text-[10px] text-ink-muted">Arijit Singh · 4:28</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-[4px] bg-surface-3 px-1.5 py-0.5 text-[10px] text-amber">
          <MicVocalIcon className="size-3" />
          Karaoke
        </span>
      </div>
    </div>
  );
}

function SweepMock() {
  return (
    <p
      aria-hidden="true"
      className="font-lyric text-xl text-transparent"
      style={{
        backgroundImage: "linear-gradient(90deg, var(--amber) 58%, var(--ink) 58%)",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
      }}
    >
      Look how they shine for you
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* Marquee                                                             */
/* ------------------------------------------------------------------ */

const MARQUEE = ["Sing together", "Any song", "Any language", "Duets in colour", "Lyrics in time"];

export function Marquee() {
  const items = [...MARQUEE, ...MARQUEE];
  return (
    <div className="overflow-hidden border-y border-line py-6" aria-hidden="true">
      <div className="animate-marquee flex w-max motion-reduce:animate-none">
        {[0, 1].map((copy) => (
          <ul key={copy} className="flex shrink-0 items-center">
            {items.map((item, i) => (
              <li key={`${copy}-${i}`} className="font-display flex items-center text-[clamp(2rem,4.5vw,4rem)] leading-none text-ink">
                <span className={i % 2 ? "text-ink-muted" : ""}>{item}</span>
                <span className="mx-6 inline-block size-2 rounded-full bg-amber sm:mx-10" />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Feature rows: zig-zag, each with a working-looking piece of UI      */
/* ------------------------------------------------------------------ */

const FEATURES = [
  {
    title: "Lyrics that keep time, and a host who can fix them",
    body: "Synced lyrics come from LRCLIB and sweep with the song. Karaoke intros run a little long? The host nudges the timing for everyone, or taps once when the next line begins.",
    visual: <OffsetMock />,
  },
  {
    title: "Who sings what, in colour",
    body: "Everyone picks a colour when they join. The host hands lines to singers, or alternates them in one tap. Your lines light up in your colour, so nobody talks over the chorus.",
    visual: <PartsMock />,
  },
  {
    title: "Play, pause, skip: the room follows the host",
    body: "The host's player is the clock. Everyone else drifts less than a quarter second, quietly corrected without a hard jump you would hear.",
    visual: <TransportMock />,
  },
];

export function FeatureRows() {
  return (
    <section id="stage" className="mx-auto w-full max-w-[1400px] px-5 py-24 sm:px-8 lg:py-36" aria-label="The stage">
      <div className="space-y-20 lg:space-y-32">
        {FEATURES.map((feature, index) => (
          <Reveal key={feature.title} className="grid items-center gap-10 lg:grid-cols-12">
            <div data-reveal className={cn("lg:col-span-5", index % 2 === 1 && "lg:order-2 lg:col-start-8")}>
              <h3 className="font-display text-3xl text-ink sm:text-4xl">{feature.title}</h3>
              <p className="mt-4 text-ink-muted">{feature.body}</p>
            </div>
            <div data-reveal className={cn("lg:col-span-6", index % 2 === 1 ? "lg:order-1 lg:col-start-1" : "lg:col-start-7")}>
              {feature.visual}
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Frame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("relative rounded-[10px] border border-line bg-surface p-4 sm:p-6", className)} aria-hidden="true">
      <span className="absolute -top-2.5 right-3 rounded-full border border-line bg-ground px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">
        Demo
      </span>
      {children}
    </div>
  );
}

function OffsetMock() {
  return (
    <Frame>
      <div className="space-y-2">
        <p className="font-lyric truncate text-base text-ink-faint">Look at the stars</p>
        <p
          className="font-lyric text-2xl text-transparent sm:text-3xl"
          style={{
            backgroundImage: "linear-gradient(90deg, var(--amber) 42%, var(--ink) 42%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
          }}
        >
          Look how they shine for you
        </p>
        <p className="font-lyric truncate text-base text-ink-muted">And everything you do</p>
      </div>
      <div className="mt-6 flex items-center gap-1 rounded-[6px] border border-line bg-ground px-2 py-1.5">
        <span className="mr-1 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-faint">Lyrics</span>
        <span className="inline-flex size-6 items-center justify-center rounded-[4px] text-ink-muted"><MinusIcon className="size-3.5" /></span>
        <span className="w-14 text-center font-mono text-xs text-ink-muted tabular">+0.5 s</span>
        <span className="inline-flex size-6 items-center justify-center rounded-[4px] text-ink-muted"><PlusIcon className="size-3.5" /></span>
        <span className="ml-1 inline-flex items-center gap-1 rounded-[4px] border border-line px-2 py-0.5 text-xs text-ink">
          <TimerResetIcon className="size-3" />
          Now
        </span>
      </div>
    </Frame>
  );
}

function PartsMock() {
  const rows = [
    { text: "Look at the stars", who: 0 },
    { text: "Look how they shine for you", who: 1 },
    { text: "And everything you do", who: null },
    { text: "Yeah, they were all yellow", who: 0 },
  ];
  const names = ["Priya", "Sam"];
  return (
    <Frame>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink">Who sings what</p>
        <span className="inline-flex items-center gap-1 rounded-[4px] border border-line px-2 py-0.5 text-xs text-ink">
          <UsersRoundIcon className="size-3" />
          Alternate lines
        </span>
      </div>
      <ul className="mt-3 space-y-1.5">
        {rows.map((row, i) => {
          const color = row.who === null ? null : SINGER_COLORS[row.who]!;
          return (
            <li
              key={i}
              className="flex items-center gap-3 rounded-[6px] border px-3 py-1.5"
              style={
                color
                  ? { backgroundColor: `${color.hex}1f`, borderColor: `${color.hex}66` }
                  : { borderColor: "var(--line)" }
              }
            >
              <span className="w-5 font-mono text-[10px] text-ink-faint tabular">{String(i + 1).padStart(2, "0")}</span>
              <span className="font-lyric min-w-0 flex-1 truncate text-sm text-ink">{row.text}</span>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={
                  color
                    ? { backgroundColor: color.hex, color: color.ink }
                    : { backgroundColor: "var(--amber)", color: "var(--amber-ink)" }
                }
              >
                {color ? names[row.who!] : "Everyone"}
              </span>
            </li>
          );
        })}
      </ul>
    </Frame>
  );
}

function TransportMock() {
  return (
    <Frame>
      <div className="grid grid-cols-3 gap-2">
        {["Priya", "Sam", "Lee"].map((name, i) => (
          <div
            key={name}
            className="flex aspect-video items-end rounded-[6px] border border-line p-1.5"
            style={{
              background: `radial-gradient(70% 70% at 50% 20%, oklch(0.62 0.13 ${[330, 172, 262][i]} / 0.8), #0a0b0b 80%)`,
            }}
          >
            <span className="rounded-[3px] bg-ground/70 px-1.5 py-0.5 text-[10px] text-ink">{name}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3 rounded-[6px] border border-line bg-ground px-3 py-2">
        <span className="inline-flex size-8 items-center justify-center rounded-full bg-amber text-amber-ink">
          <PauseIcon className="size-4" />
        </span>
        <span className="text-ink-muted"><SkipForwardIcon className="size-4" /></span>
        <span className="font-mono text-xs text-ink-muted tabular">1:24</span>
        <span className="relative h-1 flex-1 overflow-hidden rounded-full bg-line-strong">
          <span className="absolute inset-y-0 left-0 w-[31%] rounded-full bg-amber" />
        </span>
        <span className="font-mono text-xs text-ink-muted tabular">4:28</span>
      </div>
      <p className="mt-2 text-right font-mono text-[10px] text-ink-faint">drift 0.12 s, corrected</p>
    </Frame>
  );
}

/* ------------------------------------------------------------------ */
/* Disc: the record spins with the song of the night                    */
/* ------------------------------------------------------------------ */

export function Disc() {
  return (
    <section className="mx-auto w-full max-w-[1400px] px-5 py-12 sm:px-8 lg:py-24" aria-label="Now singing">
      <Reveal className="grid items-center gap-12 lg:grid-cols-12">
        <div data-reveal className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-full lg:col-span-6">
          <div
            className="animate-spin-slow absolute inset-0 rounded-full border border-line motion-reduce:animate-none"
            style={{
              background:
                "conic-gradient(from 210deg, rgba(255,255,255,0.10), transparent 25%, rgba(255,255,255,0.05) 50%, transparent 75%, rgba(255,255,255,0.10)), repeating-radial-gradient(circle at 50% 50%, #1c1d1d 0 2px, #101111 2px 5px)",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06), 0 30px 80px -30px rgba(0,0,0,0.9)",
            }}
            aria-hidden="true"
          >
            <div className="absolute inset-[34%] rounded-full bg-amber" />
            <div className="absolute inset-[34%] flex items-center justify-center rounded-full">
              <span className="font-display text-center text-xs leading-tight text-amber-ink">
                Harmoniq
                <br />
                <span className="font-mono text-[9px] tracking-[0.2em]">SIDE A</span>
              </span>
            </div>
            <div className="absolute inset-[48%] rounded-full bg-ground" />
          </div>
        </div>
        <div data-reveal className="lg:col-span-6">
          <h3 className="font-display text-3xl text-ink sm:text-4xl lg:text-5xl">
            Every night is a different record.
          </h3>
          <p className="mt-4 max-w-md text-ink-muted">
            There is no catalogue to run out of. If it is on YouTube, someone in the room can queue
            it, in Hindi, Spanish, Korean, or whatever the night calls for. Lyrics follow from an
            open database with more than a million synced songs.
          </p>
        </div>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* What to expect: honest about physics                                 */
/* ------------------------------------------------------------------ */

export function Expectations() {
  // The first two notes describe live microphones, so they only hold while voice is on. The last
  // one is the standing news about cameras, and drops out by itself when they come back.
  const callItems = [
    ...(AUDIO_ENABLED
      ? [
          {
            Icon: HeadphonesIcon,
            title: "Wear headphones",
            body: "Speakers leak the song into your mic and everyone hears an echo. Headphones fix it.",
          },
          {
            Icon: UsersRoundIcon,
            title: "Voices arrive a beat late",
            body: "Internet calls carry a small delay, roughly a tenth to a third of a second. The track stays in sync; your friends' voices trail it slightly.",
          },
        ]
      : []),
    ...(VIDEO_ENABLED
      ? []
      : [
          {
            Icon: VideoOffIcon,
            title: "Seeing each other is coming soon",
            body: "Cameras are off while we make them steady enough to sing to. You can hear each other, and the room keeps everyone on the same second.",
          },
        ]),
  ];

  const items = [
    ...callItems,
    {
      Icon: MicVocalIcon,
      title: "The instrumental comes from YouTube",
      body: "A small player stays visible beside the lyrics, as YouTube requires. Songs whose owners block embedding are left out of results.",
    },
  ];
  return (
    <section id="expect" className="mx-auto w-full max-w-[1400px] px-5 py-12 sm:px-8 lg:py-24" aria-labelledby="expect-heading">
      <Reveal className="rounded-[10px] border border-line bg-surface p-6 sm:p-10">
        <h2 id="expect-heading" data-reveal className="font-display text-2xl text-ink sm:text-3xl">
          Honest about the physics
        </h2>
        <ul className="mt-10 grid gap-8 sm:grid-cols-3">
          {items.map(({ Icon, title, body }) => (
            <li key={title} data-reveal className="flex gap-3">
              <Icon className="mt-0.5 size-5 shrink-0 text-amber" />
              <div>
                <p className="font-medium text-ink">{title}</p>
                <p className="mt-1 text-sm text-ink-muted">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Close: the code input, big                                           */
/* ------------------------------------------------------------------ */

export function JoinClose({ signedIn }: { signedIn: boolean }) {
  const router = useRouter();
  const [code, setCode] = useState("");

  function join(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (code.length !== 6) return;
    const target = `/room/${code}`;
    router.push(signedIn ? target : `/signin?next=${encodeURIComponent(target)}`);
  }

  return (
    <section className="grid-lines mx-auto w-full max-w-[1400px] px-5 py-24 sm:px-8 lg:py-40" aria-labelledby="close-heading">
      <Reveal className="text-center">
        <h2 id="close-heading" data-reveal className="font-display text-[clamp(2.5rem,7vw,6rem)] leading-[0.95] text-ink">
          Your friends are
          <br />
          warming up.
        </h2>
        <form data-reveal onSubmit={join} className="mx-auto mt-10 flex max-w-md flex-col items-center gap-3 sm:flex-row">
          <RoomCodeInput value={code} onChange={setCode} aria-label="Room code" className="w-full" />
          <Button type="submit" size="lg" disabled={code.length !== 6} className="w-full sm:w-auto">
            Join
            <ArrowRightIcon />
          </Button>
        </form>
        <p data-reveal className="mt-6 text-sm text-ink-muted">
          No code yet?{" "}
          <Link href={signedIn ? "/rooms" : "/signup"} className="text-ink underline-offset-4 hover:underline">
            Open a room
          </Link>{" "}
          and send one.
        </p>
      </Reveal>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-line pb-24">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-5 py-8 text-sm text-ink-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <Logo />
      </div>
    </footer>
  );
}
