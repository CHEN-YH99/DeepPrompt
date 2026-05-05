import { SectionHeader } from "@/components/section-header";
import { Shell } from "@/components/shell";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    registered?: string;
  }>;
};

function getLoginMessage(searchParams?: { error?: string; registered?: string }) {
  if (searchParams?.registered === "1") {
    return "注册成功，请使用新账号登录。";
  }
  if (searchParams?.error === "invalid_credentials") {
    return "账号或密码错误，请重试。";
  }
  if (searchParams?.error === "api_unreachable") {
    return "后端服务不可达，请确认 API 服务已启动。";
  }
  return "";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const message = getLoginMessage(resolvedSearchParams);
  return (
    <Shell activePath="/login">
      <main className="shell">
        <section className="page-grid two-col">
          <div className="section" data-unit="UNIT / AUTH-01">
            <div className="eyebrow">[ AUTHENTICATION / ACCESS NODE ]</div>
            <h1 className="headline">
              USER
              <br />
              ACCESS
              <br />
              GATE
            </h1>
            <p className="lede">
              登录页按需求文档支持邮箱 / 手机号注册和第三方登录预留。当前先以前端界面完整度为主，保留接入认证系统的结构。
            </p>
            <div className="ascii-rule">
              [ EMAIL ] [ PHONE ] [ GOOGLE ] [ GITHUB ] [ WECHAT ]
            </div>
          </div>
          <div className="section" data-unit="UNIT / AUTH-02">
            <SectionHeader
              eyebrow="[ LOGIN FORM ]"
              title="SIGN-IN PANEL"
              copy="视觉上维持战术终端风，交互上保留常规登录习惯，别为了风格把可用性也狠狠干没了。"
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
                  EMAIL / PHONE
                </label>
                <input defaultValue="operator@deepprompt.ai" id="account" name="account" required />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="password">
                  PASSWORD
                </label>
                <input defaultValue="••••••••••••" id="password" name="password" required type="password" />
              </div>
              <div className="action-row">
                <button className="action" type="submit">
                  ENTER SYSTEM
                </button>
                <a className="ghost-action" href="/register">
                  CREATE ACCOUNT
                </a>
              </div>
              <div className="panel-grid">
                <button className="ghost-action" type="button">
                  GOOGLE OAUTH
                </button>
                <button className="ghost-action" type="button">
                  GITHUB OAUTH
                </button>
                <button className="ghost-action" type="button">
                  WECHAT OAUTH
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>
    </Shell>
  );
}
