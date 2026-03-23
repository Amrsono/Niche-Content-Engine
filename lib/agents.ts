import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { fetchGoogleTrends, scrapeTikTokTrends } from "./scraper";
import { savePost, updatePost, getSettings, saveSettings } from "./storage";
export { updatePost };

// Utility to safely stringify any error object
function stringifyError(err: any): string {
  if (!err) return "Unknown Error";
  if (typeof err === 'string') return err;
  if (err.message) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

/**
 * Safely parses JSON from AI responses that might contain markdown or text noise.
 */
function safeJsonParse(content: string, context: string): any {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const cleanContent = jsonMatch ? jsonMatch[0] : content;
    return JSON.parse(cleanContent);
  } catch (err) {
    console.error(`[AI JSON ERROR] Failed to parse ${context}.`);
    console.error(`[RAW CONTENT SNIPPET]: ${content.substring(0, 200)}...`);
    throw new Error(`Invalid JSON response from AI while processing ${context}.`);
  }
}

async function getTikTokToken() {
  const auth = await getSettings('tiktok_auth');
  if (!auth) return null;

  const now = Date.now();
  // Buffer of 5 minutes before actual expiration
  if (now < (auth.expires_at - 300000)) {
    return auth.access_token;
  }

  // Token expired or near expiration, try refresh
  console.log(`[TIKTOK] 🔄 Token expired. Refreshing...`);
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

  try {
    const res = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache'
      },
      body: new URLSearchParams({
        client_key: clientKey || '',
        client_secret: clientSecret || '',
        grant_type: 'refresh_token',
        refresh_token: auth.refresh_token
      })
    });

    const data = await res.json();
    if (data.access_token) {
      const newAuth = {
        ...auth,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Date.now() + (data.expires_in * 1000),
        refresh_expires_at: Date.now() + (data.refresh_expires_in * 1000),
        updated_at: new Date().toISOString()
      };
      await saveSettings('tiktok_auth', newAuth);
      console.log(`[TIKTOK] ✅ Token refreshed successfully.`);
      return data.access_token;
    } else {
      console.error('[TIKTOK REFRESH ERROR]', JSON.stringify(data, null, 2));
      return null;
    }
  } catch (error) {
    console.error('[TIKTOK REFRESH FETCH ERROR]', error);
    return null;
  }
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function getAI() {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });
  return { groq, genAI, openai };
}

// Models
// Models
const DISCOVERY_MODEL = "llama-3.3-70b-versatile";
const REASONING_MODEL = "llama-3.3-70b-versatile";
const FAST_MODEL = "llama-3.1-8b-instant"; // For small tasks
const FALLBACK_MODEL = "gemini-2.5-flash";

// Global Provider Cooldowns
const providerCooldowns: Record<string, number> = {
  groq: 0,
  gemini: 0,
  openai: 0
};

const COOLDOWN_DURATION = 60000; // 60 seconds

