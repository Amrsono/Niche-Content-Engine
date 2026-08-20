import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "@/lib/logger";
import { stringifyError } from "@/lib/ai/utils";
import { DiagnosticRequestSchema, validateRequestBody } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const validation = validateRequestBody(DiagnosticRequestSchema, body);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }

    const { model: modelName } = validation.data;
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
