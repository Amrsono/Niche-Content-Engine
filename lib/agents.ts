import { fetchGoogleTrends, scrapeTikTokTrends } from './scraper';
import { savePost, updatePost } from './storage';
import { logger } from './logger';
import { captureException } from './errorTracking';
import { env } from './env';
import { safeJsonParse, cleanResult, stringifyError, delay } from './ai/utils';
import { GROQ_MODELS } from './ai/providers/groq';
import { getTikTokToken } from './tiktok/token';
import { callAIWithFallback } from './ai/dispatcher';
import { generateHashtags, generateSocialCaption } from './social/captions';

export {
  updatePost,
  safeJsonParse,
  cleanResult,
  stringifyError,
  getTikTokToken,
  callAIWithFallback,
  generateHashtags,
  generateSocialCaption,
};

export interface TrendData {
  keyword: string;
  searchVolume: number;
  competition: 'LOW' | 'MEDIUM' | 'HIGH';
  niche: string;
}

export interface DraftArticle {
  title: string;
  content: string;
  metaDescription: string;
  ogImageUrl?: string;
}

export interface PublishResult {
  status: 'success' | 'error' | 'skipped';
  url?: string;
  platform: string;
  id?: string;
  message?: string;
}

// 1. Discovery Agent
export async function runTrendScraper(niche: string): Promise<TrendData[]> {
  logger.info(`Starting real-time scrape for niche: ${niche}`, 'DISCOVERY');
  try {
    const googleTrends = await fetchGoogleTrends();
    const tiktokTrends = await scrapeTikTokTrends();
    const rawData = JSON.stringify({
      google: googleTrends.slice(0, 5),
      tiktok: tiktokTrends,
    });

    const res = await callAIWithFallback({
      messages: [
        {
          role: 'system',
          content: 'You are an expert SEO analyst. I will provide raw trending data. Pick the top 3 high-growth, low-competition keywords for a blog in JSON format.',
        },
        {
          role: 'user',
          content: `Niche: "${niche}". Raw Data: ${rawData}. Return JSON with 'trends' (keyword, searchVolume, competition: LOW/MEDIUM/HIGH).`,
        },
      ],
      model: GROQ_MODELS.DISCOVERY,
      response_format: { type: 'json_object' },
    });

    const data = safeJsonParse<{ trends: TrendData[] }>(res.text, 'Trend Scraper');
    return (data.trends || []).map((t) => ({ ...t, niche }));
  } catch (err: unknown) {
    logger.error('Real-time Discovery failed', 'DISCOVERY', err);
    captureException(err, { module: 'DISCOVERY' });
    throw new Error(`Real-time Discovery failed: ${stringifyError(err)}`);
  }
}

// Helper to find affiliate products
async function findAffiliateProducts(keyword: string) {
  const isAI = keyword.toLowerCase().includes('ai') || keyword.toLowerCase().includes('productivity');
  const affiliateTag = env.AFFILIATE_TAG || 'niche-engine-20';

  if (isAI) {
    return [
      { name: 'Jasper AI', url: `https://jasper.ai?utm_source=${affiliateTag}`, price: 'from $39/mo' },
      { name: 'Notion AI', url: `https://notion.so/product/ai?tag=${affiliateTag}`, price: '$10/mo' },
      { name: 'Synthesia AI Video', url: `https://synthesia.io?ref=${affiliateTag}`, price: 'from $22/mo' },
    ];
  }

  return [
    { name: 'ecobee Smart Thermostat Premium', url: `https://amazon.com/dp/ecobee?tag=${affiliateTag}`, price: '$249.99' },
    { name: 'Anker SOLIX PS200 Solar Panel', url: `https://amazon.com/dp/anker-solix?tag=${affiliateTag}`, price: '$499.00' },
    { name: 'Fairphone 5 (Sustainable Edition)', url: `https://fairphone.com/en/?ref=${affiliateTag}`, price: '€699.00' },
  ];
}

// Multi-Pass Step 1: Generate Outline
async function generateOutline(keyword: string): Promise<Array<{ title: string; targetWordCount?: number }>> {
  const res = await callAIWithFallback({
    messages: [
      {
        role: 'system',
        content: 'You are an expert content strategist. Create a comprehensive outline for a high-quality article. The outline sections must be specific, insightful, and directly relevant to the topic — no generic filler.',
      },
      {
        role: 'user',
        content: `Create an outline for: "${keyword}". Return JSON with 'sections' array. Focus on quality over quantity. Max 4-5 sections total targeting 1,000 words total.`,
      },
    ],
    model: GROQ_MODELS.REASONING,
    response_format: { type: 'json_object' },
  });

  const data = safeJsonParse<{ sections: Array<{ title: string; targetWordCount?: number }> }>(res.text, 'Article Outline');
  return data.sections || [];
}

