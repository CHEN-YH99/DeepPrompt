import { SectionHeader } from "@/components/section-header";
import { Shell } from "@/components/shell";
import { myPromptRows } from "@/lib/data";

export default function MyPromptsPage() {
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
              个人中心 MVP 先覆盖我发布的 Prompt、草稿 / 待审核 / 已发布状态和基础数据看板，符合需求文档的个人主页核心诉求。
            </p>
            <div className="metric-board" style={{ marginTop: 18 }}>
              <div>
                <div className="mini-label">TOTAL PROMPTS</div>
                <div className="card-value">37</div>
              </div>
              <div>
                <div className="mini-label">TOTAL COPIES</div>
                <div className="card-value">8204</div>
              </div>
              <div>
                <div className="mini-label">TOTAL COLLECTS</div>
                <div className="card-value">2331</div>
              </div>
              <div>
                <div className="mini-label">POINTS</div>
                <div className="card-value">5410</div>
              </div>
            </div>
          </div>
          <div className="section" data-unit="UNIT / USER-02">
            <SectionHeader
              eyebrow="[ FILTER TABS ]"
              title="CONTENT STATES"
              copy="后续可扩展为 Tabs 与收藏夹管理。当前用终端标签区分状态即可。"
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
              copy="这里预留了与后端状态机对齐的状态展示位，审核完成后即可直接接真实数据。"
            />
            <div className="list-table" style={{ marginTop: 18 }}>
              <div className="table-row head">
                <span>ENTRY NAME</span>
                <span>STATE</span>
                <span>MODEL</span>
                <span>METRICS</span>
              </div>
              {myPromptRows.map((row) => (
                <div className="table-row" key={row.name}>
                  <span>{row.name}</span>
                  <span>{row.state}</span>
                  <span>{row.model}</span>
                  <span>{row.metrics}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </Shell>
  );
}
