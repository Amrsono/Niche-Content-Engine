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
  // rebrand.ly was a broken placeholder used in early articles
  if (url.includes('rebrand.ly')) return true;
  // Two Unsplash photos were hardcoded as defaults across all early articles:
  // 1. photo-1677442136019 — a generic tech graphic
  // 2. photo-1451187580459 — planet Earth (the visible default the user reported)
  if (url.includes('unsplash.com')) return true;
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
        const newImageUrl = await generateOgImage(post.title, post.keyword);
        await updatePost(post.id, { ogImageUrl: newImageUrl });

        results.push({ id: post.id, title: post.title, status: 'fixed', newUrl: newImageUrl });
        console.log(`[FIX-IMAGES] ✅ Fixed: ${post.id}`);

        // Small delay between posts to stay within rate limits
        await new Promise(r => setTimeout(r, 3000));
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
