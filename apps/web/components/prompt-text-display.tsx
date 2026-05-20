"use client";

import { useState } from "react";

type PromptTextDisplayProps = {
  text: string;
  expandLabel?: string;
  collapseLabel?: string;
};

const COLLAPSE_THRESHOLD = 6;

// 识别常见 AI prompt 语法：
// --param value (Midjourney/CLI 风格)
// (text:0.8) 或 [text:0.8] (SD 权重)
// <lora:xxx:0.8> (LoRA)
// {a|b|c} (随机选择)
// BREAK / AND (分隔关键词)
const PARAM_PATTERN =
  /(--\w+(?:\s+[\w./:]+)?|\([^()]+:[\d.]+\)|\[[^\[\]]+:[\d.]+\]|<[^<>]+>|\{[^{}]+\})/g;

const KEYWORD_PATTERN = /\b(BREAK|AND|NOT)\b/g;

function highlightLine(line: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let lastIdx = 0;
  let key = 0;

  // 先按参数语法切分
  line.replace(PARAM_PATTERN, (match, _g1, offset: number) => {
    if (offset > lastIdx) {
      const plain = line.slice(lastIdx, offset);
      out.push(...renderKeywords(plain, key));
      key += 100;
    }
    out.push(
      <span className="prompt-param" key={`p-${key++}`}>
        {match}
      </span>
    );
    lastIdx = offset + match.length;
    return match;
  });

  if (lastIdx < line.length) {
    out.push(...renderKeywords(line.slice(lastIdx), key));
  }
  return out;
}

function renderKeywords(text: string, baseKey: number): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let lastIdx = 0;
  let key = 0;

  text.replace(KEYWORD_PATTERN, (match, _g1, offset: number) => {
    if (offset > lastIdx) {
      out.push(
        <span key={`t-${baseKey}-${key++}`}>{text.slice(lastIdx, offset)}</span>
      );
    }
    out.push(
      <span className="prompt-keyword" key={`k-${baseKey}-${key++}`}>
        {match}
      </span>
    );
    lastIdx = offset + match.length;
    return match;
  });

  if (lastIdx < text.length) {
    out.push(
      <span key={`t-${baseKey}-${key++}`}>{text.slice(lastIdx)}</span>
    );
  }
  return out;
}

export function PromptTextDisplay({
  text,
  expandLabel = "展开全文",
  collapseLabel = "收起"
}: PromptTextDisplayProps) {
  const [expanded, setExpanded] = useState(false);

  const lines = text.split(/\r?\n/);
  const isLong = lines.length > COLLAPSE_THRESHOLD;
  const visibleLines = expanded || !isLong ? lines : lines.slice(0, COLLAPSE_THRESHOLD);

  return (
    <div className="prompt-text-display">
      <pre className="prompt-text-content">
        {visibleLines.map((line, i) => (
          <span key={i}>
            {highlightLine(line)}
            {i < visibleLines.length - 1 && "\n"}
          </span>
        ))}
        {!expanded && isLong && <span className="prompt-text-fade">…</span>}
      </pre>
      {isLong && (
        <button
          type="button"
          className="prompt-text-toggle"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? collapseLabel : `${expandLabel}（${lines.length} 行）`}
        </button>
      )}
    </div>
  );
}
