import { SectionHeader } from "@/components/section-header";
import { Shell } from "@/components/shell";
import { models } from "@/lib/data";

export default function PublishPage() {
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
              当前先完成前端视图和表单编排，后续可无缝接入 API 与审核队列。
            </p>
            <div className="panel-grid" style={{ marginTop: 18 }}>
              {[
                "STEP 01 / BASE INFO",
                "STEP 02 / IMAGE UPLOAD",
                "STEP 03 / TAG REFINEMENT"
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
              copy="发布后先进入待审核状态，审核通过后公开展示。内容安全、人工复核与积分奖励都在后续后端环节完成。"
            />
            <div className="card-list" style={{ marginTop: 18 }}>
              {[
                "1 / LOGIN REQUIRED",
                "2 / FILL PROMPT CORE FIELDS",
                "3 / UPLOAD 1 TO 6 IMAGES",
                "4 / AI TAG SUGGESTION",
                "5 / QUEUE FOR REVIEW",
                "6 / PUBLIC RELEASE + POINTS"
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
              copy="字段与需求文档对齐：Prompt、适用模型、风格标签、Negative Prompt、参数配置、使用说明和图片上传。"
            />
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
            <div className="form-split" style={{ marginTop: 18 }}>
              <div className="section" data-unit="FORM / LEFT">
                <div className="form-stack">
                  <div className="field">
                    <label className="field-label" htmlFor="title">
                      TITLE
                    </label>
                    <input defaultValue="TACTICAL PORTRAIT / NEON RAIN" id="title" />
                  </div>
                  <div className="field">
                    <label className="field-label" htmlFor="prompt">
                      PROMPT TEXT
                    </label>
                    <textarea
                      defaultValue="ultra realistic tactical portrait, rain soaked face, command terminal reflections, cold city bokeh, severe contrast"
                      id="prompt"
                    />
                  </div>
                  <div className="field">
                    <label className="field-label" htmlFor="negative">
                      NEGATIVE PROMPT
                    </label>
                    <textarea
                      defaultValue="blurry eyes, soft consumer lighting, pastel colors, rounded toy aesthetics"
                      id="negative"
                    />
                  </div>
                  <div className="field">
                    <label className="field-label" htmlFor="note">
                      USAGE NOTE
                    </label>
                    <textarea
                      defaultValue="建议搭配冷色赛博背景和强对比灯光，用于人物封面与专题头图。"
                      id="note"
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
                    <select defaultValue={models[0].id} id="model">
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
                    <input defaultValue="REALISM, CYBERPUNK, FILM GRAIN" id="style-tags" />
                  </div>
                  <div className="field">
                    <label className="field-label" htmlFor="usage-tags">
                      USAGE TAGS
                    </label>
                    <input defaultValue="PORTRAIT, KEY VISUAL" id="usage-tags" />
                  </div>
                  <div className="field">
                    <label className="field-label" htmlFor="params">
                      PARAM SCHEMA / VALUES
                    </label>
                    <textarea
                      defaultValue="AR=4:5&#10;QUALITY=HIGH&#10;DETAIL=85&#10;SEED=2204"
                      id="params"
                    />
                  </div>
                  <div className="field">
                    <label className="field-label" htmlFor="images">
                      IMAGE UPLOAD SLOT
                    </label>
                    <input defaultValue="01 MAIN IMAGE / 02 ALT / 03 ALT" id="images" />
                    <div className="field-hint">
                      SUPPORT / JPG PNG WEBP / 1 TO 6 FILES / SINGLE FILE ≤ 10MB
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="action-row" style={{ marginTop: 18 }}>
              <button className="action" type="button">
                SUBMIT FOR REVIEW
              </button>
              <button className="ghost-action" type="button">
                SAVE DRAFT
              </button>
              <button className="ghost-action" type="button">
                PREVIEW ENTRY
              </button>
            </div>
          </div>
        </section>
      </main>
    </Shell>
  );
}
