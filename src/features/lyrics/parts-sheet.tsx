"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { LrcLine } from "@/lib/lyrics/lrc-parser";
import { alternateParts, cyclePart, singerForLine, type Parts } from "@/lib/lyrics/parts";
import { singerColor } from "@/lib/singers/colors";
import { cn } from "@/lib/utils";
import type { Singer } from "./lyrics-panel";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lines: LrcLine[];
  parts: Parts;
  singers: Singer[];
  onSave: (parts: Parts) => Promise<void>;
};

/** Who sings which line. Tap a line to hand it to the next singer; amber means everyone. */
export function PartsSheet({ open, onOpenChange, lines, parts, singers, onSave }: Props) {
  const [draft, setDraft] = useState<Parts>(parts);
  const dirty = useRef(false);

  // Follow remote changes unless we are mid-edit.
  useEffect(() => {
    if (!dirty.current) setDraft(parts);
  }, [parts]);

  // Debounced save.
  useEffect(() => {
    if (!dirty.current) return;
    const timer = window.setTimeout(() => {
      dirty.current = false;
      onSave(draft).catch(() => toast.error("Could not save the parts"));
    }, 500);
    return () => window.clearTimeout(timer);
  }, [draft, onSave]);

  function update(next: Parts) {
    dirty.current = true;
    setDraft(next);
  }

  const singerUids = singers.map((s) => s.uid);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Who sings what</SheetTitle>
          <SheetDescription>
            Tap a line to pass it to the next singer. Lines without a name are for everyone.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-wrap gap-2 px-4">
          <Button
            size="sm"
            variant="outline"
            disabled={singers.length < 2}
            onClick={() => update(alternateParts(lines, singerUids))}
          >
            Alternate lines
          </Button>
          <Button size="sm" variant="ghost" onClick={() => update({})}>
            Everyone sings
          </Button>
        </div>

        <ol className="min-h-0 flex-1 space-y-1 overflow-y-auto px-4 py-3" data-slot="parts-list">
          {lines.map((line, index) => {
            const uid = singerForLine(draft, index);
            const singer = uid ? singers.find((s) => s.uid === uid) : null;
            const color = singer ? singerColor(singer.color) : null;
            return (
              <li key={`${line.timeMs}-${index}`}>
                <button
                  type="button"
                  onClick={() => update(withLine(draft, index, cyclePart(uid, singerUids)))}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors",
                    color ? "border-transparent" : "border-line hover:border-line-strong",
                  )}
                  style={color ? { backgroundColor: `${color.hex}1f`, borderColor: `${color.hex}66` } : undefined}
                >
                  <span className="w-6 shrink-0 font-mono text-[10px] text-ink-faint tabular">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="font-lyric min-w-0 flex-1 truncate text-sm text-ink">
                    {line.text || "♪"}
                  </span>
                  <span
                    data-slot="parts-chip"
                    data-colour={color?.hex ?? "everyone"}
                    className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium"
                    style={
                      color
                        ? { backgroundColor: color.hex, color: color.ink }
                        : { backgroundColor: "var(--amber)", color: "var(--amber-ink)", opacity: 0.85 }
                    }
                  >
                    {singer?.name ?? "Everyone"}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <SheetFooter>
          <p className="text-xs text-ink-muted">
            Singers: {singers.map((s) => s.name).join(", ") || "nobody has picked a colour yet"}
          </p>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/** Assigns a line, or hands it back to everyone when the singer is undefined. */
function withLine(parts: Parts, index: number, uid: string | undefined): Parts {
  const next = { ...parts };
  if (uid) next[String(index)] = uid;
  else delete next[String(index)];
  return next;
}
