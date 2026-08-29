"use client";

import { forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { normalizeRoomCode, ROOM_CODE_ALPHABET } from "@/lib/rooms/code";
import { cn } from "@/lib/utils";

type Props = Omit<React.ComponentProps<typeof Input>, "value" | "onChange"> & {
  value: string;
  onChange: (bareCode: string) => void;
};

const ALLOWED = new RegExp(`[^${ROOM_CODE_ALPHABET}]`, "g");

/** One large mono input that shows ABC-DEF while storing the bare six characters. */
export const RoomCodeInput = forwardRef<HTMLInputElement, Props>(function RoomCodeInput(
  { value, onChange, className, ...props },
  ref,
) {
  const display = value.length > 3 ? `${value.slice(0, 3)}-${value.slice(3)}` : value;

  return (
    <Input
      ref={ref}
      inputMode="text"
      autoCapitalize="characters"
      autoCorrect="off"
      spellCheck={false}
      maxLength={7}
      placeholder="ABC-DEF"
      value={display}
      onChange={(event) => {
        const raw = event.target.value.toUpperCase().replace(ALLOWED, "");
        onChange(raw.slice(0, 6));
      }}
      onPaste={(event) => {
        const text = event.clipboardData.getData("text");
        const code = normalizeRoomCode(text);
        if (code) {
          event.preventDefault();
          onChange(code);
        }
      }}
      className={cn(
        "h-14 text-center font-mono text-2xl font-semibold tracking-[0.3em] uppercase placeholder:tracking-[0.3em] placeholder:text-ink-faint md:text-2xl",
        className,
      )}
      {...props}
    />
  );
});
