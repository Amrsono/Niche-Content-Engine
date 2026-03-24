import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testInstagram() {
  const businessId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID?.trim();
  const token = process.env.INSTAGRAM_ACCESS_TOKEN?.trim().replace(/['"]+/g, '');

  console.log('--- Instagram Diagnostic ---');
  console.log('Business ID:', businessId ? 'PRESENT' : 'MISSING');
  console.log('Token:', token ? 'PRESENT' : 'MISSING');

  if (!businessId || !token) {
    console.error('Missing credentials.');
    return;
  }

  try {
    // Test 1: Check token validity and basic info
    console.log('Testing Token Validity...');
    const meRes = await fetch(`https://graph.facebook.com/v20.0/me?fields=id,name&access_token=${token}`);
    const meData = await meRes.json();
    
    if (meData.error) {
      console.error('Token Error:', meData.error.message);
      return;
    }
    console.log('✅ Token is valid. User:', meData.name);

    // Test 2: Check Business Account access
    console.log('Testing Business Account Access...');
    const bizRes = await fetch(`https://graph.facebook.com/v20.0/${businessId}?fields=name,username,profile_picture_url&access_token=${token}`);
    const bizData = await bizRes.json();
    
    if (bizData.error) {
      console.error('Business Account Error:', bizData.error.message);
      return;
    }
    console.log('✅ Business Account Found:', bizData.username);

    // Test 3: Check Permissions
    console.log('Checking Permissions...');
    const permRes = await fetch(`https://graph.facebook.com/v20.0/me/permissions?access_token=${token}`);
    const permData = await permRes.json();
    const permissions = permData.data?.filter(p => p.status === 'granted').map(p => p.permission);
    console.log('Granted Permissions:', permissions.join(', '));
    
    const required = ['instagram_basic', 'instagram_content_publish'];
    const missing = required.filter(p => !permissions.includes(p));
    
    if (missing.length > 0) {
      console.warn('⚠️ Missing recommended permissions:', missing.join(', '));
    } else {
      console.log('✅ All required permissions are present.');
    }

  } catch (error) {
    console.error('Fetch Error:', error.message);
  }
}

testInstagram();
