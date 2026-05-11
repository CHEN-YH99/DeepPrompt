"use client";

import { useMemo, useState } from "react";

import type { ModelRecord } from "@/lib/data";
import type { Dictionary } from "@/lib/i18n";

type PublishFormProps = {
  models: ModelRecord[];
  initialModelId: string;
  initialParams: Record<string, string | number>;
  labels: Dictionary["publish"];
  negativeLabels: Pick<Dictionary["home"], "negativeOn" | "negativeOff">;
};

export function PublishForm({
  models,
  initialModelId,
  initialParams,
  labels,
  negativeLabels
}: PublishFormProps) {
  const [modelId, setModelId] = useState(initialModelId);
  const [paramValues, setParamValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      Object.entries(initialParams).map(([key, value]) => [key, String(value ?? "")])
    )
  );

  const activeModel = useMemo(
    () => models.find((model) => model.id === modelId) ?? models[0],
    [models, modelId]
  );

  const paramSchema = activeModel?.paramSchema ?? [];

  return (
    <div className="form-stack">
      <div className="field">
        <label className="field-label" htmlFor="model">
          {labels.modelRegistry}
        </label>
        <select
          id="model"
          name="model_id"
          onChange={(event) => setModelId(event.target.value)}
          required
          value={modelId}
        >
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.displayName}
            </option>
          ))}
        </select>
        {activeModel ? (
          <div className="field-hint">
            {labels.modelVendor} / {activeModel.vendor} · {labels.modelFormat} /{" "}
            {activeModel.format.toUpperCase()} · {labels.modelNegative} /{" "}
            {activeModel.supportsNegative ? negativeLabels.negativeOn : negativeLabels.negativeOff}
          </div>
        ) : null}
      </div>

      <div className="field">
        <div className="field-label">{labels.paramHeader}</div>
        {paramSchema.length === 0 ? (
          <div className="field-hint">{labels.paramEmpty}</div>
        ) : (
          <div className="dynamic-params-grid">
            {paramSchema.map((field) => {
              const fieldName = `param__${field.key}`;
              const currentValue = paramValues[field.key] ?? String(field.default_value ?? "");
              const onChange = (value: string) =>
                setParamValues((prev) => ({ ...prev, [field.key]: value }));

              if (field.input_type === "select" && field.options && field.options.length > 0) {
                return (
                  <div className="field" key={field.key}>
                    <label className="field-label" htmlFor={fieldName}>
                      {field.label}
                    </label>
                    <select
                      id={fieldName}
                      name={fieldName}
                      onChange={(event) => onChange(event.target.value)}
                      value={currentValue}
                    >
                      {field.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {field.help_text ? <div className="field-hint">{field.help_text}</div> : null}
                  </div>
                );
              }

              if (field.input_type === "textarea") {
                return (
                  <div className="field" key={field.key} style={{ gridColumn: "1 / -1" }}>
                    <label className="field-label" htmlFor={fieldName}>
                      {field.label}
                    </label>
                    <textarea
                      id={fieldName}
                      name={fieldName}
                      onChange={(event) => onChange(event.target.value)}
                      placeholder={field.placeholder}
                      value={currentValue}
                    />
                    {field.help_text ? <div className="field-hint">{field.help_text}</div> : null}
                  </div>
                );
              }

              return (
                <div className="field" key={field.key}>
                  <label className="field-label" htmlFor={fieldName}>
                    {field.label}
                  </label>
                  <input
                    id={fieldName}
                    inputMode={field.input_type === "number" ? "decimal" : undefined}
                    name={fieldName}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={field.placeholder}
                    type={field.input_type === "number" ? "number" : "text"}
                    value={currentValue}
                  />
                  {field.help_text ? <div className="field-hint">{field.help_text}</div> : null}
                </div>
              );
            })}
          </div>
        )}
        <input name="param_keys" type="hidden" value={paramSchema.map((field) => field.key).join(",")} />
      </div>
    </div>
  );
}
