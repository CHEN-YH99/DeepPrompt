import { PromptCard } from "@/components/prompt-card";
import { SectionHeader } from "@/components/section-header";
import { Shell } from "@/components/shell";
import {
  featuredPrompt,
  fetchModels,
  fetchPromptRecords,
  searchHotTerms
} from "@/lib/data";
import { getDictionary } from "@/lib/i18n";

export const revalidate = 60;

export default async function HomePage() {
  const dict = getDictionary();
  const [modelRecords, promptRecords] = await Promise.all([
    fetchModels(),
    fetchPromptRecords()
  ]);
  const featured = promptRecords[0] ?? featuredPrompt;

  return (
    <Shell activePath="/">
      <main className="shell">
        <section className="page-grid two-col">
          <div className="section" data-unit="UNIT / HERO-01">
            <div className="eyebrow">{dict.home.heroKicker}</div>
            <h1 className="headline headline-tight">
              {dict.home.heroTitleLine1}
              <br />
              {dict.home.heroTitleLine2}
              <br />
              {dict.home.heroTitleLine3}
            </h1>
            <p className="lede">{dict.home.heroLede}</p>
            <div className="ascii-rule">{dict.home.heroAsciiRule}</div>
            <div className="action-row">
              <a className="action" href="/publish">
                {dict.home.heroPrimary}
              </a>
              <a className="ghost-action" href="/search">
                {dict.home.heroSecondary}
              </a>
            </div>
            <div className="stats-grid" style={{ marginTop: 20 }}>
              <div className="stat-card">
                <div className="stat-label">{dict.home.statsSupportedModels}</div>
                <div className="stat-value">{modelRecords.length.toString().padStart(2, "0")}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">{dict.home.statsPromptUnits}</div>
                <div className="stat-value">{promptRecords.length || "500+"}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">{dict.home.statsTargetLcp}</div>
                <div className="stat-value">{dict.home.statsTargetLcpValue}</div>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="crosshair" />
            <div className="hero-meta">
              <div className="cell">
                <div className="mini-label">{dict.home.visualFeatureId}</div>
                <div className="card-value">{featured.id}</div>
              </div>
              <div className="cell">
                <div className="mini-label">{dict.home.visualPrimaryModel}</div>
                <div className="card-value">{featured.modelLabel}</div>
              </div>
              <div className="cell">
                <div className="mini-label">{dict.home.visualAuthorUnit}</div>
                <div className="card-value">{featured.author}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="page-grid" style={{ marginTop: 14 }}>
          <div className="section" data-unit="UNIT / OPS-04">
            <SectionHeader
              eyebrow={dict.home.gatesEyebrow}
              title={dict.home.gatesTitle}
              copy={dict.home.gatesCopy}
            />
            <div className="panel-grid" style={{ marginTop: 18 }}>
              {dict.home.milestones.map((item) => (
                <div className="telemetry-card" key={item.stage}>
                  <div className="card-kicker">{item.stage}</div>
                  <div className="card-value">{item.title}</div>
                  <p className="mono-copy">{item.summary}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="page-grid two-col" style={{ marginTop: 14 }}>
          <div className="section" data-unit="UNIT / LIB-02">
            <SectionHeader
              eyebrow={dict.home.registryEyebrow}
              title={dict.home.registryTitle}
              copy={dict.home.registryCopy}
            />
            <div className="info-grid" style={{ marginTop: 18 }}>
              {modelRecords.map((model) => (
                <div className="info-card" key={model.id}>
                  <div className="card-kicker">{model.vendor}</div>
                  <div className="card-value">{model.displayName}</div>
                  <p className="mono-copy">
                    {dict.home.registryFormat} / {model.format.toUpperCase()} ·{" "}
                    {dict.home.registryNegative} /{" "}
                    {model.supportsNegative ? dict.home.negativeOn : dict.home.negativeOff}
                  </p>
                  <div className="tag-row">
                    {model.featureTags.map((tag) => (
                      <span className="tag" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="section" data-unit="UNIT / RAD-09">
            <SectionHeader
              eyebrow={dict.home.hotEyebrow}
              title={dict.home.hotTitle}
              copy={dict.home.hotCopy}
            />
            <div className="card-list" style={{ marginTop: 18 }}>
              {searchHotTerms.map((term, index) => (
                <div className="telemetry-card" key={term}>
                  <div className="split-row" style={{ justifyContent: "space-between" }}>
                    <span className="card-kicker">
                      {dict.home.hotRank} {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="card-kicker">{dict.home.hotLoad}</span>
                  </div>
                  <div className="card-value">{term}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="page-grid" style={{ marginTop: 14 }}>
          <div className="section" data-unit="UNIT / FEED-11">
            <SectionHeader
              eyebrow={dict.home.feedEyebrow}
              title={dict.home.feedTitle}
              copy={dict.home.feedCopy}
            />
            <div className="prompt-grid" style={{ marginTop: 18 }}>
              {promptRecords.map((prompt, index) => (
                <PromptCard key={prompt.id} prompt={prompt} priority={index < 2} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </Shell>
  );
}
