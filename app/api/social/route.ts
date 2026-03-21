import { NextResponse } from 'next/server';
import { getPostBySlug, updatePost } from '@/lib/storage';
import { publishToInstagram, publishToTwitter } from '@/lib/agents';
import type { Post } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const { postId, platform, slug } = await request.json();

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
    if (platform === 'twitter') {
      result = await publishToTwitter(article, `${request.headers.get('origin')}/blog/${post.slug}`);
    } else if (platform === 'instagram') {
      result = await publishToInstagram(article);
    } else {
      return NextResponse.json({ success: false, error: 'Invalid platform' }, { status: 400 });
    }

    // 3. Update the post if successful
    if (result.status === 'success' && result.url) {
      const updates: Partial<Post> = {};
      if (platform === 'twitter') updates.twitterUrl = result.url;
      if (platform === 'instagram') updates.instagramUrl = result.url;

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
