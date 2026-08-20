import { NextResponse } from 'next/server';
import { getPosts } from '@/lib/storage';
import { logger } from '@/lib/logger';
import { stringifyError } from '@/lib/ai/utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    logger.info('GET request, reading posts from storage...', 'API/POSTS');
    const posts = await getPosts();
    return NextResponse.json({ success: true, posts });
  } catch (error: unknown) {
    logger.error('Failed to get posts', 'API/POSTS', error);
    return NextResponse.json({ success: false, error: stringifyError(error) }, { status: 500 });
  }
}
