"use client";

import { usePosts } from '@/lib/useLocalPosts';
import { notFound } from 'next/navigation';
import styles from '../blog.module.css';
import { FloatingNav } from '@/app/components/FloatingNav';
import { use } from 'react';

export default function PostReader({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { posts } = usePosts();
  const post = posts.find(p => p.slug === slug);

  // Show loading state while localStorage hydrates
  if (posts.length === 0) {
    return (
      <main className={styles.blogContainer}>
        <FloatingNav />
        <div style={{ textAlign: 'center', paddingTop: '200px', color: '#64748b' }}>Loading...</div>
      </main>
    );
  }

  if (!post) {
    notFound();
  }

  return (
    <main className={styles.blogContainer}>
      <FloatingNav />
      
      <article className={styles.readerContainer}>
        <header className={styles.readerHeader}>
          <div className={styles.tag} style={{ fontSize: '1rem', marginBottom: '20px' }}>{post.keyword}</div>
          <h1 className={styles.readerTitle}>{post.title}</h1>
          <div className={styles.readerMeta}>
            <span>{new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            <span>•</span>
            <span>2,000+ Words</span>
            <span>•</span>
            <span>Original Insight</span>
          </div>
        </header>

        <div className={styles.featuredImageArea}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={post.ogImageUrl || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2000&auto=format&fit=crop'} 
            alt={post.title}
            style={{ width: '100%', height: 'auto', display: 'block' }}
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2000&auto=format&fit=crop'; }}
          />
        </div>

        <div 
          className={styles.articleBody}
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
    </main>
  );
}
