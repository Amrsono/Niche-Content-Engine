import { getPostBySlug } from '@/lib/storage';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import styles from '../blog.module.css';
import { FloatingNav } from '@/app/components/FloatingNav';
import AdSenseInArticle from '@/app/components/AdSenseInArticle';
import AdSenseDisplay from '@/app/components/AdSenseDisplay';
import AmazonAdBanner from '@/app/components/AmazonAdBanner';
import SidebarAd from '@/app/components/SidebarAd';
import adStyles from '@/app/components/AdStyles.module.css';
import { ViewTracker } from './ViewTracker';

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Dynamic Metadata for SEO & Social Sharing
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) return {};

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://niche-content-engine.vercel.app';
  const postUrl = `${siteUrl}/blog/${slug}`;
  const description = post.content.replace(/<[^>]*>/g, '').slice(0, 160) + '...';

  const defaultOgImage = `https://gen.pollinations.ai/image/${encodeURIComponent(post.title + ' digital art cinematic')}?width=1200&height=630&nologo=true&enhance=true&model=flux&key=pk_31oNBvU9JLA1ApNX`;
  
  // Always route through proxy for Meta compatibility
  const shareImage = (post.ogImageUrl && post.ogImageUrl.includes('/api/image-proxy')) 
    ? post.ogImageUrl 
    : `${siteUrl}/api/image-proxy?url=${encodeURIComponent(post.ogImageUrl || defaultOgImage)}`;

  return {
    title: post.title,
    description,
    openGraph: {
      title: post.title,
      description,
      url: postUrl,
      siteName: 'Niche Content Engine',
      images: [
        {
          url: shareImage,
          width: 1200,
          height: 630,
          alt: post.title,
          type: 'image/jpeg',
        },
      ],
      type: 'article',
      publishedTime: post.publishedAt,
      authors: ['NicheEngine AI'],
    },
    facebook: {
      appId: process.env.NEXT_PUBLIC_FB_APP_ID || '2464563490653501',
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      images: [shareImage],
    },
  };
}

function splitAfterNthParagraph(html: string, n: number): [string, string] {
  let count = 0;
  let idx = 0;
  while (count < n && idx < html.length) {
    const next = html.indexOf('</p>', idx);
    if (next === -1) break;
    count++;
    idx = next + 4;
  }
  return [html.slice(0, idx), html.slice(idx)];
}

export default async function PostReader({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const [contentBefore, contentAfter] = splitAfterNthParagraph(post.content, 2);

  return (
    <main className={styles.blogContainer}>
      <FloatingNav />
      {/* Client-side tracking */}
      <ViewTracker slug={slug} />
      
      <div className={adStyles.blogLayoutWrapper}>
        <SidebarAd 
          link="https://amzn.to/47myeq5"
          label="Best Sellers"
          image="/ads/amazon_bestsellers_ad_sidebar.png"
        />

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
                src={post.ogImageUrl || `https://gen.pollinations.ai/image/${encodeURIComponent(post.title + ' digital art cinematic')}?width=1200&height=630&nologo=true&enhance=true&model=flux&key=pk_31oNBvU9JLA1ApNX`} 
                alt={post.title}
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>

            <div 
              className={styles.articleBody}
              dangerouslySetInnerHTML={{ __html: contentBefore }}
            />

            <AdSenseInArticle />

            <div 
              className={styles.articleBody}
              dangerouslySetInnerHTML={{ __html: contentAfter }}
            />

            <AmazonAdBanner />
            <AdSenseDisplay style={{ marginTop: '1rem' }} />
          </article>
        </div>

        <SidebarAd 
          link="https://amzn.to/4bZ6kmB"
          label="Hot New Releases"
        />
      </div>
    </main>
  );
}
