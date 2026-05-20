import type { ReactNode } from "react";

type HighlightTextProps = {
  text: string;
  keyword?: string;
};

export function HighlightText({ text, keyword }: HighlightTextProps): ReactNode {
  if (!keyword || !keyword.trim()) return text;

  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);

  if (parts.length === 1) return text;

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark className="search-highlight" key={i}>
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}
