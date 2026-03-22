import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { model: modelName } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ success: false, error: "GEMINI_API_KEY is missing in environment." }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Explicitly using the model name without v1beta alias if possible
    const model = genAI.getGenerativeModel({ model: modelName });
    
    // Very simple request to test connectivity
    const result = await model.generateContent("Say 'Ready'");
    const text = result.response.text();

    return NextResponse.json({ success: true, text });
  } catch (error: any) {
    console.error(`[DIAGNOSTIC ERROR] ${error.message}`);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
