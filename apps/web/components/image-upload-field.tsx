"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type FilePreview = {
  id: string;
  file: File;
  url: string;
  size: string;
};

type ImageUploadFieldProps = {
  name: string;
  label: string;
  hint: string;
  accept?: string;
  multiple?: boolean;
  extraHint?: string;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

let uid = 0;

export function ImageUploadField({
  name,
  label,
  hint,
  accept = "image/*",
  multiple = true,
  extraHint
}: ImageUploadFieldProps) {
  const [previews, setPreviews] = useState<FilePreview[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const addFiles = useCallback((files: FileList | File[]) => {
    const newPreviews: FilePreview[] = [];
    const fileArray = Array.from(files);
    for (const file of fileArray) {
      if (!file.type.startsWith("image/")) continue;
      newPreviews.push({
        id: `img-${++uid}`,
        file,
        url: URL.createObjectURL(file),
        size: formatFileSize(file.size)
      });
    }
    if (newPreviews.length > 0) {
      const last = newPreviews[newPreviews.length - 1]!;
      const img = new Image();
      img.onload = () => {
        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
          document.dispatchEvent(
            new CustomEvent("image-aspect-detected", {
              detail: { width: img.naturalWidth, height: img.naturalHeight }
            })
          );
        }
      };
      img.src = last.url;
    }
    setPreviews((prev) => [...prev, ...newPreviews]);
  }, []);

  const removeFile = useCallback((id: string) => {
    setPreviews((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files);
      }
    },
    [addFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  // 同步 previews 到隐藏 input，让 form submit 能拿到文件。
  // 移动端兼容：使用 DataTransfer 或降级方案
  const syncInputRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef<File[]>([]);

  useEffect(() => {
    filesRef.current = previews.map((p) => p.file);

    if (!syncInputRef.current) return;

    // 尝试使用 DataTransfer API（桌面浏览器）
    if (typeof DataTransfer !== "undefined") {
      try {
        const dt = new DataTransfer();
        for (const p of previews) {
          dt.items.add(p.file);
        }
        syncInputRef.current.files = dt.files;
        return;
      } catch (error) {
        console.warn("DataTransfer failed, using fallback", error);
      }
    }

    // 降级方案：在表单提交时手动处理（见下面的表单事件监听）
  }, [previews]);

  // 移动端降级方案：拦截表单提交，手动添加文件到 FormData
  useEffect(() => {
    const input = syncInputRef.current;
    if (!input) return;

    const form = input.closest("form");
    if (!form) return;

    const handleFormSubmit = (e: SubmitEvent) => {
      // 如果 DataTransfer 成功，直接跳过
      if (input.files && input.files.length > 0) return;

      // 如果没有文件，也跳过
      if (filesRef.current.length === 0) return;

      // 拦截表单提交，手动构建 FormData
      e.preventDefault();

      const formData = new FormData(form);
      // 移除可能的空文件字段
      formData.delete(name);

      // 手动添加文件
      for (const file of filesRef.current) {
        formData.append(name, file);
      }

      // 重新提交
      fetch(form.action || window.location.href, {
        method: form.method || "POST",
        body: formData
      }).then((response) => {
        if (response.redirected) {
          window.location.href = response.url;
        } else {
          window.location.reload();
        }
      }).catch((error) => {
        console.error("Form submission failed", error);
        alert("上传失败，请重试");
      });
    };

    form.addEventListener("submit", handleFormSubmit);
    return () => {
      form.removeEventListener("submit", handleFormSubmit);
    };
  }, [name, previews]);

  return (
    <div className="field">
      <label className="field-label" htmlFor="images-trigger">
        {label}
      </label>
      <div
        ref={dropRef}
        className={`image-drop-zone${isDragging ? " is-dragging" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <span className="image-drop-text">
          {isDragging ? "松开即可上传" : "点击选择或拖拽图片到此处"}
        </span>
      </div>
      {/* 用户交互用的 input，选完即清空 value */}
      <input
        ref={inputRef}
        accept={accept}
        id="images-trigger"
        multiple={multiple}
        onChange={handleChange}
        style={{ display: "none" }}
        type="file"
      />
      {/* 真正提交给 form 的 input，files 由 DataTransfer 同步 */}
      {/* 移动端 DataTransfer 兼容性问题：如果失败则通过表单拦截手动处理 */}
      <input
        ref={syncInputRef}
        name={name}
        multiple={multiple}
        style={{ display: "none" }}
        type="file"
        tabIndex={-1}
        aria-hidden="true"
      />
      {previews.length > 0 ? (
        <div className="image-preview-grid">
          {previews.map((p) => (
            <div className="image-preview-item" key={p.id}>
              {/* blob URL 无法走 next/image 优化，此处只做本地预览 */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt={p.file.name} className="image-preview-thumb" src={p.url} />
              <div className="image-preview-info">
                <span className="image-preview-name">{p.file.name}</span>
                <span className="image-preview-size">{p.size}</span>
              </div>
              <button
                type="button"
                className="image-preview-remove"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(p.id);
                }}
                aria-label={`移除 ${p.file.name}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : null}
      <div className="field-hint">
        {hint}
        {extraHint ?? ""}
      </div>
    </div>
  );
}
