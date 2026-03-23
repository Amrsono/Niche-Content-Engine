import { NextResponse } from 'next/server';
import { getNextNiche, addDiscoveredTopics } from '@/lib/niche-manager';
import { generateArticle, generateOgImage, publishToLocal, publishToInstagram, publishToTwitter, publishToTikTok, updatePost, PublishResult } from '@/lib/agents';
import { fetchGoogleTrends, scrapeTikTokTrends } from '@/lib/scraper';
import { requestIndexing } from '@/lib/indexing';

// Single Daily Cron for Vercel Hobby Limits
export async function GET(request: Request) {
  try {
    // 1. Security Check
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
    }

    console.log(`[CRON DAILY] Waking up for daily cycle...`);
    
    // --- PART 1: DISCOVERY ---
    console.log(`[CRON DAILY] Step 1: Discovering new trends...`);
    try {
      const [googleTrends, tiktokTrends] = await Promise.all([
        fetchGoogleTrends(),
        scrapeTikTokTrends()
      ]);
      const keywords: string[] = [];
      if (googleTrends && Array.isArray(googleTrends)) keywords.push(...googleTrends.slice(0, 5).map((t: any) => t.title as string));
      if (tiktokTrends && Array.isArray(tiktokTrends)) keywords.push(...tiktokTrends.slice(0, 5).map((t: any) => t.keyword as string));
      
      await addDiscoveredTopics(keywords);
    } catch (e) {
      console.warn(`[CRON DAILY] Discovery phase failed, but continuing to publish...`, e);
    }

    // --- PART 2: PUBLISHING ---
    console.log(`[CRON DAILY] Step 2: Publishing new article...`);
    const keyword = await getNextNiche();
    console.log(`[CRON DAILY] Selected topic: ${keyword}`);

    const article = await generateArticle(keyword);
    article.ogImageUrl = await generateOgImage(article.title);

    const publishResult = await publishToLocal(article, keyword);
    
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://niche-content-engine.vercel.app';
    const absoluteUrl = `${siteUrl}${publishResult.url}`;
    
    // Social publishing is now done strictly manually via the UI
    const igResult: PublishResult = { status: 'skipped', platform: 'Instagram' };
    const xResult: PublishResult = { status: 'skipped', platform: 'X/Twitter' };
    const tkResult: PublishResult = { status: 'skipped', platform: 'TikTok' };
    
    await requestIndexing(absoluteUrl);

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
        instagram: igResult.status === 'success',
        twitter: xResult.status === 'success',
        tiktok: tkResult.status === 'success',
      }
    });

  } catch (error: any) {
    console.error("[CRON DAILY ERROR]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
