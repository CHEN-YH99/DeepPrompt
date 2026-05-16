import Link from "next/link";
import { cookies } from "next/headers";

import { PromptCard } from "@/components/prompt-card";
import { SectionHeader } from "@/components/section-header";
import { fetchCurrentUser, fetchMyCollections } from "@/lib/data";
import { getDictionary } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type MyCollectionsPageProps = {
  searchParams?: Promise<{
    page?: string;
  }>;
};

const PAGE_SIZE = 12;

export default async function MyCollectionsPage({ searchParams }: MyCollectionsPageProps) {
  const dict = getDictionary();
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const currentPage = Math.max(1, parseInt(resolvedSearchParams?.page ?? "1", 10) || 1);
  const [currentUser, result] = await Promise.all([
    fetchCurrentUser(accessToken),
    fetchMyCollections(accessToken, currentPage, PAGE_SIZE)
  ]);
  const { items, total } = result;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

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
              <div className="stat-value">{total}</div>
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
                <PromptCard key={prompt.id} prompt={prompt} labels={{ metrics: dict.common.metrics, actions: dict.common.actions }} />
              ))}
            </div>
          )}
          {totalPages > 1 && (
            <div className="action-row" style={{ marginTop: 14 }}>
              {safePage > 1 ? (
                <Link className="ghost-action" href={`/me/collections?page=${safePage - 1}`}>
                  ← 上一页
                </Link>
              ) : (
                <span className="ghost-action" style={{ opacity: 0.3 }}>
                  ← 上一页
                </span>
              )}
              <span style={{ color: "var(--text-dim)", fontSize: 12, letterSpacing: "0.1em" }}>
                {safePage} / {totalPages}
              </span>
              {safePage < totalPages ? (
                <Link className="ghost-action" href={`/me/collections?page=${safePage + 1}`}>
                  下一页 →
                </Link>
              ) : (
                <span className="ghost-action" style={{ opacity: 0.3 }}>
                  下一页 →
                </span>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
