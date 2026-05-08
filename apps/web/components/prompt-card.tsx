import Link from "next/link";

import type { PromptRecord } from "@/lib/data";

type PromptCardProps = {
  prompt: PromptRecord;
};

export function PromptCard({ prompt }: PromptCardProps) {
  return (
    <article className="prompt-card">
      <div className="prompt-thumb">
        <img alt={prompt.title} src={prompt.cover} />
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
        <span>LIKE {prompt.likes}</span>
        <span>COLLECT {prompt.collects}</span>
        <span>COPY {prompt.copies}</span>
      </div>
      <div className="action-row">
        <Link className="micro-action" href={`/prompts/${prompt.id}`}>
          OPEN DOSSIER
        </Link>
        <form action={`/api/prompts/${prompt.id}/copy`} method="post">
          <button className="ghost-action" type="submit">
            RECORD COPY
          </button>
        </form>
      </div>
    </article>
  );
}
