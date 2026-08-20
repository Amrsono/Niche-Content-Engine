import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { runTrendScraper, generateArticle, generateOgImage, publishToLocal, updatePost, PublishResult } from '@/lib/agents';
import { requestIndexing } from '@/lib/indexing';
import { logger } from '@/lib/logger';
import { stringifyError } from '@/lib/ai/utils';
import { BatchRequestSchema, validateRequestBody } from '@/lib/validation';
import { isUserAdmin } from '@/lib/env';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;
    if (!isUserAdmin(email)) {
      return NextResponse.json({ success: false, error: 'Forbidden — admin only' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const validation = validateRequestBody(BatchRequestSchema, body);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }

    const { niche, count } = validation.data;
    logger.info(`Starting bulk cycle for niche: ${niche} (Count: ${count})`, 'BATCH');
    
    // 1. Discovery Phase
    const allTrends = await runTrendScraper(niche);
    const targetTrends = allTrends.slice(0, count);
    
    const completedActions = [];
    
    // 2. Sequential Generation
    for (const [index, trend] of targetTrends.entries()) {
      try {
        logger.info(`Processing #${index + 1}/${targetTrends.length}: ${trend.keyword}`, 'BATCH');
        
        // Generate Article
        const article = await generateArticle(trend.keyword);
        
        // Generate Image
        const ogImageUrl = await generateOgImage(article.title, trend.keyword || niche);
        article.ogImageUrl = ogImageUrl;
        
        // Publish (Local Pulse Blog)
        const publishResult: PublishResult = await publishToLocal(article, trend.keyword, trend.niche || niche);
        
        // Social Signal - manual via UI
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://niche-content-engine.vercel.app';
        const absoluteUrl = `${siteUrl}${publishResult.url}`;
        
        const igResult: PublishResult = { status: 'skipped', platform: 'Instagram' };
        const xResult: PublishResult = { status: 'skipped', platform: 'X/Twitter' };
        const tkResult: PublishResult = { status: 'skipped', platform: 'TikTok' };
        
        // Indexing (Fast-Track)
        const indexingResult = await requestIndexing(absoluteUrl);
        
        if (publishResult.platform === 'Local-Pulse-Blog' && publishResult.id) {
          await updatePost(publishResult.id, {
            instagramUrl: igResult.status === 'success' ? igResult.url : undefined,
            twitterUrl: xResult.status === 'success' ? xResult.url : undefined,
            tiktokUrl: tkResult.status === 'success' ? tkResult.url : undefined,
          });
        }
        
        completedActions.push({
          keyword: trend.keyword,
          title: article.title,
          url: publishResult.url,
          instagram: igResult.status === 'success' ? igResult.url : igResult.status,
          twitter: xResult.status === 'success' ? xResult.url : xResult.status,
          tiktok: tkResult.status === 'success' ? tkResult.url : tkResult.status,
          indexing: indexingResult.success
        });

        if (index < targetTrends.length - 1) {
          logger.info('Cooling down for 15s between batch articles...', 'BATCH');
          await new Promise(resolve => setTimeout(resolve, 15000));
        }
      } catch (err: unknown) {
        completedActions.push({ keyword: trend.keyword, error: stringifyError(err) });
      }
    }

    logger.info(`Batch Cycle Complete. Total: ${completedActions.length}`, 'BATCH');

    return NextResponse.json({
      success: true,
      niche,
      totalProcessed: completedActions.length,
      results: completedActions
    });
  } catch (error: unknown) {
    logger.error('Batch route exception', 'BATCH', error);
    return NextResponse.json({ success: false, error: stringifyError(error) }, { status: 500 });
  }
}
