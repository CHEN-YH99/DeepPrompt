import Link from "next/link";

import { PromptCard } from "@/components/prompt-card";
import { SectionHeader } from "@/components/section-header";
import { Shell } from "@/components/shell";
import {
  SEARCH_SORT_OPTIONS,
  fetchModels,
  fetchPromptList,
  searchHotTerms
} from "@/lib/data";
import type { SearchSort } from "@deepprompt/types";

type SearchPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const STYLE_OPTIONS = [
  "REALISM",
  "CYBERPUNK",
  "ANIME",
  "MINIMAL",
  "EDITORIAL",
  "INTERIOR",
  "PRODUCT",
  "BRUTALIST",
  "STUDIO",
  "FILM GRAIN",
  "DENSE UI",
  "TERMINAL"
];

const COLOR_OPTIONS = ["COLD", "WARM", "MONO", "BLACK", "WHITE", "RED", "GREEN", "RED SHIFT"];

const USAGE_OPTIONS = ["PORTRAIT", "LANDSCAPE", "PRODUCT", "UI", "CONCEPT ART", "AD", "COVER", "KEY VISUAL"];

function pickList(value: string | string[] | undefined): string[] {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => item.split(","))
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function pickSort(value: string | string[] | undefined): SearchSort {
  const candidate = Array.isArray(value) ? value[0] : value;
  const allowed = SEARCH_SORT_OPTIONS.map((option) => option.value);
  return (allowed as string[]).includes(candidate ?? "") ? (candidate as SearchSort) : "latest";
}

function pickKeyword(value: string | string[] | undefined): string {
  if (!value) return "";
  return Array.isArray(value) ? (value[0] ?? "") : value;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolved = (searchParams ? await searchParams : {}) ?? {};
  const keyword = pickKeyword(resolved.q);
  const selectedModelIds = pickList(resolved.model_ids).concat(pickList(resolved.model_id));
  const selectedStyleTags = pickList(resolved.style_tags);
  const selectedColorTags = pickList(resolved.color_tags);
  const selectedUsageTags = pickList(resolved.usage_tags);
  const sort = pickSort(resolved.sort);

  const [models, snapshot] = await Promise.all([
    fetchModels(),
    fetchPromptList({
      q: keyword,
      modelIds: selectedModelIds,
      styleTags: selectedStyleTags,
      colorTags: selectedColorTags,
      usageTags: selectedUsageTags,
      sort
    })
  ]);

  const facets = snapshot.meta?.facets;
  const totalLabel = snapshot.meta ? `${snapshot.meta.total} HITS / ${snapshot.meta.tookMs}MS` : `${snapshot.items.length} HITS`;
  const styleOptions = (facets?.styleTags.map((bucket) => bucket.value) ?? []).concat(
    STYLE_OPTIONS.filter((option) => !facets?.styleTags.some((bucket) => bucket.value === option))
  );
  const colorOptions = (facets?.colorTags.map((bucket) => bucket.value) ?? []).concat(
    COLOR_OPTIONS.filter((option) => !facets?.colorTags.some((bucket) => bucket.value === option))
  );
  const usageOptions = (facets?.usageTags.map((bucket) => bucket.value) ?? []).concat(
    USAGE_OPTIONS.filter((option) => !facets?.usageTags.some((bucket) => bucket.value === option))
  );

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
              对齐 PRD 的搜索与筛选能力，关键词走 PostgreSQL 全文检索，模型、风格、色调、用途、排序全部联动并写回 URL。
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
              copy="MVP 阶段热搜词先走静态配置，后续切到 Redis 排行榜。"
            />
            <div className="card-list" style={{ marginTop: 18 }}>
              {searchHotTerms.map((term, index) => (
                <Link
                  className="telemetry-card"
                  href={`/search?q=${encodeURIComponent(term)}`}
                  key={term}
                  style={{ display: "block" }}
                >
                  <div className="card-kicker">TERM / {index + 1}</div>
                  <div className="card-value">{term}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="matrix-grid page-grid" style={{ marginTop: 14 }}>
          <aside className="section filter-panel" data-unit="UNIT / FILTER-05">
            <SectionHeader
              eyebrow="[ FILTER CONFIG ]"
              title="QUERY PANEL"
              copy="模型来自 model_registry，标签维度由后端 facet 聚合返回，多选 + 排序联动。"
            />
            <form className="filter-stack" id="query-panel" method="get" style={{ marginTop: 18 }}>
              <div className="field">
                <label className="field-label" htmlFor="keyword">
                  KEYWORD / TITLE + PROMPT + TAG
                </label>
                <input defaultValue={keyword} id="keyword" name="q" />
              </div>

              <div className="field">
                <div className="field-label">MODEL REGISTRY</div>
                <div className="checkbox-grid">
                  {models.map((model) => {
                    const facetCount = facets?.modelIds.find((bucket) => bucket.value === model.id)?.count;
                    return (
                      <label className="checkbox-item" key={model.id}>
                        <input
                          defaultChecked={selectedModelIds.includes(model.id)}
                          name="model_ids"
                          type="checkbox"
                          value={model.id}
                        />
                        <span>
                          {model.displayName}
                          {typeof facetCount === "number" ? ` (${facetCount})` : ""}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="field">
                <div className="field-label">STYLE TAGS</div>
                <div className="checkbox-grid">
                  {styleOptions.slice(0, 10).map((option) => {
                    const bucket = facets?.styleTags.find((item) => item.value === option);
                    return (
                      <label className="checkbox-item" key={option}>
                        <input
                          defaultChecked={selectedStyleTags.includes(option)}
                          name="style_tags"
                          type="checkbox"
                          value={option}
                        />
                        <span>
                          {option}
                          {bucket ? ` (${bucket.count})` : ""}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="field">
                <div className="field-label">COLOR TONE</div>
                <div className="checkbox-grid">
                  {colorOptions.slice(0, 8).map((option) => {
                    const bucket = facets?.colorTags.find((item) => item.value === option);
                    return (
                      <label className="checkbox-item" key={option}>
                        <input
                          defaultChecked={selectedColorTags.includes(option)}
                          name="color_tags"
                          type="checkbox"
                          value={option}
                        />
                        <span>
                          {option}
                          {bucket ? ` (${bucket.count})` : ""}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="field">
                <div className="field-label">USAGE SCENE</div>
                <div className="checkbox-grid">
                  {usageOptions.slice(0, 8).map((option) => {
                    const bucket = facets?.usageTags.find((item) => item.value === option);
                    return (
                      <label className="checkbox-item" key={option}>
                        <input
                          defaultChecked={selectedUsageTags.includes(option)}
                          name="usage_tags"
                          type="checkbox"
                          value={option}
                        />
                        <span>
                          {option}
                          {bucket ? ` (${bucket.count})` : ""}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="field">
                <label className="field-label" htmlFor="sort">
                  SORT
                </label>
                <select defaultValue={sort} id="sort" name="sort">
                  {SEARCH_SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
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
              copy={`SORT / ${sort.toUpperCase()} / ${totalLabel}`}
            />
            {snapshot.items.length === 0 ? (
              <p className="mono-copy" style={{ marginTop: 18 }}>
                没有匹配的 Prompt，先放宽筛选条件再继续探索。
              </p>
            ) : (
              <div className="prompt-grid" style={{ marginTop: 18 }}>
                {snapshot.items.map((prompt) => (
                  <PromptCard key={prompt.id} prompt={prompt} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </Shell>
  );
}
