"use client";

import { useMemo, useState } from "react";
import {
  Download,
  Film,
  Image as ImageIcon,
  Maximize2,
  Play,
  Sparkles,
  Trash2,
} from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/Dialog";
import { formatBytes } from "@/lib/formatters";
import { API_BASE_URL } from "@/redux/constants";
import type { ServiceRequestAttachment } from "@/types/domain";

export interface MediaItem {
  id?: string;
  fileName?: string;
  fileType?: string;
  sizeBytes?: number;
  uploadedAt?: string;
  kind?: "photo" | "video" | "document" | string;
  url?: string;
  category?: string;
  note?: string;
}

export interface MediaGalleryPreviewProps {
  attachments?: (ServiceRequestAttachment | MediaItem)[];
  title?: string;
  description?: string;
  emptyMessage?: string;
  emptyDescription?: string;
  className?: string;
  columnsClass?: string;
  compact?: boolean;
  onDelete?: (attachmentId: string) => void;
}

export function resolveMediaUrl(att: { url?: string; fileName?: string }): string {
  if (att.url) {
    if (
      att.url.startsWith("http://") ||
      att.url.startsWith("https://") ||
      att.url.startsWith("blob:") ||
      att.url.startsWith("data:")
    ) {
      return att.url;
    }
    const base = API_BASE_URL || "http://localhost:3000";
    return `${base.replace(/\/$/, "")}/${att.url.replace(/^\//, "")}`;
  }
  if (att.fileName) {
    const base = API_BASE_URL || "http://localhost:3000";
    return `${base.replace(/\/$/, "")}/uploads/${att.fileName}`;
  }
  return "";
}

export function isVideoMedia(att: {
  fileType?: string;
  fileName?: string;
  kind?: string;
}): boolean {
  if (att.kind === "video") return true;
  if (att.fileType?.startsWith("video/")) return true;
  const name = (att.fileName || "").toLowerCase();
  return (
    name.endsWith(".mp4") ||
    name.endsWith(".webm") ||
    name.endsWith(".mov") ||
    name.endsWith(".mkv") ||
    name.endsWith(".avi")
  );
}

export function isImageMedia(att: {
  fileType?: string;
  fileName?: string;
  kind?: string;
}): boolean {
  if (att.kind === "photo") return true;
  if (att.fileType?.startsWith("image/")) return true;
  const name = (att.fileName || "").toLowerCase();
  return (
    name.endsWith(".png") ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".webp") ||
    name.endsWith(".avif") ||
    name.endsWith(".gif") ||
    name.endsWith(".svg")
  );
}

