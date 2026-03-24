import { NextResponse } from 'next/server';
import { getPosts, updatePost } from '@/lib/storage';
import { generateOgImage } from '@/lib/agents';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes – allow time for many posts

/**
 * Identifies posts whose ogImageUrl is broken or a generic placeholder.
 */
function isBrokenImage(url: string | undefined): boolean {
  if (!url) return true;
  if (url.includes('rebrand.ly')) return true;
  if (url.includes('unsplash.com')) return true;
  // Previously we used image.pollinations.ai/prompt/ but this was deprecated and returns 404 ORB blocks
  if (url.includes('image.pollinations.ai')) return true;
  // Encoded quotes in the prompt cause 401/404 on current gen.pollinations.ai
  if (url.includes('%22')) return true;
  return false;
}

export async function GET() {
  try {
    console.log('[FIX-IMAGES] Starting image repair scan...');
    const posts = await getPosts();

    const broken = posts.filter(p => isBrokenImage(p.ogImageUrl));
    console.log(`[FIX-IMAGES] Found ${broken.length} posts with broken/default images out of ${posts.length} total.`);

    const results: { id: string; title: string; status: string; newUrl?: string; error?: string }[] = [];

    for (const post of broken) {
      try {
        console.log(`[FIX-IMAGES] Regenerating image for: "${post.title}" (id: ${post.id})`);
        
        // Use our upgraded agent system to generate the new, highly creative prompt and image URL
        // `generateOgImage` in `lib/agents.ts` now securely uses the properly authenticated `gen.pollinations.ai` endpoints
        const newImageUrl = await generateOgImage(post.title, post.keyword);
        
        // This is the CRITICAL missing link. updatePost saves to Redis if KV_URL is available!
        await updatePost(post.id, { ogImageUrl: newImageUrl });

        results.push({ id: post.id, title: post.title, status: 'fixed', newUrl: newImageUrl });
        console.log(`[FIX-IMAGES] ✅ Fixed: ${post.id}`);

        // Rate limit for Groq & Pollinations 
        await new Promise(r => setTimeout(r, 2000));
      } catch (err: any) {
        const errorMsg = err?.message || String(err);
        console.error(`[FIX-IMAGES] ❌ Failed for post ${post.id}:`, errorMsg);
        results.push({ id: post.id, title: post.title, status: 'error', error: errorMsg });
      }
    }

    const fixed = results.filter(r => r.status === 'fixed').length;
    const failed = results.filter(r => r.status === 'error').length;

    return NextResponse.json({
      success: true,
      summary: {
        totalPosts: posts.length,
        brokenFound: broken.length,
        fixed,
        failed,
      },
      results,
    });
  } catch (err: any) {
    console.error('[FIX-IMAGES ERROR]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
