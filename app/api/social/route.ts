import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getPostBySlug, updatePost } from '@/lib/storage';
import { publishToInstagram, publishToTwitter, publishToTikTok } from '@/lib/agents';
import type { Post } from '@/lib/types';

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { postId, platform, slug } = await request.json();
    const origin = request.headers.get('origin') || `http://${request.headers.get('host')}` || 'http://localhost:3000';

    if (!slug || !platform) {
      return NextResponse.json({ success: false, error: 'Missing slug or platform' }, { status: 400 });
    }

    // 1. Get the post
    const post = await getPostBySlug(slug);
    if (!post) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
    }

    console.log(`[SOCIAL API] Signaling ${platform} for: ${post.title}`);

    let result;
    const article = {
      title: post.title,
      content: post.content,
      metaDescription: post.metaDescription,
      ogImageUrl: post.ogImageUrl
    };

    // 2. Trigger the agent
    const blogUrl = `${origin}/blog/${post.slug}`;
    if (platform === 'twitter') {
      result = await publishToTwitter(article, blogUrl);
    } else if (platform === 'instagram') {
      result = await publishToInstagram(article, blogUrl);
    } else if (platform === 'tiktok') {
      result = await publishToTikTok(article, blogUrl);
    } else {
      return NextResponse.json({ success: false, error: 'Invalid platform' }, { status: 400 });
    }

    // 3. Update the post if successful
    if (result.status === 'success' && result.url) {
      const updates: Partial<Post> = {};
      if (platform === 'twitter') updates.twitterUrl = result.url;
      if (platform === 'instagram') updates.instagramUrl = result.url;
      if (platform === 'tiktok') updates.tiktokUrl = result.url;

      await updatePost(post.id, updates);
      return NextResponse.json({ success: true, url: result.url });
    }

    return NextResponse.json({ 
      success: false, 
      error: result.message || `Failed to post to ${platform}`,
      status: result.status 
    });

  } catch (error: any) {
    console.error('[SOCIAL API ERROR]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
