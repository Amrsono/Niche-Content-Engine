import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getPostBySlug, updatePost } from '@/lib/storage';
import { publishToInstagram, publishToTwitter, publishToTikTok, publishToFacebook } from '@/lib/agents';
import type { Post } from '@/lib/types';
import { logger } from '@/lib/logger';
import { stringifyError } from '@/lib/ai/utils';

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { platform, slug } = await request.json();
    const origin = request.headers.get('origin') || `http://${request.headers.get('host')}` || 'http://localhost:3000';

    if (!slug || !platform) {
      return NextResponse.json({ success: false, error: 'Missing slug or platform' }, { status: 400 });
    }

    const post = await getPostBySlug(slug);
    if (!post) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
    }

    logger.info(`Signaling ${platform} for: ${post.title}`, 'SOCIAL_API');

    const article = {
      title: post.title,
      content: post.content,
      metaDescription: post.metaDescription,
      ogImageUrl: post.ogImageUrl
    };

    const blogUrl = `${origin}/blog/${post.slug}`;
    let result;
    
    if (platform === 'twitter') {
      result = await publishToTwitter(article, blogUrl);
    } else if (platform === 'instagram') {
      result = await publishToInstagram(article, blogUrl);
    } else if (platform === 'tiktok') {
      result = await publishToTikTok(article, blogUrl);
    } else if (platform === 'facebook') {
      result = await publishToFacebook(article, blogUrl);
    } else {
      return NextResponse.json({ success: false, error: 'Invalid platform' }, { status: 400 });
    }

    if (result.status === 'success' && result.url) {
      const updates: Partial<Post> = {};
      if (platform === 'twitter') updates.twitterUrl = result.url;
      if (platform === 'instagram') updates.instagramUrl = result.url;
      if (platform === 'tiktok') updates.tiktokUrl = result.url;
      if (platform === 'facebook') updates.facebookUrl = result.url;

      await updatePost(post.id, updates);
      return NextResponse.json({ success: true, url: result.url });
    }

    return NextResponse.json({ 
      success: false, 
      error: result.message || `Failed to post to ${platform}`,
      status: result.status 
    });

  } catch (error: unknown) {
    logger.error('Social API error', 'SOCIAL_API', error);
    return NextResponse.json({ success: false, error: stringifyError(error) }, { status: 500 });
  }
}