export function MediaGalleryPreview({
  attachments = [],
  title = "Photos & Video Media",
  description,
  emptyMessage = "No media attachments for this service",
  emptyDescription = "No inspection photos or video recordings were submitted with this ticket.",
  className = "",
  columnsClass = "grid-cols-2 sm:grid-cols-3 md:grid-cols-3",
  compact = false,
  onDelete,
}: MediaGalleryPreviewProps) {
  const [activeMedia, setActiveMedia] = useState<MediaItem | null>(null);

  // Filter only images and videos
  const mediaItems = useMemo(() => {
    return attachments.filter(
      (item) => isImageMedia(item) || isVideoMedia(item),
    );
  }, [attachments]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with Title & Count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <ImageIcon size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500">
              {description ||
                `${mediaItems.length} ${mediaItems.length === 1 ? "file attached" : "files attached"}`}
            </p>
          </div>
        </div>
      </div>

      {/* Media Gallery Grid */}
      {mediaItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-teal-200 bg-teal-50/20 p-8 text-center">
          <div className="flex size-10 items-center justify-center rounded-md bg-white text-teal-700 shadow-xs border border-teal-200">
            <Sparkles size={18} />
          </div>
          <p className="mt-3 text-sm font-bold text-slate-800">
            {emptyMessage}
          </p>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
            {emptyDescription}
          </p>
        </div>
      ) : (
        <div className={`grid gap-3.5 ${columnsClass}`}>
          {mediaItems.map((item, idx) => {
            const isVid = isVideoMedia(item);
            const mediaSrc = resolveMediaUrl(item);
            const key = item.id || item.fileName || `media-${idx}`;

            return (
              <motion.div
                key={key}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={`group relative ${compact ? "aspect-square" : "aspect-[4/3]"} overflow-hidden rounded-lg border border-slate-200 bg-slate-900 shadow-xs transition hover:border-teal-500 hover:shadow-md`}
              >
                {/* Visual Media Rendering */}
                <div
                  onClick={() => setActiveMedia(item)}
                  className="size-full cursor-pointer"
                >
                  {isVid ? (
                    <div className="relative size-full bg-slate-950 flex items-center justify-center">
                      <video
                        src={mediaSrc}
                        className="size-full object-cover opacity-75"
                        preload="metadata"
                        muted
                        playsInline
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px] transition group-hover:bg-black/10">
                        <div className="flex size-10 items-center justify-center rounded-full bg-white/90 text-teal-900 shadow-lg transition group-hover:scale-110 group-hover:bg-white">
                          <Play size={18} className="translate-x-0.5 fill-current" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative size-full bg-slate-100">
                      <img
                        src={mediaSrc}
                        alt={item.fileName || "Inspection attachment"}
                        className="size-full object-cover transition duration-300 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80";
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Glass Badge (Type & Size) */}
                <div className="absolute top-2 left-2 flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md">
                  {isVid ? <Film size={10} /> : <ImageIcon size={10} />}
                  <span>{isVid ? "Video" : "Photo"}</span>
                  {item.sizeBytes ? (
                    <span className="text-white/70">· {formatBytes(item.sizeBytes)}</span>
                  ) : null}
                </div>

                {/* Delete button (if onDelete enabled) */}
                {onDelete && item.id && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (item.id) onDelete(item.id);
                    }}
                    title="Delete attachment"
                    className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-md bg-black/60 text-white backdrop-blur-md transition hover:bg-rose-600 hover:text-white"
                  >
                    <Trash2 size={13} />
                  </button>
                )}

                {/* Bottom Overlay with Filename */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2.5 pt-6 text-white opacity-90 transition group-hover:opacity-100 pointer-events-none">
                  <p className="truncate text-xs font-medium">{item.fileName || "Inspection File"}</p>
                </div>

                {/* Hover Action Overlay */}
                <div
                  onClick={() => setActiveMedia(item)}
                  className="absolute inset-0 flex items-center justify-center bg-teal-950/40 opacity-0 backdrop-blur-[1px] transition group-hover:opacity-100 cursor-pointer pointer-events-none"
                >
                  <div className="inline-flex items-center gap-1.5 rounded-md bg-white/95 px-3 py-1.5 text-xs font-bold text-teal-950 shadow-lg">
                    {isVid ? <Play size={12} className="fill-current" /> : <Maximize2 size={12} />}
                    <span>{isVid ? "Watch" : "Preview"}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Lightbox / Video Player Modal */}
      <Dialog
        open={Boolean(activeMedia)}
        onOpenChange={(open) => !open && setActiveMedia(null)}
      >
        <DialogContent className="max-w-3xl overflow-hidden rounded-lg border-slate-700 p-0 shadow-2xl">
          {activeMedia && (
            <div className="flex flex-col bg-slate-950 text-white">
              {/* Header Bar */}
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div className="min-w-0 pr-4">
                  <DialogTitle className="truncate text-base font-bold text-white">
                    {activeMedia.fileName || "Media Preview"}
                  </DialogTitle>
                  <p className="text-xs text-slate-400">
                    {isVideoMedia(activeMedia) ? "Video Recording" : "Inspection Photo"}
                    {activeMedia.sizeBytes ? ` · ${formatBytes(activeMedia.sizeBytes)}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    asChild
                    className="h-8 gap-1.5 rounded-full border-white/20 bg-white/10 text-xs text-white hover:bg-white/20"
                  >
                    <a
                      href={resolveMediaUrl(activeMedia)}
                      download={activeMedia.fileName || "media-file"}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download size={13} />
                      Download
                    </a>
                  </Button>
                </div>
              </div>

              {/* Media Content Display */}
              <div className="relative flex max-h-[75vh] min-h-[300px] items-center justify-center bg-black p-2">
                {isVideoMedia(activeMedia) ? (
                  <video
                    src={resolveMediaUrl(activeMedia)}
                    controls
                    autoPlay
                    className="max-h-[70vh] w-full rounded-xl object-contain"
                  />
                ) : (
                  <img
                    src={resolveMediaUrl(activeMedia)}
                    alt={activeMedia.fileName || "Preview"}
                    className="max-h-[70vh] w-full rounded-xl object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80";
                    }}
                  />
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
