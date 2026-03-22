import { NextResponse } from 'next/server';
import { fetchGoogleTrends, scrapeTikTokTrends } from '@/lib/scraper';
import { addDiscoveredTopics } from '@/lib/niche-manager';

export async function GET(request: Request) {
  try {
    // 1. Security Check
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
    }

    console.log(`[CRON 24-HR] Waking up to discover new niches...`);

    // 2. Fetch fresh trends from multiple sources
    const [googleTrends, tiktokTrends] = await Promise.all([
      fetchGoogleTrends(),
      scrapeTikTokTrends()
    ]);

    // 3. Extract keywords (top 5 from each)
    const keywords: string[] = [];
    
    if (googleTrends && Array.isArray(googleTrends)) {
      keywords.push(...googleTrends.slice(0, 5).map((t: any) => t.title as string));
    }
    
    if (tiktokTrends && Array.isArray(tiktokTrends)) {
      keywords.push(...tiktokTrends.slice(0, 5).map((t: any) => t.keyword as string));
    }

    // 4. Send to Niche Manager to append uniquely
    await addDiscoveredTopics(keywords);

    return NextResponse.json({
      success: true,
      discovered: keywords.length,
      newTopics: keywords
    });

  } catch (error: any) {
    console.error("[CRON 24-HR ERROR]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
