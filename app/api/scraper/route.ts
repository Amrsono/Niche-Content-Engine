import { NextResponse } from 'next/server';
import { runTrendScraper, generateArticle, generateOgImage, publishToWordpress, publishToSanity, publishToLocal, publishToInstagram, publishToTikTok, calculatePeakTime } from '@/lib/agents';

export async function POST(request: Request) {
  try {
    const { niche } = await request.json();
    
    // 1. Discovery Phase (Trends & TikTok)
    const trends = await runTrendScraper(niche || 'Sustainable Tech');
    if (trends.length === 0) {
      return NextResponse.json({ message: "No high-growth, low-comp keywords found." });
    }
    
    // Process the top "low-hanging fruit" keyword
    const targetKeyword = trends[0].keyword;
    
    // 2. Reasoning Phase (Gemini 2.0 Ultra generation)
    const draft = await generateArticle(targetKeyword);
    
    // 3. SEO Auto-Optimization Phase (DALL-E 3 / Meta)
    const ogImageUrl = await generateOgImage(draft.title);
    draft.ogImageUrl = ogImageUrl;
    
    // 4. Auto-Publisher Phase (Local by default, or WordPress/Sanity)
    const cmsProvider = request.headers.get('x-cms-provider');
    let publishResult;
    
    if (cmsProvider === 'wordpress') {
      publishResult = await publishToWordpress(draft);
    } else if (cmsProvider === 'sanity') {
      publishResult = await publishToSanity(draft);
    } else {
      publishResult = await publishToLocal(draft, targetKeyword);
    }
    
    // 5. Social Media Phase (Pulse across Instagram/TikTok)
    const igResult = await publishToInstagram(draft);
    const ttResult = await publishToTikTok(draft);

    // 6. Scheduling (Peak Engagement)
    const scheduledAt = calculatePeakTime();
    
    return NextResponse.json({
      success: true,
      message: "Autonomous cycle complete",
      keyword: targetKeyword,
      postUrl: publishResult.url,
      socialUrls: {
        instagram: igResult.url,
        tiktok: ttResult.url
      },
      platform: publishResult.platform || (cmsProvider === 'sanity' ? 'Sanity' : 'WordPress'),
      scheduledAt,
      draftPreview: draft
    });
  } catch (error: any) {
    console.error("[SYSTEM ERROR]", error);
    // Explicitly return the error message for debugging
    return NextResponse.json({ 
      success: false, 
      error: error.message || "An unexpected error occurred in the autonomous cycle",
      details: error.toString() 
    }, { status: 500 });
  }
}
