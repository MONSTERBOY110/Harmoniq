/**
 * Firebase Authentication refuses sign-in from domains it does not know, so every deployment
 * domain has to be on the authorised list (DEPLOY.md, step 4b).
 *
 *   node scripts/authorize-domain.mjs                    # show the current list
 *   node scripts/authorize-domain.mjs harmoniq.vercel.app  # add a domain (idempotent)
 *
 * Credentials come from FIREBASE_SERVICE_ACCOUNT_BASE64 in .env or .env.local, the same value
 * the app itself uses.
 */
import { readFileSync, existsSync } from "node:fs";

function serviceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    return JSON.parse(
      Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf8"),
    );
  }
  for (const file of [".env.local", ".env"]) {
    if (!existsSync(file)) continue;
    const line = readFileSync(file, "utf8")
      .split(/\r?\n/)
      .find((l) => l.startsWith("FIREBASE_SERVICE_ACCOUNT_BASE64="));
    if (line) {
      const value = line.slice("FIREBASE_SERVICE_ACCOUNT_BASE64=".length).trim();
      if (value) return JSON.parse(Buffer.from(value, "base64").toString("utf8"));
    }
  }
  throw new Error("FIREBASE_SERVICE_ACCOUNT_BASE64 is not set in the environment, .env.local or .env");
}

async function accessToken(account) {
  const { GoogleAuth } = await import("google-auth-library");
  const auth = new GoogleAuth({
    credentials: { client_email: account.client_email, private_key: account.private_key },
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  return auth.getAccessToken();
}

async function main() {
  const account = serviceAccount();
  const projectId = account.project_id;
  const token = await accessToken(account);
  const url = `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config`;
  const headers = { authorization: `Bearer ${token}`, "content-type": "application/json" };

  const current = await fetch(url, { headers });
  if (!current.ok) {
    throw new Error(`Could not read the auth config (${current.status}): ${await current.text()}`);
  }
  const config = await current.json();
  const domains = config.authorizedDomains ?? [];
  const wanted = process.argv[2]?.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");

  if (!wanted) {
    console.log(`Authorised domains for ${projectId}:`);
    for (const domain of domains) console.log(`  ${domain}`);
    console.log("\nAdd one with: node scripts/authorize-domain.mjs <domain>");
    return;
  }

  if (domains.includes(wanted)) {
    console.log(`${wanted} is already authorised for ${projectId}. Nothing to do.`);
    return;
  }

  const next = [...domains, wanted];
  const update = await fetch(`${url}?updateMask=authorizedDomains`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ authorizedDomains: next }),
  });
  if (!update.ok) {
    throw new Error(`Could not add ${wanted} (${update.status}): ${await update.text()}`);
  }
  console.log(`Added ${wanted}. Authorised domains for ${projectId} are now:`);
  for (const domain of next) console.log(`  ${domain}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
