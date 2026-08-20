import { NextResponse } from 'next/server';
import { getPosts } from '@/lib/storage';
import { stringifyError } from '@/lib/ai/utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const posts = await getPosts();
    const postCount = posts.length;

    // Base performance model
    // - AdSense: $1.42 per post projection
    // - Affiliate: $0.89 per post projection
    const adsenseBase = postCount * 1.42;
    const affiliateBase = postCount * 0.89;

    const todayPosts = posts.filter((p) => {
      const postDate = new Date(p.publishedAt).toDateString();
      const today = new Date().toDateString();
      return postDate === today;
    }).length;

    const adsenseToday = todayPosts * 0.50;

    // Generate Chart Data (Last 7 days)
    const chartData = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toDateString();
      
      const count = posts.filter((p) => new Date(p.publishedAt).toDateString() === dateStr).length;
      return Math.min(20 + (count * 20), 100);
    });

    return NextResponse.json({
      success: true,
      stats: {
        adsense: adsenseBase.toFixed(2),
        adsenseGrowth: todayPosts > 0 ? `+${((adsenseToday / adsenseBase) * 100).toFixed(1)}%` : '0%',
        affiliates: affiliateBase.toFixed(2),
        clicks: postCount * 3,
        chartData,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: stringifyError(error) }, { status: 500 });
  }
}
