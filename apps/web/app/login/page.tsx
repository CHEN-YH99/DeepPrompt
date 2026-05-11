import { SectionHeader } from "@/components/section-header";
import { Shell } from "@/components/shell";
import { getDictionary } from "@/lib/i18n";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    registered?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const dict = getDictionary();

  function getLoginMessage(sp?: { error?: string; registered?: string }) {
    if (sp?.registered === "1") return dict.login.msgRegistered;
    if (sp?.error === "invalid_credentials") return dict.login.msgInvalid;
    if (sp?.error === "api_unreachable") return dict.login.msgApiUnreachable;
    return "";
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const message = getLoginMessage(resolvedSearchParams);

  return (
    <Shell activePath="/login">
      <main className="shell">
        <section className="page-grid two-col">
          <div className="section" data-unit="UNIT / AUTH-01">
            <div className="eyebrow">{dict.login.heroKicker}</div>
            <h1 className="headline">
              {dict.login.heroTitleLine1}
              <br />
              {dict.login.heroTitleLine2}
              <br />
              {dict.login.heroTitleLine3}
            </h1>
            <p className="lede">{dict.login.heroLede}</p>
            <div className="ascii-rule">{dict.login.asciiRule}</div>
          </div>
          <div className="section" data-unit="UNIT / AUTH-02">
            <SectionHeader
              eyebrow={dict.login.formEyebrow}
              title={dict.login.formTitle}
              copy={dict.login.formCopy}
            />
            {message ? (
              <div
                style={{
                  marginTop: 14,
                  border: "1px solid #22c55e",
                  padding: "10px 12px",
                  color: "#bbf7d0",
                  background: "rgba(20, 83, 45, 0.25)"
                }}
              >
                {message}
              </div>
            ) : null}
            <form action="/api/auth/login" className="form-stack" method="post" style={{ marginTop: 18 }}>
              <div className="field">
                <label className="field-label" htmlFor="account">
                  {dict.login.account}
                </label>
                <input id="account" name="account" required />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="password">
                  {dict.login.password}
                </label>
                <input id="password" name="password" required type="password" />
              </div>
              <div className="action-row">
                <button className="action" type="submit">
                  {dict.common.actions.enterSystem}
                </button>
                <a className="ghost-action" href="/register">
                  {dict.common.actions.createAccount}
                </a>
              </div>
              <div className="panel-grid">
                <button className="ghost-action" type="button">
                  {dict.login.google}
                </button>
                <button className="ghost-action" type="button">
                  {dict.login.github}
                </button>
                <button className="ghost-action" type="button">
                  {dict.login.wechat}
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>
    </Shell>
  );
}
