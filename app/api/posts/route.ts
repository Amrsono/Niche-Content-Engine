import { NextResponse } from 'next/server';
import { getPosts } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log(`[API/POSTS] GET request. reading from storage...`);
    const posts = await getPosts();
    return NextResponse.json({ success: true, posts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
