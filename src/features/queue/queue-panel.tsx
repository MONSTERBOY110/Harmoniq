"use client";

import { useState } from "react";
import { Reorder, useDragControls } from "motion/react";
import { GripVerticalIcon, ListMusicIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/format-duration";
import { cn } from "@/lib/utils";
import { moveQueueItem, removeFromQueue } from "./queue-actions";
import type { QueueItem } from "./use-queue";

type Props = {
  code: string;
  items: QueueItem[];
  status: "loading" | "ready" | "error";
  currentUid: string;
  isHost: boolean;
  onAddSong: () => void;
};

/** The reserved list: what is playing now and what is queued, numbered like a songbook. */
export function QueuePanel({ code, items, status, currentUid, isHost, onAddSong }: Props) {
  const playing = items.find((item) => item.status === "playing") ?? null;
  const queued = items.filter((item) => item.status === "queued");
  // While the host drags, the list follows the pointer; otherwise it mirrors Firestore.
  const [dragOrder, setDragOrder] = useState<QueueItem[] | null>(null);
  const order = dragOrder ?? queued;

  async function commitMove(item: QueueItem) {
    const toIndex = (dragOrder ?? queued).findIndex((entry) => entry.id === item.id);
    setDragOrder(null);
    if (toIndex === -1) return;
    try {
      await moveQueueItem(code, items, item.id, toIndex);
    } catch {
      toast.error("Could not reorder the queue");
    }
  }

  async function remove(item: QueueItem) {
    try {
      await removeFromQueue(code, item.id);
    } catch {
      toast.error("Could not remove that song");
    }
  }

  return (
    <div className="flex h-full flex-col" data-slot="queue-panel">
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-ink-muted">
          Reserved <span className="tabular">{String(queued.length).padStart(2, "0")}</span>
        </h2>
        <Button size="sm" onClick={onAddSong}>
          <PlusIcon />
          Add song
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {playing ? (
          <div className="mb-2 rounded-lg border border-amber/30 bg-amber/10 px-2.5 py-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber">Now singing</p>
            <p className="truncate text-sm font-medium text-ink">{playing.title}</p>
            <p className="truncate text-xs text-ink-muted">Added by {playing.addedByName}</p>
          </div>
        ) : null}

        {status === "loading" ? (
          <div className="space-y-2 px-1 pt-1">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-surface-2" />
            ))}
          </div>
        ) : queued.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <ListMusicIcon className="size-6 text-ink-faint" />
            <p className="text-sm text-ink-muted">
              Nothing queued yet. Search a song to start the night.
            </p>
          </div>
        ) : (
          <Reorder.Group
            axis="y"
            values={order}
            onReorder={setDragOrder}
            as="ol"
            className="space-y-1"
          >
            {order.map((item, index) => (
              <QueueRow
                key={item.id}
                item={item}
                index={index}
                canDrag={isHost}
                canRemove={isHost || item.addedByUid === currentUid}
                onDragStart={() => setDragOrder(queued)}
                onDragEnd={() => void commitMove(item)}
                onRemove={() => void remove(item)}
              />
            ))}
          </Reorder.Group>
        )}
      </div>
    </div>
  );
}

function QueueRow({
  item,
  index,
  canDrag,
  canRemove,
  onDragStart,
  onDragEnd,
  onRemove,
}: {
  item: QueueItem;
  index: number;
  canDrag: boolean;
  canRemove: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onRemove: () => void;
}) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      as="li"
      data-slot="queue-item"
      className={cn(
        "flex items-center gap-2 rounded-lg border border-transparent bg-surface px-2 py-1.5",
        canDrag && "hover:border-line",
      )}
    >
      {canDrag ? (
        <button
          type="button"
          aria-label="Drag to reorder"
          onPointerDown={(event) => controls.start(event)}
          className="cursor-grab touch-none text-ink-faint hover:text-ink active:cursor-grabbing"
        >
          <GripVerticalIcon className="size-4" />
        </button>
      ) : null}
      <span className="w-6 shrink-0 font-mono text-xs text-ink-muted tabular">
        {String(index + 1).padStart(2, "0")}
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.thumbnailUrl}
        alt=""
        width={64}
        height={36}
        loading="lazy"
        className="aspect-video w-16 shrink-0 rounded object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-ink">{item.title}</p>
        <p className="truncate text-xs text-ink-muted">
          {item.addedByName}
          <span className="mx-1.5 text-ink-faint">·</span>
          <span className="font-mono tabular">{formatDuration(item.durationMs)}</span>
        </p>
      </div>
      {canRemove ? (
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={`Remove ${item.title}`}
          onClick={onRemove}
          className="text-ink-faint hover:text-gel-rose"
        >
          <Trash2Icon />
        </Button>
      ) : null}
    </Reorder.Item>
  );
}
