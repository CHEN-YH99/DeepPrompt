import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { InteractionBar } from "@/components/interaction-bar";
import { PromptGallery } from "@/components/prompt-gallery";
import { Shell } from "@/components/shell";
import {
  fetchCurrentUser,
  fetchModels,
  fetchPromptRecordById,
  fetchRelatedPromptRecords
} from "@/lib/data";
import { applyVars, getDictionary } from "@/lib/i18n";

type PromptDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    created?: string;
  }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PromptDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const prompt = await fetchPromptRecordById(id).catch(() => null);
  const dict = getDictionary();
  if (!prompt) {
    return {
      title: dict.common.brand,
      description: dict.home.heroLede,
      robots: { index: false, follow: false }
    };
  }
  const description = prompt.excerpt?.trim() || prompt.promptText.slice(0, 160);
  const ogImage = prompt.images[0]?.url ?? prompt.cover;
  return {
    title: prompt.title,
    description,
    openGraph: {
      type: "article",
      title: prompt.title,
      description,
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : undefined
    },
    twitter: {
      card: "summary_large_image",
      title: prompt.title,
      description,
      images: ogImage ? [ogImage] : undefined
    },
    alternates: {
      canonical: `/prompts/${prompt.id}`
    }
  };
}

export default async function PromptDetailPage({
  params,
  searchParams
}: PromptDetailPageProps) {
  const dict = getDictionary();
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  const [prompt, currentUser] = await Promise.all([
    fetchPromptRecordById(id, accessToken),
    fetchCurrentUser(accessToken)
  ]);

  if (!prompt) {
    notFound();
  }

  const [relatedPrompts, models] = await Promise.all([
    fetchRelatedPromptRecords(prompt.id),
    fetchModels()
  ]);
  const promptModels = models.filter((model) => prompt.modelIds.includes(model.id));
  const paramEntries = Object.entries(prompt.paramsRecord);
  const statusLabelMap: Record<typeof prompt.status, string> = {
    approved: dict.common.status.approved,
    pending: dict.common.status.pending,
    draft: dict.common.status.draft,
    rejected: dict.common.status.rejected,
    archived: dict.common.status.archived
  };

  const createdMessage = resolvedSearchParams?.created === "1" ? dict.detail.createdNotice : "";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": `/prompts/${prompt.id}`,
    name: prompt.title,
    description: prompt.excerpt || prompt.promptText.slice(0, 220),
    abstract: prompt.promptText.slice(0, 500),
    keywords: [...prompt.styleTags, ...prompt.usageTags, ...prompt.colorTags].join(", "),
    image: prompt.images.map((image) => image.url).filter(Boolean),
    author: { "@type": "Person", name: prompt.author },
    datePublished: prompt.createdAt,
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/LikeAction",
        userInteractionCount: prompt.likes
      },
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/BookmarkAction",
        userInteractionCount: prompt.collects
      }
    ]
  };

  return (
    <Shell activePath="">
      <main className="shell">
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <section className="page-grid">
          <div className="section" data-unit="UNIT / DETAIL-01">
            <div className="eyebrow">{applyVars(dict.detail.promptKicker, { id: prompt.id })}</div>
            <h1 className="headline">{prompt.title}</h1>
            <p className="lede">{prompt.excerpt}</p>
            {createdMessage ? <p className="lede">{createdMessage}</p> : null}
            <InteractionBar
              copyLabels={dict.common.actions}
              initialCollectCount={prompt.collects}
              initialCollected={prompt.viewerCollected}
              initialLikeCount={prompt.likes}
              initialLiked={prompt.viewerLiked}
              isLoggedIn={Boolean(currentUser)}
              labels={dict.interactions}
              loginHref="/login?error=login_required"
              promptId={prompt.id}
              promptText={prompt.promptText}
            />
            <div className="action-row" style={{ marginTop: 10 }}>
              {promptModels[0] ? (
                <Link className="ghost-action" href={`/models/${promptModels[0].id}`}>
                  {dict.detail.actionOpenModelZone}
                </Link>
              ) : (
                <button className="ghost-action" type="button">
                  {dict.detail.actionOpenModelLink}
                </button>
              )}
              <button className="ghost-action" type="button">
                {dict.interactions.reportAction}
              </button>
            </div>
          </div>
        </section>

        <section className="detail-grid page-grid" style={{ marginTop: 14 }}>
          <div className="section media-panel" data-unit="UNIT / MEDIA-11">
            <PromptGallery images={prompt.images} title={prompt.title} />
            <div className="metric-board" style={{ marginTop: 16 }}>
              <div>
                <div className="mini-label">{dict.detail.metricLike}</div>
                <div className="card-value">{prompt.likes}</div>
              </div>
              <div>
                <div className="mini-label">{dict.detail.metricCollect}</div>
                <div className="card-value">{prompt.collects}</div>
              </div>
              <div>
                <div className="mini-label">{dict.detail.metricCopy}</div>
                <div className="card-value">{prompt.copies}</div>
              </div>
              <div>
                <div className="mini-label">{dict.detail.metricStatus}</div>
                <div className={`card-value status-badge ${prompt.status}`}>{statusLabelMap[prompt.status]}</div>
              </div>
            </div>
          </div>
          <div className="section detail-panel" data-unit="UNIT / META-04">
            <div className="detail-stack">
              <div>
                <div className="field-label">{dict.detail.primaryModel}</div>
                {promptModels.length === 0 ? (
                  <div className="card-value">{prompt.modelLabel}</div>
                ) : (
                  <div className="info-grid" style={{ marginTop: 8 }}>
                    {promptModels.map((model) => (
                      <Link className="model-tile" href={`/models/${model.id}`} key={model.id}>
                        <div className="card-kicker">{model.vendor}</div>
                        <div className="card-value">{model.displayName}</div>
                        <p className="mono-copy">
                          {dict.models.cardFormat} / {model.format.toUpperCase()} ·{" "}
                          {dict.models.cardNegative} /{" "}
                          {model.supportsNegative ? dict.home.negativeOn : dict.home.negativeOff} ·{" "}
                          {dict.models.cardParams} / {model.paramSchema.length}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <div className="field-label">{dict.detail.promptText}</div>
                <p className="detail-copy">{prompt.promptText}</p>
              </div>
              {prompt.negativePrompt ? (
                <div>
                  <div className="field-label">{dict.detail.negativePrompt}</div>
                  <p className="detail-copy">{prompt.negativePrompt}</p>
                </div>
              ) : null}
              <div>
                <div className="field-label">{dict.detail.parameters}</div>
                {paramEntries.length === 0 ? (
                  <p className="mono-copy">{dict.detail.paramNoData}</p>
                ) : (
                  <div className="list-table" style={{ marginTop: 8 }}>
                    <div className="table-row head">
                      <span>{dict.detail.paramKey}</span>
                      <span>{dict.detail.paramValue}</span>
                      <span>{dict.detail.paramSchemaLabel}</span>
                      <span>{dict.detail.paramType}</span>
                    </div>
                    {paramEntries.map(([key, value]) => {
                      const schemaField = promptModels
                        .flatMap((model) => model.paramSchema)
                        .find((field) => field.key === key);
                      return (
                        <div className="table-row" key={key}>
                          <span>{key.toUpperCase()}</span>
                          <span>{String(value)}</span>
                          <span>{schemaField?.label ?? "—"}</span>
                          <span>{(schemaField?.input_type ?? "text").toUpperCase()}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div>
                <div className="field-label">{dict.detail.styleTags}</div>
                <div className="tag-row">
                  {prompt.styleTags.map((tag) => (
                    <Link
                      className="tag"
                      href={`/search?style_tags=${encodeURIComponent(tag)}`}
                      key={tag}
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <div className="field-label">{dict.detail.colorTags}</div>
                <div className="tag-row">
                  {prompt.colorTags.map((tag) => (
                    <Link
                      className="tag"
                      href={`/search?color_tags=${encodeURIComponent(tag)}`}
                      key={tag}
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <div className="field-label">{dict.detail.usageNote}</div>
                <p className="detail-copy">{prompt.note}</p>
              </div>
              <div>
                <div className="field-label">{dict.detail.authorTime}</div>
                <p className="detail-copy">
                  {prompt.author} / {prompt.createdAt}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="page-grid" style={{ marginTop: 14 }}>
          <div className="section" data-unit="UNIT / LINK-17">
            <div className="eyebrow">{dict.detail.relatedEyebrow}</div>
            {relatedPrompts.length === 0 ? (
              <p className="mono-copy" style={{ marginTop: 12 }}>
                {dict.detail.relatedEmpty}
              </p>
            ) : (
              <div className="library-grid">
                {relatedPrompts.map((item) => (
                  <div className="library-card" key={item.id}>
                    <div className="card-kicker">{item.modelLabel}</div>
                    <div className="card-value">{item.title}</div>
                    <p className="mono-copy">{item.excerpt}</p>
                    <a className="micro-action" href={`/prompts/${item.id}`}>
                      {dict.detail.openRelated}
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </Shell>
  );
}
