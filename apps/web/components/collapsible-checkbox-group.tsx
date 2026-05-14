"use client";

import { useState } from "react";

type CheckboxItem = {
  value: string;
  label: string;
  count?: number;
};

type CollapsibleCheckboxGroupProps = {
  label: string;
  name: string;
  items: CheckboxItem[];
  defaultChecked: string[];
  initialVisible?: number;
  expandLabel: string;
  collapseLabel: string;
};

export function CollapsibleCheckboxGroup({
  label,
  name,
  items,
  defaultChecked,
  initialVisible = 3,
  expandLabel,
  collapseLabel
}: CollapsibleCheckboxGroupProps) {
  const [expanded, setExpanded] = useState(false);
  const needsCollapse = items.length > initialVisible;

  return (
    <div className="field">
      <div className="field-label">{label}</div>
      <div
        className="collapsible-body"
        data-expanded={expanded || !needsCollapse}
      >
        <div className="checkbox-grid">
          {items.map((item) => (
            <label className="checkbox-item" key={item.value}>
              <input
                defaultChecked={defaultChecked.includes(item.value)}
                name={name}
                type="checkbox"
                value={item.value}
              />
              <span>
                {item.label}
                {typeof item.count === "number" ? ` (${item.count})` : ""}
              </span>
            </label>
          ))}
        </div>
      </div>
      {needsCollapse ? (
        <button
          className="micro-action"
          onClick={() => setExpanded((prev) => !prev)}
          type="button"
        >
          {expanded ? collapseLabel : expandLabel}
        </button>
      ) : null}
    </div>
  );
}
