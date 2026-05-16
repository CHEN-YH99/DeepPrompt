import Link from "next/link";

import { PromptCard } from "@/components/prompt-card";
import { AutoSubmitForm } from "@/components/auto-submit-form";
import { CollapsibleCheckboxGroup } from "@/components/collapsible-checkbox-group";
import { SectionHeader } from "@/components/section-header";
import { SEARCH_SORT_VALUES, fetchModels, fetchPromptList } from "@/lib/data";
import { getDictionary, applyVars } from "@/lib/i18n";
import { STYLE_OPTIONS, COLOR_OPTIONS, USAGE_OPTIONS } from "@/lib/tag-options";
import type { SearchSort } from "@deepprompt/types";

type SearchPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

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
  return (SEARCH_SORT_VALUES as string[]).includes(candidate ?? "")
    ? (candidate as SearchSort)
    : "latest";
}

function pickKeyword(value: string | string[] | undefined): string {
  if (!value) return "";
  return Array.isArray(value) ? (value[0] ?? "") : value;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const dict = getDictionary();
  const sortLabelMap: Record<SearchSort, string> = {
    latest: dict.search.sortLatest,
    trending_weekly: dict.search.sortTrendingWeekly,
    trending_monthly: dict.search.sortTrendingMonthly,
    most_copied: dict.search.sortMostCopied,
    most_collected: dict.search.sortMostCollected
  };

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
  const totalLabel = snapshot.meta
    ? applyVars(dict.search.resultStat, {
        sort: sortLabelMap[snapshot.meta.sort],
        total: snapshot.meta.total,
        took: snapshot.meta.tookMs
      })
    : applyVars(dict.search.resultStat, {
        sort: sortLabelMap[sort],
        total: snapshot.items.length,
        took: 0
      });
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
    <main className="shell">
      <section className="page-grid two-col">
        <div className="section" data-unit="UNIT / SEARCH-01">
          <div className="eyebrow">{dict.search.heroKicker}</div>
          <h1 className="headline">
            {dict.search.heroTitleLine1}
            <br />
            {dict.search.heroTitleLine2}
            <br />
            {dict.search.heroTitleLine3}
          </h1>
          <p className="lede">{dict.search.heroLede}</p>
          <div className="action-row">
            <a className="action" href="#query-panel">
              {dict.common.actions.executeQuery}
            </a>
            <a className="ghost-action" href="/search">
              {dict.common.actions.resetFilters}
            </a>
          </div>
        </div>
        <div className="section" data-unit="UNIT / SEARCH-02">
          <SectionHeader
            eyebrow={dict.search.hotEyebrow}
            title={dict.search.hotTitle}
            copy={dict.search.hotCopy}
          />
          <div className="card-list" style={{ marginTop: 18 }}>
            {dict.hotTerms.map((term, index) => (
              <Link
                className="telemetry-card"
                href={`/search?q=${encodeURIComponent(term.value)}`}
                key={term.value}
                style={{ display: "block" }}
              >
                <div className="card-kicker">
                  {dict.search.hotRank} {index + 1}
                </div>
                <div className="card-value">{term.label}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="matrix-grid page-grid" style={{ marginTop: 14 }}>
        <aside className="section filter-panel" data-unit="UNIT / FILTER-05">
          <SectionHeader
            eyebrow={dict.search.filterEyebrow}
            title={dict.search.filterTitle}
            copy={dict.search.filterCopy}
          />
          <AutoSubmitForm className="filter-stack" id="query-panel" style={{ marginTop: 18 }}>
            <div className="field">
              <label className="field-label" htmlFor="keyword">
                {dict.search.keywordLabel}
              </label>
              <input defaultValue={keyword} id="keyword" name="q" />
            </div>

            <div className="field">
              <div className="field-label">{dict.search.modelRegistry}</div>
              <div className="checkbox-grid">
                {models.map((model) => {
                  const facetCount = facets?.modelIds.find(
                    (bucket) => bucket.value === model.id
                  )?.count;
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

            <CollapsibleCheckboxGroup
              label={dict.search.styleTags}
              name="style_tags"
              items={styleOptions.map((option) => ({
                value: option,
                label: dict.tags.style[option] ?? option,
                count: facets?.styleTags.find((item) => item.value === option)?.count
              }))}
              defaultChecked={selectedStyleTags}
              initialVisible={3}
              expandLabel={dict.search.expandMore}
              collapseLabel={dict.search.collapseLess}
            />

            <CollapsibleCheckboxGroup
              label={dict.search.colorTags}
              name="color_tags"
              items={colorOptions.map((option) => ({
                value: option,
                label: dict.tags.color[option] ?? option,
                count: facets?.colorTags.find((item) => item.value === option)?.count
              }))}
              defaultChecked={selectedColorTags}
              initialVisible={3}
              expandLabel={dict.search.expandMore}
              collapseLabel={dict.search.collapseLess}
            />

            <CollapsibleCheckboxGroup
              label={dict.search.usageScene}
              name="usage_tags"
              items={usageOptions.map((option) => ({
                value: option,
                label: dict.tags.usage[option] ?? option,
                count: facets?.usageTags.find((item) => item.value === option)?.count
              }))}
              defaultChecked={selectedUsageTags}
              initialVisible={3}
              expandLabel={dict.search.expandMore}
              collapseLabel={dict.search.collapseLess}
            />

            <div className="field">
              <label className="field-label" htmlFor="sort">
                {dict.search.sortLabel}
              </label>
              <select defaultValue={sort} id="sort" name="sort">
                {SEARCH_SORT_VALUES.map((value) => (
                  <option key={value} value={value}>
                    {sortLabelMap[value]}
                  </option>
                ))}
              </select>
            </div>

            <button className="action" type="submit">
              {dict.common.actions.executeQuery}
            </button>
          </AutoSubmitForm>
        </aside>
        <div className="section" data-unit="UNIT / RESULT-08">
          <SectionHeader
            eyebrow={dict.search.resultEyebrow}
            title={dict.search.resultTitle}
            copy={totalLabel}
          />
          {snapshot.items.length === 0 ? (
            <p className="mono-copy" style={{ marginTop: 18 }}>
              {dict.search.emptyHint}
            </p>
          ) : (
            <div className="prompt-grid" style={{ marginTop: 18 }}>
              {snapshot.items.map((prompt) => (
                <PromptCard key={prompt.id} prompt={prompt} labels={{ metrics: dict.common.metrics, actions: dict.common.actions }} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
