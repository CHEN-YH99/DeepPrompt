"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { isSafeImageUrl } from "@/lib/safe-url";

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
    () => images.filter((image) => isSafeImageUrl(image.url)),
    [images]
  );
  const [activeIndex, setActiveIndex] = useState(0);

  const activeImage = safeImages[activeIndex] ?? safeImages[0];
  if (!activeImage) {
    return null;
  }

  return (
    <div className="gallery-stack">
      <div className="prompt-thumb gallery-main">
        <Image
          alt={title}
          src={activeImage.url}
          fill
          sizes="(max-width: 720px) 100vw, 720px"
          priority
          style={{ objectFit: "cover" }}
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
              <Image
                alt={`${title} ${index + 1}`}
                src={image.thumbUrl ?? image.url}
                fill
                sizes="100px"
                style={{ objectFit: "cover" }}
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

