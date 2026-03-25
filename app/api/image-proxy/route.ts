import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Proxies images from Pollinations.ai to ensure a stable, 
 * correctly-headed image/jpeg response for Instagram/Meta.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return new NextResponse('Missing URL parameter', { status: 400 });
  }

  // Inject the required API key for legacy database URLs missing it
  if (imageUrl.includes('pollinations.ai') && !imageUrl.includes('key=')) {
    imageUrl += (imageUrl.includes('?') ? '&' : '?') + 'key=pk_31oNBvU9JLA1ApNX';
  }

  try {
    console.log(`[IMAGE-PROXY] Fetching: ${imageUrl}`);
    const response = await fetch(imageUrl, {
      headers: {
        'Accept': 'image/*'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Proxy-Source': 'Pollinations-Stable-Proxy'
      },
    });
  } catch (error: any) {
    console.error(`[IMAGE-PROXY ERROR] ${error.message}`);
    return new NextResponse(`Proxy Error: ${error.message}`, { status: 500 });
  }
}
