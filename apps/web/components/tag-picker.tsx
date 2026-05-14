"use client";

import { useState } from "react";

type TagPickerProps = {
  label: string;
  name: string;
  options: readonly string[];
  max?: number;
  required?: boolean;
  maxHintLabel: string;
};

export function TagPicker({
  label,
  name,
  options,
  max = 5,
  required = false,
  maxHintLabel
}: TagPickerProps) {
  const [selected, setSelected] = useState<string[]>([]);

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
          const isActive = selected.includes(option);
          const isDisabled = atMax && !isActive;
          return (
            <label
              className={`checkbox-item${isDisabled ? " disabled" : ""}`}
              key={option}
            >
              <input
                checked={isActive}
                onChange={() => toggle(option)}
                type="checkbox"
                value={option}
              />
              <span>{option}</span>
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