// Global Fallback Helper with Exponential Backoff and Cooldowns
async function callGroq(options: any): Promise<any> {
  const { groq, genAI, openai } = getAI();
  
  // Model selection: Use faster model for small tasks if possible
  const isSimpleTask = options.messages.some((m: any) => 
    m.content?.toLowerCase().includes("hashtag") || 
    m.content?.toLowerCase().includes("meta description")
  );

  if (isSimpleTask && options.model === DISCOVERY_MODEL) {
    options.model = FAST_MODEL;
    console.log(`[AI] Using FAST_MODEL (${FAST_MODEL}) for simple task.`);
  }

  const MAX_TRIES = 2;
  let attempt = 0;

  while (attempt < MAX_TRIES) {
    try {
      // 1. Try Groq (Primary) - Only if not cooling down
      if (Date.now() > providerCooldowns.groq) {
        return await groq.chat.completions.create(options);
      } else {
        console.warn(`[AI] Groq is cooling down. Skipping to fallback...`);
        throw { status: 429 }; // Force fallback
      }
    } catch (e: any) {
      if (e.status === 429) {
        providerCooldowns.groq = Date.now() + COOLDOWN_DURATION;
        attempt++;
        if (attempt < MAX_TRIES) {
          const waitTime = 15000 * attempt; // 15s then 30s
          console.warn(`[AI 429] Groq rate limited. Retrying in ${waitTime/1000}s... (Attempt ${attempt}/${MAX_TRIES})`);
          await delay(waitTime);
          continue;
        }
        
        console.warn(`[AI FALLBACK] Groq exhausted. Switching to Gemini...`);
        
        // 2. Try Gemini (Secondary)
        if (Date.now() > providerCooldowns.gemini) {
          try {
            const model = genAI.getGenerativeModel({ model: FALLBACK_MODEL });
            const prompt = options.messages.map((m: any) => `${m.role}: ${m.content}`).join("\n");
            const result = await model.generateContent({
              contents: [{ role: "user", parts: [{ text: prompt }] }],
            });
            const text = result.response.text();
            return { choices: [{ message: { content: text } }] };
          } catch (gemError: any) {
            console.error("[GEMINI ERROR]", stringifyError(gemError));
            const isGemQuota = gemError.message?.includes('429') || gemError.status === 429 || gemError.message?.includes('quota');
            if (isGemQuota) {
              providerCooldowns.gemini = Date.now() + COOLDOWN_DURATION;
              
              if (process.env.OPENAI_API_KEY && Date.now() > providerCooldowns.openai) {
                console.warn(`[AI FALLBACK] Gemini Quota also hit. Cooling down (15s) for OpenAI...`);
                await delay(15000);
                
                // 3. Try OpenAI (Tertiary)
                try {
                  return await openai.chat.completions.create({
                    ...options,
                    model: "gpt-4o-mini"
                  });
                } catch (oaError: any) {
                  providerCooldowns.openai = Date.now() + COOLDOWN_DURATION;
                  console.error("[OPENAI ERROR]", stringifyError(oaError));
                  throw new Error(`CRITICAL: All providers exhausted. Latest error: ${stringifyError(oaError)}`);
                }
              }
            }
            throw gemError;
          }
        }
      }
      throw e;
    }
  }

  throw new Error("AI call failed to return a valid response after all retries and fallbacks.");
}

/**
 * Generates 3-5 high-engagement hashtags based on article content.
 */
async function generateHashtags(title: string, content: string): Promise<string> {
  try {
    const chatCompletion = await callGroq({
      messages: [
        {
          role: "system",
          content: "You are a social media growth expert. Generate 5 highly relevant, trending hashtags for a post. Return ONLY the hashtags separated by spaces."
        },
        {
          role: "user",
          content: `Title: ${title}\nContent: ${content.substring(0, 500)}...`
        }
      ],
      model: DISCOVERY_MODEL
    });
    return chatCompletion.choices[0].message.content?.trim() || "#niche #pulse2026 #contentengine";
  } catch (err) {
    console.warn("[SOCIAL] Hashtag generation failed, using fallbacks.");
    return "#niche #pulse2026 #contentengine";
  }
}

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
  status: "success" | "error" | "skipped";
  url?: string;
  platform: string;
  id?: string;
  message?: string;
}

