import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "@/lib/logger";
import { stringifyError } from "@/lib/ai/utils";

export async function POST(req: Request) {
  try {
    const { model: modelName } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ success: false, error: "GEMINI_API_KEY is missing in environment." }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });
    
    const result = await model.generateContent("Say 'Ready'");
    const text = result.response.text();

    return NextResponse.json({ success: true, text });
  } catch (error: unknown) {
    const message = stringifyError(error);
    logger.error('Diagnostic error', 'DIAGNOSTIC', error);
    return NextResponse.json({ 
      success: false, 
      error: message 
    }, { status: 500 });
  }
}
