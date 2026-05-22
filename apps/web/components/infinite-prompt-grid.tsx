"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { InfiniteScrollLoader } from "@/components/infinite-scroll-loader";
import { PromptCard, type PromptCardLabels } from "@/components/prompt-card";
import type { PromptRecord, PromptSearchQuery } from "@/lib/data";
import { fetchPromptsClient } from "@/lib/fetch-prompts-client";

type InfinitePromptGridProps = {
  initialItems: PromptRecord[];
  total: number;
  query: PromptSearchQuery;
  pageSize?: number;
  labels: PromptCardLabels;
  noMoreLabel: string;
  keyword?: string;
  /** @deprecated kept for backwards compat, no longer displayed */
  loadingLabel?: string;
};

export function InfinitePromptGrid({
  initialItems,
  total,
  query,
  pageSize = 24,
  labels,
  noMoreLabel,
  keyword
}: InfinitePromptGridProps) {
  const [items, setItems] = useState(initialItems);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialItems.length < total);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(initialItems.length);

  const loadNext = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const result = await fetchPromptsClient(
        { ...query, offset: offsetRef.current },
        pageSize
      );
      setItems((prev) => [...prev, ...result.items]);
      offsetRef.current += result.items.length;
      setHasMore(result.hasMore);
    } catch {
      // 网络错误静默，用户可再次滚动触发
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, query, pageSize]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadNext();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadNext]);

  return (
    <>
      <div className="prompt-grid" style={{ marginTop: 18 }}>
        {items.map((prompt, index) => (
          <PromptCard
            key={prompt.id}
            prompt={prompt}
            priority={index < 2}
            labels={labels}
            keyword={keyword}
          />
        ))}
      </div>
      {loading && <InfiniteScrollLoader />}
      {hasMore ? (
        <div ref={sentinelRef} style={{ height: 1 }} />
      ) : items.length > 0 ? (
        <div
          className="mono-copy"
          style={{ textAlign: "center", padding: "24px 0", opacity: 0.4 }}
        >
          {noMoreLabel}
        </div>
      ) : null}
    </>
  );
}
