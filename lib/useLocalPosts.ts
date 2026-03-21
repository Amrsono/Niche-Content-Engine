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
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/posts');
      const data = await res.json();
      if (data.success) {
        setPosts(data.posts);
      }
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const getPostBySlug = (slug: string) => posts.find((p) => p.slug === slug);

  return { posts, isLoading, getPostBySlug, refresh: fetchPosts };
}
