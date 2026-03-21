import { runTrendScraper, generateArticle, generateOgImage, publishToWordpress } from './lib/agents';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  console.log('--- STARTING CORE ENGINE TEST ---');
  
  const niche = 'Sustainable Tech';
  
  // 1. Test Discovery
  console.log('\n[TEST] Testing Discovery Agent...');
  const trends = await runTrendScraper(niche);
  console.log('Trends Found:', trends);
  
  if (trends.length > 0) {
    const keyword = trends[0].keyword;
    
    // 2. Test Reasoning
    console.log(`\n[TEST] Testing Reasoning Agent for: ${keyword}...`);
    const article = await generateArticle(keyword);
    console.log('Article Title:', article.title);
    console.log('Content Snippet:', article.content.substring(0, 500) + '...');
    console.log('Word Count approx:', article.content.split(' ').length);
    
    // 3. Test SEO
    console.log('\n[TEST] Testing SEO Optimizer...');
    const imageUrl = await generateOgImage(article.title);
    console.log('OG Image URL:', imageUrl);
    
    // 4. Test Publisher
    console.log('\n[TEST] Testing Auto-Publisher...');
    const pubResult = await publishToWordpress(article);
    console.log('Publish Result:', pubResult);
  }
  
  console.log('\n--- TEST COMPLETE ---');
}

main().catch(console.error);
