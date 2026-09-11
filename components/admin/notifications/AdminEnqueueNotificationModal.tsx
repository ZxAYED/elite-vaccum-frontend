"use client";

import React, { useMemo, useState } from "react";
import { Send, X, BellRing, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { readApiMessage } from "@/lib/api-error";
import {
  NOTIFICATION_TITLE_MAX,
  NOTIFICATION_TYPES,
  NOTIFICATION_TYPE_LABELS,
  useAdminEnqueueNotificationMutation,
  type NotificationType,
} from "@/redux/api/notificationsApi";

interface AdminEnqueueNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Splits the comma-separated recipient field into unique, trimmed ids and
 * separates the ones that are not User UUIDs. Newlines and semicolons are
 * accepted too — ids get pasted out of spreadsheets and query results.
 */
function parseRecipientIds(raw: string) {
  const seen = new Set<string>();
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const entry of raw.split(/[\s,;]+/)) {
    const id = entry.trim();
    if (!id || seen.has(id.toLowerCase())) continue;
    seen.add(id.toLowerCase());
    if (UUID_PATTERN.test(id)) valid.push(id);
    else invalid.push(id);
  }

  return { valid, invalid };
}

export function AdminEnqueueNotificationModal({
  isOpen,
  onClose,
}: AdminEnqueueNotificationModalProps) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<NotificationType>("SYSTEM_ALERT");
  const [recipientIds, setRecipientIds] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [sentCount, setSentCount] = useState<number | null>(null);
  // A mutation hook's own `isLoading` only tracks its most recent trigger, so
  // it can read false while earlier fan-out requests are still in flight.
  const [isDispatching, setIsDispatching] = useState(false);

  const [enqueueNotification] = useAdminEnqueueNotificationMutation();

  const parsed = useMemo(() => parseRecipientIds(recipientIds), [recipientIds]);

  if (!isOpen) return null;

  function resetForm() {
    setTitle("");
    setMessage("");
    setRecipientIds("");
    setCtaLabel("");
    setSentCount(null);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !message.trim()) {
      toast.error("Please provide both a title and message.");
      return;
    }

    const { valid, invalid } = parsed;

    if (invalid.length > 0) {
      toast.error(
        `${invalid.length} recipient ${invalid.length === 1 ? "id is" : "ids are"} not a User UUID`,
        {
          description: `Fix or remove: ${invalid.slice(0, 3).join(", ")}${
            invalid.length > 3 ? ` +${invalid.length - 3} more` : ""
          }`,
        },
      );
      return;
    }

    if (valid.length === 0) {
      toast.error("Add at least one recipient User ID.");
      return;
    }

    // No bulk endpoint exists yet, so fan out one POST per recipient and
    // report partial failures instead of pretending the whole batch landed.
    setIsDispatching(true);
    setSentCount(0);
    const results = await Promise.allSettled(
      valid.map((userId) =>
        enqueueNotification({
          userId,
          type,
          title: title.trim(),
          message: message.trim(),
          ctaLabel: ctaLabel.trim() || undefined,
        })
          .unwrap()
          .then((response) => {
            setSentCount((current) => (current ?? 0) + 1);
            return response;
          }),
      ),
    );

    setSentCount(null);
    setIsDispatching(false);

    const failures = results.flatMap((result, index) =>
      result.status === "rejected"
        ? [{ userId: valid[index], reason: result.reason }]
        : [],
    );
    const delivered = valid.length - failures.length;

    if (failures.length === 0) {
      toast.success(
        `Notification queued for ${delivered} recipient${delivered === 1 ? "" : "s"}.`,
      );
      resetForm();
      onClose();
      return;
    }

    if (delivered === 0) {
      toast.error("Failed to dispatch notification", {
        description: readApiMessage(
          failures[0].reason,
          "The server rejected every recipient. Check the ids and type.",
        ),
      });
      return;
    }

    // Keep only what failed in the field so the admin can retry the remainder.
    setRecipientIds(failures.map((failure) => failure.userId).join(", "));
    toast.error(`Queued ${delivered} of ${valid.length} recipients`, {
      description: `${failures.length} failed and ${failures.length === 1 ? "was" : "were"} kept in the recipient field. ${readApiMessage(
        failures[0].reason,
        "",
      )}`.trim(),
    });
  };

  const recipientCount = parsed.valid.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in-0">
      <div className="relative w-full max-w-lg rounded-2xl border border-teal-100 bg-white p-6 shadow-2xl animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-teal-50 text-teal-800">
              <BellRing size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Dispatch Notification
              </h2>
              <p className="text-xs text-slate-500">
                Send real-time alert via worker queue to connected users.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label
              className="block text-xs font-semibold text-slate-700"
              htmlFor="notification-recipients"
            >
              Recipient User IDs <span className="text-red-500">*</span>
            </label>
            <textarea
              id="notification-recipients"
              required
              rows={2}
              placeholder="123e4567-e89b-12d3-a456-426614174000, 7c9e6679-7425-40de-944b-e07fc1f90ae7"
              value={recipientIds}
              onChange={(e) => setRecipientIds(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-hidden"
            />
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              <span className="text-slate-500">
                Comma-separated <strong className="font-semibold">User</strong>{" "}
                UUIDs (not customer profile ids). One notification is queued per
                id.
              </span>
              {recipientCount > 0 ? (
                <span className="rounded-md border border-teal-200 bg-teal-50 px-1.5 py-0.5 font-semibold text-teal-800">
                  {recipientCount} recipient{recipientCount === 1 ? "" : "s"}
                </span>
              ) : null}
              {parsed.invalid.length > 0 ? (
                <span className="rounded-md border border-rose-200 bg-rose-50 px-1.5 py-0.5 font-semibold text-rose-700">
                  {parsed.invalid.length} invalid
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-600">
            <Info size={14} className="mt-0.5 shrink-0 text-slate-400" />
            <p>
              Role broadcast is not available — the API sends to one user per
              request. It needs a <code>POST /notifications/bulk</code> endpoint
              on the backend.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className="block text-xs font-semibold text-slate-700"
                htmlFor="notification-type"
              >
                Notification Type
              </label>
              <select
                id="notification-type"
                value={type}
                onChange={(e) => setType(e.target.value as NotificationType)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-hidden"
              >
                {NOTIFICATION_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {NOTIFICATION_TYPE_LABELS[value]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                className="block text-xs font-semibold text-slate-700"
                htmlFor="notification-cta"
              >
                Action Button Label (Optional)
              </label>
              <input
                id="notification-cta"
                type="text"
                placeholder="e.g. View Details"
                value={ctaLabel}
                onChange={(e) => setCtaLabel(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label
              className="block text-xs font-semibold text-slate-700"
              htmlFor="notification-title"
            >
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="notification-title"
              type="text"
              required
              maxLength={NOTIFICATION_TITLE_MAX}
              placeholder="e.g. Scheduled System Maintenance"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label
              className="block text-xs font-semibold text-slate-700"
              htmlFor="notification-message"
            >
              Message Content <span className="text-red-500">*</span>
            </label>
            <textarea
              id="notification-message"
              required
              rows={3}
              placeholder="Describe the update or announcement..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-hidden"
            />
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isDispatching}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isDispatching || recipientCount === 0}
              className="gap-2"
            >
              {isDispatching ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
              {isDispatching
                ? sentCount !== null && recipientCount > 1
                  ? `Dispatching ${sentCount}/${recipientCount}...`
                  : "Dispatching..."
                : recipientCount > 1
                  ? `Send to ${recipientCount} Users`
                  : "Send Notification"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
