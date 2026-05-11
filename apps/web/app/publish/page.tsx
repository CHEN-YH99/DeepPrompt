import { PublishForm } from "@/components/publish-form";
import { SectionHeader } from "@/components/section-header";
import { Shell } from "@/components/shell";
import { defaultModel, fetchModels } from "@/lib/data";
import { getDictionary } from "@/lib/i18n";

type PublishPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function PublishPage({ searchParams }: PublishPageProps) {
  const dict = getDictionary();

  function getPublishErrorMessage(error?: string) {
    if (error === "login_required") return dict.publish.errorLoginRequired;
    if (error === "invalid_prompt_payload") return dict.publish.errorInvalidPayload;
    if (error === "api_unreachable") return dict.publish.errorApiUnreachable;
    if (error === "upload_failed") return dict.publish.errorUploadFailed;
    if (error === "publish_failed") return dict.publish.errorPublishFailed;
    return "";
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const errorMessage = getPublishErrorMessage(resolvedSearchParams?.error);
  const models = await fetchModels();
  const firstModel = models[0] ?? defaultModel;

  return (
    <Shell activePath="/publish">
      <main className="shell">
        <section className="page-grid two-col">
          <div className="section" data-unit="UNIT / PUB-01">
            <div className="eyebrow">{dict.publish.heroKicker}</div>
            <h1 className="headline">
              {dict.publish.heroTitleLine1}
              <br />
              {dict.publish.heroTitleLine2}
              <br />
              {dict.publish.heroTitleLine3}
            </h1>
            <p className="lede">{dict.publish.heroLede}</p>
            <div className="panel-grid" style={{ marginTop: 18 }}>
              {[dict.publish.step1, dict.publish.step2, dict.publish.step3].map((item) => (
                <div className="telemetry-card" key={item}>
                  <div className="card-value">{item}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="section" data-unit="UNIT / PUB-02">
            <SectionHeader
              eyebrow={dict.publish.policyEyebrow}
              title={dict.publish.policyTitle}
              copy={dict.publish.policyCopy}
            />
            <div className="card-list" style={{ marginTop: 18 }}>
              {[
                dict.publish.policyItem1,
                dict.publish.policyItem2,
                dict.publish.policyItem3,
                dict.publish.policyItem4
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
              eyebrow={dict.publish.formEyebrow}
              title={dict.publish.formTitle}
              copy={dict.publish.formCopy}
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
                <div className="card-kicker">{dict.publish.chipPromptRequired}</div>
                <div className="card-value">{dict.publish.chipPromptText}</div>
              </div>
              <div className="telemetry-card">
                <div className="card-kicker">{dict.publish.chipModelRequired}</div>
                <div className="card-value">{dict.publish.chipModelTag}</div>
              </div>
              <div className="telemetry-card">
                <div className="card-kicker">{dict.publish.chipNegativeOptional}</div>
                <div className="card-value">{dict.publish.chipNegative}</div>
              </div>
            </div>
            <form
              action="/api/prompts"
              encType="multipart/form-data"
              method="post"
              style={{ marginTop: 18 }}
            >
              <div className="form-split">
                <div className="section" data-unit="FORM / LEFT">
                  <div className="form-stack">
                    <div className="field">
                      <label className="field-label" htmlFor="title">
                        {dict.publish.title}
                      </label>
                      <input defaultValue="" id="title" name="title" required />
                    </div>
                    <div className="field">
                      <label className="field-label" htmlFor="prompt">
                        {dict.publish.promptText}
                      </label>
                      <textarea defaultValue="" id="prompt" name="prompt_text" required />
                    </div>
                    <div className="field">
                      <label className="field-label" htmlFor="negative">
                        {dict.publish.negativePrompt}
                      </label>
                      <textarea defaultValue="" id="negative" name="negative_prompt" />
                    </div>
                    <div className="field">
                      <label className="field-label" htmlFor="note">
                        {dict.publish.usageNote}
                      </label>
                      <textarea defaultValue="" id="note" name="usage_note" />
                    </div>
                  </div>
                </div>
                <div className="section" data-unit="FORM / RIGHT">
                  <PublishForm
                    initialModelId={firstModel.id}
                    initialParams={{}}
                    labels={dict.publish}
                    models={models}
                    negativeLabels={{
                      negativeOn: dict.home.negativeOn,
                      negativeOff: dict.home.negativeOff
                    }}
                  />
                  <div className="form-stack" style={{ marginTop: 18 }}>
                    <div className="field">
                      <label className="field-label" htmlFor="style-tags">
                        {dict.publish.styleTags}
                      </label>
                      <input defaultValue="" id="style-tags" name="style_tags" required />
                    </div>
                    <div className="field">
                      <label className="field-label" htmlFor="usage-tags">
                        {dict.publish.usageTags}
                      </label>
                      <input defaultValue="" id="usage-tags" name="usage_tags" />
                    </div>
                    <div className="field">
                      <label className="field-label" htmlFor="color-tags">
                        {dict.publish.colorTags}
                      </label>
                      <input defaultValue="" id="color-tags" name="color_tags" />
                    </div>
                    <div className="field">
                      <label className="field-label" htmlFor="images">
                        {dict.publish.imageFiles}
                      </label>
                      <input accept="image/*" id="images" multiple name="images" type="file" />
                      <div className="field-hint">{dict.publish.imageHint}</div>
                    </div>
                    <div className="field">
                      <label className="field-label" htmlFor="image-url">
                        {dict.publish.imageUrl}
                      </label>
                      <input
                        defaultValue=""
                        id="image-url"
                        name="image_url"
                        type="url"
                      />
                      <div className="field-hint">{dict.publish.imageUrlHint}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="action-row" style={{ marginTop: 18 }}>
                <button className="action" name="intent" type="submit" value="submit">
                  {dict.common.actions.publishLive}
                </button>
                <button className="ghost-action" name="intent" type="submit" value="draft">
                  {dict.common.actions.saveDraft}
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>
    </Shell>
  );
}
