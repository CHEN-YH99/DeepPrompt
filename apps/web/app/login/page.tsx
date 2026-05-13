import { LoginForm } from "@/components/login-form";
import { SectionHeader } from "@/components/section-header";
import { Shell } from "@/components/shell";
import { getDictionary } from "@/lib/i18n";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    registered?: string;
    email?: string;
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
  const presetAccount = resolvedSearchParams?.email ?? "";

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
            <LoginForm
              commonLabels={dict.common}
              labels={dict.login}
              message={message}
              presetAccount={presetAccount}
            />
          </div>
        </section>
      </main>
    </Shell>
  );
}
