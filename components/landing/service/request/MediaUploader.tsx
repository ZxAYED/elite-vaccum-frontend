"use client";

import { ImageIcon, Trash2, UploadCloud, Video } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

import { mediaConstraints } from "./service-request-schema";
import type { ServiceRequestFormValues } from "./service-request-schema";

type MediaFile = ServiceRequestFormValues["media"][number];

interface MediaUploaderProps {
  value: MediaFile[];
  onChange: (files: MediaFile[]) => void;
}

const acceptedTypes = new Set<string>(mediaConstraints.acceptedMediaTypes);

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaUploader({ value, onChange }: MediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    return () => {
      value.forEach((file) => {
        URL.revokeObjectURL(file.previewUrl);
      });
    };
  }, [value]);

  function addFiles(fileList: FileList | File[]) {
    const incoming = Array.from(fileList);
    const nextFiles: MediaFile[] = [];
    const nextErrors: string[] = [];
    const existingIds = new Set(value.map((file) => file.id));

    for (const file of incoming) {
      const fileId = `${file.name}-${file.lastModified}-${file.size}`;

      if (existingIds.has(fileId) || nextFiles.some((entry) => entry.id === fileId)) {
        nextErrors.push(`${file.name} is already added.`);
        continue;
      }

      if (!acceptedTypes.has(file.type)) {
        nextErrors.push("Upload JPG, PNG, WebP, MP4, or MOV files only.");
        continue;
      }

      if (file.size > mediaConstraints.maxFileSizeBytes) {
        nextErrors.push("Each file must be 50MB or smaller.");
        continue;
      }

      if (value.length + nextFiles.length >= mediaConstraints.maxFiles) {
        nextErrors.push(`Upload up to ${mediaConstraints.maxFiles} files.`);
        break;
      }

      nextFiles.push({
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type as MediaFile["type"],
        previewUrl: URL.createObjectURL(file),
      });
    }

    setError(nextErrors[0] ?? null);

    if (nextFiles.length) {
      onChange([...value, ...nextFiles]);
    }
  }

  function removeFile(fileId: string) {
    const removed = value.find((file) => file.id === fileId);
    if (removed) {
      URL.revokeObjectURL(removed.previewUrl);
    }
    onChange(value.filter((file) => file.id !== fileId));
  }

  return (
    <div>
      <div
        className={cn(
          "rounded-[1.25rem] border border-dashed border-teal-200 bg-white p-8 text-center transition",
          dragActive && "border-primary bg-[var(--brand-soft)]",
        )}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragActive(false);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          addFiles(event.dataTransfer.files);
        }}
      >
        <UploadCloud aria-hidden="true" className="mx-auto text-primary" size={32} />
        <p className="mt-4 text-sm font-semibold text-slate-900">
          Drag and drop photos or videos here
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Main unit, serial label, affected inlet, damaged part, or noise video.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-5"
          onClick={() => inputRef.current?.click()}
        >
          Browse files
        </Button>
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
          onChange={(event) => {
            if (event.target.files) {
              addFiles(event.target.files);
            }
            event.target.value = "";
          }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-4 text-xs text-slate-500">
        <span>
          {value.length}/{mediaConstraints.maxFiles} files selected
        </span>
        <span>Max 50MB each</span>
      </div>

      {error ? (
        <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : null}

      {value.length ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {value.map((file) => {
            const isVideo = file.type.startsWith("video/");

            return (
              <div
                key={file.id}
                className="flex items-center gap-3 rounded-[1rem] bg-slate-50 p-3"
              >
                <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white text-primary">
                  {isVideo ? (
                    <Video aria-hidden="true" size={24} />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={file.previewUrl}
                      alt=""
                      className="size-full object-cover"
                    />
                  )}
                  {!isVideo ? null : <span className="sr-only">Video file</span>}
                  {isVideo ? null : (
                    <ImageIcon className="sr-only" aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {file.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {isVideo ? "Video" : "Image"} - {formatSize(file.size)}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${file.name}`}
                  onClick={() => removeFile(file.id)}
                  className="inline-flex size-10 items-center justify-center rounded-full bg-white text-slate-400 transition hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)]"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
