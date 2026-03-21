import fs from 'fs';
import path from 'path';

// On Vercel, only /tmp is writable. In dev, use the local data/ dir.
const IS_SERVERLESS = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined;
const DATA_DIR = IS_SERVERLESS ? '/tmp' : path.join(process.cwd(), 'data');
const POSTS_FILE = path.join(DATA_DIR, 'posts.json');

export interface Post {
  id: string;
  title: string;
  content: string;
  metaDescription: string;
  ogImageUrl?: string;
  status: 'published' | 'scheduled' | 'draft';
  publishedAt: string;
  slug: string;
  keyword: string;
  instagramUrl?: string;
  twitterUrl?: string;
  tiktokUrl?: string;
}

export async function savePost(post: Omit<Post, 'id' | 'publishedAt' | 'slug'>) {
  const posts = await getPosts();
  
  const newPost: Post = {
    ...post,
    id: Math.random().toString(36).substring(2, 11),
    publishedAt: new Date().toISOString(),
    slug: post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  };

  posts.unshift(newPost); // Newest first

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));
  return newPost;
}

export async function getPosts(): Promise<Post[]> {
  if (!fs.existsSync(POSTS_FILE)) {
    return [];
  }
  const data = fs.readFileSync(POSTS_FILE, 'utf-8');
  return JSON.parse(data);
}

export async function getPostBySlug(slug: string): Promise<Post | undefined> {
  const posts = await getPosts();
  return posts.find(p => p.slug === slug);
}

export async function updatePost(id: string, updates: Partial<Post>) {
  const posts = await getPosts();
  const index = posts.findIndex(p => p.id === id);
  if (index === -1) return null;
  
  posts[index] = { ...posts[index], ...updates };
  
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));
  return posts[index];
}

