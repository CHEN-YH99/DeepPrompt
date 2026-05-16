import Link from "next/link";
import { notFound } from "next/navigation";

import { PromptCard } from "@/components/prompt-card";
import { SectionHeader } from "@/components/section-header";
import { fetchModelDetail, fetchPromptRecords } from "@/lib/data";
import { applyVars, getDictionary } from "@/lib/i18n";

type ModelDetailPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function ModelDetailPage({ params }: ModelDetailPageProps) {
  const dict = getDictionary();
  const { id } = await params;
  const [model, promptRecords] = await Promise.all([
    fetchModelDetail(id),
    fetchPromptRecords({ modelIds: [id], sort: "latest", limit: 24 })
  ]);

  if (!model) {
    notFound();
  }

  return (
    <main className="shell">
      <section className="page-grid two-col">
        <div className="section" data-unit="UNIT / MODEL-HERO">
          <div className="eyebrow">{applyVars(dict.models.detailKicker, { id: model.id })}</div>
          <h1 className="headline">{model.displayName}</h1>
          <p className="lede">
            {dict.models.detailVendor} / {model.vendor} · {dict.models.detailFormat} /{" "}
            {model.format.toUpperCase()} · {dict.models.detailNegative} /{" "}
            {model.supportsNegative ? dict.home.negativeOn : dict.home.negativeOff}
          </p>
          <div className="tag-row" style={{ marginTop: 14 }}>
            {model.featureTags.map((tag) => (
              <span className="tag" key={tag}>
                {tag}
              </span>
            ))}
          </div>
          <div className="action-row" style={{ marginTop: 16 }}>
            <Link className="action" href={`/search?model_ids=${encodeURIComponent(model.id)}`}>
              {dict.models.detailSearchInModel}
            </Link>
            <Link className="ghost-action" href="/models">
              {dict.models.detailBackToRegistry}
            </Link>
            {model.officialUrl ? (
              <a className="ghost-action" href={model.officialUrl} rel="noreferrer" target="_blank">
                {dict.models.detailOfficialSite}
              </a>
            ) : null}
          </div>
        </div>

        <div className="section" data-unit="UNIT / MODEL-PARAM">
          <SectionHeader
            eyebrow={dict.models.paramEyebrow}
            title={dict.models.paramTitle}
            copy={dict.models.paramCopy}
          />
          {model.paramSchema.length === 0 ? (
            <p className="mono-copy" style={{ marginTop: 18 }}>
              {dict.models.paramNoSchema}
            </p>
          ) : (
            <div className="list-stack" style={{ marginTop: 18 }}>
              {model.paramSchema.map((field) => (
                <div className="telemetry-card" key={field.key}>
                  <div className="card-kicker">
                    {dict.models.paramKey} / {field.key.toUpperCase()} · {dict.models.paramType} /{" "}
                    {field.input_type.toUpperCase()}
                  </div>
                  <div className="card-value">{field.label}</div>
                  {field.help_text ? <p className="mono-copy">{field.help_text}</p> : null}
                  {field.options && field.options.length > 0 ? (
                    <div className="tag-row" style={{ marginTop: 6 }}>
                      {field.options.map((option) => (
                        <span className="tag" key={option.value}>
                          {option.label}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {field.default_value !== undefined ? (
                    <p className="mono-copy">
                      {dict.models.paramDefault} / {String(field.default_value)}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="page-grid" style={{ marginTop: 14 }}>
        <div className="section" data-unit="UNIT / MODEL-FEED">
          <SectionHeader
            eyebrow={dict.models.feedEyebrow}
            title={dict.models.feedTitle}
            copy={applyVars(dict.models.feedCopy, { count: promptRecords.length })}
          />
          {promptRecords.length === 0 ? (
            <p className="mono-copy" style={{ marginTop: 18 }}>
              {dict.models.feedEmpty}
            </p>
          ) : (
            <div className="prompt-grid" style={{ marginTop: 18 }}>
              {promptRecords.map((prompt) => (
                <PromptCard key={prompt.id} prompt={prompt} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
