# Deploying Harmoniq

A step by step guide to putting Harmoniq on the internet. The reference target is **Vercel**,
because the app uses Next.js server features (route handlers, server actions, a proxy) and needs a
Node runtime. Everything else it depends on (Firebase, LiveKit, YouTube, LRCLIB) is a hosted
service you point it at.

Budget about 30 minutes for a first deploy. You need: a GitHub account, a Vercel account, and the
Firebase and LiveKit projects you already created for local development.

---

## 0. Before you start

Run the checks locally so you deploy something known good:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

All four must pass. `npm run build` is the one that matters most: Vercel runs the same command.

Optional but recommended:

```bash
npm run test:e2e          # needs the dev server env; see README
npm run test:rules        # Firestore rules against the emulator (needs Java 21+, or firebase-tools 13)
```

---

## 1. Push the code to GitHub

The repository has no commits yet. Everything sensitive is already ignored
(`.env`, `*firebase-adminsdk*.json`, `.next`, `node_modules`), but check before your first push:

```bash
git status --short
git check-ignore -v .env                      # must print a .gitignore rule
git check-ignore -v *firebase-adminsdk*.json  # must print a .gitignore rule
```

Then:

```bash
git add -A
git commit -m "Harmoniq: karaoke rooms with synced lyrics"
gh repo create harmoniq --private --source=. --push
```

If you do not use the GitHub CLI, create an empty private repo on github.com and follow its
"push an existing repository" instructions instead.

> If `git check-ignore` prints nothing for either file, stop and fix `.gitignore` first. Those two
> files are your Firebase admin credentials and your API keys.

---

## 2. Create the Vercel project

1. Go to https://vercel.com/new and import the GitHub repository.
2. Vercel detects Next.js on its own. Leave the defaults:
   - Framework preset: **Next.js**
   - Build command: `next build` (from `npm run build`)
   - Output directory: default
   - Install command: `npm install`
3. Do **not** deploy yet. Open **Environment Variables** first (next step), otherwise the first
   build succeeds but every page fails at runtime.

---

## 3. Set the environment variables

Add each of these in Vercel under **Settings → Environment Variables**, for the
**Production**, **Preview** and **Development** environments unless noted.

| Variable | Where it comes from | Notes |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase console → Project settings → General → your web app | Public by design |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | same place | e.g. `harmoniq110.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | same place | |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | same place | |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | same place | |
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | see below | **Secret.** Server only |
| `LIVEKIT_URL` | LiveKit Cloud → Settings → Keys | `wss://<project>.livekit.cloud` |
| `NEXT_PUBLIC_LIVEKIT_URL` | same value as `LIVEKIT_URL` | The browser needs it too |
| `LIVEKIT_API_KEY` | LiveKit Cloud → Settings → Keys | **Secret** |
| `LIVEKIT_API_SECRET` | LiveKit Cloud → Settings → Keys | **Secret** |
| `YOUTUBE_API_KEY` | Google Cloud console | Optional. Without it search falls back to `youtubei.js` |
| `NEXT_PUBLIC_APP_URL` | your deployed URL | e.g. `https://harmoniq.vercel.app`. Set after step 5, then redeploy |

### Encoding the service account

Vercel cannot hold a multi-line JSON file, so the app reads the service account as base64:

```powershell
# Windows PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("harmoniq110-firebase-adminsdk-fbsvc-xxxx.json"))
```

```bash
# macOS or Linux
base64 -w0 service-account.json
```

Paste the single-line result as the value of `FIREBASE_SERVICE_ACCOUNT_BASE64`. It is the same
value you already have in your local `.env`, so copying it from there works too.

> Treat this string like a password. It grants full admin access to your Firebase project.

---

## 4. Prepare Firebase for the live domain

Two things must be done in the Firebase console, or sign-in and the database will fail in
production even though they work locally.

### 4a. Publish the security rules and indexes

The rules in this repository are the ones the app expects. Deploy them from your machine:

```bash
# Point at the service account you downloaded, then deploy
export GOOGLE_APPLICATION_CREDENTIALS="$PWD/harmoniq110-firebase-adminsdk-fbsvc-xxxx.json"
npx -y firebase-tools deploy --only firestore:rules,firestore:indexes --project <your-project-id>
```

