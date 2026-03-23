import { NextResponse } from 'next/server';
import { fetchGoogleTrends, scrapeTikTokTrends } from '@/lib/scraper';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [googleTrends, tiktokTrends] = await Promise.all([
      fetchGoogleTrends(),
      scrapeTikTokTrends()
    ]);

    // Map trends to random (but stable-ish) global coordinates, ensuring they stay safely away from edges to prevent tooltips from being cropped
    const coordinates = [
      { top: '35%', left: '25%' }, // North America
      { top: '45%', left: '50%' }, // Europe
      { top: '55%', left: '75%' }, // Asia/East
      { top: '65%', left: '30%' }, // South America
      { top: '75%', left: '60%' }, // Africa/South
      { top: '30%', left: '70%' }, // North Asia
    ];

    const combined = [
      ...googleTrends.slice(0, 3).map((t: any, i: number) => ({
        keyword: t.title,
        growth: t.traffic || 'High',
        type: 'Google',
        ...coordinates[i % coordinates.length]
      })),
      ...tiktokTrends.map((t: any, i: number) => ({
        keyword: t.keyword,
        growth: t.growth,
        type: 'TikTok',
        ...coordinates[(i + 3) % coordinates.length]
      }))
    ];

    return NextResponse.json({ success: true, trends: combined });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
