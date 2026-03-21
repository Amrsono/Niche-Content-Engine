
require('dotenv').config({ path: '.env.local' });
const { generateArticle } = require('./lib/agents');

async function test() {
  console.log("Testing generateArticle with Gemini Fallback...");
  try {
    const article = await generateArticle("AI Voice Generator");
    console.log("SUCCESS:", article.title);
  } catch (e) {
    console.error("FAILED:", e.message);
  }
}

test();
