import { getPostBySlug } from '@/lib/storage';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import styles from '../blog.module.css';
import { FloatingNav } from '@/app/components/FloatingNav';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: 'Post Not Found' };
  
  return {
    title: post.title,
    description: post.metaDescription,
    openGraph: {
      title: post.title,
      description: post.metaDescription,
      images: [post.ogImageUrl || ''],
    },
  };
}

export default async function PostReader({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

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
          <Image 
            src={post.ogImageUrl || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2000'} 
            alt={post.title}
            width={1200}
            height={630}
            priority
            style={{ width: '100%', height: 'auto', display: 'block' }}
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
