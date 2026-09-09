"use client";

import {
  MediaGalleryPreview,
  type MediaGalleryPreviewProps,
  resolveMediaUrl,
  isImageMedia,
  isVideoMedia,
} from "@/components/shared/MediaGalleryPreview";
import type { ServiceRequestAttachment } from "@/types/domain";

export { resolveMediaUrl, isImageMedia as isImageAttachment, isVideoMedia as isVideoAttachment };

export interface ServiceMediaGalleryProps extends Omit<MediaGalleryPreviewProps, "attachments"> {
  attachments: ServiceRequestAttachment[];
}

export function ServiceMediaGallery({
  attachments = [],
  title = "Photos & Video Media",
  description,
  emptyMessage = "No media attachments for this service",
  emptyDescription = "No photos or video recordings were submitted during the intake for this service request.",
  className = "",
  columnsClass = "grid-cols-2 sm:grid-cols-3 md:grid-cols-3",
  compact = false,
}: ServiceMediaGalleryProps) {
  return (
    <MediaGalleryPreview
      attachments={attachments}
      title={title}
      description={description}
      emptyMessage={emptyMessage}
      emptyDescription={emptyDescription}
      className={className}
      columnsClass={columnsClass}
      compact={compact}
    />
  );
}
