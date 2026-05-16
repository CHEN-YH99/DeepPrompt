import Link from "next/link";
import { cookies } from "next/headers";

import { ModerationActions } from "@/components/moderation-actions";
import { SectionHeader } from "@/components/section-header";
import { fetchCurrentUser, fetchModerationQueue } from "@/lib/data";
import { getDictionary } from "@/lib/i18n";
import type { PromptStatus } from "@deepprompt/types";

type ModerationPageProps = {
  searchParams?: Promise<{
    status?: string;
  }>;
};

const STATUS_TABS: PromptStatus[] = ["pending", "approved", "rejected", "archived"];

function parseStatus(value: string | undefined): PromptStatus {
  return (STATUS_TABS as string[]).includes(value ?? "") ? (value as PromptStatus) : "pending";
}

export const dynamic = "force-dynamic";

export default async function ModerationPage({ searchParams }: ModerationPageProps) {
  const dict = getDictionary();
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  const currentUser = await fetchCurrentUser(accessToken);
  const resolved = searchParams ? await searchParams : undefined;
  const targetStatus = parseStatus(resolved?.status);

  const tabLabelMap: Record<PromptStatus, string> = {
    draft: dict.common.status.draft,
    pending: dict.moderation.queuePending,
    approved: dict.moderation.queueApproved,
    rejected: dict.moderation.queueRejected,
    archived: dict.moderation.queueArchived
  };

  if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "moderator")) {
    return (
      <main className="shell">
        <section className="page-grid">
          <div className="section" data-unit="UNIT / MOD-FORBIDDEN">
            <div className="eyebrow">{dict.moderation.heroKicker}</div>
            <h1 className="headline">{dict.moderation.forbiddenTitle}</h1>
            <p className="lede">{dict.moderation.forbiddenLede}</p>
            <div className="action-row" style={{ marginTop: 14 }}>
              {currentUser ? (
                <Link className="ghost-action" href="/">
                  {dict.nav.home}
                </Link>
              ) : (
                <a className="action" href="/login">
                  {dict.common.actions.loginRequired}
                </a>
              )}
            </div>
          </div>
        </section>
      </main>
    );
  }

  const snapshot = await fetchModerationQueue(targetStatus, accessToken);
  const summary = snapshot?.summary ?? {
    pending: 0,
    approved: 0,
    rejected: 0,
    archived: 0,
    draft: 0
  };
  const items = snapshot?.items ?? [];

  return (
    <main className="shell">
      <section className="page-grid two-col">
        <div className="section" data-unit="UNIT / MOD-HERO">
          <div className="eyebrow">{dict.moderation.heroKicker}</div>
          <h1 className="headline">
            {dict.moderation.heroTitleLine1}
            <br />
            {dict.moderation.heroTitleLine2}
            <br />
            {dict.moderation.heroTitleLine3}
          </h1>
          <p className="lede">{dict.moderation.heroLede}</p>
        </div>
        <div className="section" data-unit="UNIT / MOD-METRICS">
          <SectionHeader
            eyebrow={dict.moderation.metricsEyebrow}
            title={dict.moderation.metricsTitle}
            copy={dict.moderation.metricsCopy}
          />
          <div className="stats-grid" style={{ marginTop: 18 }}>
            {STATUS_TABS.map((statusKey) => (
              <Link
                className="stat-card"
                data-active={targetStatus === statusKey}
                href={`/admin/moderation?status=${statusKey}`}
                key={statusKey}
                style={{ display: "block" }}
              >
                <div className={`stat-label status-badge ${statusKey}`}>
                  {tabLabelMap[statusKey]}
                </div>
                <div className="stat-value">{summary[statusKey] ?? 0}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="page-grid" style={{ marginTop: 14 }}>
        <div className="section" data-unit="UNIT / MOD-LIST">
          <SectionHeader
            eyebrow={dict.moderation.listEyebrow}
            title={dict.moderation.listTitle}
            copy={dict.moderation.listCopy}
          />
          {items.length === 0 ? (
            <div className="telemetry-card" style={{ marginTop: 18 }}>
              <div className="card-kicker">{dict.moderation.emptyTitle}</div>
              <p className="mono-copy">{dict.moderation.emptyHint}</p>
            </div>
          ) : (
            <div className="info-grid" style={{ marginTop: 18 }}>
              {items.map((prompt) => (
                <div className="info-card" key={prompt.id}>
                  <div className="card-kicker">
                    {dict.moderation.rowAuthor} / {prompt.author} · {dict.moderation.rowModel} /{" "}
                    {prompt.modelLabel} · {dict.moderation.rowSubmittedAt} /{" "}
                    {new Date(prompt.createdAt).toLocaleString()}
                  </div>
                  <div className="card-value">{prompt.title}</div>
                  <p className="mono-copy">{prompt.excerpt}</p>
                  <div className="tag-row">
                    {prompt.styleTags.map((tag) => (
                      <span className="tag" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="mono-copy">
                    {dict.moderation.autoFlagsLabel} / {dict.moderation.autoFlagsClean}
                  </p>
                  <div className="action-row" style={{ marginTop: 8 }}>
                    <Link className="ghost-action" href={`/prompts/${prompt.id}`}>
                      {dict.moderation.openDetail}
                    </Link>
                  </div>
                  <ModerationActions labels={dict.moderation} promptId={prompt.id} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