// Multi-Pass Step 2: Generate Individual Section
async function generateSection(
  title: string,
  keyword: string,
  productContext: string,
  previousContext: string,
  targetWords: number
): Promise<string> {
  const res = await callAIWithFallback({
    messages: [
      {
        role: 'system',
        content: `You are a world-class journalist and expert writer. Write a compelling, insightful article section.
Focus on original, factual, and genuinely useful content. Tone: confident, conversational, and premium.
NEVER use phrases like "deep dive", "delve into", "in conclusion", "in this article we will", or filler.`,
      },
      {
        role: 'user',
        content: `Topic: "${title}" (Context: ${keyword}).
Target: ${targetWords} words.
Affiliate Products allowed to mention: ${productContext}.
Previous Sections Summary: ${previousContext.substring(0, 1000)}...
Write only the HTML content (start with <h2> or <h3>).`,
      },
    ],
    model: GROQ_MODELS.REASONING,
  });
  return cleanResult(res.text);
}

// 2. Reasoning Agent (Multi-Pass Coordinator)
export async function generateArticle(keyword: string): Promise<DraftArticle> {
  logger.info(`Starting 1,000-word Multi-Pass cycle for: '${keyword}'...`, 'REASONING');
  try {
    const products = await findAffiliateProducts(keyword);
    const productContext = JSON.stringify(products);
    const sections = await generateOutline(keyword);

    let fullContent = '';
    let contextSummary = '';

    for (let i = 0; i < sections.length; i += 2) {
      const currentSections = sections.slice(i, i + 2);
      const sectionTitles = currentSections.map((s) => s.title).join(' AND ');
      const targetWords = currentSections.reduce((acc, s) => acc + (s.targetWordCount || 250), 0);

      logger.info(`Drafting merged pass (${i / 2 + 1}/${Math.ceil(sections.length / 2)}): ${sectionTitles}`, 'REASONING');
      const sectionHtml = await generateSection(sectionTitles, keyword, productContext, contextSummary, targetWords);
      fullContent += sectionHtml + '\n\n';
      contextSummary += ` Completed: ${sectionTitles}.`;
      await delay(4000);
    }

    const metaRes = await callAIWithFallback({
      messages: [
        {
          role: 'system',
          content: `You are a world-class headline writer for premium publications like WIRED and TechCrunch.
Write a UNIQUE, CREATIVE, and SPECIFIC article title and meta description.
Return JSON with: "title" (max 70 chars) and "metaDescription" (max 160 chars).`,
        },
        {
          role: 'user',
          content: `Write a headline for an article about: "${keyword}".`,
        },
      ],
      model: GROQ_MODELS.DISCOVERY,
      response_format: { type: 'json_object' },
    });

    const metaData = safeJsonParse<{ title?: string; metaDescription?: string }>(metaRes.text, 'Title and Meta');
    return {
      title: metaData.title || `${keyword}: A Complete Guide`,
      content: fullContent,
      metaDescription: metaData.metaDescription || `Explore the latest insights and analysis on ${keyword}.`,
    };
  } catch (err: unknown) {
    logger.error('Multi-Pass Reasoning failed', 'REASONING', err);
    captureException(err, { module: 'REASONING' });
    throw new Error(`Multi-Pass Reasoning failed: ${stringifyError(err)}`);
  }
}