On Windows PowerShell:

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS = "$PWD\harmoniq110-firebase-adminsdk-fbsvc-xxxx.json"
npx -y firebase-tools deploy --only firestore:rules,firestore:indexes --project <your-project-id>
```

You should see `rules file firestore.rules compiled successfully` and `Deploy complete!`.

### 4b. Authorise the deployed domain

Firebase Authentication refuses sign-in from unknown domains, so the deployed domain has to be on
the authorised list. There is a script for it, which uses the same service account as the app:

```bash
node scripts/authorize-domain.mjs                      # show the current list
node scripts/authorize-domain.mjs harmoniq.vercel.app  # add your domain, idempotent
```

Run the second command once Vercel has given you a URL (step 5), and again for any custom domain
you attach later. Leave `localhost` in the list so local development keeps working.

The console does the same job by hand: **Authentication → Settings → Authorized domains**.

> Only add domains you control. Authorising a domain lets whoever owns it start sign-in flows
> against your Firebase project, so do not add a guessed `*.vercel.app` name before you own it.

Preview deployments get a different URL per commit. Either add the ones you use, or test sign-in
only on production and on localhost.

---

## 5. Deploy

Click **Deploy** in Vercel (or push to your default branch). The first build takes two to three
minutes.

When it finishes:

1. Copy the production URL.
2. Set `NEXT_PUBLIC_APP_URL` to that URL in Vercel's environment variables.
3. Authorise the domain with Firebase:

   ```bash
   node scripts/authorize-domain.mjs <your-domain>
   ```

4. Redeploy so the new value is baked in: **Deployments → ... → Redeploy**.

---

## 6. Check it works

Open the production URL and walk the real path. This is the same sequence the automated tests
cover, done by hand:

1. **Landing page** loads: the wordmark, the demo stage animating, the pill navigation.
2. **Create an account** at `/signup`. If this fails with "Something went wrong", the domain is
   not in Firebase's authorised list (step 4b).
3. **Open a room.** You land in the lobby with a camera preview and a colour picker.
4. **Join with sound.** Your own video tile appears. If the call column shows "The call is not
   available", check `LIVEKIT_URL`, `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET`.
5. **Add a song** ("Coldplay Yellow karaoke"). It should start playing on its own.
6. **Lyrics.** During the intro the panel counts down to the first line; then lines advance and
   fill with amber as they are sung.
7. **Open the room link in a second browser** (or a phone). Both should play in step, within about
   a second of each other.
8. **Parts.** With two people in, open **Parts**, press **Alternate lines**, and confirm each
   person's lines carry their own colour on both screens.

---

## 7. Custom domain (optional)

1. Vercel → **Settings → Domains** → add your domain and follow the DNS instructions.
2. Add the same domain to Firebase **authorised domains**.
3. Update `NEXT_PUBLIC_APP_URL` and redeploy, so shared room links use the right host.

---

## Things worth knowing before real users arrive

**Free tier ceilings.** Firestore on the Spark plan allows 50,000 reads and 20,000 writes per day;
LiveKit's free tier gives 5,000 participant minutes a month; the YouTube Data API allows about 100
searches a day (search falls back to `youtubei.js` when the quota is gone). A busy evening with
several rooms can reach the LiveKit and YouTube limits first.

**Caches are per instance.** The YouTube search cache, the embeddability probe cache and the
per-user search rate limit live in memory. On Vercel each serverless instance keeps its own copy,
so the effective cache hit rate is lower than locally and the rate limit is per instance rather
than global. Move them to Firestore or Redis if that becomes a problem.

**The YouTube API key must not be referrer restricted.** Search runs on the server, so an HTTP
referrer restriction rejects it. Leave the key unrestricted, or restrict it by API (YouTube Data
API v3) rather than by referrer.

**Firebase Storage is not on the free plan**, which is why avatars come from Google profile
photos or generated initials. Nothing to configure.

**Rooms are never cleaned up automatically.** There is a cleanup route sketched in the plan but no
scheduled job. Old rooms simply sit in Firestore; they cost reads only when someone opens them.

**Secrets rotation.** If `FIREBASE_SERVICE_ACCOUNT_BASE64` or the LiveKit secret ever leaks,
revoke the key in its console, generate a new one, update the Vercel variable, and redeploy.

---

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| Every page 500s right after deploy | `FIREBASE_SERVICE_ACCOUNT_BASE64` missing or truncated. Re-encode and paste it as one line |
| Sign in says "Something went wrong" | The domain is not in Firebase → Authentication → Authorized domains |
| "The call is not available" in the room | LiveKit variables wrong, or `LIVEKIT_URL` still holds a placeholder. It must start with `wss://` |
| Search returns "not responding right now" | YouTube key is referrer restricted or the quota is exhausted. Remove the restriction, or drop the key entirely to use the fallback |
| Lyrics never appear | The song has no LRCLIB match. The panel says so; the words on the karaoke video are the fallback |
| Lyrics run early or late | The karaoke version's intro differs. The host presses **Start lyrics here** when the first line is sung, or nudges with the timing controls |
| Permission denied writing to Firestore | Rules were never published. Run step 4a |
| Video plays for the host but not a guest | The guest's browser blocked autoplay. They tap **Tap to play along** on the instrumental tile |
