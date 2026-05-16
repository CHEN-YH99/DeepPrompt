import Link from "next/link";

import { SectionHeader } from "@/components/section-header";
import { fetchModels, fetchPromptRecords } from "@/lib/data";
import { getDictionary } from "@/lib/i18n";

export default async function ModelsIndexPage() {
  const dict = getDictionary();
  const [models, promptRecords] = await Promise.all([fetchModels(), fetchPromptRecords()]);

  return (
    <main className="shell">
      <section className="page-grid two-col">
        <div className="section" data-unit="UNIT / MODEL-01">
          <div className="eyebrow">{dict.models.indexKicker}</div>
          <h1 className="headline">
            {dict.models.indexTitleLine1}
            <br />
            {dict.models.indexTitleLine2}
            <br />
            {dict.models.indexTitleLine3}
          </h1>
          <p className="lede">{dict.models.indexLede}</p>
        </div>
        <div className="section" data-unit="UNIT / MODEL-02">
          <SectionHeader
            eyebrow={dict.models.metricsEyebrow}
            title={dict.models.metricsTitle}
            copy={dict.models.metricsCopy}
          />
          <div className="stats-grid" style={{ marginTop: 18 }}>
            <div className="stat-card">
              <div className="stat-label">{dict.models.activeModels}</div>
              <div className="stat-value">{models.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">{dict.models.approvedPrompts}</div>
              <div className="stat-value">{promptRecords.length || "—"}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">{dict.models.negativeSupport}</div>
              <div className="stat-value">
                {models.filter((model) => model.supportsNegative).length}/{models.length}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="page-grid" style={{ marginTop: 14 }}>
        <div className="section" data-unit="UNIT / MODEL-LIST">
          <SectionHeader
            eyebrow={dict.models.listEyebrow}
            title={dict.models.listTitle}
            copy={dict.models.listCopy}
          />
          <div className="info-grid" style={{ marginTop: 18 }}>
            {models.map((model) => {
              const promptCount = promptRecords.filter((prompt) =>
                prompt.modelIds.includes(model.id)
              ).length;
              return (
                <Link className="model-tile" href={`/models/${model.id}`} key={model.id}>
                  <div className="card-kicker">{model.vendor}</div>
                  <div className="card-value">{model.displayName}</div>
                  <p className="mono-copy">
                    {dict.models.cardFormat} / {model.format.toUpperCase()} ·{" "}
                    {dict.models.cardNegative} /{" "}
                    {model.supportsNegative ? dict.home.negativeOn : dict.home.negativeOff} ·{" "}
                    {dict.models.cardParams} / {model.paramSchema.length}
                  </p>
                  <div className="tag-row">
                    {model.featureTags.map((tag) => (
                      <span className="tag" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="mono-copy">
                    {dict.models.cardPrompts} / {promptCount}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
