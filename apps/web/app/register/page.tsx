import { SectionHeader } from "@/components/section-header";
import { Shell } from "@/components/shell";
import { getDictionary } from "@/lib/i18n";

type RegisterPageProps = {
  searchParams?: Promise<{
    error?: string;
    invite?: string;
  }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const dict = getDictionary();
  const inviteRequired =
    (process.env.NEXT_PUBLIC_INVITE_REQUIRED ?? "false").toLowerCase() === "true";

  function getErrorMessage(error?: string) {
    if (error === "email_or_phone_exists") return dict.register.msgExists;
    if (error === "invalid_register_payload") return dict.register.msgInvalid;
    if (error === "api_unreachable") return dict.register.msgApiUnreachable;
    if (error === "register_failed") return dict.register.msgFailed;
    if (error === "invite_required") return "需要邀请码才能注册，请联系内测组获取。";
    if (error === "invite_invalid") return "邀请码无效或已被全部使用。";
    if (error === "invite_expired") return "邀请码已过期。";
    return "";
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const errorMessage = getErrorMessage(resolvedSearchParams?.error);
  const presetInvite = resolvedSearchParams?.invite ?? "";

  return (
    <Shell activePath="/login">
      <main className="shell">
        <section className="page-grid two-col">
          <div className="section" data-unit="UNIT / REG-01">
            <div className="eyebrow">{dict.register.heroKicker}</div>
            <h1 className="headline">
              {dict.register.heroTitleLine1}
              <br />
              {dict.register.heroTitleLine2}
              <br />
              {dict.register.heroTitleLine3}
            </h1>
            <p className="lede">{dict.register.heroLede}</p>
          </div>
          <div className="section" data-unit="UNIT / REG-02">
            <SectionHeader
              eyebrow={dict.register.formEyebrow}
              title={dict.register.formTitle}
              copy={dict.register.formCopy}
            />
            {errorMessage ? (
              <div
                style={{
                  marginTop: 14,
                  border: "1px solid #ef4444",
                  padding: "10px 12px",
                  color: "#fecaca",
                  background: "rgba(127, 29, 29, 0.28)"
                }}
              >
                {errorMessage}
              </div>
            ) : null}
            <form action="/api/auth/register" className="form-stack" method="post" style={{ marginTop: 18 }}>
              <div className="field">
                <label className="field-label" htmlFor="nickname">
                  {dict.register.nickname}
                </label>
                <input id="nickname" name="nickname" required />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="email">
                  {dict.register.email}
                </label>
                <input id="email" name="email" required type="email" />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="password">
                  {dict.register.password}
                </label>
                <input id="password" minLength={8} name="password" required type="password" />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="invite_code">
                  邀请码{inviteRequired ? "（必填）" : "（可选）"}
                </label>
                <input
                  defaultValue={presetInvite}
                  id="invite_code"
                  name="invite_code"
                  placeholder="DP-XXXXXXXX"
                  required={inviteRequired}
                />
              </div>
              <div className="action-row">
                <button className="action" type="submit">
                  {dict.common.actions.createAccount}
                </button>
                <a className="ghost-action" href="/login">
                  {dict.common.actions.backToLogin}
                </a>
              </div>
            </form>
          </div>
        </section>
      </main>
    </Shell>
  );
}
