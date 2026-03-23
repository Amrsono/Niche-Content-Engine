import fs from 'fs';
import path from 'path';
import Redis from 'ioredis';
import type { Post } from './types';

// Detect if we have a Redis URL available (supports various env keys just in case)
const REDIS_URL = process.env.REDIS_URL || process.env.KV_URL;
const IS_REDIS_ENABLED = !!REDIS_URL;

let redis: Redis | null = null;
if (IS_REDIS_ENABLED) {
  redis = new Redis(REDIS_URL!);
}

// Original Local fallback behavior
const IS_SERVERLESS = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined;
const DATA_DIR = IS_SERVERLESS ? '/tmp' : path.resolve(process.cwd(), 'data');
const POSTS_FILE = path.resolve(DATA_DIR, 'posts.json');
const SETTINGS_FILE = path.resolve(DATA_DIR, 'settings.json');

const POSTS_KEY = 'niche_engine_posts';
const SETTINGS_KEY = 'niche_engine_settings';

export async function savePost(post: Omit<Post, 'id' | 'publishedAt' | 'slug'>) {
  try {
    const posts = await getPosts();
    
    const newPost: Post = {
      ...post,
      id: Math.random().toString(36).substring(2, 11),
      publishedAt: new Date().toISOString(),
      slug: post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    };

    posts.unshift(newPost);
    
    if (redis) {
      console.log(`[STORAGE] Saving to Redis: ${POSTS_KEY}`);
      await redis.set(POSTS_KEY, JSON.stringify(posts));
    } else {
      console.log(`[STORAGE] Saving to FS: ${POSTS_FILE}`);
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));
    }
    
    console.log(`[STORAGE] ✅ Successfully saved post. Total posts: ${posts.length}`);
    return newPost;
  } catch (error: any) {
    console.error(`[STORAGE ERROR] Failed to save post:`, error);
    throw error;
  }
}

export async function getPosts(): Promise<Post[]> {
  try {
    if (redis) {
      const data = await redis.get(POSTS_KEY);
      return data ? JSON.parse(data) : [];
    } else {
      if (!fs.existsSync(POSTS_FILE)) return [];
      return JSON.parse(fs.readFileSync(POSTS_FILE, 'utf-8'));
    }
  } catch (error: any) {
    console.error(`[STORAGE ERROR] Failed to read posts:`, error);
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
  
  if (redis) {
    await redis.set(POSTS_KEY, JSON.stringify(posts));
  } else {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));
  }
  return posts[index];
}

async function getAllSettings(): Promise<Record<string, any>> {
  try {
    if (redis) {
      const data = await redis.get(SETTINGS_KEY);
      return data ? JSON.parse(data) : {};
    } else {
      if (!fs.existsSync(SETTINGS_FILE)) return {};
      return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
    }
  } catch {
    return {};
  }
}

export async function saveSettings(key: string, value: any) {
  try {
    const settings = await getAllSettings();
    settings[key] = value;
    
    if (redis) {
      await redis.set(SETTINGS_KEY, JSON.stringify(settings));
    } else {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    }
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

