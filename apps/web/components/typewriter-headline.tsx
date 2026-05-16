"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const SELECTOR =
  "main > .page-grid.two-col:first-of-type > .section:first-child .headline";
const DURATION_MS = 1000;
const START_DELAY_MS = 200;

function typewrite(headline: HTMLElement) {
  if (headline.dataset.typewriter === "done") return;
  headline.dataset.typewriter = "done";

  const textNodes: Text[] = [];
  const walker = document.createTreeWalker(headline, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    if ((node as Text).nodeValue && (node as Text).nodeValue!.length > 0) {
      textNodes.push(node as Text);
    }
    node = walker.nextNode();
  }

  const totalChars = textNodes.reduce(
    (sum, t) => sum + [...(t.nodeValue ?? "")].length,
    0
  );
  if (totalChars === 0) return;

  const delayPerChar = DURATION_MS / totalChars;
  let charIndex = 0;

  for (const textNode of textNodes) {
    const chars = [...(textNode.nodeValue ?? "")];
    const fragment = document.createDocumentFragment();
    for (const ch of chars) {
      if (ch === " " || ch === "\n") {
        fragment.appendChild(document.createTextNode(ch));
        charIndex++;
        continue;
      }
      const span = document.createElement("span");
      span.className = "typewriter-char";
      span.textContent = ch;
      span.style.animationDelay = `${START_DELAY_MS + charIndex * delayPerChar}ms`;
      fragment.appendChild(span);
      charIndex++;
    }
    textNode.replaceWith(fragment);
  }

  headline.style.setProperty(
    "--typewriter-finish-ms",
    `${START_DELAY_MS + DURATION_MS}ms`
  );
}

export function TypewriterHeadline() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;
    let rafId = 0;

    function run() {
      if (cancelled) return;
      const el = document.querySelector<HTMLElement>(SELECTOR);
      if (el) {
        typewrite(el);
        return;
      }
      rafId = window.requestAnimationFrame(run);
    }

    run();

    return () => {
      cancelled = true;
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [pathname]);

  return null;
}
