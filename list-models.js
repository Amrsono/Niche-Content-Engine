
require('dotenv').config({ path: '.env.local' });

async function listModels() {
  const key = process.env.GEMINI_API_KEY;
  console.log("Checking models for key starting with:", key.substring(0, 5));
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await res.json();
    if (data.models) {
      console.log("AVAILABLE MODELS:");
      data.models.forEach(m => console.log("- " + m.name));
    } else {
      console.log("ERROR:", JSON.stringify(data));
    }
  } catch (e) {
    console.error("FETCH ERROR:", e.message);
  }
}

listModels();
