import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { stringifyError } from '@/lib/ai/utils';

export const dynamic = 'force-dynamic';

/**
 * Proxies images from Pollinations.ai to ensure a stable, 
 * correctly-headed image/jpeg response.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return new NextResponse('Missing URL parameter', { status: 400 });
  }

  // PREVENT LOOPS
  if (imageUrl.startsWith('/api/image-proxy') || imageUrl.includes('localhost')) {
    return createPlaceholderSvg("Local Path Detected", "700", "400");
  }

  // Remove deprecated API key if present
  if (imageUrl.includes('pollinations.ai') && imageUrl.includes('key=')) {
    imageUrl = imageUrl.replace(/&key=[^&]*/, '').replace(/\?key=[^&]*&/, '?').replace(/\?key=[^&]*$/, '');
  }

  try {
    logger.debug(`Proxying image: ${imageUrl}`, 'IMAGE_PROXY');
    
    const fetchPromise = fetch(imageUrl, {
      headers: { 'Accept': 'image/*' }
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('ProxyTimeout')), 2500);
    });

    const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;

    if (!response.ok) {
      throw new Error(`External Error: ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('image')) {
      throw new Error(`Invalid content type: ${contentType}`);
    }

    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Proxy-Source': 'Pollinations-Stable-Proxy'
      },
    });
  } catch (error: unknown) {
    logger.warn(`Image proxy failed (${stringifyError(error)}), returning placeholder`, 'IMAGE_PROXY');
    
    const titleFromPrompt = imageUrl.split('/image/')[1]?.split('?')[0] || "Pulse AI Content";
    const cleanTitle = decodeURIComponent(titleFromPrompt).replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 40);
    
    return createPlaceholderSvg(cleanTitle, "1200", "630");
  }
}

function createPlaceholderSvg(title: string, width: string, height: string) {
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0f172a" />
          <stop offset="100%" style="stop-color:#1e293b" />
        </linearGradient>
        <filter id="f" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="40" />
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)" />
      <circle cx="10%" cy="10%" r="20%" fill="#3b82f6" opacity="0.1" filter="url(#f)" />
      <circle cx="90%" cy="90%" r="30%" fill="#ec4899" opacity="0.1" filter="url(#f)" />
      <rect x="20%" y="30%" width="60%" height="5%" fill="#3b82f6" opacity="0.3" rx="10" />
      <rect x="50%" y="45%" width="2" height="10%" fill="white" opacity="0.5">
         <animate attributeName="opacity" values="0.1;1;0.1" dur="2s" repeatCount="indefinite" />
      </rect>
      <text x="50%" y="60%" font-family="system-ui, sans-serif" font-weight="700" font-size="32" fill="white" text-anchor="middle" opacity="0.8">
        ${title}
      </text>
      <text x="50%" y="68%" font-family="system-ui, sans-serif" font-size="16" fill="white" text-anchor="middle" opacity="0.4">
        AI Generation in Progress • Niche Content Engine
      </text>
    </svg>
  `.trim();

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}
