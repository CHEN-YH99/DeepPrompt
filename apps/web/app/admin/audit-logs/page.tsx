import Link from "next/link";
import { cookies } from "next/headers";

import { SectionHeader } from "@/components/section-header";
import { fetchAuditLogs, fetchCurrentUser } from "@/lib/data";
import { getDictionary } from "@/lib/i18n";

type AuditPageProps = {
  searchParams?: Promise<{
    action?: string;
    actor_id?: string;
    target_type?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
};

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function AuditLogsPage({ searchParams }: AuditPageProps) {
  const dict = getDictionary();
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  const currentUser = await fetchCurrentUser(accessToken);

  if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "moderator")) {
    return (
      <main className="shell">
        <section className="page-grid">
          <div className="section">
            <h1 className="headline">ACCESS DENIED</h1>
            <p className="lede">需要管理员权限</p>
            <div className="action-row" style={{ marginTop: 14 }}>
              <a className="action" href="/login">{dict.common.actions.loginRequired}</a>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const resolved = searchParams ? await searchParams : undefined;
  const currentPage = Math.max(1, parseInt(resolved?.page ?? "1", 10) || 1);
  const query = {
    action: resolved?.action || undefined,
    actorId: resolved?.actor_id || undefined,
    targetType: resolved?.target_type || undefined,
    from: resolved?.from || undefined,
    to: resolved?.to || undefined
  };

  const result = await fetchAuditLogs(query, accessToken, currentPage, PAGE_SIZE);
  const { items, total } = result;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  function buildPageUrl(page: number) {
    const params = new URLSearchParams();
    if (query.action) params.set("action", query.action);
    if (query.actorId) params.set("actor_id", query.actorId);
    if (query.targetType) params.set("target_type", query.targetType);
    if (query.from) params.set("from", query.from);
    if (query.to) params.set("to", query.to);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return qs ? `/admin/audit-logs?${qs}` : "/admin/audit-logs";
  }

  return (
    <main className="shell">
      <section className="page-grid two-col">
        <div className="section" data-unit="UNIT / AUDIT-01">
          <div className="eyebrow">ADMIN / AUDIT</div>
          <h1 className="headline">
            审计
            <br />
            日志
          </h1>
          <p className="lede">管理员操作全量记录，不可删除。</p>
          <div className="action-row" style={{ marginTop: 14 }}>
            <Link className="ghost-action" href="/admin/moderation">
              返回审核
            </Link>
          </div>
        </div>
        <div className="section" data-unit="UNIT / AUDIT-02">
          <SectionHeader eyebrow="FILTERS" title="筛选条件" copy="按操作类型、时间范围过滤" />
          <form className="form-stack" style={{ marginTop: 18 }} method="get" action="/admin/audit-logs">
            <div className="field">
              <label className="field-label" htmlFor="action">操作类型</label>
              <input id="action" name="action" defaultValue={query.action ?? ""} placeholder="如 admin.moderation.approve" />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="from">起始时间</label>
              <input id="from" name="from" type="date" defaultValue={query.from ?? ""} />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="to">结束时间</label>
              <input id="to" name="to" type="date" defaultValue={query.to ?? ""} />
            </div>
            <button className="action" type="submit">查询</button>
          </form>
        </div>
      </section>

      <section className="page-grid" style={{ marginTop: 14 }}>
        <div className="section" data-unit="UNIT / AUDIT-LIST">
          <SectionHeader
            eyebrow="RECORDS"
            title={`共 ${total} 条记录`}
            copy={`第 ${safePage} / ${totalPages} 页`}
          />
          {items.length === 0 ? (
            <div className="telemetry-card" style={{ marginTop: 18 }}>
              <div className="card-kicker">暂无记录</div>
              <p className="mono-copy">当前筛选条件下没有审计日志</p>
            </div>
          ) : (
            <div className="list-table" style={{ marginTop: 18 }}>
              <div className="table-row head">
                <span>时间</span>
                <span>操作者</span>
                <span>操作</span>
                <span>目标</span>
                <span>IP</span>
              </div>
              {items.map((log) => (
                <div className="table-row" key={log.id}>
                  <span>{new Date(log.created_at).toLocaleString()}</span>
                  <span>{log.actor_nickname ?? log.actor_id.slice(0, 8)}</span>
                  <span>{log.action}</span>
                  <span>{log.target_type ? `${log.target_type}/${(log.target_id ?? "").slice(0, 8)}` : "—"}</span>
                  <span>{log.ip_address ?? "—"}</span>
                </div>
              ))}
            </div>
          )}
          {totalPages > 1 && (
            <div className="action-row" style={{ marginTop: 14 }}>
              {safePage > 1 ? (
                <Link className="ghost-action" href={buildPageUrl(safePage - 1)}>← 上一页</Link>
              ) : (
                <span className="ghost-action" style={{ opacity: 0.3 }}>← 上一页</span>
              )}
              <span style={{ color: "var(--text-dim)", fontSize: 12, letterSpacing: "0.1em" }}>
                {safePage} / {totalPages}
              </span>
              {safePage < totalPages ? (
                <Link className="ghost-action" href={buildPageUrl(safePage + 1)}>下一页 →</Link>
              ) : (
                <span className="ghost-action" style={{ opacity: 0.3 }}>下一页 →</span>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
