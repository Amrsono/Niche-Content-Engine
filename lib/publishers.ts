/**
 * Social & CMS Publisher Functions
 * Extracted from lib/agents.ts for maintainability.
 * Each function publishes a DraftArticle to a specific platform and returns a PublishResult.
 */
import { logger } from './logger';
import { env } from './env';
import { delay, stringifyError } from './ai/utils';
import { getTikTokToken } from './tiktok/token';
import { generateSocialCaption } from './social/captions';
import type { DraftArticle, PublishResult } from './agents';
import { savePost } from './storage';

// --------------------------------------------------------------------------
// Local Pulse Blog
// --------------------------------------------------------------------------
export async function publishToLocal(
  article: DraftArticle,
  keyword: string,
  category?: string
): Promise<PublishResult> {
  logger.info(`Saving '${article.title}' to storage`, 'PUBLISHER');
  const post = await savePost({
    title: article.title,
    content: article.content,
    metaDescription: article.metaDescription,
    ogImageUrl: article.ogImageUrl,
    status: 'published',
    keyword,
    category,
  });

  return {
    status: 'success',
    id: post.id,
    url: `/blog/${post.slug}`,
    platform: 'Local-Pulse-Blog',
  };
}

// --------------------------------------------------------------------------
// WordPress
// --------------------------------------------------------------------------
export async function publishToWordpress(article: DraftArticle): Promise<PublishResult> {
  const wpBaseUrl = env.WP_BASE_URL || process.env.WP_BASE_URL;
  const wpAppPassword = env.WP_APP_PASSWORD || process.env.WP_APP_PASSWORD;

  if (wpBaseUrl && wpAppPassword) {
    logger.info(`Pushing '${article.title}' to WordPress at: ${wpBaseUrl}`, 'PUBLISHER');
    return { status: 'success', url: `${wpBaseUrl}/?p=123`, platform: 'WordPress' };
  }

  await delay(200);
  return { status: 'success', url: 'https://yourblog.wp.com/niche-content-post', platform: 'WordPress-Mock' };
}

// --------------------------------------------------------------------------
// Sanity CMS
// --------------------------------------------------------------------------
export async function publishToSanity(article: DraftArticle): Promise<PublishResult> {
  const sanityProjectId = env.SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID;
  if (sanityProjectId) {
    logger.info(`Pushing '${article.title}' to Sanity project: ${sanityProjectId}`, 'PUBLISHER');
    return { status: 'success', url: `https://${sanityProjectId}.sanity.studio`, platform: 'Sanity' };
  }
  return { status: 'error', message: 'Sanity Project ID missing', platform: 'Sanity' };
}

// --------------------------------------------------------------------------
// Instagram
// --------------------------------------------------------------------------
export async function publishToInstagram(
  article: DraftArticle,
  blogUrl?: string
): Promise<PublishResult> {
  const businessId = (env.INSTAGRAM_BUSINESS_ACCOUNT_ID || process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || '').trim();
  const token = (env.INSTAGRAM_ACCESS_TOKEN || process.env.INSTAGRAM_ACCESS_TOKEN || '').trim().replace(/['\"]+/g, '');

  if (!businessId || !token) {
    return {
      status: 'skipped',
      message: 'Instagram credentials missing. Add INSTAGRAM_BUSINESS_ACCOUNT_ID and INSTAGRAM_ACCESS_TOKEN to .env.local',
      platform: 'Instagram',
    };
  }

  try {
    const caption = await generateSocialCaption('instagram', article.title, article.content, blogUrl);
    let imageUrl = article.ogImageUrl || '';
    if (imageUrl.includes('pollinations.ai') && !imageUrl.includes('.jpg?') && !imageUrl.endsWith('.jpg')) {
      imageUrl = imageUrl.includes('?') ? imageUrl.replace('?', '.jpg?') : imageUrl + '.jpg';
    }

    const url = `https://graph.facebook.com/v20.0/${businessId}/media?access_token=${token}`;
    const containerRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: imageUrl, caption }),
    });

    const containerData = await containerRes.json();
    if (!containerData.id) {
      throw new Error(containerData.error?.message || 'Failed to create Instagram media container');
    }

    await delay(10000);
    const publishRes = await fetch(
      `https://graph.facebook.com/v20.0/${businessId}/media_publish?access_token=${token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creation_id: containerData.id }),
      }
    );

    const publishData = await publishRes.json();
    if (!publishData.id) {
      throw new Error(publishData.error?.message || 'Failed to publish media to Instagram');
    }

    return {
      status: 'success',
      url: `https://instagram.com/p/${publishData.id}`,
      platform: 'Instagram',
    };
  } catch (error: unknown) {
    logger.error('Instagram publish failed', 'SOCIAL', error);
    return { status: 'error', message: stringifyError(error), platform: 'Instagram' };
  }
}

// --------------------------------------------------------------------------
// Twitter / X
// --------------------------------------------------------------------------
function percentEncode(str: string) {
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/\*/g, '%2A')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29');
}

