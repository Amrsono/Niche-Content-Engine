import { NextResponse } from 'next/server';
import { getNextNiche } from '@/lib/niche-manager';
import { generateArticle, generateOgImage, publishToLocal, publishToInstagram, publishToTwitter, publishToTikTok, updatePost } from '@/lib/agents';
import { requestIndexing } from '@/lib/indexing';

// Vercel Cron sends a GET request
export async function GET(request: Request) {
  try {
    // 1. Security Check
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // Allow execution in dev or if secret isn't set, but block unauthorized production requests
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
    }

    console.log(`[CRON 20-MIN] Waking up to publish new article...`);
    
    // 2. Determine next topic
    const keyword = await getNextNiche();
    console.log(`[CRON 20-MIN] Selected topic from round-robin: ${keyword}`);

    // 3. Generate content
    const article = await generateArticle(keyword);
    const ogImageUrl = await generateOgImage(article.title);
    article.ogImageUrl = ogImageUrl;

    // 4. Publish to blog
    const publishResult = await publishToLocal(article, keyword);
    
    // 5. Social signaling
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://niche-content-engine.vercel.app';
    const absoluteUrl = `${siteUrl}${publishResult.url}`;
    
    const igResult = await publishToInstagram(article, absoluteUrl);
    const xResult = await publishToTwitter(article, absoluteUrl);
    const tkResult = await publishToTikTok(article, absoluteUrl);
    
    // 6. Fast track indexing
    const indexingResult = await requestIndexing(absoluteUrl);

    // Save social urls back to post
    if (publishResult.platform === 'Local-Pulse-Blog' && publishResult.id) {
      await updatePost(publishResult.id, {
        instagramUrl: igResult.status === 'success' ? igResult.url : undefined,
        twitterUrl: xResult.status === 'success' ? xResult.url : undefined,
        tiktokUrl: tkResult.status === 'success' ? tkResult.url : undefined,
      });
    }

    return NextResponse.json({
      success: true,
      publishedTopic: keyword,
      url: absoluteUrl,
      socials: {
        instagram: igResult.status === 'success' ? igResult.url : false,
        twitter: xResult.status === 'success' ? xResult.url : false,
        tiktok: tkResult.status === 'success' ? tkResult.url : false,
      }
    });

  } catch (error: any) {
    console.error("[CRON 20-MIN ERROR]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
