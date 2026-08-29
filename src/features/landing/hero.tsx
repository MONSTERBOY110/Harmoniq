"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowDownIcon } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { RoomCodeInput } from "@/features/rooms/room-code-input";
import { DemoStage } from "./demo-stage";
import { StageCard } from "./stage-card";

gsap.registerPlugin(useGSAP);

const RING_TEXT = "SING TOGETHER · ANY SONG · ANY LANGUAGE · ";

export function Hero({ signedIn }: { signedIn: boolean }) {
  const scope = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [code, setCode] = useState("");

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        tl.from("[data-hero-mark]", { y: 40, opacity: 0, duration: 1.1 })
          .from("[data-hero-card]", { y: 30, opacity: 0, duration: 0.9, stagger: 0.15 }, "-=0.7")
          .from("[data-hero-label]", { opacity: 0, y: 10, duration: 0.6 }, "-=0.6")
          .from("[data-hero-demo]", { y: 60, opacity: 0, rotate: 0, duration: 1.1 }, "-=0.5")
          .from("[data-hero-ring]", { scale: 0.7, opacity: 0, duration: 0.8 }, "-=0.8");

        // The floating cards drift with the pointer, gently.
        const cards = gsap.utils.toArray<HTMLElement>("[data-hero-card]");
        const onMove = (event: MouseEvent) => {
          const dx = (event.clientX / window.innerWidth - 0.5) * 2;
          const dy = (event.clientY / window.innerHeight - 0.5) * 2;
          cards.forEach((card, i) => {
            const depth = i === 0 ? 10 : 16;
            gsap.to(card, { x: dx * depth, y: dy * depth, duration: 1.2, ease: "power2.out" });
          });
        };
        window.addEventListener("mousemove", onMove);
        return () => window.removeEventListener("mousemove", onMove);
      });
    },
    { scope },
  );

  function join(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (code.length !== 6) return;
    const target = `/room/${code}`;
    router.push(signedIn ? target : `/signin?next=${encodeURIComponent(target)}`);
  }

  return (
    <section ref={scope} className="grid-lines relative min-h-dvh overflow-hidden pt-16">
      {/* Floating stage cards, corner-anchored like the reference's photographs. */}
      <div data-hero-card className="absolute top-16 left-4 hidden w-44 lg:block xl:w-52">
        <StageCard hue={172} caption="Any song, any language" label="Sam is singing" />
      </div>
      <div data-hero-card className="absolute top-[38%] right-4 hidden w-56 lg:block xl:w-64">
        <StageCard hue={330} caption="Lyrics that keep time" label="Priya, host" landscape />
      </div>

      <div className="relative mx-auto flex w-full max-w-[1400px] flex-col items-center px-5 pt-[9vh] sm:px-8">
        <h1
          data-hero-mark
          className="font-display relative text-[18vw] leading-[0.9] text-ink sm:text-[15vw] lg:text-[11.5vw]"
        >
          Harmoniq
          <LogoMark className="absolute -top-1 -right-6 size-[3vw] min-h-5 min-w-5 sm:-right-8 lg:-right-10" />
        </h1>
        <p data-hero-label className="mt-6 text-base text-ink sm:text-lg">
          Karaoke night, on a call
        </p>
        <p data-hero-label className="mt-2 max-w-md text-center text-sm text-ink-muted">
          Open a room, share a code, and sing together with friends anywhere, to any song on
          YouTube, with lyrics that keep time.
        </p>

        <form
          data-hero-label
          onSubmit={join}
          className="mt-6 flex items-center gap-2"
          aria-label="Join with a code"
        >
          <RoomCodeInput
            value={code}
            onChange={setCode}
            aria-label="Room code"
            className="h-10 w-40 text-base tracking-[0.25em] placeholder:tracking-[0.25em] md:text-base"
          />
          <Button type="submit" variant="secondary" disabled={code.length !== 6}>
            Join
          </Button>
        </form>

        {/* Tilted stacked demo, with the rotating ring at its left edge. */}
        <div className="relative mt-12 w-full max-w-2xl pb-28 sm:mt-16">
          <div
            data-hero-ring
            className="pointer-events-none absolute top-1/2 z-20 hidden size-40 -translate-y-1/2 lg:-left-[8.75rem] lg:block lg:size-48"
            aria-hidden="true"
          >
            <svg viewBox="0 0 200 200" className="size-full animate-spin-slow motion-reduce:animate-none">
              <defs>
                <path id="ring-path" d="M100,100 m-72,0 a72,72 0 1,1 144,0 a72,72 0 1,1 -144,0" />
              </defs>
              <text className="fill-ink-muted font-mono text-[11px] tracking-[0.28em]">
                <textPath href="#ring-path">{RING_TEXT + RING_TEXT}</textPath>
              </text>
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-ink-muted">
              <ArrowDownIcon className="size-5" />
            </span>
          </div>

          <div
            aria-hidden="true"
            className="absolute inset-x-6 -top-3 bottom-3 rotate-[-3deg] rounded-[10px] border border-line bg-surface-2"
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-3 -top-1.5 bottom-1.5 rotate-[1.5deg] rounded-[10px] border border-line bg-surface"
          />
          <div data-hero-demo className="relative rounded-[10px] border border-line-strong bg-ground p-3 sm:p-4">
            <DemoStage />
          </div>
        </div>
      </div>
    </section>
  );
}
