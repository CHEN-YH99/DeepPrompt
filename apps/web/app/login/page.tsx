import { SectionHeader } from "@/components/section-header";
import { Shell } from "@/components/shell";

export default function LoginPage() {
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
            <div className="form-stack" style={{ marginTop: 18 }}>
              <div className="field">
                <label className="field-label" htmlFor="account">
                  EMAIL / PHONE
                </label>
                <input defaultValue="operator@deepprompt.ai" id="account" />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="password">
                  PASSWORD
                </label>
                <input defaultValue="••••••••••••" id="password" type="password" />
              </div>
              <div className="action-row">
                <button className="action" type="button">
                  ENTER SYSTEM
                </button>
                <button className="ghost-action" type="button">
                  CREATE ACCOUNT
                </button>
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
            </div>
          </div>
        </section>
      </main>
    </Shell>
  );
}