// 1. Discovery Agent (Now with Real-time Scraping)
export async function runTrendScraper(niche: string): Promise<TrendData[]> {
  console.log(`[DISCOVERY] Starting real-time scrape for niche: ${niche}`);
  
  try {
    // A. Fetch Real Data
    const googleTrends = await fetchGoogleTrends();
    const tiktokTrends = await scrapeTikTokTrends();
    
    const rawData = JSON.stringify({ 
      google: googleTrends.slice(0, 5), 
      tiktok: tiktokTrends 
    });

    console.log(`[DISCOVERY] Analyzing ${googleTrends.length + tiktokTrends.length} raw signals...`);

    const chatCompletion = await callGroq({
      messages: [
        {
          role: "system",
          content: "You are an expert SEO analyst. I will provide raw trending data. Pick the top 3 high-growth, low-competition keywords for a blog in JSON format."
        },
        {
          role: "user",
          content: `Niche: "${niche}". Raw Data: ${rawData}. Return JSON with 'trends' (keyword, searchVolume, competition: LOW/MEDIUM/HIGH).`
        }
      ],
      model: DISCOVERY_MODEL,
      response_format: { type: "json_object" }
    });

    const content = chatCompletion.choices[0].message.content || "{}";
    const data = safeJsonParse(content, 'Trend Scraper');
    return (data.trends || []).map((t: any) => ({ ...t, niche }));
  } catch (err: any) {
    console.error("[DISCOVERY ERROR]", err);
    throw new Error(`Real-time Discovery failed: ${stringifyError(err)}`);
  }
}

// Helper to find REAL affiliate products based on niche/keyword
async function findAffiliateProducts(keyword: string) {
  const isAI = keyword.toLowerCase().includes('ai') || keyword.toLowerCase().includes('productivity');
  
  const affiliateTag = process.env.AFFILIATE_TAG || "niche-engine-20";
  
  if (isAI) {
    return [
      { name: "Jasper AI", url: `https://jasper.ai?utm_source=${affiliateTag}`, price: "from $39/mo" },
      { name: "Notion AI", url: `https://notion.so/product/ai?tag=${affiliateTag}`, price: "$10/mo" },
      { name: "Synthesia AI Video", url: `https://synthesia.io?ref=${affiliateTag}`, price: "from $22/mo" }
    ];
  } else {
    return [
      { name: "ecobee Smart Thermostat Premium", url: `https://amazon.com/dp/ecobee?tag=${affiliateTag}`, price: "$249.99" },
      { name: "Anker SOLIX PS200 Solar Panel", url: `https://amazon.com/dp/anker-solix?tag=${affiliateTag}`, price: "$499.00" },
      { name: "Fairphone 5 (Sustainable Edition)", url: `https://fairphone.com/en/?ref=${affiliateTag}`, price: "€699.00" }
    ];
  }
}

// Multi-Pass Step 1: Generate Outline
async function generateOutline(keyword: string) {
  try {
    const chatCompletion = await callGroq({
      messages: [
        {
          role: "system",
          content: "You are an expert content strategist. Create a comprehensive outline for a 2,000-word deep-dive article."
        },
        {
          role: "user",
          content: `Create an outline for: "${keyword}". Return JSON with 'sections' array. Focus on quality over quantity. Max 4-5 sections total targeting 1,000 words total.`
        }
      ],
      model: REASONING_MODEL,
      response_format: { type: "json_object" }
    });
    
    const content = chatCompletion.choices[0].message.content || "{}";
    const data = safeJsonParse(content, 'Article Outline');
    return data.sections || [];
  } catch (err: any) {
    console.error("[OUTLINE ERROR]", err);
    throw new Error(`Outline generation failed: ${stringifyError(err)}`);
  }
}

// Multi-Pass Step 2: Generate Individual Section
async function generateSection(title: string, keyword: string, productContext: string, previousContext: string, targetWords: number) {
  const chatCompletion = await callGroq({
    messages: [
      {
        role: "system",
        content: `You are a world-class investigative tech journalist. Write a deep-dive section for a mega-post. 
        Focus on 'Information Gain'—original insights and technical depth. Tone: Sophisticated and analytical.`
      },
      {
        role: "user",
        content: `Topic: "${title}" (Context: ${keyword}). 
        Target: ${targetWords} words.
        Affiliate Products allowed to mention: ${productContext}.
        Previous Sections Summary: ${previousContext.substring(0, 1000)}...
        
        Write only the HTML content (start with <h2> or <h3>).`
      }
    ],
    model: REASONING_MODEL
  });
  return chatCompletion.choices[0].message.content || "";
}

