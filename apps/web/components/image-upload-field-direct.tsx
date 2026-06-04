"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import imageCompression from "browser-image-compression";

type UploadedImage = {
  url: string;
  thumb_url: string;
  width: number;
  height: number;
  file_size: number;
};

type FilePreview = {
  id: string;
  file: File;
  url: string;
  size: string;
  uploadStatus: "pending" | "uploading" | "uploaded" | "error";
  uploadedData?: UploadedImage;
  errorMessage?: string;
};

type ImageUploadFieldDirectProps = {
  name: string;
  label: string;
  hint: string;
  accept?: string;
  multiple?: boolean;
  extraHint?: string;
  onUploadComplete?: (images: UploadedImage[]) => void;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// 客户端直传无 payload 限制，放宽到单张 5MB，总 30MB
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_TOTAL_SIZE = 30 * 1024 * 1024; // 30MB
const COMPRESS_TARGET_SIZE = 2 * 1024 * 1024; // 压缩目标 2MB（建议值，不强制）

let uid = 0;

async function compressImageIfNeeded(file: File): Promise<File> {
  // 如果文件小于 2MB，不压缩
  if (file.size <= COMPRESS_TARGET_SIZE) {
    return file;
  }

  try {
    const options = {
      maxSizeMB: COMPRESS_TARGET_SIZE / (1024 * 1024),
      maxWidthOrHeight: 2048,
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

async function uploadToR2(file: File, accessToken: string): Promise<UploadedImage> {
  // 1. 获取预签名 URL
  const presignRes = await fetch("/api/uploads/presign", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      filename: file.name || "upload.bin",
      content_type: file.type || "application/octet-stream"
    }),
    credentials: "include"
  });

  if (!presignRes.ok) {
    throw new Error(`获取上传签名失败: ${presignRes.status}`);
  }

  const presignJson = await presignRes.json() as {
    data?: { uploadUrl?: string; key?: string; publicUrl?: string };
  };

  const uploadUrl = presignJson.data?.uploadUrl;
  const key = presignJson.data?.key;
  const publicUrl = presignJson.data?.publicUrl;

  if (!uploadUrl || !key || !publicUrl) {
    throw new Error("预签名响应缺少必要字段");
  }

  // 2. 直接上传到 R2
  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "content-type": file.type || "application/octet-stream" },
    body: file
  });

  if (!putRes.ok) {
    throw new Error(`R2 上传失败: ${putRes.status}`);
  }

  // 3. 确认上传并获取缩略图
  let thumbUrl: string | null = publicUrl;
  let width = 1200;
  let height = 800;
  let fileSize = file.size;

  try {
    const confirmRes = await fetch(`/api/uploads/confirm/${encodeURIComponent(key)}`, {
      method: "POST",
      credentials: "include"
    });

    if (confirmRes.ok) {
      const confirmJson = await confirmRes.json() as {
        data?: { thumbUrl?: string | null; width?: number; height?: number; fileSize?: number };
      };
      if (confirmJson.data) {
        thumbUrl = confirmJson.data.thumbUrl ?? publicUrl;
        width = confirmJson.data.width || width;
        height = confirmJson.data.height || height;
        fileSize = confirmJson.data.fileSize || fileSize;
      }
    }
  } catch {
    // confirm 失败不阻塞
  }

  return {
    url: publicUrl,
    thumb_url: thumbUrl,
    width,
    height,
    file_size: fileSize
  };
}

export function ImageUploadFieldDirect({
  name,
  label,
  hint,
  accept = "image/*",
  multiple = true,
  extraHint,
  onUploadComplete
}: ImageUploadFieldDirectProps) {
  const [previews, setPreviews] = useState<FilePreview[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const uploadFile = useCallback(async (preview: FilePreview) => {
    setPreviews((prev) =>
      prev.map((p) => (p.id === preview.id ? { ...p, uploadStatus: "uploading" } : p))
    );

    try {
      const uploadedData = await uploadToR2(preview.file, "");
      setPreviews((prev) =>
        prev.map((p) =>
          p.id === preview.id ? { ...p, uploadStatus: "uploaded", uploadedData } : p
        )
      );
    } catch (error) {
      console.error("上传失败", error);
      setPreviews((prev) =>
        prev.map((p) =>
          p.id === preview.id
            ? {
                ...p,
                uploadStatus: "error",
                errorMessage: error instanceof Error ? error.message : "上传失败"
              }
            : p
        )
      );
    }
  }, []);

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
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

        const preview: FilePreview = {
          id: `img-${++uid}`,
          file,
          url: URL.createObjectURL(file),
          size: formatFileSize(file.size),
          uploadStatus: "pending"
        };

        newPreviews.push(preview);
      }

      if (errors.length > 0) {
        alert(`以下文件处理失败：\n${errors.join("\n")}`);
      }

      if (newPreviews.length > 0) {
        setPreviews((prev) => {
          const currentTotal = prev.reduce((sum, p) => sum + p.file.size, 0);
          const newTotal = newPreviews.reduce((sum, p) => sum + p.file.size, 0);

          if (currentTotal + newTotal > MAX_TOTAL_SIZE) {
            alert(`图片总大小不能超过 ${formatFileSize(MAX_TOTAL_SIZE)}，当前已选 ${formatFileSize(currentTotal)}`);
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

          // 自动开始上传
          for (const preview of newPreviews) {
            uploadFile(preview);
          }

          return [...prev, ...newPreviews];
        });
      }
    },
    [uploadFile]
  );

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

  // 通知父组件上传完成的图片
  useEffect(() => {
    const uploadedImages = previews
      .filter((p) => p.uploadStatus === "uploaded" && p.uploadedData)
      .map((p) => p.uploadedData!);

    if (onUploadComplete) {
      onUploadComplete(uploadedImages);
    }
  }, [previews, onUploadComplete]);

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
      <input
        ref={inputRef}
        accept={accept}
        id="images-trigger"
        multiple={multiple}
        onChange={handleChange}
        style={{ display: "none" }}
        type="file"
      />
      {/* 隐藏的 input 用于存储已上传的图片数据（JSON） */}
      <input
        name={name}
        type="hidden"
        value={JSON.stringify(
          previews
            .filter((p) => p.uploadStatus === "uploaded" && p.uploadedData)
            .map((p) => p.uploadedData)
        )}
      />
      {previews.length > 0 ? (
        <div className="image-preview-grid">
          {previews.map((p) => (
            <div className="image-preview-item" key={p.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt={p.file.name} className="image-preview-thumb" src={p.url} />
              <div className="image-preview-info">
                <span className="image-preview-name">{p.file.name}</span>
                <span className="image-preview-size">
                  {p.size}
                  {p.uploadStatus === "uploading" && " - 上传中..."}
                  {p.uploadStatus === "uploaded" && " - ✓"}
                  {p.uploadStatus === "error" && ` - 失败: ${p.errorMessage}`}
                </span>
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