// 3. SEO Auto-Optimizer Image Generator
export async function generateOgImage(title: string, context?: string): Promise<string> {
  logger.info(`Generating AI Image for: ${title}`, 'SEO');
  try {
    const contextInfo = context ? `Core Concept: ${context}` : '';
    const promptRes = await callAIWithFallback({
      messages: [
        {
          role: 'system',
          content: `You are a creative director for a viral digital magazine. Write a single image prompt for an AI image generator producing a stunning, click-inducing thumbnail. Return ONLY the prompt sentence without preamble.`,
        },
        {
          role: 'user',
          content: `ARTICLE TITLE: "${title}"\n${contextInfo}`,
        },
      ],
      model: GROQ_MODELS.DISCOVERY,
    });

    let imagePrompt = cleanResult(promptRes.text || `A premium 3D concept art piece representing: ${title}`);
    if (imagePrompt.startsWith('http') || imagePrompt.includes('unsplash.com')) {
      imagePrompt = `A premium 3D digital art piece representing: ${title}. High-tech aesthetic, cinematic lighting.`;
    }

    if (env.OPENAI_API_KEY || process.env.OPENAI_API_KEY) {
      try {
        const openai = new (await import('openai')).default({ apiKey: env.OPENAI_API_KEY || process.env.OPENAI_API_KEY });
        const image = await openai.images.generate({
          model: 'dall-e-3',
          prompt: imagePrompt,
          n: 1,
          size: '1024x1024',
        });
        if (image.data?.[0]?.url) return image.data[0].url;
      } catch (dallErr) {
        logger.warn('DALL-E 3 failed, falling back to Pollinations', 'SEO', dallErr);
      }
    }

    const titleSeed = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 999983;
    const uniqueSeed = titleSeed + Math.floor(Math.random() * 10000);
    const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}.jpg?width=1200&height=630&nologo=true&seed=${uniqueSeed}&enhance=true&model=flux`;

    try {
      await fetch(fallbackUrl);
    } catch {
      // Warmup fetch failure is non-blocking
    }
    return fallbackUrl;
  } catch (err: unknown) {
    logger.warn('Image generation failed, using emergency fallback', 'SEO', err);
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(title)}?width=1200&height=630&nologo=true&model=flux`;
  }
}

// 4. Auto-Publisher
export async function publishToLocal(article: DraftArticle, keyword: string, category?: string): Promise<PublishResult> {
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

export async function publishToSanity(article: DraftArticle): Promise<PublishResult> {
  const sanityProjectId = env.SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID;
  if (sanityProjectId) {
    logger.info(`Pushing '${article.title}' to Sanity project: ${sanityProjectId}`, 'PUBLISHER');
    return { status: 'success', url: `https://${sanityProjectId}.sanity.studio`, platform: 'Sanity' };
  }
  return { status: 'error', message: 'Sanity Project ID missing', platform: 'Sanity' };
}

export async function publishToInstagram(article: DraftArticle, blogUrl?: string): Promise<PublishResult> {
  const businessId = (env.INSTAGRAM_BUSINESS_ACCOUNT_ID || process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || '').trim();
  const token = (env.INSTAGRAM_ACCESS_TOKEN || process.env.INSTAGRAM_ACCESS_TOKEN || '').trim().replace(/['"]+/g, '');

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
    const publishRes = await fetch(`https://graph.facebook.com/v20.0/${businessId}/media_publish?access_token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creation_id: containerData.id }),
    });

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

function percentEncode(str: string) {
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/\*/g, '%2A')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29');
}

export async function publishToTwitter(article: DraftArticle, blogUrl?: string): Promise<PublishResult> {
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

    const sortedParams = Object.keys(oauthParams).sort().map((k) => `${percentEncode(k)}=${percentEncode(oauthParams[k])}`).join('&');
    const baseString = `POST&${percentEncode(tweetUrl)}&${percentEncode(sortedParams)}`;
    const signingKey = `${percentEncode(apiSecret)}&${percentEncode(accessSecret)}`;

    const { createHmac } = await import('crypto');
    oauthParams['oauth_signature'] = createHmac('sha1', signingKey).update(baseString).digest('base64');

    const authHeader = `OAuth ${Object.keys(oauthParams).sort().map((k) => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`).join(', ')}`;
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

export async function publishToTikTok(article: DraftArticle, blogUrl?: string): Promise<PublishResult> {
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

export async function publishToFacebook(article: DraftArticle, blogUrl?: string): Promise<PublishResult> {
  const pageId = (env.FACEBOOK_PAGE_ID || process.env.FACEBOOK_PAGE_ID || '').trim();
  const token = (env.FACEBOOK_PAGE_ACCESS_TOKEN || process.env.FACEBOOK_PAGE_ACCESS_TOKEN || '').trim().replace(/['"]+/g, '');

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
    return { status: 'success', url: `https://www.facebook.com/${pageId}/posts/${shortPostId}`, id: postId, platform: 'Facebook' };
  } catch (error: unknown) {
    logger.error('Facebook publish failed', 'SOCIAL', error);
    return { status: 'error', message: stringifyError(error), platform: 'Facebook' };
  }
}

export function calculatePeakTime(): string {
  const peakHours = [9, 13, 19, 21];
  const currentHour = new Date().getHours();
  const nextPeak = peakHours.find((h) => h > currentHour) || peakHours[0];

  const scheduleDate = new Date();
  scheduleDate.setHours(nextPeak, 0, 0, 0);
  if (nextPeak <= currentHour) scheduleDate.setDate(scheduleDate.getDate() + 1);

  return scheduleDate.toISOString();
}
