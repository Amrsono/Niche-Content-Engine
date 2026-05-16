# Meta Social Auth Guide (Facebook & Instagram)

This guide explains how to maintain the connection between this app and Meta's APIs.

## 1. Required Environment Variables

Ensure these are set in `.env.local` (Local) and the **Vercel Dashboard** (Production):

| Variable | Description | Source |
| :--- | :--- | :--- |
| `FACEBOOK_PAGE_ID` | The ID of your FB Page | Page Settings or `me/accounts` |
| `FACEBOOK_PAGE_ACCESS_TOKEN` | **Page Access Token** | Graph API Explorer (`me/accounts`) |
| `INSTAGRAM_BUSINESS_ACCOUNT_ID` | The ID of your IG Business Acct | Graph API Explorer |
| `INSTAGRAM_ACCESS_TOKEN` | **User Access Token** | Graph API Explorer |

---

## 2. How to get/refresh tokens

### Step A: Get a User Token
1. Go to the [Graph API Explorer](https://developers.facebook.com/tools/explorer/).
2. Select your App.
3. Click **Get Token** -> **Get User Access Token**.
4. **Permissions needed**:
   - `pages_manage_posts`
   - `pages_read_engagement`
   - `instagram_basic`
   - `instagram_content_publish`
   - `public_profile`

### Step B: Get the Page Access Token (For Facebook)
1. In the Explorer, change the path to `me/accounts`.
2. Click **Submit**.
3. Find your Page ID in the list.
4. Copy the `access_token` for that Page. **This is your `FACEBOOK_PAGE_ACCESS_TOKEN`.**

### Step C: Extend Token Life (Long-Lived Tokens)
By default, these tokens expire in 1-2 hours. To make them last 60 days:
1. Go to the [Access Token Tool](https://developers.facebook.com/tools/accesstoken/).
2. Find the token you just got.
3. Click **Debug**.
4. Click **Extend Access Token**.
5. Copy the new long-lived token.

---

## 3. Updating Vercel
1. Go to **Project Settings** -> **Environment Variables**.
2. Update the values.
3. **Important**: You must **Redeploy** the latest commit for changes to take effect on the live site.
