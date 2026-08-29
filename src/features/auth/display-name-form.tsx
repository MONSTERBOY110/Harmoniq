"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { firestore } from "@/lib/firebase/client";
import { useAuth } from "./auth-provider";
import { friendlyAuthError } from "./auth-errors";
import { signUpSchema } from "./schemas";
import { syncSessionCookie } from "./session-sync";

export function DisplayNameForm({ initialName }: { initialName: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [value, setValue] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    const parsed = signUpSchema.shape.displayName.safeParse(value);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a name.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await updateProfile(user, { displayName: parsed.data });
      await updateDoc(doc(firestore(), "users", user.uid), { displayName: parsed.data });
      await syncSessionCookie(user, true);
      toast.success("Name updated");
      router.refresh();
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-sm space-y-4" noValidate>
      <Field>
        <FieldLabel htmlFor="displayName">Display name</FieldLabel>
        <Input
          id="displayName"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoComplete="name"
          aria-invalid={!!error}
        />
        <FieldDescription>Shown on your video tile and in the queue.</FieldDescription>
        <FieldError errors={error ? [{ message: error }] : []} />
      </Field>
      <Button type="submit" disabled={saving || !user || value.trim() === initialName}>
        {saving ? <Loader2Icon className="animate-spin" /> : null}
        Save
      </Button>
    </form>
  );
}
