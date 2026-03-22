import fs from 'fs';
import path from 'path';
import type { Post } from './types';

// On Vercel, only /tmp is writable. In dev, use the local data/ dir.
const IS_SERVERLESS = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined;
const DATA_DIR = IS_SERVERLESS ? '/tmp' : path.resolve(process.cwd(), 'data');
const POSTS_FILE = path.resolve(DATA_DIR, 'posts.json');

export async function savePost(post: Omit<Post, 'id' | 'publishedAt' | 'slug'>) {
  try {
    console.log(`[STORAGE] Attempting save to: ${POSTS_FILE}`);
    const posts = await getPosts();
    console.log(`[STORAGE] Currently have ${posts.length} posts. unshifting new one...`);
    
    const newPost: Post = {
      ...post,
      id: Math.random().toString(36).substring(2, 11),
      publishedAt: new Date().toISOString(),
      slug: post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    };

    posts.unshift(newPost);

    if (!fs.existsSync(DATA_DIR)) {
      console.log(`[STORAGE] Creating directory: ${DATA_DIR}`);
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));
    console.log(`[STORAGE] ✅ Successfully wrote to ${POSTS_FILE}. Total posts: ${posts.length}`);
    return newPost;
  } catch (error: any) {
    console.error(`[STORAGE ERROR] Failed to save post: ${error.message}`);
    throw error;
  }
}

export async function getPosts(): Promise<Post[]> {
  try {
    if (!fs.existsSync(POSTS_FILE)) {
      console.log(`[STORAGE] ${POSTS_FILE} not found. Returning empty array.`);
      return [];
    }
    const data = fs.readFileSync(POSTS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    console.log(`[STORAGE] Read ${parsed.length} posts from ${POSTS_FILE}`);
    return parsed;
  } catch (error: any) {
    console.error(`[STORAGE ERROR] Failed to read posts: ${error.message}`);
    return [];
  }
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

const SETTINGS_FILE = path.resolve(DATA_DIR, 'settings.json');

async function getAllSettings(): Promise<Record<string, any>> {
  if (!fs.existsSync(SETTINGS_FILE)) {
    return {};
  }
  try {
    const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

export async function saveSettings(key: string, value: any) {
  try {
    const settings = await getAllSettings();
    settings[key] = value;
    
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    return true;
  } catch (error) {
    console.error(`[STORAGE ERROR] Failed to save settings: ${key}`, error);
    return false;
  }
}

export async function getSettings(key: string): Promise<any> {
  const settings = await getAllSettings();
  return settings[key];
}

