import { NextResponse } from 'next/server';
import { runTrendScraper, generateArticle, generateOgImage, publishToWordpress, publishToSanity, publishToLocal, calculatePeakTime, updatePost, PublishResult } from '@/lib/agents';
import { logger } from '@/lib/logger';
import { stringifyError } from '@/lib/ai/utils';
import { ScraperRequestSchema, validateRequestBody } from '@/lib/validation';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const validation = validateRequestBody(ScraperRequestSchema, body);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }

    const { niche } = validation.data;
    
    // 1. Discovery Phase
    const trends = await runTrendScraper(niche || 'All Trends');
    if (trends.length === 0) {
      return NextResponse.json({ message: "No high-growth, low-comp keywords found." });
    }
    
    const targetKeyword = trends[0].keyword;
    
    // 2. Reasoning Phase
    const draft = await generateArticle(targetKeyword);
    
    // 3. SEO Auto-Optimization Phase
    const ogImageUrl = await generateOgImage(draft.title, targetKeyword);
    draft.ogImageUrl = ogImageUrl;
    
    // 4. Auto-Publisher Phase
    const cmsProvider = request.headers.get('x-cms-provider');
    let publishResult: PublishResult;
    
    if (cmsProvider === 'wordpress') {
      publishResult = await publishToWordpress(draft);
    } else if (cmsProvider === 'sanity') {
      publishResult = await publishToSanity(draft);
    } else {
      publishResult = await publishToLocal(draft, targetKeyword, niche || 'General');
    }
    
    const igResult: PublishResult = { status: 'skipped', platform: 'Instagram' };
    const xResult: PublishResult = { status: 'skipped', platform: 'X/Twitter' };
    const ttResult: PublishResult = { status: 'skipped', platform: 'TikTok' };

    if (publishResult.platform === 'Local-Pulse-Blog' && publishResult.id) {
      await updatePost(publishResult.id, {
        instagramUrl: igResult.status === 'success' ? igResult.url : undefined,
        twitterUrl: xResult.status === 'success' ? xResult.url : undefined,
        tiktokUrl: ttResult.status === 'success' ? ttResult.url : undefined
      });
    }

    const scheduledAt = calculatePeakTime();
    
    return NextResponse.json({
      success: true,
      message: "Autonomous cycle complete",
      keyword: targetKeyword,
      postUrl: publishResult.url,
      socialUrls: {
        instagram: igResult.url,
        twitter: xResult.url,
        tiktok: ttResult.url
      },
      platform: publishResult.platform || (cmsProvider === 'sanity' ? 'Sanity' : 'WordPress'),
      scheduledAt,
      draftPreview: draft
    });
  } catch (error: unknown) {
    logger.error('System error during scraping cycle', 'SCRAPER_API', error);
    const message = stringifyError(error);
    return NextResponse.json({ 
      success: false, 
      error: message || "An unexpected error occurred in the autonomous cycle",
      details: String(error) 
    }, { status: 500 });
  }
}
