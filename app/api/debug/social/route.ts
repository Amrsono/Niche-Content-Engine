import { NextResponse } from 'next/server';

export async function GET() {
  const diagnostics = {
    TWITTER_API_KEY: process.env.TWITTER_API_KEY ? `SET (starts with ${process.env.TWITTER_API_KEY.substring(0,4)}...)` : 'MISSING',
    TWITTER_API_SECRET: process.env.TWITTER_API_SECRET ? `SET (length: ${process.env.TWITTER_API_SECRET.length})` : 'MISSING',
    TWITTER_ACCESS_TOKEN: process.env.TWITTER_ACCESS_TOKEN ? `SET (starts with ${process.env.TWITTER_ACCESS_TOKEN.substring(0,4)}...)` : 'MISSING',
    TWITTER_ACCESS_TOKEN_SECRET: process.env.TWITTER_ACCESS_TOKEN_SECRET ? `SET (length: ${process.env.TWITTER_ACCESS_TOKEN_SECRET.length})` : 'MISSING',
    INSTAGRAM_BUSINESS_ID: process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID ? `SET (${process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID})` : 'MISSING',
    INSTAGRAM_ACCESS_TOKEN: process.env.INSTAGRAM_ACCESS_TOKEN ? `SET (starts with ${process.env.INSTAGRAM_ACCESS_TOKEN.substring(0,4)}...)` : 'MISSING',
  };

  return NextResponse.json(diagnostics);
}
