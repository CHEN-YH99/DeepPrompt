import Link from "next/link";

import { getDictionary } from "@/lib/i18n";

export const dynamic = "force-static";

export default function NotFoundPage() {
  const dict = getDictionary();
  return (
    <main className="shell">
      <section className="page-grid">
        <div className="section" data-unit="UNIT / 404">
          <div className="eyebrow">STATUS / 404</div>
          <h1 className="headline">{dict.common.brand} · 节点未发现</h1>
          <p className="lede">
            请求的资源不存在或已经下架。可能是 Prompt 被作者删除，或地址输错了。
          </p>
          <div className="action-row" style={{ marginTop: 18 }}>
            <Link className="action" href="/">
              回到首页
            </Link>
            <Link className="ghost-action" href="/search">
              继续搜索
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
