"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { signInWithEmail, signInWithGoogle, signUpWithEmail } from "./auth-actions";
import { friendlyAuthError } from "./auth-errors";
import { z } from "zod";
import { signInSchema, signUpSchema, type SignUpValues } from "./schemas";

// Sign-in shares the sign-up shape so one form type serves both modes; the name is simply ignored.
const signInFormSchema = signInSchema.extend({ displayName: z.string() });

type Mode = "signin" | "signup";

const COPY: Record<Mode, { title: string; lede: string; submit: string; pending: string }> = {
  signin: {
    title: "Welcome back",
    lede: "Sign in to open a room or join your friends.",
    submit: "Sign in",
    pending: "Signing in",
  },
  signup: {
    title: "Start singing in two minutes",
    lede: "Create an account, open a room, share the code.",
    submit: "Create account",
    pending: "Creating account",
  },
};

function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/rooms";
  return raw;
}

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [googlePending, setGooglePending] = useState(false);
  const configured = isFirebaseConfigured();

  const form = useForm<SignUpValues>({
    resolver: zodResolver(mode === "signup" ? signUpSchema : signInFormSchema),
    defaultValues: { displayName: "", email: "", password: "" },
    mode: "onTouched",
  });

  const copy = COPY[mode];
  const pending = form.formState.isSubmitting || googlePending;

  async function finish() {
    router.replace(next as Parameters<typeof router.replace>[0]);
    router.refresh();
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      if (mode === "signup") {
        await signUpWithEmail(values);
      } else {
        await signInWithEmail({ email: values.email, password: values.password });
      }
      await finish();
    } catch (error) {
      const message = friendlyAuthError(error);
      if (message) setFormError(message);
    }
  });

  async function onGoogle() {
    setFormError(null);
    setGooglePending(true);
    try {
      await signInWithGoogle();
      await finish();
    } catch (error) {
      const message = friendlyAuthError(error);
      if (message) setFormError(message);
    } finally {
      setGooglePending(false);
    }
  }

  const otherHref = mode === "signup" ? "/signin" : "/signup";
  const otherQuery = searchParams.get("next") ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <div className="w-full max-w-sm">
      <h1 className="font-display text-3xl font-medium text-ink">{copy.title}</h1>
      <p className="mt-2 text-sm text-ink-muted">{copy.lede}</p>

      {!configured ? (
        <p
          role="alert"
          className="mt-6 rounded-lg border border-gel-rose/30 bg-gel-rose/10 px-3 py-2 text-sm text-ink"
        >
          Firebase is not configured yet. Copy .env.example to .env.local and fill in the values,
          then restart the dev server.
        </p>
      ) : null}

      <Button
        type="button"
        variant="outline"
        size="lg"
        className="mt-6 w-full"
        onClick={onGoogle}
        disabled={pending || !configured}
      >
        {googlePending ? <Loader2Icon className="animate-spin" /> : <GoogleGlyph />}
        Continue with Google
      </Button>

      <div className="my-6 flex items-center gap-3 text-xs text-ink-faint">
        <Separator className="flex-1" />
        <span>or with email</span>
        <Separator className="flex-1" />
      </div>

      <form onSubmit={onSubmit} noValidate>
        <FieldGroup>
          {mode === "signup" ? (
            <Field>
              <FieldLabel htmlFor="displayName">Your name</FieldLabel>
              <Input
                id="displayName"
                autoComplete="name"
                placeholder="What your friends call you"
                aria-invalid={!!form.formState.errors.displayName}
                {...form.register("displayName")}
              />
              <FieldError errors={[form.formState.errors.displayName]} />
            </Field>
          ) : null}

          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={!!form.formState.errors.email}
              {...form.register("email")}
            />
            <FieldError errors={[form.formState.errors.email]} />
          </Field>

          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
                aria-invalid={!!form.formState.errors.password}
                {...form.register("password")}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  type="button"
                  size="icon-xs"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
            <FieldError errors={[form.formState.errors.password]} />
          </Field>

          {formError ? (
            <p
              role="alert"
              className="rounded-lg border border-gel-rose/30 bg-gel-rose/10 px-3 py-2 text-sm text-ink"
            >
              {formError}
            </p>
          ) : null}

          <Button type="submit" size="lg" className="w-full" disabled={pending || !configured}>
            {form.formState.isSubmitting ? (
              <>
                <Loader2Icon className="animate-spin" />
                {copy.pending}
              </>
            ) : (
              copy.submit
            )}
          </Button>
        </FieldGroup>
      </form>

      <p className="mt-6 text-sm text-ink-muted">
        {mode === "signup" ? "Already have an account? " : "New here? "}
        <Link
          href={`${otherHref}${otherQuery}` as "/signin" | "/signup"}
          className="font-medium text-ink underline-offset-4 hover:underline"
        >
          {mode === "signup" ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z"
      />
    </svg>
  );
}
