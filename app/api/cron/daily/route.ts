import { NextResponse } from 'next/server';
import { getNextNiche, addDiscoveredTopics } from '@/lib/niche-manager';
import { generateArticle, generateOgImage, publishToLocal, updatePost, PublishResult } from '@/lib/agents';
import { fetchGoogleTrends, scrapeTikTokTrends, GoogleTrendItem, TikTokTrendItem } from '@/lib/scraper';
import { requestIndexing } from '@/lib/indexing';
import { logger } from '@/lib/logger';
import { stringifyError } from '@/lib/ai/utils';

export async function GET(request: Request) {
  try {
    // 1. Security Check
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
    }

    logger.info('Waking up for daily cycle...', 'CRON_DAILY');
    
    // --- PART 1: DISCOVERY ---
    logger.info('Step 1: Discovering new trends...', 'CRON_DAILY');
    try {
      const [googleTrends, tiktokTrends] = await Promise.all([
        fetchGoogleTrends(),
        scrapeTikTokTrends()
      ]);
      const keywords: string[] = [];
      if (googleTrends && Array.isArray(googleTrends)) {
        keywords.push(...googleTrends.slice(0, 5).map((t: GoogleTrendItem) => t.title));
      }
      if (tiktokTrends && Array.isArray(tiktokTrends)) {
        keywords.push(...tiktokTrends.slice(0, 5).map((t: TikTokTrendItem) => t.keyword));
      }
      
      await addDiscoveredTopics(keywords);
    } catch (e) {
      logger.warn('Discovery phase failed, continuing to publish', 'CRON_DAILY', e);
    }

    // --- PART 2: PUBLISHING ---
    logger.info('Step 2: Publishing new article...', 'CRON_DAILY');
    const keyword = await getNextNiche();
    logger.info(`Selected topic: ${keyword}`, 'CRON_DAILY');

    const article = await generateArticle(keyword);
    article.ogImageUrl = await generateOgImage(article.title, keyword);

    const publishResult = await publishToLocal(article, keyword, keyword);
    
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://niche-content-engine.vercel.app';
    const absoluteUrl = `${siteUrl}${publishResult.url}`;
    
    const igResult: PublishResult = { status: 'skipped', platform: 'Instagram' };
    const xResult: PublishResult = { status: 'skipped', platform: 'X/Twitter' };
    const tkResult: PublishResult = { status: 'skipped', platform: 'TikTok' };
    const fbResult: PublishResult = { status: 'skipped', platform: 'Facebook' };
    
    await requestIndexing(absoluteUrl);

    if (publishResult.platform === 'Local-Pulse-Blog' && publishResult.id) {
      await updatePost(publishResult.id, {
        instagramUrl: igResult.status === 'success' ? igResult.url : undefined,
        twitterUrl: xResult.status === 'success' ? xResult.url : undefined,
        tiktokUrl: tkResult.status === 'success' ? tkResult.url : undefined,
        facebookUrl: fbResult.status === 'success' ? fbResult.url : undefined,
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
        facebook: fbResult.status === 'success',
      }
    });

  } catch (error: unknown) {
    logger.error('Daily cron error', 'CRON_DAILY', error);
    return NextResponse.json({ success: false, error: stringifyError(error) }, { status: 500 });
  }
}
