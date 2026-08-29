"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon, LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatRoomCode } from "@/lib/rooms/code";
import { cn } from "@/lib/utils";

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function RoomCodeChip({ code, className }: { code: string; className?: string }) {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  async function copy(kind: "code" | "link") {
    const text = kind === "code" ? formatRoomCode(code) : `${window.location.origin}/room/${code}`;
    const ok = await copyText(text);
    if (!ok) {
      toast.error("Could not copy. Select the code and copy it manually.");
      return;
    }
    setCopied(kind);
    toast.success(kind === "code" ? "Room code copied" : "Room link copied");
    window.setTimeout(() => setCopied(null), 1600);
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border border-line bg-surface-2/70 py-1 pr-1 pl-3",
        className,
      )}
    >
      <span className="font-mono text-sm font-semibold tracking-[0.18em] text-ink tabular">
        {formatRoomCode(code)}
      </span>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Copy room code"
              onClick={() => copy("code")}
            />
          }
        >
          {copied === "code" ? <CheckIcon className="text-gel-teal" /> : <CopyIcon />}
        </TooltipTrigger>
        <TooltipContent>Copy code</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Copy room link"
              onClick={() => copy("link")}
            />
          }
        >
          {copied === "link" ? <CheckIcon className="text-gel-teal" /> : <LinkIcon />}
        </TooltipTrigger>
        <TooltipContent>Copy link</TooltipContent>
      </Tooltip>
    </div>
  );
}
