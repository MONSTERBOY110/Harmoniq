"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon, Loader2Icon, MicVocalIcon, PlusIcon, SearchIcon } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatDuration } from "@/lib/format-duration";
import type { SongResult } from "@/lib/youtube/provider";
import { cn } from "@/lib/utils";
import { addToQueue } from "./queue-actions";
import type { QueueItem } from "./use-queue";

type Props = {
  code: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adder: { uid: string; displayName: string };
  items: QueueItem[];
};

type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; results: SongResult[]; provider: string }
  | { status: "error"; message: string };

export function AddSongDialog({ code, open, onOpenChange, adder, items }: Props) {
  const [text, setText] = useState("");
  const [karaokeOnly, setKaraokeOnly] = useState(true);
  const [search, setSearch] = useState<SearchState>({ status: "idle" });
  const [selected, setSelected] = useState<SongResult | null>(null);
  const [artist, setArtist] = useState("");
  const [title, setTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const requestId = useRef(0);

  // Debounced search: Enter searches immediately, typing searches after a pause.
  useEffect(() => {
    if (!open) return;
    const trimmed = text.trim();
    if (trimmed.length < 3) return;
    const timer = window.setTimeout(() => void runSearch(trimmed), 600);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, karaokeOnly, open]);

  async function runSearch(query: string) {
    const id = ++requestId.current;
    setSearch({ status: "loading" });
    try {
      const response = await fetch(
        `/api/youtube/search?q=${encodeURIComponent(query)}&karaoke=${karaokeOnly ? 1 : 0}`,
      );
      const body = (await response.json()) as {
        results?: SongResult[];
        provider?: string;
        error?: string;
        blocked?: boolean;
      };
      if (id !== requestId.current) return;
      if (!response.ok || !body.results) {
        setSearch({ status: "error", message: body.error ?? "Search failed." });
        return;
      }
      if (body.blocked && body.results.length === 0) {
        setSearch({
          status: "error",
          message:
            "That video's owner turned off playback outside YouTube, so it cannot play here. Try another version.",
        });
        return;
      }
      setSearch({ status: "ready", results: body.results, provider: body.provider ?? "" });
    } catch {
      if (id === requestId.current) setSearch({ status: "error", message: "You seem to be offline." });
    }
  }

  function pick(song: SongResult) {
    setSelected(song);
    setArtist(song.guessedArtist ?? "");
    setTitle(song.guessedTitle ?? song.title);
  }

  async function confirmAdd() {
    if (!selected) return;
    setAdding(true);
    try {
      await addToQueue(
        code,
        selected,
        { artist: artist.trim() || null, title: title.trim() || selected.title },
        adder,
        items,
      );
      toast.success("Added to the queue", { description: selected.title });
      setSelected(null);
      setText("");
      setSearch({ status: "idle" });
      onOpenChange(false);
    } catch (error) {
      toast.error("Could not add that song", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setAdding(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add a song</DialogTitle>
          <DialogDescription>
            Search YouTube or paste a link. Karaoke versions are picked by default so the vocals
            are yours.
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-center"
          onSubmit={(event) => {
            event.preventDefault();
            if (text.trim().length >= 2) void runSearch(text.trim());
          }}
        >
          <InputGroup className="flex-1">
            <InputGroupAddon align="inline-start">
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Any song, any language, or a YouTube link"
              aria-label="Search for a song"
            />
          </InputGroup>
          <div className="flex items-center gap-2">
            <Switch id="karaoke-only" checked={karaokeOnly} onCheckedChange={setKaraokeOnly} />
            <Label htmlFor="karaoke-only" className="text-sm">
              Karaoke versions
            </Label>
          </div>
        </form>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {selected ? (
            <div className="space-y-4 rounded-xl border border-amber/30 bg-amber/5 p-4">
              <ResultRow song={selected} compact />
              <p className="text-sm text-ink-muted">
                Check the artist and title. Lyrics are looked up with these.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="song-artist">Artist</FieldLabel>
                  <Input
                    id="song-artist"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    placeholder="Unknown"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="song-title">Song title</FieldLabel>
                  <Input id="song-title" value={title} onChange={(e) => setTitle(e.target.value)} />
                </Field>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelected(null)} disabled={adding}>
                  Back
                </Button>
                <Button onClick={confirmAdd} disabled={adding}>
                  {adding ? <Loader2Icon className="animate-spin" /> : <PlusIcon />}
                  Add to queue
                </Button>
              </div>
            </div>
          ) : (
            <SearchResults state={search} onPick={pick} items={items} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SearchResults({
  state,
  onPick,
  items,
}: {
  state: SearchState;
  onPick: (song: SongResult) => void;
  items: QueueItem[];
}) {
  if (state.status === "idle") {
    return (
      <p className="px-1 py-8 text-center text-sm text-ink-muted">
        Try an artist and a song in any language, like &quot;Arijit Singh Kesariya&quot; or &quot;Adele Someone Like You&quot;.
      </p>
    );
  }
  if (state.status === "loading") {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-ink-muted">
        <Loader2Icon className="size-4 animate-spin" />
        Searching YouTube
      </div>
    );
  }
  if (state.status === "error") {
    return (
      <p role="alert" className="px-1 py-8 text-center text-sm text-gel-rose">
        {state.message}
      </p>
    );
  }
  if (state.results.length === 0) {
    return (
      <p className="px-1 py-8 text-center text-sm text-ink-muted">
        Nothing found. Try fewer words, or turn off karaoke versions.
      </p>
    );
  }
  const queuedIds = new Set(items.map((item) => item.videoId));
  return (
    <ul className="divide-y divide-line" data-slot="song-results">
      {state.results.map((song) => (
        <li key={song.videoId}>
          <button
            type="button"
            onClick={() => onPick(song)}
            className="flex w-full items-center gap-3 rounded-lg px-1 py-2 text-left transition-colors hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none"
          >
            <ResultRow song={song} inQueue={queuedIds.has(song.videoId)} />
          </button>
        </li>
      ))}
    </ul>
  );
}

function ResultRow({
  song,
  compact,
  inQueue,
}: {
  song: SongResult;
  compact?: boolean;
  inQueue?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={song.thumbnailUrl}
        alt=""
        width={96}
        height={54}
        loading="lazy"
        className={cn("aspect-video shrink-0 rounded-md object-cover", compact ? "w-20" : "w-24")}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{song.title}</p>
        <p className="mt-0.5 flex items-center gap-2 text-xs text-ink-muted">
          <span className="truncate">{song.channel}</span>
          <span className="font-mono tabular">{formatDuration(song.durationMs)}</span>
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {song.karaoke ? (
          <Badge variant="secondary" className="gap-1 text-amber">
            <MicVocalIcon className="size-3" />
            Karaoke
          </Badge>
        ) : null}
        {inQueue ? (
          <Badge variant="outline" className="gap-1 text-gel-teal">
            <CheckIcon className="size-3" />
            Queued
          </Badge>
        ) : null}
      </div>
    </div>
  );
}