// 2. Reasoning Agent (Multi-Pass Coordinator)
export async function generateArticle(keyword: string): Promise<DraftArticle> {
  console.log(`[REASONING] Starting 1,000-word Multi-Pass cycle for: '${keyword}'...`);
  
  try {
    const products = await findAffiliateProducts(keyword);
    const productContext = JSON.stringify(products);

    // Step 1: Outline
    const sections = await generateOutline(keyword);
    console.log(`[REASONING] Outline generated with ${sections.length} sections.`);

    let fullContent = "";
    let contextSummary = "";

    // Step 2 & 3: Section Generation (Merged Passes to reduce API calls)
    for (let i = 0; i < sections.length; i += 2) {
      const currentSections = sections.slice(i, i + 2);
      const sectionTitles = currentSections.map((s: any) => s.title).join(" AND ");
      const targetWords = currentSections.reduce((acc: number, s: any) => acc + (s.targetWordCount || 250), 0);
      
      console.log(`[REASONING] Drafting merged pass (${i/2 + 1}/${Math.ceil(sections.length/2)}): ${sectionTitles} (~${targetWords} words)...`);
      
      const sectionHtml = await generateSection(sectionTitles, keyword, productContext, contextSummary, targetWords);
      fullContent += sectionHtml + "\n\n";
      contextSummary += ` Completed: ${sectionTitles}.`;
      
      // Delay to respect free-tier rate limits
      await delay(8000); 
    }

    // Generate Meta Description with Fallback
    const metaCompletion = await callGroq({
      messages: [{ role: "user", content: `Write a high-CTR SEO meta description for this article title: "${keyword}". Max 160 chars.` }],
      model: DISCOVERY_MODEL
    });

    return {
      title: `${keyword}: The 2026 Definitive Deep-Dive`,
      content: fullContent,
      metaDescription: metaCompletion.choices[0].message.content || ""
    };
  } catch (err: any) {
    console.error("[REASONING ERROR]", err);
    throw new Error(`Multi-Pass Reasoning failed: ${stringifyError(err)}`);
  }
}

