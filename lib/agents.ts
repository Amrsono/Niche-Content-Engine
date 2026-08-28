import { fetchGoogleTrends, scrapeTikTokTrends } from './scraper';
import { updatePost } from './storage';
import { logger } from './logger';
import { captureException } from './errorTracking';
import { env } from './env';
import { safeJsonParse, cleanResult, stringifyError, delay } from './ai/utils';
import { GROQ_MODELS } from './ai/providers/groq';
import { getTikTokToken } from './tiktok/token';
import { callAIWithFallback } from './ai/dispatcher';
import { generateHashtags, generateSocialCaption } from './social/captions';

// Re-export publisher functions from dedicated module (see lib/publishers.ts)
export {
  publishToLocal,
  publishToWordpress,
  publishToSanity,
  publishToInstagram,
  publishToTwitter,
  publishToTikTok,
  publishToFacebook,
} from './publishers';

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
  let googleTrends: unknown[] = [];
  let tiktokTrends: unknown[] = [];

  try {
    googleTrends = await fetchGoogleTrends().catch(() => []);
    tiktokTrends = await scrapeTikTokTrends().catch(() => []);

    const rawData = JSON.stringify({
      google: (googleTrends || []).slice(0, 5),
      tiktok: tiktokTrends || [],
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
    if (data.trends && data.trends.length > 0) {
      return data.trends.map((t) => ({ ...t, niche }));
    }
  } catch (err: unknown) {
    logger.warn('AI analysis of raw trends failed, deploying direct trend parser fallback...', 'DISCOVERY', err);
  }

  // Resilient Direct Parser Fallback
  const fallbackTrends: TrendData[] = [];
  if (Array.isArray(googleTrends) && googleTrends.length > 0) {
    googleTrends.slice(0, 5).forEach((t: unknown) => {
      const keyword = typeof t === 'string' ? t : (t as { title?: string; keyword?: string })?.title || (t as { keyword?: string })?.keyword;
      if (keyword && typeof keyword === 'string') {
        fallbackTrends.push({ keyword, searchVolume: 5000, competition: 'LOW', niche });
      }
    });
  }

  if (fallbackTrends.length === 0) {
    fallbackTrends.push({ keyword: niche, searchVolume: 10000, competition: 'LOW', niche });
    fallbackTrends.push({ keyword: `${niche} news & updates`, searchVolume: 8000, competition: 'LOW', niche });
    fallbackTrends.push({ keyword: `${niche} complete guide`, searchVolume: 6000, competition: 'LOW', niche });
  }

  return fallbackTrends;
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

// 4. Auto-Publisher — see lib/publishers.ts for platform-specific implementations

export function calculatePeakTime(): string {
  const peakHours = [9, 13, 19, 21];
  const currentHour = new Date().getHours();
  const nextPeak = peakHours.find((h) => h > currentHour) || peakHours[0];

  const scheduleDate = new Date();
  scheduleDate.setHours(nextPeak, 0, 0, 0);
  if (nextPeak <= currentHour) scheduleDate.setDate(scheduleDate.getDate() + 1);

  return scheduleDate.toISOString();
}
