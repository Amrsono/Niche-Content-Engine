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
                src={post.ogImageUrl || `https://image.pollinations.ai/prompt/${encodeURIComponent(post.title + ' digital art cinematic')}.jpg?width=1200&height=630&nologo=true&enhance=true`} 
                alt={post.title}
                style={{ width: '100%', height: 'auto', display: 'block' }}
                onError={(e) => { 
                  const target = e.target as HTMLImageElement;
                  // Fallback: generate an alternative image from the title
                  if (!target.src.includes('fallback=true')) {
                    target.src = `https://image.pollinations.ai/prompt/${encodeURIComponent(post.title)}.jpg?width=1200&height=630&nologo=true&seed=42&fallback=true`;
                  }
                }}
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
        <SidebarAd 
          link="https://amzn.to/4bZ6kmB"
          label="Hot New Releases"
        />
      </div>
    </main>
  );
}
