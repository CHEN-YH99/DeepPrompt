import Link from "next/link";
import { cookies } from "next/headers";
import { SectionHeader } from "@/components/section-header";
import { Shell } from "@/components/shell";
import { fetchCurrentUser, fetchMyPromptRecords } from "@/lib/data";
import { applyVars, getDictionary } from "@/lib/i18n";
import type { PromptStatus } from "@deepprompt/types";
import { ModerationActions } from "@/components/moderation-actions";

type MyPromptsPageProps = {
  searchParams?: Promise<{
    created?: string;
    status?: string;
    page?: string;
  }>;
};

const STATUS_TABS = ["all", "approved", "pending", "draft", "rejected", "archived"] as const;
type TabKey = (typeof STATUS_TABS)[number];
const PAGE_SIZE = 10;

function parseTab(value: string | undefined): TabKey {
  return (STATUS_TABS as readonly string[]).includes(value ?? "") ? (value as TabKey) : "all";
}

export default async function MyPromptsPage({ searchParams }: MyPromptsPageProps) {
  const dict = getDictionary();
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const tab = parseTab(resolvedSearchParams?.status);
  const currentPage = Math.max(1, parseInt(resolvedSearchParams?.page ?? "1", 10) || 1);
  const statusFilter: PromptStatus | null = tab === "all" ? null : (tab as PromptStatus);
  const [currentUser, allRecords] = await Promise.all([
    fetchCurrentUser(accessToken),
    fetchMyPromptRecords(accessToken, statusFilter)
  ]);
  const totalPages = Math.max(1, Math.ceil(allRecords.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const promptRecords = allRecords.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const createdMessage =
    resolvedSearchParams?.created === "1" ? dict.myPrompts.submittedForReviewNotice : "";
  const totalCopies = allRecords.reduce((sum, prompt) => sum + prompt.copies, 0);
  const totalCollects = allRecords.reduce((sum, prompt) => sum + prompt.collects, 0);

  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "moderator";

  const statusLabelMap: Record<PromptStatus, string> = {
    approved: dict.common.status.approved,
    pending: dict.common.status.pending,
    draft: dict.common.status.draft,
    rejected: dict.common.status.rejected,
    archived: dict.common.status.archived
  };

  const tabLabelMap: Record<TabKey, string> = {
    all: dict.myPrompts.tabAll,
    approved: dict.myPrompts.tabApproved,
    pending: dict.myPrompts.tabPending,
    draft: dict.myPrompts.tabDraft,
    rejected: dict.myPrompts.tabRejected,
    archived: dict.myPrompts.tabArchived
  };

  function buildPageUrl(page: number) {
    const base = tab === "all" ? "/me/prompts" : `/me/prompts?status=${tab}`;
    return page <= 1 ? base : `${base}${tab === "all" ? "?" : "&"}page=${page}`;
  }

  return (
    <Shell activePath="/me/prompts">
      <main className="shell">
        <section className="page-grid two-col">
          <div className="section" data-unit="UNIT / USER-01">
            <div className="eyebrow">{dict.myPrompts.heroKicker}</div>
            <h1 className="headline">
              {dict.myPrompts.heroTitleLine1}
              <br />
              {dict.myPrompts.heroTitleLine2}
              <br />
              {dict.myPrompts.heroTitleLine3}
            </h1>
            <p className="lede">{dict.myPrompts.heroLede}</p>
            {createdMessage ? <p className="lede">{createdMessage}</p> : null}
            <div className="action-row" style={{ marginTop: 14 }}>
              {!currentUser ? (
                <a className="action" href="/login">
                  {dict.common.actions.loginRequired}
                </a>
              ) : (
                <Link className="ghost-action" href="/me/collections">
                  {dict.myPrompts.collectionsLink}
                </Link>
              )}
            </div>
            <div className="metric-board" style={{ marginTop: 18 }}>
              <div>
                <div className="mini-label">{dict.myPrompts.totalPrompts}</div>
                <div className="card-value">{allRecords.length}</div>
              </div>
              <div>
                <div className="mini-label">{dict.myPrompts.totalCopies}</div>
                <div className="card-value">{totalCopies}</div>
              </div>
              <div>
                <div className="mini-label">{dict.myPrompts.totalCollects}</div>
                <div className="card-value">{totalCollects}</div>
              </div>
              <div>
                <div className="mini-label">{dict.myPrompts.points}</div>
                <div className="card-value">{currentUser?.points ?? 0}</div>
              </div>
            </div>
          </div>
          <div className="section" data-unit="UNIT / USER-02">
            <SectionHeader
              eyebrow={dict.myPrompts.tabsEyebrow}
              title={dict.myPrompts.tabsTitle}
              copy={dict.myPrompts.tabsCopy}
            />
            <div className="tag-row" style={{ marginTop: 18 }}>
              {STATUS_TABS.map((key) => (
                <Link
                  className="tab-chip"
                  data-active={tab === key}
                  href={key === "all" ? "/me/prompts" : `/me/prompts?status=${key}`}
                  key={key}
                  onClick={() => { /* 切换状态 tab 时重置到第1页 */ }}
                >
                  {tabLabelMap[key]}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="page-grid" style={{ marginTop: 14 }}>
          <div className="section table-panel" data-unit="UNIT / USER-03">
            <SectionHeader
              eyebrow={dict.myPrompts.listEyebrow}
              title={dict.myPrompts.listTitle}
              copy={dict.myPrompts.listCopy}
            />
            <div className="list-table" style={{ marginTop: 18 }}>
              <div className={`table-row head${isAdmin ? " admin-row" : ""}`}>
                <span>{dict.myPrompts.colName}</span>
                {isAdmin && <span>{dict.myPrompts.colAuthor}</span>}
                <span>{dict.myPrompts.colState}</span>
                <span>{dict.myPrompts.colModel}</span>
                <span>{dict.myPrompts.colMetrics}</span>
                {isAdmin && <span>操作</span>}
              </div>
              {promptRecords.length > 0 ? (
                promptRecords.map((row) => (
                  <div className={`table-row${isAdmin ? " admin-row" : ""}`} key={row.id}>
                    <span>
                      <Link href={`/prompts/${row.id}`}>{row.title}</Link>
                    </span>
                    {isAdmin && <span className="row-author">{row.author}</span>}
                    <span className={`status-badge ${row.status}`}>{statusLabelMap[row.status] ?? row.status}</span>
                    <span>{row.modelLabel}</span>
                    <span>
                      {applyVars(dict.myPrompts.rowMetricsCopiesLikes, {
                        copies: row.copies,
                        likes: row.likes
                      })}
                    </span>
                    {isAdmin && (
                      <span className="row-actions">
                        <ModerationActions labels={dict.moderation} promptId={row.id} />
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className={`table-row${isAdmin ? " admin-row" : ""}`}>
                  <span>{dict.myPrompts.emptyName}</span>
                  {isAdmin && <span>--</span>}
                  <span>
                    {currentUser ? dict.myPrompts.emptyStateLogged : dict.myPrompts.emptyStateLocked}
                  </span>
                  <span>--</span>
                  <span>
                    {currentUser ? dict.myPrompts.emptyTip : dict.common.actions.loginFirst}
                  </span>
                  {isAdmin && <span></span>}
                </div>
              )}
            </div>
            {totalPages > 1 && (
              <div className="action-row" style={{ marginTop: 14 }}>
                {safePage > 1 ? (
                  <Link className="ghost-action" href={buildPageUrl(safePage - 1)}>
                    ← 上一页
                  </Link>
                ) : (
                  <span className="ghost-action" style={{ opacity: 0.3 }}>← 上一页</span>
                )}
                <span style={{ color: "var(--text-dim)", fontSize: 12, letterSpacing: "0.1em" }}>
                  {safePage} / {totalPages}
                </span>
                {safePage < totalPages ? (
                  <Link className="ghost-action" href={buildPageUrl(safePage + 1)}>
                    下一页 →
                  </Link>
                ) : (
                  <span className="ghost-action" style={{ opacity: 0.3 }}>下一页 →</span>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </Shell>
  );
}
