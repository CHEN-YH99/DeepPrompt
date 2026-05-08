import { cookies } from "next/headers";
import { SectionHeader } from "@/components/section-header";
import { Shell } from "@/components/shell";
import { fetchCurrentUser, fetchMyPromptRecords } from "@/lib/data";

type MyPromptsPageProps = {
  searchParams?: Promise<{
    created?: string;
  }>;
};

export default async function MyPromptsPage({ searchParams }: MyPromptsPageProps) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  const [currentUser, promptRecords] = await Promise.all([
    fetchCurrentUser(accessToken),
    fetchMyPromptRecords(accessToken)
  ]);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const createdMessage =
    resolvedSearchParams?.created === "1"
      ? "Prompt 已提交审核，你可以在这里看到它。"
      : "";
  const totalCopies = promptRecords.reduce((sum, prompt) => sum + prompt.copies, 0);
  const totalCollects = promptRecords.reduce((sum, prompt) => sum + prompt.collects, 0);

  return (
    <Shell activePath="/me/prompts">
      <main className="shell">
        <section className="page-grid two-col">
          <div className="section" data-unit="UNIT / USER-01">
            <div className="eyebrow">[ CREATOR DESK / PERSONAL CONSOLE ]</div>
            <h1 className="headline">
              MY
              <br />
              PROMPT
              <br />
              DESK
            </h1>
            <p className="lede">
              个人中心 MVP 已接入当前登录用户数据，覆盖我发布的 Prompt、草稿 / 待审核 / 已发布状态和基础数据看板。
            </p>
            {createdMessage ? <p className="lede">{createdMessage}</p> : null}
            {!currentUser ? (
              <div className="action-row" style={{ marginTop: 18 }}>
                <a className="action" href="/login">
                  LOGIN REQUIRED
                </a>
              </div>
            ) : null}
            <div className="metric-board" style={{ marginTop: 18 }}>
              <div>
                <div className="mini-label">TOTAL PROMPTS</div>
                <div className="card-value">{promptRecords.length}</div>
              </div>
              <div>
                <div className="mini-label">TOTAL COPIES</div>
                <div className="card-value">{totalCopies}</div>
              </div>
              <div>
                <div className="mini-label">TOTAL COLLECTS</div>
                <div className="card-value">{totalCollects}</div>
              </div>
              <div>
                <div className="mini-label">POINTS</div>
                <div className="card-value">{currentUser?.points ?? 0}</div>
              </div>
            </div>
          </div>
          <div className="section" data-unit="UNIT / USER-02">
            <SectionHeader
              eyebrow="[ FILTER TABS ]"
              title="CONTENT STATES"
              copy="后续可扩展为 Tabs 与收藏夹管理。当前先展示后端状态机返回值。"
            />
            <div className="tag-row" style={{ marginTop: 18 }}>
              <span className="tab-chip" data-active="true">
                ALL
              </span>
              <span className="tab-chip">APPROVED</span>
              <span className="tab-chip">PENDING</span>
              <span className="tab-chip">DRAFT</span>
            </div>
          </div>
        </section>

        <section className="page-grid" style={{ marginTop: 14 }}>
          <div className="section table-panel" data-unit="UNIT / USER-03">
            <SectionHeader
              eyebrow="[ PUBLISHED + DRAFTED ENTRIES ]"
              title="PROMPT LOG TABLE"
              copy="这里已经接入后端状态机，发布后 pending / draft / approved 会同步显示。"
            />
            <div className="list-table" style={{ marginTop: 18 }}>
              <div className="table-row head">
                <span>ENTRY NAME</span>
                <span>STATE</span>
                <span>MODEL</span>
                <span>METRICS</span>
              </div>
              {promptRecords.length > 0 ? (
                promptRecords.map((row) => (
                  <div className="table-row" key={row.id}>
                    <span>{row.title}</span>
                    <span>{row.status.toUpperCase()}</span>
                    <span>{row.modelLabel}</span>
                    <span>
                      {row.copies} COPIES / {row.likes} LIKES
                    </span>
                  </div>
                ))
              ) : (
                <div className="table-row">
                  <span>NO PROMPT YET</span>
                  <span>{currentUser ? "EMPTY" : "LOCKED"}</span>
                  <span>--</span>
                  <span>{currentUser ? "PUBLISH FIRST PROMPT" : "LOGIN FIRST"}</span>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </Shell>
  );
}
