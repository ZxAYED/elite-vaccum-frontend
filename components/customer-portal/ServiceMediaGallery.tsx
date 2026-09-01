"use client";

import { useMemo, useState } from "react";
import {
  Download,
  Film,
  Image as ImageIcon,
  Maximize2,
  Play,
  Sparkles,
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

interface ServiceMediaGalleryProps {
  attachments: ServiceRequestAttachment[];
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

export function isVideoAttachment(att: {
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

export function isImageAttachment(att: {
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

export function ServiceMediaGallery({
  attachments = [],
}: ServiceMediaGalleryProps) {
  const [activeMedia, setActiveMedia] = useState<ServiceRequestAttachment | null>(null);

  // Filter only images and videos as strictly requested
  const mediaItems = useMemo(() => {
    return attachments.filter(
      (item) => isImageAttachment(item) || isVideoAttachment(item),
    );
  }, [attachments]);

  return (
    <div className="space-y-4">
      {/* Header with count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <ImageIcon size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Photos & Video Media
            </h3>
            <p className="text-xs text-slate-500">
              {mediaItems.length} {mediaItems.length === 1 ? "file attached" : "files attached"}
            </p>
          </div>
        </div>
      </div>

      {/* Media Gallery Grid */}
      {mediaItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-teal-100 bg-teal-50/20 p-8 text-center">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-white text-teal-700 shadow-sm border border-teal-100">
            <Sparkles size={20} />
          </div>
          <p className="mt-3 text-sm font-bold text-slate-800">
            No media attachments for this service
          </p>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
            No photos or video recordings were submitted during the intake for this service request.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-3">
          {mediaItems.map((item) => {
            const isVid = isVideoAttachment(item);
            const mediaSrc = resolveMediaUrl(item);

            return (
              <motion.div
                key={item.id || item.fileName}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveMedia(item)}
                className="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-2xl border border-teal-100/90 bg-slate-900 shadow-sm transition hover:border-teal-400 hover:shadow-md"
              >
                {/* Visual Media Rendering */}
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
                      alt={item.fileName || "Service attachment"}
                      className="size-full object-cover transition duration-300 group-hover:scale-105"
                      onError={(e) => {
                        // Fallback placeholder if image url is 404
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80";
                      }}
                    />
                  </div>
                )}

                {/* Glass Badge (Type & Size) */}
                <div className="absolute top-2 left-2 flex items-center gap-1 rounded-lg bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md">
                  {isVid ? <Film size={10} /> : <ImageIcon size={10} />}
                  <span>{isVid ? "Video" : "Photo"}</span>
                  {item.sizeBytes ? (
                    <span className="text-white/70">· {formatBytes(item.sizeBytes)}</span>
                  ) : null}
                </div>

                {/* Bottom Overlay with Filename */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2.5 pt-6 text-white opacity-90 transition group-hover:opacity-100">
                  <p className="truncate text-xs font-medium">{item.fileName}</p>
                </div>

                {/* Hover Action Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-teal-950/40 opacity-0 backdrop-blur-[1px] transition group-hover:opacity-100">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-teal-950 shadow-lg">
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
        <DialogContent className="max-w-3xl overflow-hidden rounded-3xl border-teal-100 p-0 shadow-2xl">
          {activeMedia && (
            <div className="flex flex-col bg-slate-950 text-white">
              {/* Header Bar */}
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div className="min-w-0 pr-4">
                  <DialogTitle className="truncate text-base font-bold text-white">
                    {activeMedia.fileName}
                  </DialogTitle>
                  <p className="text-xs text-slate-400">
                    {isVideoAttachment(activeMedia) ? "Video Recording" : "Inspection Photo"}
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
                      download={activeMedia.fileName}
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
                {isVideoAttachment(activeMedia) ? (
                  <video
                    src={resolveMediaUrl(activeMedia)}
                    controls
                    autoPlay
                    className="max-h-[70vh] w-full rounded-xl object-contain"
                  />
                ) : (
                  <img
                    src={resolveMediaUrl(activeMedia)}
                    alt={activeMedia.fileName}
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
