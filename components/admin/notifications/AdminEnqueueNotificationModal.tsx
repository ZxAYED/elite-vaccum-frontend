"use client";

import React, { useState } from "react";
import { Send, X, BellRing, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { useAdminEnqueueNotificationMutation } from "@/redux/api/notificationsApi";

interface AdminEnqueueNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminEnqueueNotificationModal({
  isOpen,
  onClose,
}: AdminEnqueueNotificationModalProps) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("system");
  const [role, setRole] = useState<string>("all");
  const [userId, setUserId] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");

  const [enqueueNotification, { isLoading }] = useAdminEnqueueNotificationMutation();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error("Please provide both a title and message.");
      return;
    }

    try {
      await enqueueNotification({
        title: title.trim(),
        message: message.trim(),
        type,
        role: role === "all" ? undefined : role,
        userId: userId.trim() || undefined,
        ctaLabel: ctaLabel.trim() || undefined,
      }).unwrap();

      toast.success("Notification enqueued and dispatched successfully!");
      setTitle("");
      setMessage("");
      setUserId("");
      setCtaLabel("");
      onClose();
    } catch {
      toast.error("Failed to dispatch notification. Please try again.");
    }
  };

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
            <label className="block text-xs font-semibold text-slate-700">
              Target Audience
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-hidden"
            >
              <option value="all">All Roles (Broadcast)</option>
              <option value="CUSTOMER">Customers Only</option>
              <option value="TECHNICIAN">Technicians Only</option>
              <option value="ADMIN">Admins Only</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Specific User ID (Optional)
            </label>
            <input
              type="text"
              placeholder="Leave blank to target selected audience"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Notification Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-hidden"
              >
                <option value="system">System / Announcement</option>
                <option value="service-update">Service Update</option>
                <option value="payment">Payment & Billing</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Action Button Label (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. View Details"
                value={ctaLabel}
                onChange={(e) => setCtaLabel(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Scheduled System Maintenance"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Message Content <span className="text-red-500">*</span>
            </label>
            <textarea
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
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
              {isLoading ? "Dispatching..." : "Send Notification"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
