import { NextResponse } from 'next/server';
import { getNextNiche, addDiscoveredTopics } from '@/lib/niche-manager';
import { generateArticle, generateOgImage, publishToLocal, updatePost, publishToFacebook, publishToInstagram, PublishResult } from '@/lib/agents';
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
        keywords.push(...googleTrends.slice(0, 10).map((t: GoogleTrendItem) => t.title));
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

    // --- PART 3: FAST-TRACK INDEXING ---
    logger.info('Step 3: Fast-Track Indexing...', 'CRON_DAILY');
    await requestIndexing(absoluteUrl);

    // --- PART 4: SOCIAL SIGNAL AGENT (Facebook + Instagram) ---
    logger.info('Step 4: Social Signal Agent posting to Facebook & Instagram...', 'CRON_DAILY');
    let fbResult: PublishResult = { status: 'skipped', platform: 'Facebook' };
    let igResult: PublishResult = { status: 'skipped', platform: 'Instagram' };

    try {
      fbResult = await publishToFacebook(article, absoluteUrl);
      logger.info(`Facebook result: ${fbResult.status}`, 'CRON_DAILY');
    } catch (fbErr) {
      logger.warn('Facebook publish failed in cron', 'CRON_DAILY', fbErr);
    }

    try {
      igResult = await publishToInstagram(article, absoluteUrl);
      logger.info(`Instagram result: ${igResult.status}`, 'CRON_DAILY');
    } catch (igErr) {
      logger.warn('Instagram publish failed in cron', 'CRON_DAILY', igErr);
    }

    if (publishResult.platform === 'Local-Pulse-Blog' && publishResult.id) {
      await updatePost(publishResult.id, {
        facebookUrl: fbResult.status === 'success' ? fbResult.url : undefined,
        instagramUrl: igResult.status === 'success' ? igResult.url : undefined,
      });
    }

    return NextResponse.json({
      success: true,
      publishedTopic: keyword,
      url: absoluteUrl,
      socials: {
        facebook: fbResult.status === 'success',
        instagram: igResult.status === 'success',
      }
    });

  } catch (error: unknown) {
    logger.error('Daily cron error', 'CRON_DAILY', error);
    return NextResponse.json({ success: false, error: stringifyError(error) }, { status: 500 });
  }
}
