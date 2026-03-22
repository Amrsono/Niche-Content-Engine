# Social Pulse: Debugging Checklist 📈

This document contains the final verification steps to resolve the "Unauthorized" and "Code 190" errors for your social media signals. Use this to pick up where we left off!

---

## 🐦 X / Twitter (401 Unauthorized)
If your X/Twitter signal fails, verify these **exact lengths** in your `.env.local`:

- **TWITTER_API_KEY**: Must be **25** characters. 
  - *Current suspect: Your key starts with `Mew5...` and might be 50 characters, which belongs in the Secret field.*
- **TWITTER_API_SECRET**: Must be **50** characters.
- **TWITTER_ACCESS_TOKEN**: Format: `[numbers-letters]`.
- **TWITTER_ACCESS_TOKEN_SECRET**: Must be **45** characters.
- **Portals Check**: Go to the [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard) -> Your App -> **User authentication settings**. Confirmed: **"App permissions"** is set to **"Read and Write"**.

---

## 📸 Instagram (Code 190)
According to Meta, **Code 190** means the token is invalid/expired.

- **Business ID**: Confirm this is the **Instagram Business Account ID** (17 digits, like yours: `17841400831855165`).
  - *Note: Do NOT use the Facebook Page ID.*
- **Token Type**: Use the [Graph API Explorer](https://developers.facebook.com/tools/explorer/) to generate a **new** token. 
- **Permissions Required**:
  - `instagram_basic`
  - `instagram_content_publish`
  - `pages_show_list`
- **Long-Lived Step**: Click the "i" info icon next to your token and click **"Open in Access Token Tool"** to swap it for a **60-day** token.

---

## 🎵 TikTok (Next Step)
TikTok is currently in "Mock Mode". To activate real posting:

1.  Create a **TikTok Developer App**.
2.  Enable the **Content Posting API**.
3.  Add `TIKTOK_ACCESS_TOKEN` and `TIKTOK_CLIENT_KEY` to `.env.local`.

---

### ✅ System Status: 
- **Absolute Paths**: Fixed. Engine always finds `data/posts.json`.
- **API Diagnostics**: Done. Server logs show full error bodies for troubleshooting.
- **Link Hardening**: Done. Social links use robust `origin` fallbacks for localhost.

**See you tomorrow! 🚀**