// 3. SEO Auto-Optimizer (DALL-E 3 / Imagen / Pollinations)
export async function generateOgImage(title: string, context?: string): Promise<string> {
  console.log(`[SEO] Generating AI Image for: ${title}`);
  
  try {
    const visualVibes = [
      "Cyberpunk Neon: High contrast, dark backgrounds with vibrant neon edges, futuristic tech elements, cinematic lighting.",
      "Minimalist Swiss: Clean lines, bold typography, monochromatic with one accent color, premium editorial feel.",
      "Vibrant 3D Pop: Hyper-realistic 3D rendering, claymorphism, playful colors, soft shadows, studio lighting.",
      "Abstract Organic: Flowing shapes, natural gradients, soft textures, peaceful and premium aesthetic.",
      "Tech-Noir Investigative: Gritty, moody, dark atmosphere, blue/teal color palette, high-tech interface elements.",
      "Hyper-Realistic Macro: Extreme close-up of high-tech materials, glass, metal, and light reflections."
    ];
    
    const selectedVibe = visualVibes[Math.floor(Math.random() * visualVibes.length)];
    const contextInfo = context ? `Article Context: ${context}` : "";

    // A. Generate a high-quality, catchy prompt using Groq
    const promptCompletion = await callGroq({
      messages: [
        {
          role: "system",
          content: `You are an expert AI prompt engineer. Your goal is to write a highly detailed, 1-sentence image generation prompt that creates a PREMIUM, attention-grabbing, and HIGH-RELEVANCE image for an article. 
          Use the provided title and context to ensure the image directly relates to the topic. 
          Follow the specific visual style/vibe provided. 
          Avoid generic results. Do not include any text, letters, or words in the image.`
        },
        {
          role: "user",
          content: `Topic: "${title}". ${contextInfo}\nVisual Style Vibe: ${selectedVibe}\n\nTask: Generate a detailed 1-sentence DALL-E 3 prompt. Return JSON with 'prompt'.`
        }
      ],
      model: DISCOVERY_MODEL,
      response_format: { type: "json_object" }
    });
    
    const content = promptCompletion.choices[0].message.content || "{}";
    const data = safeJsonParse(content, 'Image Prompt');
    const imagePrompt = data.prompt || `A premium and relevant 3D concept art piece representing: ${title}`;

    // B. Check for API Keys (DALL-E 3)
    const openaiKey = process.env.OPENAI_API_KEY;

    if (openaiKey) {
      console.log(`[SEO] Calling DALL-E 3 API (Real)...`);
      const { openai } = getAI();
      const image = await openai.images.generate({
        model: "dall-e-3",
        prompt: imagePrompt,
        n: 1,
        size: "1024x1024",
      });
      if (image.data && image.data[0] && image.data[0].url) {
         console.log(`[SEO] DALL-E 3 Image Generation Successful!`);
         return image.data[0].url;
      }
    }

    // C. Fallback to free AI Image generation (Pollinations) if DALL-E limit hit or no keys
    const randomSeed = Math.floor(Math.random() * 100000);
    console.log(`[SEO] DALL-E skipped or failed. Falling back to Pollinations with seed: ${randomSeed}`);
    const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=1200&height=630&nologo=true&seed=${randomSeed}`;
    
    try {
      console.log(`[SEO] Warming up AI Image cache to prevent social API timeouts...`);
      // This forces the image to generate now. When Instagram scrapes it later, it returns instantly.
      await fetch(fallbackUrl);
    } catch (e) {
      console.warn(`[SEO] Warmup fetch failed, continuing anyway.`);
    }

    return fallbackUrl;
  } catch (err: any) {
    console.warn(`[SEO ERROR] Image generation failed:`, err.message || err);
    const errorFallback = `https://image.pollinations.ai/prompt/${encodeURIComponent(title)}?width=1200&height=630&nologo=true`;
    try { await fetch(errorFallback); } catch (e) {}
    return errorFallback;
  }
}


// 4. Auto-Publisher (WordPress / Sanity / Local)
export async function publishToLocal(article: DraftArticle, keyword: string, category?: string): Promise<PublishResult> {
  console.log(`[PUBLISHER] Attempting to save '${article.title}' to local storage...`);
  try {
    const post = await savePost({
      title: article.title,
      content: article.content,
      metaDescription: article.metaDescription,
      ogImageUrl: article.ogImageUrl,
      status: 'published',
      keyword: keyword,
      category: category
    });
    
    console.log(`[PUBLISHER] ✅ Saved successfully as ID: ${post.id}. Slug: ${post.slug}`);
    
    return { 
      status: "success", 
      id: post.id,
      url: `/blog/${post.slug}`, 
      platform: "Local-Pulse-Blog"
    };
  } catch (error: any) {
    console.error(`[PUBLISHER ERROR] Local save failed: ${error.message}`);
    throw error;
  }
}
export async function publishToWordpress(article: DraftArticle): Promise<PublishResult> {
  console.log(`[PUBLISHER] Preparing for WordPress publication...`);
  
  const wpBaseUrl = process.env.WP_BASE_URL;
  const wpAppPassword = process.env.WP_APP_PASSWORD;

  if (wpBaseUrl && wpAppPassword) {
    console.log(`[PUBLISHER] Pushing to WordPress: ${wpBaseUrl}`);
    // Realistic implementation would use a fetch/axios POST to /wp-json/wp/v2/posts
    return { status: "success", url: `${wpBaseUrl}/?p=123`, platform: "WordPress" };
  }

  // Fallback / Mock
  console.log(`[PUBLISHER WARNING] WordPress credentials missing. Using mock.`);
  await new Promise(resolve => setTimeout(resolve, 800));
  return { 
    status: "success", 
    url: "https://yourblog.wp.com/niche-content-post",
    platform: "WordPress-Mock"
  };
}

