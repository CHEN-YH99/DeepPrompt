import Link from "next/link";

import { CopyPromptButton } from "@/components/copy-prompt-button";
import type { PromptRecord } from "@/lib/data";
import { getDictionary } from "@/lib/i18n";

type PromptCardProps = {
  prompt: PromptRecord;
  priority?: boolean;
};

export function PromptCard({ prompt, priority }: PromptCardProps) {
  const dict = getDictionary();
  return (
    <article className="prompt-card">
      <div className="prompt-thumb">
        <img
          alt={prompt.title}
          src={prompt.cover}
          decoding="async"
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "low"}
        />
      </div>
      <div className="card-kicker">[{prompt.modelLabel}] / ID {prompt.id}</div>
      <h3 className="prompt-title">{prompt.title}</h3>
      <p className="prompt-copy">{prompt.excerpt}</p>
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
      <div className="action-row">
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
  );
}
