require('dotenv').config({ path: '.env.local' });
const { Redis } = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);
async function run() {
  const data = await redis.get('niche_engine_posts');
  let posts = JSON.parse(data || '[]');
  let updated = 0;
  posts.forEach(p => {
    if (p.ogImageUrl && (p.ogImageUrl.includes('gen.pollinations.ai') || p.ogImageUrl.includes('pollinations.ai/p/'))) {
      const isProxy = p.ogImageUrl.includes('image-proxy');
      const base = "https://image.pollinations.ai/prompt/" + encodeURIComponent(p.title + ' digital art cinematic') + "?width=1200&height=630&nologo=true&enhance=true&model=flux";
      p.ogImageUrl = isProxy ? ('/api/image-proxy?url=' + encodeURIComponent(base)) : base;
      updated++;
    }
  });
  if (updated) await redis.set('niche_engine_posts', JSON.stringify(posts));
  console.log('Fixed', updated, 'posts.');
  process.exit(0);
}
run();
