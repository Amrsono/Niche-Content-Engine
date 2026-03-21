"use client";

import { useState, useEffect } from "react";

export interface Post {
  id: string;
  title: string;
  content: string;
  metaDescription: string;
  ogImageUrl?: string;
  publishedAt: string;
  slug: string;
  keyword: string;
  status: string;
}

const STORAGE_KEY = "pulse-blog-posts";

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setPosts(JSON.parse(raw));
  }, []);

  const addPost = (post: Omit<Post, "id" | "publishedAt" | "slug">) => {
    const newPost: Post = {
      ...post,
      id: Math.random().toString(36).substring(2, 11),
      publishedAt: new Date().toISOString(),
      slug: post.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    };
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const updated = [newPost, ...existing];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setPosts(updated);
    return newPost;
  };

  const getPostBySlug = (slug: string) => posts.find((p) => p.slug === slug);

  return { posts, addPost, getPostBySlug };
}
