"use client";

import { useMemo, useState } from "react";

type PromptGalleryImage = {
  url: string;
  thumbUrl?: string | null;
};

type PromptGalleryProps = {
  title: string;
  images: PromptGalleryImage[];
};

export function PromptGallery({ title, images }: PromptGalleryProps) {
  const safeImages = useMemo(
    () => images.filter((image) => image.url.trim().length > 0),
    [images]
  );
  const [activeIndex, setActiveIndex] = useState(0);

  const activeImage = safeImages[activeIndex] ?? safeImages[0];
  if (!activeImage) {
    return null;
  }

  return (
    <div className="gallery-stack">
      <div className="prompt-thumb gallery-main" style={{ minHeight: 560 }}>
        <img
          alt={title}
          src={activeImage.url}
          decoding="async"
          loading="eager"
          fetchPriority="high"
        />
      </div>
      {safeImages.length > 1 ? (
        <div className="gallery-strip">
          {safeImages.map((image, index) => (
            <button
              className="gallery-thumb"
              data-active={index === activeIndex}
              key={`${image.url}-${index}`}
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              <img
                alt={`${title} ${index + 1}`}
                src={image.thumbUrl ?? image.url}
                decoding="async"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
