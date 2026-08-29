"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FlameIcon, HandIcon, HeartIcon, LaughIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ReactionKind } from "@/lib/livekit/data-messages";
import { cn } from "@/lib/utils";
import { useRoomMessages } from "./use-room-messages";

const KINDS: { kind: ReactionKind; label: string; Icon: typeof HandIcon; color: string }[] = [
  { kind: "clap", label: "Applause", Icon: HandIcon, color: "var(--amber)" },
  { kind: "fire", label: "Fire", Icon: FlameIcon, color: "#F07C5A" },
  { kind: "heart", label: "Love", Icon: HeartIcon, color: "var(--gel-rose)" },
  { kind: "laugh", label: "Laugh", Icon: LaughIcon, color: "var(--gel-teal)" },
];

type Floating = { id: number; kind: ReactionKind; x: number; drift: number };

const MAX_ON_SCREEN = 24;

/**
 * Ephemeral reactions: a tap sends a lossy LiveKit message and floats an icon up over the call
 * on every screen. Nothing is stored. When a song ends, everyone gets a round of applause.
 */
export function useReactions(songEndSignal: string | null) {
  const [floating, setFloating] = useState<Floating[]>([]);
  const nextId = useRef(1);
  const lastSignal = useRef<string | null>(songEndSignal);

  const burst = useCallback((kind: ReactionKind, count = 1) => {
    setFloating((current) => {
      const added: Floating[] = Array.from({ length: count }, () => ({
        id: nextId.current++,
        kind,
        x: 10 + Math.random() * 80,
        drift: (Math.random() - 0.5) * 40,
      }));
      return [...current, ...added].slice(-MAX_ON_SCREEN);
    });
  }, []);

  const publish = useRoomMessages("reaction", (message) => {
    if (message.t === "reaction") burst(message.kind);
  });

  const react = useCallback(
    (kind: ReactionKind) => {
      burst(kind);
      publish({ t: "reaction", kind }, { reliable: false });
    },
    [burst, publish],
  );

  // A song finished (or moved on): applause for the singers.
  useEffect(() => {
    if (lastSignal.current !== null && songEndSignal !== lastSignal.current) {
      const timer = window.setTimeout(() => burst("clap", 6), 0);
      lastSignal.current = songEndSignal;
      return () => window.clearTimeout(timer);
    }
    lastSignal.current = songEndSignal;
  }, [songEndSignal, burst]);

  const remove = useCallback((id: number) => {
    setFloating((current) => current.filter((f) => f.id !== id));
  }, []);

  return { floating, react, remove };
}

export function ReactionBar({
  onReact,
  className,
}: {
  onReact: (kind: ReactionKind) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1", className)} role="group" aria-label="Reactions">
      {KINDS.map(({ kind, label, Icon, color }) => (
        <Tooltip key={kind}>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={label}
                onClick={() => onReact(kind)}
                className="active:scale-90"
                style={{ color }}
              />
            }
          >
            <Icon />
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

export function ReactionsOverlay({
  floating,
  onDone,
}: {
  floating: Floating[];
  onDone: (id: number) => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <AnimatePresence>
        {floating.map((item) => {
          const meta = KINDS.find((k) => k.kind === item.kind)!;
          return (
            <motion.span
              key={item.id}
              initial={{ opacity: 0, y: 0, x: 0, scale: 0.6 }}
              animate={{ opacity: [0, 1, 1, 0], y: -220, x: item.drift, scale: [0.6, 1.1, 1, 0.9] }}
              transition={{ duration: 2.2, ease: [0.22, 1, 0.36, 1] }}
              onAnimationComplete={() => onDone(item.id)}
              className="absolute bottom-4"
              style={{ left: `${item.x}%`, color: meta.color }}
            >
              <meta.Icon className="size-7 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]" />
            </motion.span>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
