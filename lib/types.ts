export interface Post {
  id: string;
  title: string;
  content: string;
  metaDescription: string;
  ogImageUrl?: string;
  publishedAt: string;
  slug: string;
  keyword: string;
  category?: string;
  status: 'published' | 'scheduled' | 'draft' | string;
  instagramUrl?: string;
  twitterUrl?: string;
  tiktokUrl?: string;
  views?: number;
  adClicks?: number;
}
