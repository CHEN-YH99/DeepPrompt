import { SectionHeader } from "@/components/section-header";
import { Shell } from "@/components/shell";
import { defaultModel, fetchModels } from "@/lib/data";

type PublishPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

function getPublishErrorMessage(error?: string) {
  if (error === "login_required") {
    return "请先登录再发布 Prompt。";
  }
  if (error === "invalid_prompt_payload") {
    return "标题、Prompt、模型和示例图链接不能为空。";
  }
  if (error === "api_unreachable") {
    return "后端服务不可达，请确认 API 服务已启动。";
  }
  if (error === "publish_failed") {
    return "发布失败，请检查字段后重试。";
  }
  return "";
}

export default async function PublishPage({ searchParams }: PublishPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const errorMessage = getPublishErrorMessage(resolvedSearchParams?.error);
  const models = await fetchModels();
  const firstModel = models[0] ?? defaultModel;

  return (
    <Shell activePath="/publish">
      <main className="shell">
        <section className="page-grid two-col">
          <div className="section" data-unit="UNIT / PUB-01">
            <div className="eyebrow">[ SUBMIT PROMPT / STEP FLOW ]</div>
            <h1 className="headline">
              PUBLISH
              <br />
              CONTROL
              <br />
              PANEL
            </h1>
            <p className="lede">
              页面结构对应 PRD 的四步发布路径：基础信息、图片上传、标签完善、预览确认。
              当前第二关先用图片 URL 打通主链路，R2 直传留到后续关卡，别一口吃成胖虎。
            </p>
            <div className="panel-grid" style={{ marginTop: 18 }}>
              {[
                "STEP 01 / BASE INFO",
                "STEP 02 / IMAGE URL",
                "STEP 03 / SUBMIT REVIEW"
              ].map((item) => (
                <div className="telemetry-card" key={item}>
                  <div className="card-value">{item}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="section" data-unit="UNIT / PUB-02">
            <SectionHeader
              eyebrow="[ REVIEW POLICY ]"
              title="MODERATION PATH"
              copy="发布后先进入待审核状态，作者可立刻在我的 Prompt 看到记录。"
            />
            <div className="card-list" style={{ marginTop: 18 }}>
              {[
                "1 / LOGIN REQUIRED",
                "2 / FILL PROMPT CORE FIELDS",
                "3 / PROVIDE IMAGE URL",
                "4 / QUEUE FOR REVIEW"
              ].map((item) => (
                <div className="telemetry-card" key={item}>
                  <div className="card-value">{item}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="page-grid" style={{ marginTop: 14 }}>
          <div className="section form-panel" data-unit="UNIT / FORM-08">
            <SectionHeader
              eyebrow="[ AUTHORING FORM ]"
              title="PROMPT INPUT ARRAY"
              copy="字段与需求文档对齐：Prompt、适用模型、风格标签、Negative Prompt、参数配置、使用说明和示例图。"
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
            <div className="form-grid" style={{ marginTop: 18 }}>
              <div className="telemetry-card">
                <div className="card-kicker">REQUIRED FIELD</div>
                <div className="card-value">PROMPT TEXT</div>
              </div>
              <div className="telemetry-card">
                <div className="card-kicker">REQUIRED FIELD</div>
                <div className="card-value">MODEL TAG</div>
              </div>
              <div className="telemetry-card">
                <div className="card-kicker">OPTIONAL FIELD</div>
                <div className="card-value">NEGATIVE PROMPT</div>
              </div>
            </div>
            <form action="/api/prompts" method="post" style={{ marginTop: 18 }}>
              <div className="form-split">
                <div className="section" data-unit="FORM / LEFT">
                  <div className="form-stack">
                    <div className="field">
                      <label className="field-label" htmlFor="title">
                        TITLE
                      </label>
                      <input defaultValue="TACTICAL PORTRAIT / NEON RAIN" id="title" name="title" required />
                    </div>
                    <div className="field">
                      <label className="field-label" htmlFor="prompt">
                        PROMPT TEXT
                      </label>
                      <textarea
                        defaultValue="ultra realistic tactical portrait, rain soaked face, command terminal reflections, cold city bokeh, severe contrast"
                        id="prompt"
                        name="prompt_text"
                        required
                      />
                    </div>
                    <div className="field">
                      <label className="field-label" htmlFor="negative">
                        NEGATIVE PROMPT
                      </label>
                      <textarea
                        defaultValue="blurry eyes, soft consumer lighting, pastel colors, rounded toy aesthetics"
                        id="negative"
                        name="negative_prompt"
                      />
                    </div>
                    <div className="field">
                      <label className="field-label" htmlFor="note">
                        USAGE NOTE
                      </label>
                      <textarea
                        defaultValue="建议搭配冷色赛博背景和强对比灯光，用于人物封面与专题头图。"
                        id="note"
                        name="usage_note"
                      />
                    </div>
                  </div>
                </div>
                <div className="section" data-unit="FORM / RIGHT">
                  <div className="form-stack">
                    <div className="field">
                      <label className="field-label" htmlFor="model">
                        MODEL REGISTRY
                      </label>
                      <select defaultValue={firstModel.id} id="model" name="model_id" required>
                        {models.map((model) => (
                          <option key={model.id} value={model.id}>
                            {model.displayName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label className="field-label" htmlFor="style-tags">
                        STYLE TAGS
                      </label>
                      <input defaultValue="REALISM, CYBERPUNK, FILM GRAIN" id="style-tags" name="style_tags" required />
                    </div>
                    <div className="field">
                      <label className="field-label" htmlFor="usage-tags">
                        USAGE TAGS
                      </label>
                      <input defaultValue="PORTRAIT, KEY VISUAL" id="usage-tags" name="usage_tags" />
                    </div>
                    <div className="field">
                      <label className="field-label" htmlFor="color-tags">
                        COLOR TAGS
                      </label>
                      <input defaultValue="COLD, RED SHIFT" id="color-tags" name="color_tags" />
                    </div>
                    <div className="field">
                      <label className="field-label" htmlFor="params">
                        PARAM SCHEMA / VALUES
                      </label>
                      <textarea
                        defaultValue={"AR=4:5\nQUALITY=HIGH\nDETAIL=85\nSEED=2204"}
                        id="params"
                        name="params_json"
                      />
                    </div>
                    <div className="field">
                      <label className="field-label" htmlFor="images">
                        IMAGE URL / MVP SLOT
                      </label>
                      <input
                        defaultValue="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80"
                        id="images"
                        name="image_url"
                        required
                        type="url"
                      />
                      <div className="field-hint">
                        MVP 阶段先提交图片 URL；R2 预签名上传留到后续关卡。
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="action-row" style={{ marginTop: 18 }}>
                <button className="action" name="intent" type="submit" value="submit">
                  SUBMIT FOR REVIEW
                </button>
                <button className="ghost-action" name="intent" type="submit" value="draft">
                  SAVE DRAFT
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>
    </Shell>
  );
}
