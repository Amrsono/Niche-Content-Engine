# Fast-Track Google Indexing — Next Steps

Follow these steps to activate **Live Mode** for the Google Indexing API.
Currently the system runs in Mock Mode (no real crawl requests are sent).

---

## Step 1 — Enable the Indexing API in Google Cloud

Open the link below and click **Enable**:
https://console.cloud.google.com/apis/library/indexing.googleapis.com?project=my-niche-engine-123

---

## Step 2 — Create a Service Account

1. Go to IAM & Admin → Service Accounts:
   https://console.cloud.google.com/iam-admin/serviceaccounts?project=my-niche-engine-123

2. Click **"+ Create Service Account"**

3. Name it `indexing-bot` (or anything you like)

4. Skip optional role assignment — no special roles are needed

5. Click **Done**

6. Open the new service account → go to the **Keys** tab

7. Click **"Add Key" → "Create new key" → JSON** → Download the file

---

## Step 3 — Share Your Search Console Property with the Service Account

1. Go to Google Search Console:
   https://search.google.com/search-console

2. Select your property: **https://niche-content-engine.vercel.app**

3. Go to **Settings → Users and permissions**

4. Click **"Add User"**

5. Enter the service account email (looks like `indexing-bot@my-niche-engine-123.iam.gserviceaccount.com`)

6. Set permission level to **Owner**

7. Click **Add**

---

## Step 4 — Add the Key to Your Project

Run this in PowerShell to base64-encode the downloaded JSON key:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("C:\path\to\your-key.json")) | clip
```

This copies the encoded string to your clipboard.

Then open `.env.local` and paste it:

```
GOOGLE_SERVICE_ACCOUNT_JSON=<paste the base64 string here>
```

---

## Step 5 — Redeploy

Push your changes and redeploy to Vercel. Once deployed, visit:

  https://niche-content-engine.vercel.app/admin/indexing

The status badge will turn **green** — confirming Live Mode is active.

---

## How It Works After Setup

- **Automatic:** Every new article published via the daily cron job is immediately
  submitted to Google for fast-track crawling (no waiting for Googlebot).

- **Manual:** Visit `/admin/indexing` and use one of three modes:
    - **Index Latest Post** — submits the most recently published article
    - **Index All Posts**  — batch-submits every blog URL (max 200/day, Google's limit)
    - **Custom URLs**      — paste any specific URLs you want force-crawled

---

## Google's Daily Quota

The Indexing API allows **200 URL submissions per day** per project.
The `/admin/indexing` dashboard tracks your usage with a live quota bar.
