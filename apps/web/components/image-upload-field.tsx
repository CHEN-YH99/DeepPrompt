"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import imageCompression from "browser-image-compression";

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

// Vercel 免费版 payload 限制 4.5MB，扣除缓冲后图片可用 4MB
// 6 张图均分：4MB ÷ 6 ≈ 650KB/张
const MAX_FILE_SIZE = 650 * 1024; // 650KB
const MAX_TOTAL_SIZE = 4 * 1024 * 1024; // 4MB
const COMPRESS_TARGET_SIZE = 600 * 1024; // 压缩目标 600KB（低于限制 50KB 作为安全边际）

let uid = 0;

async function compressImageIfNeeded(file: File): Promise<File> {
  // 如果文件已经小于目标大小，直接返回
  if (file.size <= COMPRESS_TARGET_SIZE) {
    return file;
  }

  try {
    const options = {
      maxSizeMB: COMPRESS_TARGET_SIZE / (1024 * 1024), // 转换为 MB
      maxWidthOrHeight: 2048, // 最大宽高限制
      useWebWorker: true,
      fileType: file.type as "image/jpeg" | "image/png" | "image/webp"
    };

    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.warn("图片压缩失败，使用原文件", error);
    return file;
  }
}

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

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const newPreviews: FilePreview[] = [];
    const fileArray = Array.from(files);
    const errors: string[] = [];

    for (const originalFile of fileArray) {
      if (!originalFile.type.startsWith("image/")) continue;

      // 自动压缩超大图片
      let file = originalFile;
      if (originalFile.size > MAX_FILE_SIZE) {
        try {
          file = await compressImageIfNeeded(originalFile);
          // 如果压缩后还是超过限制，提示用户
          if (file.size > MAX_FILE_SIZE) {
            errors.push(`${originalFile.name} 即使压缩后仍超过 ${formatFileSize(MAX_FILE_SIZE)} 限制`);
            continue;
          }
        } catch (error) {
          console.error("压缩失败", error);
          errors.push(`${originalFile.name} 压缩失败`);
          continue;
        }
      }

      newPreviews.push({
        id: `img-${++uid}`,
        file,
        url: URL.createObjectURL(file),
        size: formatFileSize(file.size)
      });
    }

    if (errors.length > 0) {
      alert(`以下文件处理失败：\n${errors.join("\n")}`);
    }

    if (newPreviews.length > 0) {
      // 总大小校验
      setPreviews((prev) => {
        const currentTotal = prev.reduce((sum, p) => sum + p.file.size, 0);
        const newTotal = newPreviews.reduce((sum, p) => sum + p.file.size, 0);

        if (currentTotal + newTotal > MAX_TOTAL_SIZE) {
          alert(`图片总大小不能超过 ${formatFileSize(MAX_TOTAL_SIZE)}，当前已选 ${formatFileSize(currentTotal)}`);
          return prev;
        }

        // 最多 6 张图片
        const willHaveTotal = prev.length + newPreviews.length;
        if (willHaveTotal > 6) {
          alert(`最多只能上传 6 张图片，当前已选 ${prev.length} 张`);
          return prev;
        }

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

        return [...prev, ...newPreviews];
      });
    }
  }, []);

  const removeFile = useCallback((id: string) => {
    setPreviews((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        await addFiles(e.target.files);
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
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        await addFiles(e.dataTransfer.files);
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

    console.log("[ImageUploadField] syncing files, count:", previews.length);

    // 尝试使用 DataTransfer API（桌面浏览器）
    if (typeof DataTransfer !== "undefined") {
      try {
        const dt = new DataTransfer();
        for (const p of previews) {
          dt.items.add(p.file);
        }
        syncInputRef.current.files = dt.files;
        console.log("[ImageUploadField] DataTransfer success, files:", dt.files.length);
        return;
      } catch (error) {
        console.warn("[ImageUploadField] DataTransfer failed, using fallback", error);
      }
    }

    // 降级方案：在表单提交时手动处理（见下面的表单事件监听）
    console.log("[ImageUploadField] using fallback mode");
  }, [previews]);

  // 移动端降级方案：拦截表单提交，手动添加文件到 FormData
  useEffect(() => {
    const input = syncInputRef.current;
    if (!input) return;

    const form = input.closest("form");
    if (!form) return;

    const handleFormSubmit = (e: SubmitEvent) => {
      // 如果 DataTransfer 成功，直接跳过
      if (input.files && input.files.length > 0) {
        console.log("[ImageUploadField] form submit: DataTransfer mode, files:", input.files.length);
        return;
      }

      // 如果没有文件，也跳过
      if (filesRef.current.length === 0) {
        console.log("[ImageUploadField] form submit: no files to upload");
        return;
      }

      // 拦截表单提交，手动构建 FormData
      console.log("[ImageUploadField] form submit: fallback mode, manual FormData, files:", filesRef.current.length);
      e.preventDefault();

      const formData = new FormData(form);
      // 移除可能的空文件字段
      formData.delete(name);

      // 手动添加文件
      for (const file of filesRef.current) {
        formData.append(name, file);
      }

      console.log("[ImageUploadField] submitting with", filesRef.current.length, "files");

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
        <span style={{ display: "block", marginTop: 4, color: "var(--accent, #60a5fa)", fontSize: 12 }}>
          单张限制 {formatFileSize(MAX_FILE_SIZE)}，总大小限制 {formatFileSize(MAX_TOTAL_SIZE)}（超大图片会自动压缩）
        </span>
      </div>
    </div>
  );
}
