"use client";

import { useEffect, useRef, useState } from "react";

type Intent = "submit" | "draft";

type Stage = {
  code: string;
  label: string;
  durationMs: number;
};

const STAGES_PUBLISH: Stage[] = [
  { code: "01", label: "AUTH HANDSHAKE", durationMs: 420 },
  { code: "02", label: "PAYLOAD VALIDATE", durationMs: 520 },
  { code: "03", label: "IMAGE STREAM", durationMs: 1100 },
  { code: "04", label: "METADATA SYNC", durationMs: 720 },
  { code: "05", label: "PUBLISH BROADCAST", durationMs: 9999 }
];

const STAGES_DRAFT: Stage[] = [
  { code: "01", label: "AUTH HANDSHAKE", durationMs: 380 },
  { code: "02", label: "PAYLOAD VALIDATE", durationMs: 460 },
  { code: "03", label: "IMAGE STREAM", durationMs: 880 },
  { code: "04", label: "DRAFT VAULT WRITE", durationMs: 9999 }
];

export function PublishLoadingOverlay() {
  const sentinelRef = useRef<HTMLSpanElement | null>(null);
  const [active, setActive] = useState(false);
  const [intent, setIntent] = useState<Intent>("submit");
  const [stageIndex, setStageIndex] = useState(0);
  const [packets, setPackets] = useState(0);
  const [bytes, setBytes] = useState(0);

  const stages = intent === "draft" ? STAGES_DRAFT : STAGES_PUBLISH;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const form = sentinel.closest("form");
    if (!form) return;

    function onSubmit(event: SubmitEvent) {
      if (event.defaultPrevented) return;
      event.preventDefault();

      const submitter = event.submitter as HTMLButtonElement | null;
      const value: Intent = submitter?.value === "draft" ? "draft" : "submit";

      const hidden = document.createElement("input");
      hidden.type = "hidden";
      hidden.name = "intent";
      hidden.value = value;
      form!.appendChild(hidden);

      setIntent(value);
      setStageIndex(0);
      setPackets(0);
      setBytes(0);
      setActive(true);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          form!.submit();
        });
      });
    }

    form.addEventListener("submit", onSubmit);
    return () => form.removeEventListener("submit", onSubmit);
  }, []);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let current = 0;

    function advance() {
      if (cancelled) return;
      if (current >= stages.length - 1) return;
      const stage = stages[current];
      if (!stage) return;
      window.setTimeout(() => {
        if (cancelled) return;
        current += 1;
        setStageIndex(current);
        advance();
      }, stage.durationMs);
    }

    advance();

    const packetTimer = window.setInterval(() => {
      setPackets((p) => (p + 1) % 6);
      setBytes((b) => b + Math.floor(2048 + Math.random() * 5120));
    }, 220);

    return () => {
      cancelled = true;
      window.clearInterval(packetTimer);
    };
  }, [active, stages]);

  if (!active) {
    return <span ref={sentinelRef} aria-hidden="true" style={{ display: "none" }} />;
  }

  const isDraft = intent === "draft";
  const headlineLine1 = isDraft ? "草稿" : "传输";
  const headlineLine2 = isDraft ? "归档" : "进行";
  const headlineLine3 = isDraft ? "中" : "中";
  const headlineAscii = isDraft ? "DRAFT VAULT" : "SECURE UPLINK";
  const subline = isDraft
    ? "正在将草稿写入私密档案库，仅作者本人可见。"
    : "正在通过加密通道把提示词推送至公共节点，请勿关闭页面。";
  const unitLabel = isDraft ? "UNIT / TX-DRAFT-04" : "UNIT / TX-LIVE-08";

  return (
    <div className="publish-loading-overlay" role="alertdialog" aria-busy="true" aria-live="assertive">
      <span ref={sentinelRef} aria-hidden="true" style={{ display: "none" }} />
      <div className="publish-loading-backdrop" />

      <div className="publish-loading-box" data-unit={unitLabel}>
        <div className="publish-loading-scanline" aria-hidden="true" />

        <div className="publish-loading-head">
          <div className="publish-loading-eyebrow">
            <span className="publish-loading-rec" aria-hidden="true" />
            [ {isDraft ? "DRAFT VAULT / WRITE LOCK" : "TRANSMITTING / SECURE CHANNEL"} ]
          </div>
          <div className="publish-loading-channel">CH-08 · ENC AES-256 · 1080P</div>
        </div>

        <div className="publish-loading-headline" aria-label={`${headlineLine1}${headlineLine2}${headlineLine3}`}>
          <span>{headlineLine1}</span>
          <span>{headlineLine2}</span>
          <span>{headlineLine3}</span>
        </div>
        <div className="publish-loading-ascii">{headlineAscii}</div>

        <p className="publish-loading-copy">{subline}</p>

        <ol className="publish-loading-stages">
          {stages.map((stage, index) => {
            const status =
              index < stageIndex ? "done" : index === stageIndex ? "active" : "pending";
            const dots = ".".repeat(Math.max(8, 28 - stage.label.length));
            const tail =
              status === "done" ? "OK" : status === "active" ? "TX" : "STDBY";
            return (
              <li key={stage.code} className="publish-loading-stage" data-status={status}>
                <span className="publish-loading-stage-code">[{stage.code}]</span>
                <span className="publish-loading-stage-label">{stage.label}</span>
                <span className="publish-loading-stage-dots" aria-hidden="true">
                  {dots}
                </span>
                <span className="publish-loading-stage-tail">{tail}</span>
              </li>
            );
          })}
        </ol>

        <div className="publish-loading-bar" aria-hidden="true">
          <div className="publish-loading-bar-track">
            <div className="publish-loading-bar-fill" />
          </div>
          <div className="publish-loading-bar-meta">
            <span>PACKET {packets + 1} / 06</span>
            <span>{bytes.toLocaleString("en-US")} B</span>
            <span>ENCRYPTED</span>
          </div>
        </div>

        <div className="publish-loading-foot">
          <span>DO NOT CLOSE · 请勿关闭页面</span>
          <span className="publish-loading-pulse">●</span>
        </div>

        <span className="publish-loading-corner publish-loading-corner-tl" aria-hidden="true" />
        <span className="publish-loading-corner publish-loading-corner-tr" aria-hidden="true" />
        <span className="publish-loading-corner publish-loading-corner-bl" aria-hidden="true" />
        <span className="publish-loading-corner publish-loading-corner-br" aria-hidden="true" />
      </div>
    </div>
  );
}
