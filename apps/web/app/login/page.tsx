import { LoginForm } from "@/components/login-form";
import { SectionHeader } from "@/components/section-header";
import { getDictionary } from "@/lib/i18n";
import "../captcha.css";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    registered?: string;
    email?: string;
    retry_after?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const dict = getDictionary();

  function getLoginMessage(sp?: { error?: string; registered?: string; retry_after?: string }) {
    if (sp?.registered === "1") return dict.login.msgRegistered;
    if (sp?.error === "invalid_credentials") return dict.login.msgInvalid;
    if (sp?.error === "captcha_required") return dict.login.captchaHint;
    if (sp?.error === "api_unreachable") return dict.login.msgApiUnreachable;
    if (sp?.error === "account_locked") {
      const seconds = Number(sp.retry_after ?? "0");
      const minutes = seconds > 0 ? Math.ceil(seconds / 60) : null;
      return minutes
        ? `${dict.login.msgAccountLocked}（约 ${minutes} 分钟）`
        : dict.login.msgAccountLocked;
    }
    return "";
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const message = getLoginMessage(resolvedSearchParams);
  const presetAccount = resolvedSearchParams?.email ?? "";

  return (
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
          <LoginForm
            commonLabels={dict.common}
            labels={dict.login}
            message={message}
            presetAccount={presetAccount}
          />
        </div>
      </section>
    </main>
  );
}
