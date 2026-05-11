import { cookies } from "next/headers";
import { SectionHeader } from "@/components/section-header";
import { Shell } from "@/components/shell";
import { fetchCurrentUser, fetchMyPromptRecords } from "@/lib/data";
import { applyVars, getDictionary } from "@/lib/i18n";

type MyPromptsPageProps = {
  searchParams?: Promise<{
    created?: string;
  }>;
};

export default async function MyPromptsPage({ searchParams }: MyPromptsPageProps) {
  const dict = getDictionary();
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  const [currentUser, promptRecords] = await Promise.all([
    fetchCurrentUser(accessToken),
    fetchMyPromptRecords(accessToken)
  ]);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const createdMessage =
    resolvedSearchParams?.created === "1" ? dict.myPrompts.createdNotice : "";
  const totalCopies = promptRecords.reduce((sum, prompt) => sum + prompt.copies, 0);
  const totalCollects = promptRecords.reduce((sum, prompt) => sum + prompt.collects, 0);

  const statusLabelMap: Record<string, string> = {
    approved: dict.common.status.approved,
    pending: dict.common.status.pending,
    draft: dict.common.status.draft,
    rejected: dict.common.status.rejected,
    archived: dict.common.status.archived
  };

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
            {!currentUser ? (
              <div className="action-row" style={{ marginTop: 18 }}>
                <a className="action" href="/login">
                  {dict.common.actions.loginRequired}
                </a>
              </div>
            ) : null}
            <div className="metric-board" style={{ marginTop: 18 }}>
              <div>
                <div className="mini-label">{dict.myPrompts.totalPrompts}</div>
                <div className="card-value">{promptRecords.length}</div>
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
              <span className="tab-chip" data-active="true">
                {dict.myPrompts.tabAll}
              </span>
              <span className="tab-chip">{dict.myPrompts.tabApproved}</span>
              <span className="tab-chip">{dict.myPrompts.tabPending}</span>
              <span className="tab-chip">{dict.myPrompts.tabDraft}</span>
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
              <div className="table-row head">
                <span>{dict.myPrompts.colName}</span>
                <span>{dict.myPrompts.colState}</span>
                <span>{dict.myPrompts.colModel}</span>
                <span>{dict.myPrompts.colMetrics}</span>
              </div>
              {promptRecords.length > 0 ? (
                promptRecords.map((row) => (
                  <div className="table-row" key={row.id}>
                    <span>{row.title}</span>
                    <span>{statusLabelMap[row.status] ?? row.status}</span>
                    <span>{row.modelLabel}</span>
                    <span>
                      {applyVars(dict.myPrompts.rowMetricsCopiesLikes, {
                        copies: row.copies,
                        likes: row.likes
                      })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="table-row">
                  <span>{dict.myPrompts.emptyName}</span>
                  <span>
                    {currentUser ? dict.myPrompts.emptyStateLogged : dict.myPrompts.emptyStateLocked}
                  </span>
                  <span>--</span>
                  <span>
                    {currentUser ? dict.myPrompts.emptyTip : dict.common.actions.loginFirst}
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </Shell>
  );
}
