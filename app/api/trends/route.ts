import { NextResponse } from 'next/server';
import { fetchGoogleTrends, scrapeTikTokTrends, GoogleTrendItem, TikTokTrendItem } from '@/lib/scraper';
import { stringifyError } from '@/lib/ai/utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [googleTrends, tiktokTrends] = await Promise.all([
      fetchGoogleTrends(),
      scrapeTikTokTrends()
    ]);

    const coordinates = [
      { top: '35%', left: '25%' },
      { top: '45%', left: '50%' },
      { top: '55%', left: '75%' },
      { top: '65%', left: '30%' },
      { top: '75%', left: '60%' },
      { top: '30%', left: '70%' },
    ];

    const combined = [
      ...googleTrends.slice(0, 3).map((t: GoogleTrendItem, i: number) => ({
        keyword: t.title,
        growth: t.traffic || 'High',
        type: 'Google',
        ...coordinates[i % coordinates.length]
      })),
      ...tiktokTrends.map((t: TikTokTrendItem, i: number) => ({
        keyword: t.keyword,
        growth: t.growth,
        type: 'TikTok',
        ...coordinates[(i + 3) % coordinates.length]
      }))
    ];

    return NextResponse.json({ success: true, trends: combined });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: stringifyError(error) }, { status: 500 });
  }
}
