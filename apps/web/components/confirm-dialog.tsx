"use client";

import { useCallback, useEffect, useState } from "react";

type ConfirmDialogProps = {
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const close = useCallback(
    (action: "confirm" | "cancel") => {
      setVisible(false);
      setTimeout(() => {
        if (action === "confirm") onConfirm();
        else onCancel();
      }, 200);
    },
    [onConfirm, onCancel]
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") close("cancel");
  }

  return (
    <div
      className="confirm-overlay"
      data-visible={visible}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="confirm-backdrop" onClick={() => close("cancel")} />
      <div className="confirm-box" data-visible={visible}>
        <p className="confirm-msg">{message}</p>
        <div className="confirm-actions">
          <button className="confirm-cancel" onClick={() => close("cancel")} type="button">
            {cancelLabel}
          </button>
          <button className="confirm-ok" onClick={() => close("confirm")} type="button">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
