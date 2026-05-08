import { PromptCard } from "@/components/prompt-card";
import { SectionHeader } from "@/components/section-header";
import { Shell } from "@/components/shell";
import { fetchModels, fetchPromptRecords, searchHotTerms } from "@/lib/data";

type SearchPageProps = {
  searchParams?: Promise<{
    q?: string;
    model_id?: string;
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const keyword = resolvedSearchParams.q ?? "";
  const selectedModel = resolvedSearchParams.model_id ?? "";
  const [models, promptRecords] = await Promise.all([
    fetchModels(),
    fetchPromptRecords({
      q: keyword,
      modelId: selectedModel
    })
  ]);

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
              对齐 PRD 的搜索与筛选能力，当前已接入后端 Prompt 列表接口，支持关键词与模型筛选。
            </p>
            <div className="action-row">
              <a className="action" href="#query-panel">
                EXECUTE QUERY
              </a>
              <a className="ghost-action" href="/search">
                RESET FILTERS
              </a>
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
              copy="MVP 先打通关键词和模型筛选，风格 / 色调 / 用途保留结构位。"
            />
            <form className="filter-stack" id="query-panel" style={{ marginTop: 18 }}>
              <div className="field">
                <label className="field-label" htmlFor="keyword">
                  KEYWORD / PROMPT TEXT + TAG + DESC
                </label>
                <input defaultValue={keyword} id="keyword" name="q" />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="model_id">
                  MODEL SELECT
                </label>
                <select defaultValue={selectedModel} id="model_id" name="model_id">
                  <option value="">ALL MODELS</option>
                  {models.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.displayName}
                    </option>
                  ))}
                </select>
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
              <button className="action" type="submit">
                EXECUTE QUERY
              </button>
            </form>
          </aside>
          <div className="section" data-unit="UNIT / RESULT-08">
            <SectionHeader
              eyebrow="[ RESULT FEED ]"
              title="MATCHED DOSSIERS"
              copy={`当前匹配 ${promptRecords.length} 条 Prompt。`}
            />
            <div className="prompt-grid" style={{ marginTop: 18 }}>
              {promptRecords.map((prompt) => (
                <PromptCard key={prompt.id} prompt={prompt} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </Shell>
  );
}
