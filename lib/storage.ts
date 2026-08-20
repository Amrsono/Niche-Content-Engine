import fs from 'fs';
import path from 'path';
import Redis from 'ioredis';
import type { Post } from './types';
import { logger } from './logger';

const REDIS_URL = process.env.REDIS_URL || process.env.KV_URL;
const IS_REDIS_ENABLED = Boolean(REDIS_URL);

let redis: Redis | null = null;
if (IS_REDIS_ENABLED && REDIS_URL) {
  redis = new Redis(REDIS_URL);
}

const IS_SERVERLESS = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined;
const DATA_DIR = IS_SERVERLESS ? '/tmp' : path.resolve(process.cwd(), 'data');
const POSTS_FILE = path.resolve(DATA_DIR, 'posts.json');
const SETTINGS_FILE = path.resolve(DATA_DIR, 'settings.json');

const POSTS_KEY = 'niche_engine_posts';
const SETTINGS_KEY = 'niche_engine_settings';

export async function savePost(post: Omit<Post, 'id' | 'publishedAt' | 'slug'>): Promise<Post> {
  try {
    const posts = await getPosts();

    const newPost: Post = {
      ...post,
      id: Math.random().toString(36).substring(2, 11),
      publishedAt: new Date().toISOString(),
      slug: post.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, ''),
    };

    posts.unshift(newPost);

    if (redis) {
      logger.info(`Saving to Redis: ${POSTS_KEY}`, 'STORAGE');
      await redis.set(POSTS_KEY, JSON.stringify(posts));
    } else {
      logger.info(`Saving to FS: ${POSTS_FILE}`, 'STORAGE');
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));
    }

    logger.info(`Successfully saved post. Total posts: ${posts.length}`, 'STORAGE');
    return newPost;
  } catch (error: unknown) {
    logger.error('Failed to save post', 'STORAGE', error);
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
  } catch (error: unknown) {
    logger.error('Failed to read posts', 'STORAGE', error);
    return [];
  }
}

export async function getPostBySlug(slug: string): Promise<Post | undefined> {
  const posts = await getPosts();
  return posts.find((p) => p.slug === slug);
}

export async function updatePost(id: string, updates: Partial<Post>): Promise<Post | null> {
  const posts = await getPosts();
  const index = posts.findIndex((p) => p.id === id);
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

async function getAllSettings(): Promise<Record<string, unknown>> {
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

export async function saveSettings<T = unknown>(key: string, value: T): Promise<boolean> {
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
    logger.error(`Failed to save settings: ${key}`, 'STORAGE', error);
    return false;
  }
}

export async function getSettings<T = unknown>(key: string): Promise<T | null> {
  const settings = await getAllSettings();
  return (settings[key] as T) ?? null;
}
