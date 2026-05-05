import { SectionHeader } from "@/components/section-header";
import { Shell } from "@/components/shell";

type RegisterPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

function getErrorMessage(error?: string) {
  if (error === "email_or_phone_exists") {
    return "该邮箱或手机号已注册，请直接登录。";
  }
  if (error === "invalid_register_payload") {
    return "注册信息不完整或格式不正确，请检查后重试。";
  }
  if (error === "api_unreachable") {
    return "后端服务不可达，请确认 API 服务已启动。";
  }
  if (error === "register_failed") {
    return "注册失败，请稍后重试。";
  }
  return "";
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const errorMessage = getErrorMessage(resolvedSearchParams?.error);
  return (
    <Shell activePath="/login">
      <main className="shell">
        <section className="page-grid two-col">
          <div className="section" data-unit="UNIT / REG-01">
            <div className="eyebrow">[ ACCOUNT CREATE / NEW OPERATOR ]</div>
            <h1 className="headline">
              CREATE
              <br />
              OPERATOR
              <br />
              ACCOUNT
            </h1>
            <p className="lede">
              关卡 1 先打通邮箱注册主链路，手机号和 OAuth 入口保留在 API 中。你要是连注册都没有，后面谈审核和互动都是空中楼阁。
            </p>
          </div>
          <div className="section" data-unit="UNIT / REG-02">
            <SectionHeader
              eyebrow="[ REGISTER FORM ]"
              title="ONBOARD PANEL"
              copy="提交后调用 /v1/auth/register，成功后引导到登录页完成登录。"
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
                  NICKNAME
                </label>
                <input id="nickname" name="nickname" required />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="email">
                  EMAIL
                </label>
                <input id="email" name="email" required type="email" />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="password">
                  PASSWORD
                </label>
                <input id="password" minLength={8} name="password" required type="password" />
              </div>
              <div className="action-row">
                <button className="action" type="submit">
                  CREATE ACCOUNT
                </button>
                <a className="ghost-action" href="/login">
                  BACK TO LOGIN
                </a>
              </div>
            </form>
          </div>
        </section>
      </main>
    </Shell>
  );
}
