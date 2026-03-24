import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testTikTok() {
  console.log('--- TikTok Diagnostic ---');
  
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  
  if (!clientKey || !clientSecret) {
    console.error('Missing TikTok App Credentials (CLIENT_KEY/SECRET).');
    return;
  }

  // Check stored auth in settings.json
  const settingsPath = path.resolve(process.cwd(), 'data/settings.json');
  if (!fs.existsSync(settingsPath)) {
    console.error('settings.json not found in data directory.');
    return;
  }

  try {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    const auth = settings.tiktok_auth;

    if (!auth) {
      console.error('No TikTok auth found in settings.json. Please visit /api/auth/tiktok/connect');
      return;
    }

    console.log('✅ TikTok Auth found in settings.');
    console.log('Expires at:', new Date(auth.expires_at).toLocaleString());
    
    const now = Date.now();
    if (now > auth.expires_at) {
      console.log('🔄 Token EXPIRED. Attempting refresh test...');
      // Refresh logic is already in agents.ts, but let's test it here manually
       const res = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cache-Control': 'no-cache'
        },
        body: new URLSearchParams({
          client_key: clientKey || '',
          client_secret: clientSecret || '',
          grant_type: 'refresh_token',
          refresh_token: auth.refresh_token
        })
      });

      const data = await res.json();
      if (data.access_token) {
        console.log('✅ Token refresh SUCCESSFUL.');
      } else {
        console.error('❌ Token refresh FAILED:', JSON.stringify(data, null, 2));
      }
    } else {
      console.log('✅ Token is still valid.');
    }

  } catch (err) {
    console.error('Error:', err.message);
  }
}

testTikTok();
