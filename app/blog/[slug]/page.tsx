"use client";

import { usePosts } from '@/lib/useLocalPosts';
import { notFound } from 'next/navigation';
import styles from '../blog.module.css';
import { FloatingNav } from '@/app/components/FloatingNav';
import AdSenseInArticle from '@/app/components/AdSenseInArticle';
import AdSenseDisplay from '@/app/components/AdSenseDisplay';
import AmazonAdBanner from '@/app/components/AmazonAdBanner';
import SidebarAd from '@/app/components/SidebarAd';
import adStyles from '@/app/components/AdStyles.module.css';
import { use, useEffect } from 'react';
import { trackView } from '@/lib/analytics';

/**
 * Splits HTML content after the Nth closing </p> tag.
 * Returns [before, after] — both are valid HTML strings.
 */
function splitAfterNthParagraph(html: string, n: number): [string, string] {
  let count = 0;
  let idx = 0;
  while (count < n && idx < html.length) {
    const next = html.indexOf('</p>', idx);
    if (next === -1) break;
    count++;
    idx = next + 4; // length of '</p>'
  }
  return [html.slice(0, idx), html.slice(idx)];
}

export default function PostReader({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { posts } = usePosts();
  const post = posts.find(p => p.slug === slug);

  // Track a view on every visit
  useEffect(() => {
    if (post?.slug) {
      trackView(post.slug);
    }
  }, [post?.slug]);


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

  const [contentBefore, contentAfter] = splitAfterNthParagraph(post.content, 2);

  return (
    <main className={styles.blogContainer}>
      <FloatingNav />
      
      <div className={adStyles.blogLayoutWrapper}>
        {/* Left Sidebar Ad */}
        <SidebarAd 
          link="https://amzn.to/47myeq5"
          label="Best Sellers"
          image="/ads/amazon_bestsellers_ad_sidebar.png"
        />

        {/* Main Content */}
        <div className={adStyles.mainColumn}>
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

            {/* First 2 paragraphs */}
            <div 
              className={styles.articleBody}
              dangerouslySetInnerHTML={{ __html: contentBefore }}
            />

            {/* In-article ad — placed after 2nd paragraph as per Google's recommendation */}
            <AdSenseInArticle />

            {/* Rest of article */}
            <div 
              className={styles.articleBody}
              dangerouslySetInnerHTML={{ __html: contentAfter }}
            />

            {/* Amazon Shopping Ad placeholder */}
            <AmazonAdBanner />

            {/* Display ad at the very bottom of each article */}
            <AdSenseDisplay style={{ marginTop: '1rem' }} />
          </article>
        </div>

        {/* Right Sidebar Ad */}
        <SidebarAd />
      </div>
    </main>
  );
}
