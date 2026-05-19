"use client";

import { useState } from "react";

type TagOption = { value: string; label: string };

type TagPickerProps = {
  label: string;
  name: string;
  options: TagOption[];
  max?: number;
  required?: boolean;
  maxHintLabel: string;
  initialSelected?: string[];
};

export function TagPicker({
  label,
  name,
  options,
  max = 5,
  required = false,
  maxHintLabel,
  initialSelected = []
}: TagPickerProps) {
  // 发布失败回灌：只接受当前 options 列表里存在的 value，去重并截断到 max。
  const [selected, setSelected] = useState<string[]>(() => {
    const allowed = new Set(options.map((o) => o.value));
    const seen = new Set<string>();
    const filtered: string[] = [];
    for (const value of initialSelected) {
      if (!allowed.has(value)) continue;
      if (seen.has(value)) continue;
      seen.add(value);
      filtered.push(value);
      if (filtered.length >= max) break;
    }
    return filtered;
  });

  function toggle(value: string) {
    setSelected((prev) => {
      if (prev.includes(value)) {
        return prev.filter((v) => v !== value);
      }
      if (prev.length >= max) return prev;
      return [...prev, value];
    });
  }

  const atMax = selected.length >= max;

  return (
    <div className="field">
      <div className="field-label">{label}</div>
      {atMax ? <div className="field-hint">{maxHintLabel}</div> : null}
      <div className="checkbox-grid">
        {options.map((option) => {
          const isActive = selected.includes(option.value);
          const isDisabled = atMax && !isActive;
          return (
            <label
              className={`checkbox-item${isDisabled ? " disabled" : ""}`}
              key={option.value}
            >
              <input
                checked={isActive}
                onChange={() => toggle(option.value)}
                type="checkbox"
                value={option.value}
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
      <input
        name={name}
        required={required && selected.length === 0}
        type="hidden"
        value={selected.join(",")}
      />
    </div>
  );
}
