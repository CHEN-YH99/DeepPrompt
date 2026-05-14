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
  const initiallyExpanded = defaultChecked.some((value) =>
    items.slice(initialVisible).some((item) => item.value === value)
  );
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const needsCollapse = items.length > initialVisible;
  const visibleItems = expanded || !needsCollapse ? items : items.slice(0, initialVisible);
  const hiddenCheckedValues = !expanded
    ? items.slice(initialVisible).filter((item) => defaultChecked.includes(item.value)).map((item) => item.value)
    : [];

  return (
    <div className="field">
      <div className="field-label">{label}</div>
      <div className="checkbox-grid">
        {visibleItems.map((item) => (
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
      {hiddenCheckedValues.map((value) => (
        <input key={value} name={name} type="hidden" value={value} />
      ))}
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
