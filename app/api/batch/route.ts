import { NextResponse } from 'next/server';
import { runTrendScraper, generateArticle, generateOgImage, publishToWordpress } from '@/lib/agents';
import { requestIndexing } from '@/lib/indexing';

export async function POST(request: Request) {
  try {
    const { niche, count = 5 } = await request.json();
    
    console.log(`[BATCH] Starting bulk cycle for niche: ${niche} (Count: ${count})`);
    
    // 1. Discovery Phase
    const allTrends = await runTrendScraper(niche);
    const targetTrends = allTrends.slice(0, count);
    
    const results = [];
    
    // 2. Parallel Generation (Groq is fast enough to handle this)
    const batchTasks = targetTrends.map(async (trend, index) => {
      try {
        console.log(`[BATCH] Processing #${index + 1}: ${trend.keyword}`);
        
        // Generate Article
        const article = await generateArticle(trend.keyword);
        
        // Generate Image
        const ogImageUrl = await generateOgImage(article.title);
        article.ogImageUrl = ogImageUrl;
        
        // Publish (Mock for now)
        const publishResult = await publishToWordpress(article);
        
        // Indexing (Fast-Track)
        const indexingResult = await requestIndexing(publishResult.url || `https://yoursite.com/${trend.keyword}`);
        
        return {
          keyword: trend.keyword,
          title: article.title,
          url: publishResult.url,
          indexing: indexingResult.success
        };
      } catch (err: any) {
        return { keyword: trend.keyword, error: err.message };
      }
    });

    const completedActions = await Promise.all(batchTasks);

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
