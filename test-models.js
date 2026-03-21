const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: ".env.local" });

async function list() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
    // The SDK might not have a direct listModels, but we can try to fetch a model info
    console.log("Checking gemini-1.5-flash...");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("test");
    console.log("Success with gemini-1.5-flash!");
  } catch (e) {
    console.error("Error with gemini-1.5-flash:", e.message);
  }

  try {
    console.log("Checking gemini-1.5-flash-latest...");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const result = await model.generateContent("test");
    console.log("Success with gemini-1.5-flash-latest!");
  } catch (e) {
    console.error("Error with gemini-1.5-flash-latest:", e.message);
  }
}

list();
