import { SectionHeader } from "@/components/section-header";
import { Shell } from "@/components/shell";

export default function RegisterPage() {
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
