"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, Loader2Icon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createRoom, joinRoom } from "./actions";
import { RoomCodeInput } from "./room-code-input";

export function CreateRoomCard({ suggestedName }: { suggestedName: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createRoom({ name });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/room/${result.code}`);
    });
  }

  return (
    <section className="gel-wash flex flex-col rounded-[10px] border border-line p-6 sm:p-8">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-muted">Open a room</p>
      <h2 className="font-display mt-2 text-2xl font-medium text-ink">Start tonight&apos;s session</h2>
      <p className="mt-1 text-sm text-ink-muted">
        You become the host: you control playback, and friends join with your code.
      </p>
      <form onSubmit={onSubmit} className="mt-6 flex flex-1 flex-col gap-4" noValidate>
        <Field>
          <FieldLabel htmlFor="room-name">Room name</FieldLabel>
          <Input
            id="room-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={suggestedName}
            maxLength={60}
            autoComplete="off"
            aria-invalid={!!error}
          />
          <FieldDescription>Optional. Friends see it at the top of the room.</FieldDescription>
          <FieldError errors={error ? [{ message: error }] : []} />
        </Field>
        <div className="mt-auto">
          <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
            {pending ? <Loader2Icon className="animate-spin" /> : <PlusIcon />}
            Open a room
          </Button>
        </div>
      </form>
    </section>
  );
}

export function JoinRoomCard() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (code.length !== 6) {
      setError("Enter all six characters of the code.");
      return;
    }
    startTransition(async () => {
      const result = await joinRoom({ code });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/room/${result.code}`);
    });
  }

  return (
    <section className="flex flex-col rounded-[10px] border border-line bg-surface p-6 sm:p-8">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-muted">Join a room</p>
      <h2 className="font-display mt-2 text-2xl font-medium text-ink">Got a code from a friend?</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Type the six characters, or paste the room link they sent you.
      </p>
      <form onSubmit={onSubmit} className="mt-6 flex flex-1 flex-col gap-4" noValidate>
        <Field>
          <FieldLabel htmlFor="room-code">Room code</FieldLabel>
          <RoomCodeInput
            id="room-code"
            value={code}
            onChange={(next) => {
              setCode(next);
              if (error) setError(null);
            }}
            aria-invalid={!!error}
          />
          <FieldError errors={error ? [{ message: error }] : []} />
        </Field>
        <div className="mt-auto">
          <Button
            type="submit"
            size="lg"
            variant="secondary"
            disabled={pending || code.length !== 6}
            className="w-full sm:w-auto"
          >
            {pending ? <Loader2Icon className="animate-spin" /> : <ArrowRightIcon />}
            Join
          </Button>
        </div>
      </form>
    </section>
  );
}
