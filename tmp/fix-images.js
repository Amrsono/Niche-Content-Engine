/**
 * Standalone script: Regenerate broken/default images for all posts.
 * Reads posts.json, finds posts with Unsplash or rebrand.ly ogImageUrl,
 * generates a creative Pollinations URL using Groq for each, and saves back.
 * 
 * Run with: node tmp/fix-images.js
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });
const Groq = require('groq-sdk');

const POSTS_FILE = path.resolve(__dirname, '../data/posts.json');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const DISCOVERY_MODEL = 'llama-3.1-8b-instant'; // Fast model for prompt generation

function isBrokenImage(url) {
  if (!url) return true;
  if (url.includes('rebrand.ly')) return true;
  if (url.includes('unsplash.com')) return true;
  return false;
}

async function generateImagePrompt(title, keyword) {
  try {
    const contextInfo = keyword ? `Core Concept: ${keyword}` : '';
    const completion = await groq.chat.completions.create({
      model: DISCOVERY_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a world-class creative director for a viral digital magazine.
Your ONLY job is to write a single image prompt for an AI image generator that will produce a STUNNING, click-inducing thumbnail.

Rules:
- The image must be SO specific to this article topic that it could belong to NO other article.
- It must feel like a premium magazine cover: cinematic lighting, dramatic composition, ultra-high detail.
- Choose ONE of these styles that best fits the topic:
  • CINEMATIC PRODUCT SHOT: dramatic studio lighting, dark background, single hero object bursting with energy
  • EXPLOSIVE 3D CONCEPT: vivid isometric scene, deep colors, neon highlights, claymorphism
  • MACRO HYPER-DETAIL: extreme close-up of the most visually striking element of the topic, bokeh, razor-sharp focus, saturated colors
  • EDITORIAL COLLAGE: bold graphic art, geometric shapes, high-contrast colors, abstract representation of the concept
- NO human faces. NO text, logos, letters, or watermarks.
- MUST be visually jaw-dropping. A blog reader scrolling at speed MUST stop and click.
- Return ONLY the image prompt sentence. Nothing else. No preamble.`
        },
        {
          role: 'user',
          content: `ARTICLE TITLE: "${title}"
${contextInfo}

Write a 1–2 sentence, hyper-specific, visually explosive AI image prompt. Make it so compelling that someone who sees this image CANNOT resist clicking to read the article.`
        }
      ]
    });

    let prompt = (completion.choices[0]?.message?.content || '').trim();
    // Safety: if AI returned a URL, fall back to title-based prompt
    if (prompt.startsWith('http') || prompt.includes('unsplash') || prompt.includes('rebrand')) {
      prompt = `A cinematic, ultra-detailed editorial concept art representing: ${title}. Dramatic lighting, deep colors, high contrast, premium magazine quality.`;
    }
    return prompt;
  } catch (err) {
    console.warn(`  [WARN] Groq failed for "${title}": ${err.message}`);
    return `A cinematic, ultra-detailed editorial concept representing: ${title}. Dramatic studio lighting, vibrant colors, premium quality.`;
  }
}

function buildPollinationsUrl(prompt, title) {
  // Seed from title for uniqueness + randomBoost for variety
  const titleSeed = title.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 999983;
  const randomBoost = Math.floor(Math.random() * 10000);
  const seed = titleSeed + randomBoost;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}.jpg?width=1200&height=630&nologo=true&seed=${seed}&enhance=true`;
}

const delay = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const posts = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf-8'));
  const broken = posts.filter(p => isBrokenImage(p.ogImageUrl));

  console.log(`Found ${broken.length} posts with broken/default images (out of ${posts.length} total).`);

  if (broken.length === 0) {
    console.log('Nothing to fix!');
    return;
  }

  let fixed = 0;
  let failed = 0;

  for (const post of broken) {
    console.log(`\n[${fixed + failed + 1}/${broken.length}] Processing: "${post.title}" (${post.id})`);
    try {
      const imagePrompt = await generateImagePrompt(post.title, post.keyword);
      console.log(`  Prompt: ${imagePrompt.substring(0, 100)}...`);

      const newUrl = buildPollinationsUrl(imagePrompt, post.title);
      console.log(`  URL: ${newUrl.substring(0, 80)}...`);

      // Warm up the Pollinations cache
      try {
        await fetch(newUrl);
        console.log(`  Cache warmed ✅`);
      } catch (e) {
        console.warn(`  Cache warmup failed (continuing anyway)`);
      }

      // Update in-memory
      const idx = posts.findIndex(p => p.id === post.id);
      posts[idx].ogImageUrl = newUrl;
      fixed++;

      // Rate-limit friendly: 2s between posts
      await delay(2000);
    } catch (err) {
      console.error(`  ❌ Failed: ${err.message}`);
      failed++;
    }
  }

  // Write back
  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));
  console.log(`\n✅ Done! Fixed: ${fixed}, Failed: ${failed}`);
}

main().catch(console.error);
