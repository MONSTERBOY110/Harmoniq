import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { avatarHue, initialsFor } from "@/lib/avatar";
import { cn } from "@/lib/utils";

type Props = {
  uid: string;
  name: string | null | undefined;
  email?: string | null;
  photoURL?: string | null;
  className?: string;
};

export function UserAvatar({ uid, name, email, photoURL, className }: Props) {
  const hue = avatarHue(uid);
  return (
    <Avatar className={cn("size-8", className)}>
      {photoURL ? <AvatarImage src={photoURL} alt="" referrerPolicy="no-referrer" /> : null}
      <AvatarFallback
        className="font-display text-[0.7em] font-medium text-ink"
        style={{
          background: `linear-gradient(135deg, oklch(0.45 0.09 ${hue}), oklch(0.32 0.07 ${(hue + 40) % 360}))`,
        }}
      >
        {initialsFor(name ?? "", email ?? "")}
      </AvatarFallback>
    </Avatar>
  );
}