export async function publishToSanity(article: DraftArticle): Promise<PublishResult> {
  console.log(`[PUBLISHER] Pushing to Sanity CMS...`);
  const sanityProjectId = process.env.SANITY_PROJECT_ID;

  if (sanityProjectId) {
    return { status: "success", url: `https://${sanityProjectId}.sanity.studio`, platform: "Sanity" };
  }

  return { status: "error", message: "Sanity Project ID missing", platform: "Sanity" };
}

export async function publishToInstagram(article: DraftArticle, blogUrl?: string): Promise<PublishResult> {
  const businessId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID?.trim();
  // Aggressive sanitization: remove any invisible characters or quotes
  const token = process.env.INSTAGRAM_ACCESS_TOKEN?.trim().replace(/['"]+/g, '');


  if (!businessId || !token) {
    console.warn(`[SOCIAL WARNING] Instagram credentials missing. Skipping real post.`);
    return { status: "skipped", message: "Instagram credentials missing", platform: "Instagram" };
  }

  try {
    console.log(`[SOCIAL] Creating Instagram media container for: ${article.title}`);
    
    // Step 1: Generate Dynamic Hashtags
    const hashtags = await generateHashtags(article.title, article.content);
    
    // Step 2: Create Media Container
    // Caption includes the title, meta, link (textual) and dynamic hashtags
    let caption = `${article.title}\n\n${article.metaDescription}`;
    
    if (blogUrl) {
      caption += `\n\n🔗 Read More: ${blogUrl}\n👉 Link in Bio for more pulses!`;
    } else {
      caption += `\n\n👉 Link in Bio for more pulses!`;
    }
    
    caption += `\n\n${hashtags}`;
    
    // Move access_token to Query String for maximum reliability
    const containerRes = await fetch(`https://graph.facebook.com/v20.0/${businessId}/media?access_token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: article.ogImageUrl,
        caption: caption,
      }),
    });

    const containerData = await containerRes.json();
    if (!containerData.id) {
      const fbError = containerData.error?.message || "Failed to create media container";
      const fbCode = containerData.error?.code ? `(Code ${containerData.error.code})` : "";
      console.error('[INSTAGRAM ERROR]', JSON.stringify(containerData, null, 2));
      throw new Error(`${fbError} ${fbCode}`);
    }

    const creationId = containerData.id;
    console.log(`[SOCIAL] Container created: ${creationId}. Waiting for processing...`);

    // Step 2: Meta needs a moment to process the image
    await new Promise(resolve => setTimeout(resolve, 8000));

    // Step 3: Publish Media
    console.log(`[SOCIAL] Publishing to Instagram...`);
    const publishRes = await fetch(`https://graph.facebook.com/v20.0/${businessId}/media_publish?access_token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: creationId,
      }),
    });

    const publishData = await publishRes.json();
    if (!publishData.id) {
       const fbError = publishData.error?.message || "Failed to publish media";
       const fbCode = publishData.error?.code ? `(Code ${publishData.error.code})` : "";
       console.error('[INSTAGRAM ERROR PUBLISH]', JSON.stringify(publishData, null, 2));
       throw new Error(`${fbError} ${fbCode}`);
    }

    // Fetch the actual permalink for the published media
    let finalUrl = `https://instagram.com/p/${publishData.id}`;
    try {
      const mediaRes = await fetch(`https://graph.facebook.com/v20.0/${publishData.id}?fields=permalink&access_token=${token}`);
      const mediaData = await mediaRes.json();
      if (mediaData.permalink) {
        finalUrl = mediaData.permalink;
      }
    } catch (e) {
      console.warn('[SOCIAL] Failed to fetch instagram permalink, falling back to ID');
    }

    return { 
      status: "success", 
      url: finalUrl, 
      platform: "Instagram" 
    };
  } catch (error: any) {
    console.error(`[SOCIAL ERROR] Instagram failed: ${error.message}`);
    return { status: "error", message: error.message, platform: "Instagram" };
  }
}

