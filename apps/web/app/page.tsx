import { PromptCard } from "@/components/prompt-card";
import { SectionHeader } from "@/components/section-header";
import { Shell } from "@/components/shell";
import {
  featuredPrompt,
  models,
  prompts,
  searchHotTerms,
  systemMilestones
} from "@/lib/data";

export default function HomePage() {
  return (
    <Shell activePath="/">
      <main className="shell">
        <section className="page-grid two-col">
          <div className="section" data-unit="UNIT / HERO-01">
            <div className="eyebrow">[ TODAY&apos;S FEATURED PROMPT ]</div>
            <h1 className="headline headline-tight">
              TACTICAL
              <br />
              PROMPT
              <br />
              ARCHIVE
            </h1>
            <p className="lede">
              DeepPrompt 是一个面向 AI 生图创作者的提示词资料库与社区平台。当前前端按
              PRD / TDD 的 MVP 链路重建，优先覆盖浏览、搜索、发布、详情与个人管理核心路径。
            </p>
            <div className="ascii-rule">
              /// MODEL-AGNOSTIC / RIGID GRID / SEARCHABLE DOSSIER / COPY-READY /
              REVIEW-READY ///
            </div>
            <div className="action-row">
              <a className="action" href="/publish">
                OPEN PUBLISH FLOW
              </a>
              <a className="ghost-action" href="/search">
                SCAN HOT LIBRARY
              </a>
            </div>
            <div className="stats-grid" style={{ marginTop: 20 }}>
              <div className="stat-card">
                <div className="stat-label">SUPPORTED MODELS</div>
                <div className="stat-value">03</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">PROMPT UNITS</div>
                <div className="stat-value">500+</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">TARGET LCP</div>
                <div className="stat-value">&lt;2S</div>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="crosshair" />
            <div className="hero-meta">
              <div className="cell">
                <div className="mini-label">FEATURE ID</div>
                <div className="card-value">{featuredPrompt.id}</div>
              </div>
              <div className="cell">
                <div className="mini-label">PRIMARY MODEL</div>
                <div className="card-value">{featuredPrompt.modelLabel}</div>
              </div>
              <div className="cell">
                <div className="mini-label">AUTHOR UNIT</div>
                <div className="card-value">{featuredPrompt.author}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="page-grid" style={{ marginTop: 14 }}>
          <div className="section" data-unit="UNIT / OPS-04">
            <SectionHeader
              eyebrow="[ PROJECT STATUS / DEVELOPMENT GATES ]"
              title="DEVELOPMENT CYCLE / GATE CHECK"
              copy="基于需求文档、技术实现文档和开发周期闯关文档，当前应优先保证工程源码可复现、MVP 链路可运行、Model Registry 可驱动页面。"
            />
            <div className="panel-grid" style={{ marginTop: 18 }}>
              {systemMilestones.map((item) => (
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
              eyebrow="[ MODEL REGISTRY / ACTIVE ]"
              title="SUPPORTED ENGINES"
              copy="MVP 阶段聚焦 3 大模型，页面筛选、发布表单和详情标签都围绕注册表配置驱动。"
            />
            <div className="info-grid" style={{ marginTop: 18 }}>
              {models.map((model) => (
                <div className="info-card" key={model.id}>
                  <div className="card-kicker">{model.vendor}</div>
                  <div className="card-value">{model.displayName}</div>
                  <p className="mono-copy">
                    FORMAT / {model.format} / NEGATIVE /{" "}
                    {model.supportsNegative ? "ON" : "OFF"}
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
              eyebrow="[ HOT SEARCH / TERMINAL FEED ]"
              title="TREND SCAN"
              copy="搜索页目标支持全文关键词、模型多选、风格类型、颜色基调、用途场景与排序方式。"
            />
            <div className="card-list" style={{ marginTop: 18 }}>
              {searchHotTerms.map((term, index) => (
                <div className="telemetry-card" key={term}>
                  <div className="split-row" style={{ justifyContent: "space-between" }}>
                    <span className="card-kicker">RANK / 0{index + 1}</span>
                    <span className="card-kicker">QUERY LOAD / HIGH</span>
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
              eyebrow="[ PROMPT LIBRARY / LATEST + TRENDING ]"
              title="PROMPT DOSSIER WALL"
              copy="首页采用高密度卡片矩阵，兼顾精选、热门趋势与最新上传。后续可再接 Masonry 和无限滚动。"
            />
            <div className="prompt-grid" style={{ marginTop: 18 }}>
              {prompts.map((prompt) => (
                <PromptCard key={prompt.id} prompt={prompt} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </Shell>
  );
}
