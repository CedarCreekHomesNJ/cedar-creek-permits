# Cedar Creek Permit Platform — Web Version

This is the hosted version of your permit platform — runs on Vercel
(free) with Supabase (free) as the database and file storage. Anyone in
your office can use it from a browser, no install needed.

## What you already did

- Created a Supabase project
- Ran the SQL schema (tables for profile, team, descriptions, forms, packages)
- Created two storage buckets: `permit-uploads` and `permit-filled`

## What's left: deploying to Vercel

### 1. Get your Supabase Service Key (different from the publishable key)

In Supabase: **Project Settings → API Keys** → click the **"Legacy anon,
service_role API keys"** tab (next to "Publishable and secret API keys").
Copy the **`service_role`** key — this one is secret, never share it
publicly or commit it to GitHub. We'll only paste it into Vercel's private
environment variable settings.

### 2. Push this folder to GitHub

If you don't already have a GitHub account, make one (free) at github.com.

```bash
cd permit-platform-web
git init
git add .
git commit -m "Initial commit"
```

Then create a new repository on GitHub (call it `cedar-creek-permits`),
and follow GitHub's instructions to push this folder to it — it'll show
you 2-3 commands to copy/paste after you create the repo.

### 3. Deploy on Vercel

1. Go to **vercel.com**, sign up free (you can sign in with your GitHub
   account directly, which makes this easier)
2. Click **Add New → Project**
3. Select the `cedar-creek-permits` repository you just pushed
4. Before clicking Deploy, expand **Environment Variables** and add:
   - `SUPABASE_URL` → `https://qzxdxjoatcbknflriqfv.supabase.co`
   - `SUPABASE_SERVICE_KEY` → (the service_role key from step 1)
5. Click **Deploy**

Vercel will install everything and give you a live URL like
`cedar-creek-permits.vercel.app` — that's the link your whole office can
use.

### 4. Test it

Open the URL, go to Company & team, enter your info, add your two PMs,
then try uploading a permit PDF and filling it out.

## How it works now (vs. the local version)

- **PDF previews**: rendered right in the browser using pdf.js — no
  server-side rendering needed, which is what makes this work on Vercel's
  serverless functions (they can't run long-lived processes like the
  local Flask server did).
- **Filled PDFs**: generated using `pdf-lib`, drawing text directly onto
  the real PDF (vector text) rather than flattening to an image — sharper
  output than the local version.
- **Storage**: every uploaded form and every generated filled PDF lives in
  Supabase Storage, not on anyone's laptop. Whoever in your office opens
  the link sees the same shared library, profile, and team list.
- **No login**: anyone with the link can use it. Don't share the link
  publicly — keep it to your office. If you want individual logins later,
  that's a bigger addition we can build when you're ready.

## Updating the app later

Whenever you want changes, just push new commits to the same GitHub repo
— Vercel automatically redeploys within about a minute of every push.
