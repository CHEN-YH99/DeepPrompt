import dynamic from "next/dynamic";
import { cookies } from "next/headers";

import { ImageUploadFieldDirect } from "@/components/image-upload-field-direct";
import { PublishForm } from "@/components/publish-form";
import { PublishFormGuard } from "@/components/publish-form-guard";
import { SectionHeader } from "@/components/section-header";
import { TagPicker } from "@/components/tag-picker";
import { defaultModel, fetchModels } from "@/lib/data";
import { getDictionary } from "@/lib/i18n";
import { STYLE_OPTIONS, COLOR_OPTIONS, USAGE_OPTIONS } from "@/lib/tag-options";
import "../publish-loading.css";

const PublishLoadingOverlay = dynamic(
  () => import("@/components/publish-loading-overlay").then((m) => m.PublishLoadingOverlay)
);

type PublishPageProps = {
  searchParams?: Promise<{
    error?: string;
    detail?: string;
  }>;
};

// 发布失败回灌：API route 把已提交字段塞进 publish_draft cookie，这里读出来回灌 defaultValue。
// 图片文件浏览器不允许程序化恢复，仅文字段 + image_url 可保留。
type PublishDraft = {
  title?: string;
  prompt_text?: string;
  negative_prompt?: string;
  usage_note?: string;
  image_url?: string;
  model_id?: string;
  style_tags?: string[];
  usage_tags?: string[];
  color_tags?: string[];
  params?: Record<string, string>;
};

function readPublishDraft(rawCookie: string | undefined): PublishDraft {
  if (!rawCookie) return {};
  try {
    const decoded = decodeURIComponent(rawCookie);
    const parsed = JSON.parse(decoded) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as PublishDraft;
  } catch {
    return {};
  }
}

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
  const errorDetail = resolvedSearchParams?.detail?.trim() ?? "";
  const models = await fetchModels();
  const firstModel = models[0] ?? defaultModel;

  // 只有在错误回跳场景下才回灌（避免空白页面意外读到旧 cookie）。
  const shouldRestoreDraft = Boolean(resolvedSearchParams?.error);
  const cookieStore = await cookies();
  const rawDraft = cookieStore.get("publish_draft")?.value;
  const draft: PublishDraft = shouldRestoreDraft ? readPublishDraft(rawDraft) : {};

  const restoredModelId = draft.model_id && models.some((m) => m.id === draft.model_id)
    ? draft.model_id
    : firstModel.id;

  return (
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
              {errorDetail ? (
                <div style={{ marginTop: 6, fontSize: 12, opacity: 0.85 }}>{errorDetail}</div>
              ) : null}
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
            <PublishFormGuard />
            <div className="form-split">
              <div className="section" data-unit="FORM / LEFT">
                <div className="form-stack">
                  <div className="field">
                    <label className="field-label" htmlFor="title">
                      {dict.publish.title}
                    </label>
                    <input defaultValue={draft.title ?? ""} id="title" name="title" required />
                  </div>
                  <div className="field">
                    <label className="field-label" htmlFor="prompt">
                      {dict.publish.promptText}
                    </label>
                    <textarea
                      defaultValue={draft.prompt_text ?? ""}
                      id="prompt"
                      name="prompt_text"
                      required
                    />
                  </div>
                  <div className="field">
                    <label className="field-label" htmlFor="negative">
                      {dict.publish.negativePrompt}
                    </label>
                    <textarea
                      defaultValue={draft.negative_prompt ?? ""}
                      id="negative"
                      name="negative_prompt"
                    />
                  </div>
                  <div className="field">
                    <label className="field-label" htmlFor="note">
                      {dict.publish.usageNote}
                    </label>
                    <textarea
                      defaultValue={draft.usage_note ?? ""}
                      id="note"
                      name="usage_note"
                    />
                  </div>
                </div>
              </div>
              <div className="section" data-unit="FORM / RIGHT">
                <PublishForm
                  initialModelId={restoredModelId}
                  initialParams={draft.params ?? {}}
                  labels={dict.publish}
                  models={models}
                  negativeLabels={{
                    negativeOn: dict.home.negativeOn,
                    negativeOff: dict.home.negativeOff
                  }}
                />
                <div className="form-stack" style={{ marginTop: 18 }}>
                  <TagPicker
                    label={dict.publish.styleTags}
                    name="style_tags"
                    options={STYLE_OPTIONS.map((v) => ({
                      value: v,
                      label: dict.tags.style[v] ?? v
                    }))}
                    max={5}
                    required
                    maxHintLabel={dict.publish.tagMaxHint}
                    initialSelected={draft.style_tags ?? []}
                  />
                  <TagPicker
                    label={dict.publish.usageTags}
                    name="usage_tags"
                    options={USAGE_OPTIONS.map((v) => ({
                      value: v,
                      label: dict.tags.usage[v] ?? v
                    }))}
                    max={5}
                    maxHintLabel={dict.publish.tagMaxHint}
                    initialSelected={draft.usage_tags ?? []}
                  />
                  <TagPicker
                    label={dict.publish.colorTags}
                    name="color_tags"
                    options={COLOR_OPTIONS.map((v) => ({
                      value: v,
                      label: dict.tags.color[v] ?? v
                    }))}
                    max={5}
                    maxHintLabel={dict.publish.tagMaxHint}
                    initialSelected={draft.color_tags ?? []}
                  />
                  <ImageUploadFieldDirect
                    name="images"
                    label={dict.publish.imageFiles}
                    hint={dict.publish.imageHint}
                    extraHint={shouldRestoreDraft ? "（图片需要重新选择）" : undefined}
                  />
                  <div className="field">
                    <label className="field-label" htmlFor="image-url">
                      {dict.publish.imageUrl}
                    </label>
                    <input
                      defaultValue={draft.image_url ?? ""}
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
            <PublishLoadingOverlay />
          </form>
        </div>
      </section>
    </main>
  );
}
