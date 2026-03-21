import { NextResponse } from 'next/server';
import { runTrendScraper, generateArticle, generateOgImage, publishToLocal, publishToInstagram, publishToTwitter, updatePost, PublishResult } from '@/lib/agents';
import { requestIndexing } from '@/lib/indexing';

export async function POST(request: Request) {
  try {
    const { niche, count = 5 } = await request.json();
    console.log(`[BATCH] CWD: ${process.cwd()}`);
    console.log(`[BATCH] Starting bulk cycle for niche: ${niche} (Count: ${count})`);
    
    // 1. Discovery Phase
    const allTrends = await runTrendScraper(niche);
    const targetTrends = allTrends.slice(0, count);
    
    const results = [];
    
    const completedActions = [];
    
    // 2. Sequential Generation (Prevents hitting rate limits in bulk mode)
    for (const [index, trend] of targetTrends.entries()) {
      try {
        console.log(`[BATCH] Processing #${index + 1}/${targetTrends.length}: ${trend.keyword}`);
        
        // Generate Article
        const article = await generateArticle(trend.keyword);
        
        // Generate Image (Static placeholder for now as per agents.ts)
        const ogImageUrl = await generateOgImage(article.title);
        article.ogImageUrl = ogImageUrl;
        
        // Publish (Local Pulse Blog)
        const publishResult: PublishResult = await publishToLocal(article, trend.keyword);
        
        // Social Signal - Instagram & X/Twitter
        const igResult = await publishToInstagram(article);
        const xResult = await publishToTwitter(article, publishResult.url);
        
        // Indexing (Fast-Track)
        const indexingResult = await requestIndexing(publishResult.url || `https://yoursite.com/${trend.keyword}`);
        
        // Save Social Links to Local Pulse if applicable
        if (publishResult.platform === 'Local-Pulse-Blog' && publishResult.id) {
          await updatePost(publishResult.id, {
            instagramUrl: igResult.status === 'success' ? igResult.url : undefined,
            twitterUrl: xResult.status === 'success' ? xResult.url : undefined,
          });
        }
        
        completedActions.push({
          keyword: trend.keyword,
          title: article.title,
          url: publishResult.url,
          instagram: igResult.status === 'success' ? igResult.url : igResult.status,
          twitter: xResult.status === 'success' ? xResult.url : xResult.status,
          indexing: indexingResult.success
        });

        // Small cooldown between articles to breathe
        if (index < targetTrends.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      } catch (err: any) {
        completedActions.push({ keyword: trend.keyword, error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      niche,
      totalProcessed: completedActions.length,
      results: completedActions
    });
  } catch (error: any) {
    console.error("[BATCH ERROR]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