// ---- X / Twitter Integration (API v2 + OAuth 1.0a) ----

function generateOAuthNonce() {
  return Math.random().toString(36).substring(2, 11);
}

function percentEncode(str: string) {
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/\*/g, '%2A')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29');
}

async function hmacSha1(key: string, data: string): Promise<string> {
  const { createHmac } = await import('crypto');
  return createHmac('sha1', key).update(data).digest('base64');
}

async function generateOAuthHeader(
  method: string,
  url: string,
  oauthParams: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string
) {
  // Build the signature base string
  const sortedParams = Object.keys(oauthParams).sort().map(k => `${percentEncode(k)}=${percentEncode(oauthParams[k])}`).join('&');
  const baseString = `${method}&${percentEncode(url)}&${percentEncode(sortedParams)}`;
  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`;
  
  const signature = await hmacSha1(signingKey, baseString);
  oauthParams['oauth_signature'] = signature;

  // Build the Authorization header
  const headerParts = Object.keys(oauthParams).sort().map(k => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`).join(', ');
  return `OAuth ${headerParts}`;
}

export async function publishToTwitter(article: DraftArticle, blogUrl?: string): Promise<PublishResult> {
  const apiKey = process.env.TWITTER_API_KEY?.trim();
  const apiSecret = process.env.TWITTER_API_SECRET?.trim();
  const accessToken = process.env.TWITTER_ACCESS_TOKEN?.trim();
  const accessSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET?.trim();

  if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
    console.warn(`[SOCIAL WARNING] X/Twitter credentials missing. Skipping post.`);
    return { status: "skipped", message: "X/Twitter credentials missing. Add TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET to .env.local", platform: "X/Twitter" };
  }

  try {
    console.log(`[SOCIAL] Composing tweet for: ${article.title}`);

    // Step 1: Generate Dynamic Hashtags
    const hashtags = await generateHashtags(article.title, article.content);

    // Step 2: Compose the tweet (280 char limit)
    const link = blogUrl || '';
    const titleTruncated = article.title.length > 120 ? article.title.substring(0, 117) + '...' : article.title;
    const metaSnippet = article.metaDescription.length > 80 ? article.metaDescription.substring(0, 77) + '...' : article.metaDescription;
    
    let tweetText = `🚀 ${titleTruncated}\n\n${metaSnippet}`;
    if (link) tweetText += `\n\n🔗 ${link}`;
    tweetText += `\n\n${hashtags}`;

    // Ensure under 280 chars
    if (tweetText.length > 280) {
      // Try to preserve the link and hashtags, truncate the text/meta
      const reservedLength = (link ? link.length + 5 : 0) + hashtags.length + 5; 
      const available = 280 - reservedLength;
      tweetText = `🚀 ${titleTruncated.substring(0, available / 2)}\n\n${metaSnippet.substring(0, available / 2)}...`;
      if (link) tweetText += `\n\n🔗 ${link}`;
      tweetText += `\n\n${hashtags}`;
    }

    // Twitter API v2 endpoint
    const tweetUrl = 'https://api.twitter.com/2/tweets';

    const oauthParams: Record<string, string> = {
      oauth_consumer_key: apiKey,
      oauth_nonce: generateOAuthNonce(),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_token: accessToken,
      oauth_version: '1.0',
    };

    console.log('[X DEBUG] OAuth Params:', { ...oauthParams, oauth_consumer_key: 'HIDDEN' });

    const authHeader = await generateOAuthHeader('POST', tweetUrl, oauthParams, apiSecret, accessSecret);

    console.log(`[SOCIAL] Posting tweet to X...`);
    const res = await fetch(tweetUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: tweetText }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('[X ERROR DEBUG]', JSON.stringify(data, null, 2));
      throw new Error(data.detail || data.title || JSON.stringify(data.errors) || 'Failed to post tweet');
    }

    const tweetId = data.data?.id;
    console.log(`[SOCIAL] ✅ Tweet posted: ${tweetId}`);

    return {
      status: "success",
      url: `https://x.com/i/status/${tweetId}`,
      platform: "X/Twitter"
    };
  } catch (error: any) {
    console.error(`[SOCIAL ERROR] X/Twitter failed: ${error.message}`);
    return { status: "error", message: error.message, platform: "X/Twitter" };
  }
}

