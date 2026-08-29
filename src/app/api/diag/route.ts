import { NextResponse } from "next/server";

/**
 * Temporary deployment diagnostic. A route module that fails to load returns an empty 500 with no
 * stack, which hides the cause completely. This route imports the admin SDK step by step at request
 * time instead, so the failure arrives as readable JSON. Delete it once the deployment is healthy.
 */
export const dynamic = "force-dynamic";

type Step = { step: string; ok: boolean; error?: string };

function describe(error: unknown): string {
  if (!(error instanceof Error)) return String(error).slice(0, 300);
  const code = (error as NodeJS.ErrnoException).code;
  const head = `${error.name}${code ? ` [${code}]` : ""}: ${error.message}`;
  const frame = error.stack?.split("\n")[1]?.trim() ?? "";
  return `${head}${frame ? ` | at ${frame}` : ""}`.slice(0, 600);
}

async function attempt(step: string, run: () => Promise<unknown>): Promise<Step> {
  try {
    await run();
    return { step, ok: true };
  } catch (error) {
    return { step, ok: false, error: describe(error) };
  }
}

export async function GET() {
  const steps: Step[] = [];

  steps.push(await attempt("import firebase-admin/app", () => import("firebase-admin/app")));
  steps.push(await attempt("import firebase-admin/auth", () => import("firebase-admin/auth")));
  steps.push(
    await attempt("import firebase-admin/firestore", () => import("firebase-admin/firestore")),
  );
  steps.push(await attempt("import @/lib/firebase/admin", () => import("@/lib/firebase/admin")));

  if (steps.every((s) => s.ok)) {
    steps.push(
      await attempt("initialise the admin app", async () => {
        const { adminAuth } = await import("@/lib/firebase/admin");
        adminAuth();
      }),
    );
  }

  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 ?? "";
  return NextResponse.json(
    {
      node: process.version,
      platform: `${process.platform}/${process.arch}`,
      nextRuntime: process.env.NEXT_RUNTIME ?? "unknown",
      vercel: {
        env: process.env.VERCEL_ENV ?? null,
        region: process.env.VERCEL_REGION ?? null,
      },
      serviceAccount: {
        present: encoded.length > 0,
        length: encoded.length,
        // Shape only, never the value: a good key is one line of base64 that decodes to JSON.
        looksBase64: /^[A-Za-z0-9+/=\s]*$/.test(encoded),
        hasWhitespace: /\s/.test(encoded),
        decodesToJson: (() => {
          if (!encoded) return false;
          try {
            const parsed: unknown = JSON.parse(
              Buffer.from(encoded, "base64").toString("utf8"),
            );
            return typeof parsed === "object" && parsed !== null;
          } catch {
            return false;
          }
        })(),
      },
      steps,
    },
    { status: 200 },
  );
}
