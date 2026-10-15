import { NextResponse } from 'next/server';
import { requireServerAdmin } from '@/lib/adminGuard.server';
import {
  runTrendScraper,
  generateArticle,
  generateOgImage,
  publishToLocal,
  updatePost,
  publishToFacebook,
  publishToInstagram,
  PublishResult,
} from '@/lib/agents';
import { requestIndexing } from '@/lib/indexing';
import { logger } from '@/lib/logger';
import { stringifyError } from '@/lib/ai/utils';
import { BatchRequestSchema, validateRequestBody } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const adminCheck = await requireServerAdmin();
    if (!adminCheck.authorized && adminCheck.errorResponse) {
      return adminCheck.errorResponse;
    }

    const body = await request.json().catch(() => ({}));
    const validation = validateRequestBody(BatchRequestSchema, body);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }

    const { niche, count, autoSocial, autoIndex } = validation.data;
    logger.info(`Starting bulk cycle for niche: ${niche} (Count: ${count})`, 'BATCH');

    // 1. Discovery Phase (Scrape targetCount low-hanging fruit keywords)
    const allTrends = await runTrendScraper(niche, count);
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

        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://niche-content-engine.vercel.app';
        const absoluteUrl = `${siteUrl}${publishResult.url}`;

        // 3. Fast-Track Indexing via Google Indexing API
        let indexingResult = { success: false, url: absoluteUrl };
        if (autoIndex !== false) {
          try {
            indexingResult = await requestIndexing(absoluteUrl);
          } catch (idxErr) {
            logger.warn(`Indexing failed for ${absoluteUrl}`, 'BATCH', idxErr);
          }
        }

        // 4. Secondary Social Signal Agent (Facebook Page & Instagram)
        let fbResult: PublishResult = { status: 'skipped', platform: 'Facebook' };
        let igResult: PublishResult = { status: 'skipped', platform: 'Instagram' };

        if (autoSocial !== false) {
          logger.info(`Secondary Agent: Posting social signals for '${article.title}'`, 'BATCH');
          try {
            fbResult = await publishToFacebook(article, absoluteUrl);
          } catch (fbErr) {
            fbResult = { status: 'error', message: stringifyError(fbErr), platform: 'Facebook' };
          }

          try {
            igResult = await publishToInstagram(article, absoluteUrl);
          } catch (igErr) {
            igResult = { status: 'error', message: stringifyError(igErr), platform: 'Instagram' };
          }
        }

        if (publishResult.platform === 'Local-Pulse-Blog' && publishResult.id) {
          await updatePost(publishResult.id, {
            facebookUrl: fbResult.status === 'success' ? fbResult.url : undefined,
            instagramUrl: igResult.status === 'success' ? igResult.url : undefined,
          });
        }

        completedActions.push({
          keyword: trend.keyword,
          title: article.title,
          url: publishResult.url,
          facebook: fbResult.status === 'success' ? fbResult.url : (fbResult.message || fbResult.status),
          instagram: igResult.status === 'success' ? igResult.url : (igResult.message || igResult.status),
          indexing: indexingResult.success,
        });

        if (index < targetTrends.length - 1) {
          logger.info('Cooling down for 10s between batch articles...', 'BATCH');
          await new Promise((resolve) => setTimeout(resolve, 10000));
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