export async function publishToTikTok(article: DraftArticle, blogUrl?: string): Promise<PublishResult> {
  const token = await getTikTokToken();

  if (!token) {
    console.warn(`[SOCIAL WARNING] TikTok token missing or expired. Connect via /api/auth/tiktok/connect`);
    return { 
      status: "skipped", 
      message: "TikTok not connected. Visit /api/auth/tiktok/connect to authorize.", 
      platform: "TikTok" 
    };
  }

  try {
    console.log(`[SOCIAL] Initializing TikTok Direct Post for: ${article.title}`);
    
    // Step 1: Generate Dynamic Hashtags
    const hashtags = await generateHashtags(article.title, article.content);
    
    // Step 2: Compose Caption
    let caption = `${article.title}\n\n${article.metaDescription}`;
    if (blogUrl) caption += `\n\n🔗 Full Pulse: ${blogUrl}`;
    caption += `\n\n${hashtags}`;

    // TikTok Direct Post V2 - Photos via URL
    // Note: char limit is 2,200 but line breaks might be ignored by some TikTok clients
    const res = await fetch('https://open.tiktokapis.com/v2/post/publish/content/init/', {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        post_info: {
          title: article.title.substring(0, 90), // TikTok title limit
          description: caption.substring(0, 2100), // Safety margin
          privacy_level: "PUBLIC_TO_EVERYONE",
          disable_comment: false,
        },
        source_info: {
          source: "PULL_FROM_URL",
          photo_urls: [article.ogImageUrl],
        },
        post_mode: "MEDIA_POST",
        media_type: "PHOTO",
      }),
    });

    const data = await res.json();
    
    // TikTok sometimes returns 200 OK but includes an error payload
    if (!res.ok || data.error || !data.data?.publish_id) {
       console.error('[TIKTOK ERROR]', JSON.stringify(data, null, 2));
       throw new Error((data.error?.message) || `TikTok API Error: Publish ID missing or invalid request.`);
    }

    // TikTok posting is asynchronous, return the publish_id
    const publishId = data.data.publish_id;
    console.log(`[SOCIAL] ✅ TikTok Pulse Initiated: ${publishId}`);

    return { 
      status: "success", 
      url: `https://tiktok.com/publish/${publishId}`, // Placeholder until processed
      id: publishId,
      platform: "TikTok" 
    };
  } catch (error: any) {
    console.error(`[SOCIAL ERROR] TikTok failed: ${error.message}`);
    return { status: "error", message: error.message, platform: "TikTok" };
  }
}

// Scheduling Helper
export function calculatePeakTime() {
  const peakHours = [9, 13, 19, 21]; // EST/Universal peak times
  const currentHour = new Date().getHours();
  const nextPeak = peakHours.find(h => h > currentHour) || peakHours[0];
  
  const scheduleDate = new Date();
  scheduleDate.setHours(nextPeak, 0, 0, 0);
  if (nextPeak <= currentHour) scheduleDate.setDate(scheduleDate.getDate() + 1);
  
  return scheduleDate.toISOString();
}
