import { cookies } from "next/headers";

import { InfinitePromptGrid } from "@/components/infinite-prompt-grid";
import { SectionHeader } from "@/components/section-header";
import { featuredPrompt, fetchCurrentUser, fetchModels, fetchPromptList } from "@/lib/data";
import { getDictionary } from "@/lib/i18n";

export const revalidate = 60;

export default async function HomePage() {
  const dict = getDictionary();
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  const [modelRecords, snapshot, currentUser] = await Promise.all([
    fetchModels(),
    fetchPromptList({ sort: "latest", limit: 24 }),
    fetchCurrentUser(accessToken).catch(() => null)
  ]);
  const promptRecords = snapshot.items;
  const total = snapshot.meta?.total ?? promptRecords.length;
  const featured = promptRecords[0] ?? featuredPrompt;

  return (
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
          {currentUser ? (
            <p className="lede" style={{ color: "var(--ok)" }}>
              {(dict.home as Record<string, string>).welcomeBack
                ? (dict.home as Record<string, string>).welcomeBack?.replace(
                    "{nickname}",
                    currentUser.nickname
                  )
                : `${currentUser.nickname}，欢迎回来`}
            </p>
          ) : null}
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
          </div>
        </div>
        <div className="hero-visual">
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
            {dict.hotTerms.map((term, index) => (
              <div className="telemetry-card" key={term.value}>
                <span className="card-kicker">
                  {dict.home.hotRank} {String(index + 1).padStart(2, "0")}
                </span>
                <div className="card-value">{term.label}</div>
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
          <InfinitePromptGrid
            initialItems={promptRecords}
            total={total}
            query={{ sort: "latest" }}
            pageSize={24}
            labels={{ metrics: dict.common.metrics, actions: dict.common.actions }}
            loadingLabel={dict.common.actions.loadingMore}
            noMoreLabel={dict.common.actions.noMoreData}
          />
        </div>
      </section>
    </main>
  );
}
