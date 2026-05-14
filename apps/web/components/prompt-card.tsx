"use client";

import Link from "next/link";
import { useState, useCallback } from "react";

import { CopyPromptButton } from "@/components/copy-prompt-button";
import type { PromptRecord } from "@/lib/data";
import { getDictionary } from "@/lib/i18n";

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

type PromptCardProps = {
  prompt: PromptRecord;
  priority?: boolean;
};

export function PromptCard({ prompt, priority }: PromptCardProps) {
  const dict = getDictionary();

  const excerpt =
    prompt.excerpt.length > MAX_EXCERPT
      ? prompt.excerpt.slice(0, MAX_EXCERPT) + "…"
      : prompt.excerpt;

  const [thumbOffset, setThumbOffset] = useState({ x: 0, y: 0 });
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const handleThumbMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
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
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setLightboxSrc(prompt.cover);
    },
    [prompt.cover]
  );

  return (
    <>
      <Link className="prompt-card-link" href={`/prompts/${prompt.id}`}>
        <article className="prompt-card">
          <div
            className="prompt-thumb"
            onMouseEnter={() => setIsHovering(true)}
            onMouseMove={handleThumbMove}
            onMouseLeave={handleThumbLeave}
            onClick={handleThumbClick}
          >
            <img
              alt={prompt.title}
              src={prompt.cover}
              decoding="async"
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : "low"}
              style={{
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
          </div>
          <div className="card-kicker">[{prompt.modelLabel}] / ID {prompt.id}</div>
          <div className="card-kicker card-author">BY {prompt.author || "ANONYMOUS"}</div>
          <h3 className="prompt-title">{prompt.title}</h3>
          <p className="prompt-copy">{excerpt}</p>
          <div className="tag-row">
            {prompt.styleTags.map((tag) => (
              <span className="tag" key={tag}>
                {tag}
              </span>
            ))}
          </div>
          <div className="kpi-row">
            <span>
              {dict.common.metrics.like} {prompt.likes}
            </span>
            <span>
              {dict.common.metrics.collect} {prompt.collects}
            </span>
            <span>
              {dict.common.metrics.copy} {prompt.copies}
            </span>
          </div>
          <div className="kpi-row" style={{ marginTop: 2 }}>
            <span>{formatDateTime(prompt.createdAt)}</span>
          </div>
          <div className="action-row" onClick={(e) => e.stopPropagation()}>
            <Link className="micro-action" href={`/prompts/${prompt.id}`}>
              {dict.common.actions.openDossier}
            </Link>
            <CopyPromptButton
              labels={dict.common.actions}
              promptId={prompt.id}
              promptText={prompt.promptText}
            />
          </div>
        </article>
      </Link>

      {lightboxSrc && (
        <div className="lightbox-overlay" onClick={() => setLightboxSrc(null)}>
          <img className="lightbox-image" alt="" src={lightboxSrc} />
        </div>
      )}
    </>
  );
}
