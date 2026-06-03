"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useCallback } from "react";

import { CopyPromptButton } from "@/components/copy-prompt-button";
import { HighlightText } from "@/components/highlight-text";
import type { PromptRecord } from "@/lib/data";
import type { Dictionary } from "@/lib/i18n";
import { isSafeImageUrl } from "@/lib/safe-url";

const MAX_EXCERPT = 40;

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  return `${y}/${mo}/${d} ${h}:${mi}:${s}`;
}

export type PromptCardLabels = {
  metrics: Dictionary["common"]["metrics"];
  actions: Dictionary["common"]["actions"];
};

type PromptCardProps = {
  prompt: PromptRecord;
  priority?: boolean;
  labels: PromptCardLabels;
  keyword?: string;
};

export function PromptCard({ prompt, priority, labels, keyword }: PromptCardProps) {
  const coverUrl = isSafeImageUrl(prompt.cover) ? prompt.cover : "/placeholder.svg";
  const thumbUrl = prompt.coverThumb && isSafeImageUrl(prompt.coverThumb)
    ? prompt.coverThumb
    : coverUrl;
  const router = useRouter();
  const detailHref = `/prompts/${prompt.id}`;

  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest(".action-row, .prompt-thumb, .card-image-grid")) return;
      router.push(detailHref);
    },
    [router, detailHref]
  );

  const excerpt =
    prompt.excerpt.length > MAX_EXCERPT
      ? prompt.excerpt.slice(0, MAX_EXCERPT) + "…"
      : prompt.excerpt;

  // 获取安全的图片列表
  const safeImages = prompt.images
    .filter((img) => isSafeImageUrl(img.url))
    .slice(0, 9); // 最多显示9张，类似朋友圈

  const [thumbOffset, setThumbOffset] = useState({ x: 0, y: 0 });
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Lightbox 无障碍：触发元素引用，关闭后焦点回去；关闭按钮引用，打开后焦点过去。
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  // ESC 关闭 + 简易焦点陷阱（关闭按钮是 dialog 内唯一可聚焦元素，Tab 始终绕回它）。
  useEffect(() => {
    if (!lightboxSrc) return;

    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    // 把焦点送进 dialog
    closeButtonRef.current?.focus();

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setLightboxSrc(null);
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setLightboxIndex((prev) => (prev > 0 ? prev - 1 : safeImages.length - 1));
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setLightboxIndex((prev) => (prev < safeImages.length - 1 ? prev + 1 : 0));
        return;
      }
      if (event.key === "Tab") {
        // 焦点陷阱：dialog 里只有一个关闭按钮，Tab/Shift+Tab 都钉死在它身上。
        event.preventDefault();
        closeButtonRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      // 关闭后焦点还回触发元素，键盘用户不会丢上下文。
      const restoreTo = triggerRef.current ?? previouslyFocused;
      restoreTo?.focus?.();
    };
  }, [lightboxSrc, safeImages.length]);

  const handleThumbMove = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      setThumbOffset({ x: -nx * 12, y: -ny * 12 });
      setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    },
    []
  );

  const handleThumbLeave = useCallback(() => {
    setIsHovering(false);
    setThumbOffset({ x: 0, y: 0 });
  }, []);

  const handleThumbClick = useCallback(
    (imageUrl: string, imageIndex: number) => (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      e.preventDefault();
      triggerRef.current = e.currentTarget;
      setLightboxSrc(imageUrl);
      setLightboxIndex(imageIndex);
    },
    [setLightboxSrc]
  );

  const closeLabel = labels.actions.closeLightbox ?? "关闭预览";
  const lightboxTitleId = `lightbox-title-${prompt.id}`;

  // 根据图片数量决定布局
  const imageCount = safeImages.length;
  const shouldUseGrid = imageCount > 1;

  return (
    <>
      <div className="prompt-card-link" onClick={handleCardClick} role="article" style={{ cursor: "pointer" }}>
        <article className="prompt-card">
          {shouldUseGrid ? (
            // 多图网格布局
            <div className={`card-image-grid card-image-grid-${Math.min(imageCount, 9)}`}>
              {safeImages.map((image, index) => (
                <button
                  key={index}
                  type="button"
                  className="card-grid-item"
                  aria-label={`查看 ${prompt.title} 第 ${index + 1} 张图片`}
                  onClick={handleThumbClick(image.url, index)}
                >
                  <Image
                    alt={`${prompt.title} ${index + 1}`}
                    src={image.thumbUrl || image.url}
                    fill
                    sizes="(max-width: 720px) 25vw, 150px"
                    priority={priority && index < 4}
                    style={{ objectFit: "cover" }}
                  />
                </button>
              ))}
            </div>
          ) : (
            // 单图布局（保留原有交互效果）
            <button
              type="button"
              className="prompt-thumb"
              aria-label={closeLabel === "关闭预览" ? `查看 ${prompt.title} 大图` : `View ${prompt.title} preview`}
              onMouseEnter={() => setIsHovering(true)}
              onMouseMove={handleThumbMove}
              onMouseLeave={handleThumbLeave}
              onClick={handleThumbClick(coverUrl, 0)}
            >
              <Image
                alt={prompt.title}
                src={thumbUrl}
                fill
                sizes="(max-width: 720px) 50vw, 320px"
                priority={priority}
                style={{
                  objectFit: "cover",
                  transform: isHovering
                    ? `translate(${thumbOffset.x}px, ${thumbOffset.y}px) scale(1.05)`
                    : "translate(0, 0) scale(1)",
                  transition: isHovering ? "transform 0.15s ease-out" : "transform 0.4s ease-out"
                }}
              />
              <div
                className="thumb-cursor"
                style={{
                  left: cursorPos.x,
                  top: cursorPos.y,
                  opacity: isHovering ? 1 : 0
                }}
              />
            </button>
          )}
          <div className="card-kicker">[{prompt.modelLabel}] / ID {prompt.id}</div>
          <div className="card-kicker card-author">BY {prompt.author || "ANONYMOUS"}</div>
          <h3 className="prompt-title">
            <HighlightText keyword={keyword} text={prompt.title} />
          </h3>
          <p className="prompt-copy">
            <HighlightText keyword={keyword} text={excerpt} />
          </p>
          <div className="tag-row">
            {prompt.styleTags.map((tag) => (
              <span className="tag" key={tag}>
                {tag}
              </span>
            ))}
          </div>
          <div className="kpi-row">
            <span>
              {labels.metrics.like} {prompt.likes}
            </span>
            <span>
              {labels.metrics.collect} {prompt.collects}
            </span>
            <span>
              {labels.metrics.copy} {prompt.copies}
            </span>
          </div>
          <div className="kpi-row" style={{ marginTop: 2 }}>
            <span>{formatDateTime(prompt.createdAt)}</span>
          </div>
          <div className="action-row" onClick={(e) => e.stopPropagation()}>
            <Link className="micro-action" href={detailHref}>
              {labels.actions.openDossier}
            </Link>
            <CopyPromptButton
              labels={labels.actions}
              promptId={prompt.id}
              promptText={prompt.promptText}
            />
          </div>
        </article>
      </div>

      {lightboxSrc && (
        <div
          className="lightbox-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby={lightboxTitleId}
          onClick={() => setLightboxSrc(null)}
        >
          <span id={lightboxTitleId} className="sr-only">
            {prompt.title}
          </span>
          <button
            ref={closeButtonRef}
            type="button"
            className="lightbox-close"
            aria-label={closeLabel}
            onClick={(e) => {
              e.stopPropagation();
              setLightboxSrc(null);
            }}
          >
            ×
          </button>

          {safeImages.length > 1 && (
            <>
              <button
                type="button"
                className="lightbox-nav lightbox-nav-prev"
                aria-label="上一张"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((prev) => (prev > 0 ? prev - 1 : safeImages.length - 1));
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>

              <button
                type="button"
                className="lightbox-nav lightbox-nav-next"
                aria-label="下一张"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((prev) => (prev < safeImages.length - 1 ? prev + 1 : 0));
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>

              <div className="lightbox-counter">
                {lightboxIndex + 1} / {safeImages.length}
              </div>
            </>
          )}

          <div
            className="lightbox-image"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              alt={`${prompt.title} ${lightboxIndex + 1}`}
              src={safeImages[lightboxIndex]?.url || lightboxSrc}
              fill
              sizes="90vw"
              quality={90}
              style={{ objectFit: "contain" }}
            />
          </div>
        </div>
      )}
    </>
  );
}
