"use client";

import { useCallback, useRef, useState } from "react";

type SliderCaptchaProps = {
  label: string;
  successLabel: string;
  onVerified: () => void;
};

export function SliderCaptcha({ label, successLabel, onVerified }: SliderCaptchaProps) {
  const [offset, setOffset] = useState(0);
  const [verified, setVerified] = useState(false);
  const [dragging, setDragging] = useState(false);
  const startXRef = useRef(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  const getMaxOffset = useCallback(() => {
    if (!trackRef.current || !thumbRef.current) return 200;
    return trackRef.current.offsetWidth - thumbRef.current.offsetWidth;
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (verified) return;
      e.preventDefault();
      setDragging(true);
      startXRef.current = e.clientX - offset;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [verified, offset]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging || verified) return;
      const max = getMaxOffset();
      const next = Math.min(Math.max(e.clientX - startXRef.current, 0), max);
      setOffset(next);
    },
    [dragging, verified, getMaxOffset]
  );

  const handlePointerUp = useCallback(() => {
    if (!dragging || verified) return;
    setDragging(false);
    const max = getMaxOffset();
    if (offset >= max - 5) {
      setOffset(max);
      setVerified(true);
      onVerified();
    } else {
      setOffset(0);
    }
  }, [dragging, verified, offset, getMaxOffset, onVerified]);

  return (
    <div
      className="captcha-track"
      data-verified={verified}
      ref={trackRef}
    >
      <span className="captcha-label">{verified ? successLabel : label}</span>
      <div
        className="captcha-thumb"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        ref={thumbRef}
        style={{ transform: `translateX(${offset}px)` }}
      >
        {verified ? "✓" : "→"}
      </div>
    </div>
  );
}
