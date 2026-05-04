import { PromptCard } from "@/components/prompt-card";
import { SectionHeader } from "@/components/section-header";
import { Shell } from "@/components/shell";
import { models, prompts, searchHotTerms } from "@/lib/data";

export default function SearchPage() {
  return (
    <Shell activePath="/search">
      <main className="shell">
        <section className="page-grid two-col">
          <div className="section" data-unit="UNIT / SEARCH-01">
            <div className="eyebrow">[ PROMPT SEARCH / FILTER ARRAY ]</div>
            <h1 className="headline">
              SEARCH
              <br />
              FIELD
              <br />
              MATRIX
            </h1>
            <p className="lede">
              对齐 PRD 的搜索与筛选能力，当前页面结构已预留模型多选、风格、色调、用途和排序区块。
              实际接后端时可直接把筛选组件替换为真实查询参数。
            </p>
            <div className="action-row">
              <button className="action" type="button">
                EXECUTE QUERY
              </button>
              <button className="ghost-action" type="button">
                RESET FILTERS
              </button>
            </div>
          </div>
          <div className="section" data-unit="UNIT / SEARCH-02">
            <SectionHeader
              eyebrow="[ HOT KEYWORDS ]"
              title="LIVE TREND BUFFER"
              copy="热搜词和历史搜索词在 MVP 可先走静态配置，后续再接 Redis / Meilisearch 热度数据。"
            />
            <div className="card-list" style={{ marginTop: 18 }}>
              {searchHotTerms.map((term, index) => (
                <div className="telemetry-card" key={term}>
                  <div className="card-kicker">TERM / {index + 1}</div>
                  <div className="card-value">{term}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="matrix-grid page-grid" style={{ marginTop: 14 }}>
          <aside className="section filter-panel" data-unit="UNIT / FILTER-05">
            <SectionHeader
              eyebrow="[ FILTER CONFIG ]"
              title="QUERY PANEL"
              copy="左侧过滤器贴合需求文档的信息架构，偏终端化视觉，不搞软绵绵消费者 UI。"
            />
            <div className="filter-stack" style={{ marginTop: 18 }}>
              <div className="field">
                <label className="field-label" htmlFor="keyword">
                  KEYWORD / PROMPT TEXT + TAG + DESC
                </label>
                <input defaultValue="TACTICAL PORTRAIT" id="keyword" />
              </div>
              <div className="field">
                <span className="field-label">MODEL SELECT</span>
                <div className="tag-row">
                  {models.map((model, index) => (
                    <span
                      className={`tag ${index === 0 ? "danger" : ""}`}
                      key={model.id}
                    >
                      {model.displayName}
                    </span>
                  ))}
                </div>
              </div>
              <div className="field">
                <label className="field-label" htmlFor="style">
                  STYLE TYPE
                </label>
                <select defaultValue="CYBERPUNK" id="style">
                  <option>CYBERPUNK</option>
                  <option>REALISM</option>
                  <option>ANIME</option>
                  <option>MINIMAL</option>
                </select>
              </div>
              <div className="field">
                <label className="field-label" htmlFor="color">
                  COLOR TONE
                </label>
                <select defaultValue="COLD" id="color">
                  <option>COLD</option>
                  <option>WARM</option>
                  <option>BLACK / WHITE</option>
                  <option>FULL COLOR</option>
                </select>
              </div>
              <div className="field">
                <label className="field-label" htmlFor="usage">
                  USAGE SCENE
                </label>
                <select defaultValue="PORTRAIT" id="usage">
                  <option>PORTRAIT</option>
                  <option>LANDSCAPE</option>
                  <option>PRODUCT</option>
                  <option>UI MATERIAL</option>
                </select>
              </div>
              <div className="field">
                <label className="field-label" htmlFor="sort">
                  SORT MODE
                </label>
                <select defaultValue="HOT" id="sort">
                  <option>HOT</option>
                  <option>LATEST</option>
                  <option>MOST COLLECTED</option>
                  <option>MOST COPIED</option>
                </select>
              </div>
            </div>
          </aside>
          <div className="section" data-unit="UNIT / RESULT-08">
            <SectionHeader
              eyebrow="[ RESULT FEED ]"
              title="MATCHED DOSSIERS"
              copy="右侧结果区采用统一卡片语言，后续接分页或无限滚动时不用推翻结构。"
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
