import { Shell } from "@/components/shell";
import { getPromptById, prompts } from "@/lib/data";

type PromptDetailPageProps = {
  params: {
    id: string;
  };
};

export function generateStaticParams() {
  return prompts.map((prompt) => ({
    id: prompt.id
  }));
}

export default function PromptDetailPage({ params }: PromptDetailPageProps) {
  const prompt = getPromptById(params.id);
  const relatedPrompts = prompts.filter((item) => item.id !== prompt.id).slice(0, 2);

  return (
    <Shell activePath="">
      <main className="shell">
        <section className="page-grid">
          <div className="section" data-unit="UNIT / DETAIL-01">
            <div className="eyebrow">[ PROMPT DOSSIER / {prompt.id} ]</div>
            <h1 className="headline">{prompt.title}</h1>
            <p className="lede">{prompt.excerpt}</p>
            <div className="action-row">
              <button className="action" type="button">
                COPY PROMPT
              </button>
              <button className="ghost-action" type="button">
                OPEN MODEL LINK
              </button>
              <button className="ghost-action" type="button">
                REPORT ENTRY
              </button>
            </div>
          </div>
        </section>

        <section className="detail-grid page-grid" style={{ marginTop: 14 }}>
          <div className="section media-panel" data-unit="UNIT / MEDIA-11">
            <div className="prompt-thumb" style={{ minHeight: 560 }}>
              <img alt={prompt.title} src={prompt.cover} />
            </div>
            <div className="metric-board" style={{ marginTop: 16 }}>
              <div>
                <div className="mini-label">LIKE COUNT</div>
                <div className="card-value">{prompt.likes}</div>
              </div>
              <div>
                <div className="mini-label">COLLECT COUNT</div>
                <div className="card-value">{prompt.collects}</div>
              </div>
              <div>
                <div className="mini-label">COPY COUNT</div>
                <div className="card-value">{prompt.copies}</div>
              </div>
              <div>
                <div className="mini-label">STATUS</div>
                <div className="card-value">{prompt.status}</div>
              </div>
            </div>
          </div>
          <div className="section detail-panel" data-unit="UNIT / META-04">
            <div className="detail-stack">
              <div>
                <div className="field-label">PRIMARY MODEL</div>
                <div className="card-value">{prompt.modelLabel}</div>
              </div>
              <div>
                <div className="field-label">PROMPT TEXT</div>
                <p className="detail-copy">{prompt.promptText}</p>
              </div>
              {prompt.negativePrompt ? (
                <div>
                  <div className="field-label">NEGATIVE PROMPT</div>
                  <p className="detail-copy">{prompt.negativePrompt}</p>
                </div>
              ) : null}
              <div>
                <div className="field-label">PARAMETERS</div>
                <div className="tag-row">
                  {prompt.params.map((param) => (
                    <span className="tag" key={param}>
                      {param}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="field-label">STYLE TAGS</div>
                <div className="tag-row">
                  {prompt.styleTags.map((tag) => (
                    <span className="tag" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="field-label">USAGE NOTE</div>
                <p className="detail-copy">{prompt.note}</p>
              </div>
              <div>
                <div className="field-label">AUTHOR / TIME</div>
                <p className="detail-copy">
                  {prompt.author} / {prompt.createdAt}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="page-grid" style={{ marginTop: 14 }}>
          <div className="section" data-unit="UNIT / LINK-17">
            <div className="eyebrow">[ RELATED DOSSIERS ]</div>
            <div className="library-grid">
              {relatedPrompts.map((item) => (
                <div className="library-card" key={item.id}>
                  <div className="card-kicker">{item.modelLabel}</div>
                  <div className="card-value">{item.title}</div>
                  <p className="mono-copy">{item.excerpt}</p>
                  <a className="micro-action" href={`/prompts/${item.id}`}>
                    OPEN RELATED ENTRY
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </Shell>
  );
}
