/**
 * Standalone script: Sync Local posts.json to Production Redis Storage
 * 
 * Since the previous scripts only fixed the local filesystem 'data/posts.json' 
 * and bypassed `lib/storage.ts`'s Redis logic, test/production environments reading
 * from KV/Redis were still seeing the broken image.pollinations.ai URLs.
 * 
 * This reads the perfectly-fixed local JSON and pushes it to Redis.
 */

const fs = require('fs');
const path = require('path');
const Redis = require('ioredis');
require('dotenv').config({ path: '.env.local' });

const POSTS_FILE = path.resolve(__dirname, '../data/posts.json');
const REDIS_URL = process.env.REDIS_URL || process.env.KV_URL;
const POSTS_KEY = 'niche_engine_posts';

async function main() {
  if (!REDIS_URL) {
    console.error('❌ No REDIS_URL or KV_URL found in .env.local');
    process.exit(1);
  }

  console.log('🔗 Connecting to Redis Production DB...');
  const redis = new Redis(REDIS_URL);

  redis.on('error', (err) => {
    console.error('❌ Redis Connection Error:', err.message);
    process.exit(1);
  });

  try {
    const rawData = fs.readFileSync(POSTS_FILE, 'utf-8');
    const localPosts = JSON.parse(rawData);

    console.log(`📦 Loaded ${localPosts.length} posts from local data/posts.json`);
    
    // Quick validation
    const broken = localPosts.filter(p => !p.ogImageUrl || p.ogImageUrl.includes('image.pollinations.ai/prompt'));
    if (broken.length > 0) {
      console.warn(`⚠️ Warning: Found ${broken.length} posts heavily matching the old deprecated URL format.`);
    } else {
      console.log('✅ All local posts verified to NOT use the deprecated pollinations URL formats.');
    }

    console.log(`📤 Pushing ${localPosts.length} posts to Redis key: ${POSTS_KEY}...`);
    await redis.set(POSTS_KEY, JSON.stringify(localPosts));

    console.log('✅ Successfully fully synchronized Local File to Production Redis Storage!');
  } catch (err) {
    console.error('❌ Failed to sync:', err);
  } finally {
    redis.quit();
    process.exit(0);
  }
}

main().catch(console.error);
