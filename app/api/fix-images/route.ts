import { NextResponse } from 'next/server';
import { getPosts, updatePost } from '@/lib/storage';
import { generateOgImage } from '@/lib/agents';
import { logger } from '@/lib/logger';
import { stringifyError } from '@/lib/ai/utils';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function isBrokenImage(url: string | undefined): boolean {
  if (!url) return true;
  if (url.includes('rebrand.ly')) return true;
  if (url.includes('unsplash.com')) return true;
  if (url.includes('image.pollinations.ai')) return true;
  if (url.includes('%22')) return true;
  return false;
}

export async function GET() {
  try {
    logger.info('Starting image repair scan...', 'FIX_IMAGES');
    const posts = await getPosts();

    const broken = posts.filter((p) => isBrokenImage(p.ogImageUrl));
    logger.info(`Found ${broken.length} posts with broken images out of ${posts.length} total.`, 'FIX_IMAGES');

    const results: { id: string; title: string; status: string; newUrl?: string; error?: string }[] = [];

    for (const post of broken) {
      try {
        logger.info(`Regenerating image for: "${post.title}" (id: ${post.id})`, 'FIX_IMAGES');
        const newImageUrl = await generateOgImage(post.title, post.keyword);
        await updatePost(post.id, { ogImageUrl: newImageUrl });

        results.push({ id: post.id, title: post.title, status: 'fixed', newUrl: newImageUrl });
        await new Promise((r) => setTimeout(r, 2000));
      } catch (err: unknown) {
        const errorMsg = stringifyError(err);
        logger.error(`Failed for post ${post.id}`, 'FIX_IMAGES', errorMsg);
        results.push({ id: post.id, title: post.title, status: 'error', error: errorMsg });
      }
    }

    const fixed = results.filter((r) => r.status === 'fixed').length;
    const failed = results.filter((r) => r.status === 'error').length;

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
  } catch (err: unknown) {
    logger.error('Fix-images route error', 'FIX_IMAGES', err);
    return NextResponse.json({ success: false, error: stringifyError(err) }, { status: 500 });
  }
}
