export type AIProvider = 'groq' | 'gemini' | 'openai';

export interface AIModelConfig {
  provider: AIProvider;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface GeneratedArticle {
  title: string;
  metaDescription: string;
  content: string;
  keyword: string;
  category: string;
  readingTimeMinutes?: number;
}

export interface GeneratedSocialPosts {
  twitter?: string;
  instagram?: string;
  tiktok?: string;
  facebook?: string;
  pinterest?: string;
  linkedin?: string;
}

export interface KeywordResearchResult {
  keyword: string;
  searchVolumeEstimated?: number;
  intent: 'informational' | 'commercial' | 'transactional' | 'navigational';
  subtopics: string[];
  suggestedTitles: string[];
}

export interface SocialPublishResult {
  success: boolean;
  platform: 'twitter' | 'instagram' | 'tiktok' | 'facebook';
  postId?: string;
  postUrl?: string;
  error?: string;
}

export interface AIServiceResponse<T> {
  success: boolean;
  data?: T;
  provider: AIProvider;
  modelUsed: string;
  latencyMs: number;
  error?: string;
}
