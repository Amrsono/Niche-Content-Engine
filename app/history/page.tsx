"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { usePosts } from "@/lib/useLocalPosts";
import { getAllAnalytics } from "@/lib/analytics";
import { FloatingNav } from "@/app/components/FloatingNav";
import type { Post } from "@/lib/types";
import { Eye, MousePointer2, Calendar, Hash, ExternalLink, RefreshCw, TrendingUp, FileText, ArrowUp, ArrowDown } from "lucide-react";
import styles from "./history.module.css";

type SortKey = "publishedAt" | "views" | "adClicks" | "title";
type SortDir = "asc" | "desc";

interface PostWithAnalytics extends Post {
  views: number;
  adClicks: number;
}

export default function HistoryPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
  const userEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
  const isAdmin = isSignedIn && userEmail && adminEmails.includes(userEmail);

  useEffect(() => {
    if (isLoaded && !isAdmin) {
      router.push("/blog");
    }
  }, [isLoaded, isAdmin, router]);

  const { posts, refresh, isLoading } = usePosts();
  const [analytics, setAnalytics] = useState<Record<string, { views: number; adClicks: number }>>({});
  const [sortKey, setSortKey] = useState<SortKey>("publishedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    setAnalytics(getAllAnalytics());
  }, []);

  const enriched: PostWithAnalytics[] = posts.map((p) => ({
    ...p,
    views: analytics[p.slug]?.views ?? 0,
    adClicks: analytics[p.slug]?.adClicks ?? 0,
  }));

  const filtered = enriched.filter(
    (p) =>
      p.title.toLowerCase().includes(filter.toLowerCase()) ||
      p.keyword.toLowerCase().includes(filter.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    let aVal: any = a[sortKey];
    let bVal: any = b[sortKey];
    if (sortKey === "publishedAt") {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }
    if (typeof aVal === "string") aVal = aVal.toLowerCase();
    if (typeof bVal === "string") bVal = bVal.toLowerCase();
    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const totalViews = enriched.reduce((s, p) => s + p.views, 0);
  const totalClicks = enriched.reduce((s, p) => s + p.adClicks, 0);
  const avgCtr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : "0.0";

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey !== k ? null : sortDir === "desc" ? (
      <ArrowDown size={13} />
    ) : (
      <ArrowUp size={13} />
    );

  return (
    <main className={styles.main}>
      <FloatingNav />

      <div className={styles.header}>
        <h1 className={styles.title}>Post History</h1>
        <p className={styles.subtitle}>All generated articles with persistent ad analytics.</p>
      </div>

      {/* Summary Cards */}
      <div className={styles.statGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><FileText size={20} /></div>
          <div className={styles.statValue}>{posts.length}</div>
          <div className={styles.statLabel}>Total Posts</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ color: "var(--accent-1)" }}><Eye size={20} /></div>
          <div className={styles.statValue}>{totalViews.toLocaleString()}</div>
          <div className={styles.statLabel}>Total Views</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ color: "var(--accent-2)" }}><MousePointer2 size={20} /></div>
          <div className={styles.statValue}>{totalClicks.toLocaleString()}</div>
          <div className={styles.statLabel}>Ad Clicks</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ color: "#ffcc00" }}><TrendingUp size={20} /></div>
          <div className={styles.statValue}>{avgCtr}%</div>
          <div className={styles.statLabel}>Avg CTR</div>
        </div>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <input
          className={styles.search}
          placeholder="🔍  Search posts..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <button className={styles.refreshBtn} onClick={refresh} disabled={isLoading}>
          <RefreshCw size={15} className={isLoading ? styles.spin : ""} />
          {isLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th
                className={`${styles.th} ${styles.sortable}`}
                onClick={() => toggleSort("title")}
              >
                Title <SortIcon k="title" />
              </th>
              <th className={styles.th}>Keyword</th>
              <th
                className={`${styles.th} ${styles.sortable}`}
                onClick={() => toggleSort("publishedAt")}
              >
                Date <SortIcon k="publishedAt" />
              </th>
              <th
                className={`${styles.th} ${styles.sortable} ${styles.centered}`}
                onClick={() => toggleSort("views")}
              >
                <Eye size={14} /> Views <SortIcon k="views" />
              </th>
              <th
                className={`${styles.th} ${styles.sortable} ${styles.centered}`}
                onClick={() => toggleSort("adClicks")}
              >
                <MousePointer2 size={14} /> Clicks <SortIcon k="adClicks" />
              </th>
              <th className={`${styles.th} ${styles.centered}`}>CTR</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th}></th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && !isLoading && (
              <tr>
                <td colSpan={8} className={styles.empty}>
                  {filter ? "No posts matching your search." : "No posts generated yet. Start a cycle!"}
                </td>
              </tr>
            )}
            {sorted.map((post) => {
              const ctr = post.views > 0 ? ((post.adClicks / post.views) * 100).toFixed(1) : "—";
              return (
                <tr key={post.id} className={styles.tr}>
                  <td className={styles.td}>
                    <div className={styles.postTitle} title={post.title}>
                      {post.title.length > 60 ? post.title.slice(0, 60) + "…" : post.title}
                    </div>
                  </td>
                  <td className={styles.td}>
                    <span className={styles.keywordBadge}>
                      <Hash size={11} />{post.keyword}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <span className={styles.date}>
                      <Calendar size={12} />
                      {new Date(post.publishedAt).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </span>
                  </td>
                  <td className={`${styles.td} ${styles.centered}`}>
                    <span className={styles.metricViews}>{post.views}</span>
                  </td>
                  <td className={`${styles.td} ${styles.centered}`}>
                    <span className={styles.metricClicks}>{post.adClicks}</span>
                  </td>
                  <td className={`${styles.td} ${styles.centered}`}>
                    <span className={styles.ctr}>{ctr}{ctr !== "—" ? "%" : ""}</span>
                  </td>
                  <td className={styles.td}>
                    <span className={`${styles.status} ${post.status === "published" ? styles.published : styles.draft}`}>
                      {post.status}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <a
                      href={`/blog/${post.slug}`}
                      className={styles.viewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
