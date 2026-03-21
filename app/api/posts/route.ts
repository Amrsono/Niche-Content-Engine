import { NextResponse } from 'next/server';
import { getPosts } from '@/lib/storage';

export async function GET() {
  try {
    const posts = await getPosts();
    return NextResponse.json({ success: true, posts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
