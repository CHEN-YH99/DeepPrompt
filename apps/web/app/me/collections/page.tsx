import Link from "next/link";
import { cookies } from "next/headers";

import { PromptCard } from "@/components/prompt-card";
import { SectionHeader } from "@/components/section-header";
import { fetchCurrentUser, fetchMyCollections } from "@/lib/data";
import { getDictionary } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function MyCollectionsPage() {
  const dict = getDictionary();
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  const [currentUser, items] = await Promise.all([
    fetchCurrentUser(accessToken),
    fetchMyCollections(accessToken)
  ]);

  const distinctAuthors = new Set(items.map((item) => item.author)).size;
  const distinctModels = new Set(items.flatMap((item) => item.modelIds)).size;

  return (
    <main className="shell">
      <section className="page-grid two-col">
        <div className="section" data-unit="UNIT / COLLECT-01">
          <div className="eyebrow">{dict.collections.heroKicker}</div>
          <h1 className="headline">
            {dict.collections.heroTitleLine1}
            <br />
            {dict.collections.heroTitleLine2}
            <br />
            {dict.collections.heroTitleLine3}
          </h1>
          <p className="lede">{dict.collections.heroLede}</p>
          <div className="action-row" style={{ marginTop: 14 }}>
            <Link className="ghost-action" href="/me/prompts">
              {dict.collections.backToMine}
            </Link>
            {!currentUser ? (
              <a className="action" href="/login">
                {dict.common.actions.loginRequired}
              </a>
            ) : null}
          </div>
        </div>
        <div className="section" data-unit="UNIT / COLLECT-02">
          <SectionHeader
            eyebrow={dict.collections.metricsEyebrow}
            title={dict.collections.metricsTitle}
            copy={dict.collections.metricsCopy}
          />
          <div className="stats-grid" style={{ marginTop: 18 }}>
            <div className="stat-card">
              <div className="stat-label">{dict.collections.totalCollects}</div>
              <div className="stat-value">{items.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">{dict.collections.distinctAuthors}</div>
              <div className="stat-value">{distinctAuthors}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">{dict.collections.distinctModels}</div>
              <div className="stat-value">{distinctModels}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="page-grid" style={{ marginTop: 14 }}>
        <div className="section" data-unit="UNIT / COLLECT-LIST">
          <SectionHeader
            eyebrow={dict.collections.listEyebrow}
            title={dict.collections.listTitle}
            copy={dict.collections.listCopy}
          />
          {!currentUser ? (
            <div className="telemetry-card" style={{ marginTop: 18 }}>
              <div className="card-kicker">{dict.collections.needLoginTitle}</div>
              <p className="mono-copy">{dict.collections.needLoginHint}</p>
            </div>
          ) : items.length === 0 ? (
            <div className="telemetry-card" style={{ marginTop: 18 }}>
              <div className="card-kicker">{dict.collections.emptyTitle}</div>
              <p className="mono-copy">{dict.collections.emptyHint}</p>
            </div>
          ) : (
            <div className="prompt-grid" style={{ marginTop: 18 }}>
              {items.map((prompt) => (
                <PromptCard key={prompt.id} prompt={prompt} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