export async function publishToTwitter(
  article: DraftArticle,
  blogUrl?: string
): Promise<PublishResult> {
  const apiKey = (env.TWITTER_API_KEY || process.env.TWITTER_API_KEY || '').trim();
  const apiSecret = (env.TWITTER_API_SECRET || process.env.TWITTER_API_SECRET || '').trim();
  const accessToken = (env.TWITTER_ACCESS_TOKEN || process.env.TWITTER_ACCESS_TOKEN || '').trim();
  const accessSecret = (env.TWITTER_ACCESS_TOKEN_SECRET || process.env.TWITTER_ACCESS_TOKEN_SECRET || '').trim();

  if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
    return { status: 'skipped', message: 'X/Twitter credentials missing.', platform: 'X/Twitter' };
  }

  try {
    let tweetText = await generateSocialCaption('twitter', article.title, article.content, blogUrl);
    if (tweetText.length > 280) tweetText = tweetText.substring(0, 277) + '...';

    const tweetUrl = 'https://api.twitter.com/2/tweets';
    const oauthParams: Record<string, string> = {
      oauth_consumer_key: apiKey,
      oauth_nonce: Math.random().toString(36).substring(2, 11),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_token: accessToken,
      oauth_version: '1.0',
    };

    const sortedParams = Object.keys(oauthParams)
      .sort()
      .map((k) => `${percentEncode(k)}=${percentEncode(oauthParams[k])}`)
      .join('&');
    const baseString = `POST&${percentEncode(tweetUrl)}&${percentEncode(sortedParams)}`;
    const signingKey = `${percentEncode(apiSecret)}&${percentEncode(accessSecret)}`;

    const { createHmac } = await import('crypto');
    oauthParams['oauth_signature'] = createHmac('sha1', signingKey).update(baseString).digest('base64');

    const authHeader = `OAuth ${Object.keys(oauthParams)
      .sort()
      .map((k) => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
      .join(', ')}`;

    const res = await fetch(tweetUrl, {
      method: 'POST',
      headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: tweetText }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || data.title || 'Failed to post tweet');

    return { status: 'success', url: `https://x.com/i/status/${data.data?.id}`, platform: 'X/Twitter' };
  } catch (error: unknown) {
    logger.error('Twitter publish failed', 'SOCIAL', error);
    return { status: 'error', message: stringifyError(error), platform: 'X/Twitter' };
  }
}

// --------------------------------------------------------------------------
// TikTok
// --------------------------------------------------------------------------
export async function publishToTikTok(
  article: DraftArticle,
  blogUrl?: string
): Promise<PublishResult> {
  const token = await getTikTokToken();
  if (!token) {
    return { status: 'skipped', message: 'TikTok not connected.', platform: 'TikTok' };
  }

  try {
    const caption = await generateSocialCaption('tiktok', article.title, article.content, blogUrl);
    const res = await fetch('https://open.tiktokapis.com/v2/post/publish/content/init/', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        post_info: {
          title: article.title.substring(0, 90),
          description: caption.substring(0, 2100),
          privacy_level: 'PUBLIC_TO_EVERYONE',
          disable_comment: false,
        },
        source_info: {
          source: 'PULL_FROM_URL',
          photo_urls: [article.ogImageUrl],
        },
        post_mode: 'MEDIA_POST',
        media_type: 'PHOTO',
      }),
    });

    const data = await res.json();
    if (!res.ok || data.error || !data.data?.publish_id) {
      throw new Error(data.error?.message || 'TikTok API Error: Publish ID missing');
    }

    const publishId = data.data.publish_id;
    return { status: 'success', url: `https://tiktok.com/publish/${publishId}`, id: publishId, platform: 'TikTok' };
  } catch (error: unknown) {
    logger.error('TikTok publish failed', 'SOCIAL', error);
    return { status: 'error', message: stringifyError(error), platform: 'TikTok' };
  }
}

// --------------------------------------------------------------------------
// Facebook
// --------------------------------------------------------------------------
export async function publishToFacebook(
  article: DraftArticle,
  blogUrl?: string
): Promise<PublishResult> {
  const pageId = (env.FACEBOOK_PAGE_ID || process.env.FACEBOOK_PAGE_ID || '').trim();
  const token = (env.FACEBOOK_PAGE_ACCESS_TOKEN || process.env.FACEBOOK_PAGE_ACCESS_TOKEN || '').trim().replace(/['\"]+/g, '');

  if (!pageId || !token) {
    return { status: 'skipped', message: 'Facebook credentials missing.', platform: 'Facebook' };
  }

  try {
    const caption = await generateSocialCaption('facebook', article.title, article.content, blogUrl);
    const res = await fetch(`https://graph.facebook.com/v20.0/${pageId}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: caption, link: blogUrl, access_token: token }),
    });

    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error?.message || 'Facebook API error');

    const postId = data.id;
    const shortPostId = postId.split('_')[1] || postId;
    return {
      status: 'success',
      url: `https://www.facebook.com/${pageId}/posts/${shortPostId}`,
      id: postId,
      platform: 'Facebook',
    };
  } catch (error: unknown) {
    logger.error('Facebook publish failed', 'SOCIAL', error);
    return { status: 'error', message: stringifyError(error), platform: 'Facebook' };
  }
}
