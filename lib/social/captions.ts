import { logger } from '../logger';
import { callAIWithFallback } from '../ai/dispatcher';
import { GROQ_MODELS } from '../ai/providers/groq';

/**
 * Generates 3-5 high-engagement hashtags based on article content.
 */
export async function generateHashtags(title: string, content: string): Promise<string> {
  try {
    const res = await callAIWithFallback({
      messages: [
        {
          role: 'system',
          content: 'You are a social media growth expert. Generate 3-5 highly relevant, trending hashtags for a post. Return ONLY the hashtags separated by spaces.',
        },
        {
          role: 'user',
          content: `Title: ${title}\nContent: ${content.substring(0, 500)}...`,
        },
      ],
      model: GROQ_MODELS.FAST,
    });
    return res.text.trim() || '#niche #pulse2026 #contentengine';
  } catch (err) {
    logger.warn('Hashtag generation failed, using default tags', 'SOCIAL', err);
    return '#niche #pulse2026 #contentengine';
  }
}

/**
 * Generates a platform-optimized social media caption.
 */
export async function generateSocialCaption(
  platform: 'instagram' | 'twitter' | 'tiktok' | 'facebook',
  title: string,
  content: string,
  blogUrl?: string
): Promise<string> {
  const hashtags = await generateHashtags(title, content);
  const platformPrompts: Record<string, string> = {
    instagram: "Create a world-class Instagram caption. Start with a 'thumb-stopping' hook. Use bullet points for value. End with a clear 'Link in Bio' CTA. Use relevant emojis.",
    twitter: 'Create a high-engagement X (Twitter) post. Start with a viral-style hook. Include the link naturally. Be concise and sharp. Use 1-2 emojis max.',
    tiktok: "Create a high-energy TikTok description. Rapid-fire hooks. Bullet points of 'what you'll learn'. Clear 'Link in Bio' CTA. Lots of energy and emojis.",
    facebook: 'Create a compelling Facebook Page post. Focus on community engagement and storytelling. Use a strong headline hook. Use relevant emojis. End with a clear CTA.',
  };

  try {
    const res = await callAIWithFallback({
      messages: [
        {
          role: 'system',
          content: `${platformPrompts[platform]} Return ONLY the caption text. Do NOT include placeholders like [Link Here]. For Instagram and TikTok, emphasize the BIO for the link. For Twitter, the link provided is ${blogUrl || 'your website'}.`,
        },
        {
          role: 'user',
          content: `Article Title: ${title}\nSummary: ${content.substring(0, 400)}...\nURL: ${blogUrl || 'Link in Bio'}`,
        },
      ],
      model: GROQ_MODELS.FAST,
    });

    let caption = res.text.trim() || `${title}\n\n${content.substring(0, 100)}...`;
    if (!caption.includes('#')) {
      caption += `\n\n${hashtags}`;
    }
    return caption;
  } catch (err) {
    logger.warn(`Caption generation failed for ${platform}, using fallback.`, 'SOCIAL', err);
    return `${title}\n\n🔗 ${blogUrl || 'Link in Bio'}\n\n${hashtags}`;
  }
}
