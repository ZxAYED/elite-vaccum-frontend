"use client";

import React from "react";
import { Bell, Mail, MessageSquare, Smartphone, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  useGetNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
} from "@/redux/api/notificationsApi";

export function NotificationPreferencesCard() {
  const { data: preferences, isLoading } = useGetNotificationPreferencesQuery();
  const [updatePreferences, { isLoading: isUpdating }] = useUpdateNotificationPreferencesMutation();

  const handleToggle = async (channel: "email" | "sms" | "push", currentValue: boolean) => {
    try {
      await updatePreferences({
        [channel]: !currentValue,
      }).unwrap();
      toast.success(
        `${channel.toUpperCase()} notifications ${!currentValue ? "enabled" : "disabled"}.`
      );
    } catch {
      toast.error("Failed to update notification preference.");
    }
  };

  const emailEnabled = preferences?.email ?? true;
  const smsEnabled = preferences?.sms ?? false;
  const pushEnabled = preferences?.push ?? true;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="flex size-10 items-center justify-center rounded-xl bg-teal-50 text-teal-800">
          <Bell size={20} />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Notification Delivery Preferences
          </h3>
          <p className="text-xs text-slate-500">
            Choose how you receive appointment reminders, status updates, and billing receipts.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-8 text-slate-500">
          <Loader2 size={20} className="animate-spin text-teal-700 mr-2" />
          Loading delivery preferences...
        </div>
      ) : (
        <div className="mt-5 divide-y divide-slate-100">
          {/* Email Channel */}
          <div className="flex items-center justify-between py-3.5">
            <div className="flex items-center gap-3.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-slate-50 text-slate-700">
                <Mail size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Email Notifications
                </p>
                <p className="text-xs text-slate-500">
                  Receive invoice summaries, quotation approvals, and scheduled visit confirmations.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={isUpdating}
              onClick={() => handleToggle("email", emailEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                emailEnabled ? "bg-teal-700" : "bg-slate-200"
              }`}
              role="switch"
              aria-checked={emailEnabled}
            >
              <span
                className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  emailEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* SMS Channel */}
          <div className="flex items-center justify-between py-3.5">
            <div className="flex items-center gap-3.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-slate-50 text-slate-700">
                <MessageSquare size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  SMS Text Messages
                </p>
                <p className="text-xs text-slate-500">
                  Urgent technician dispatch arrivals, time window confirmations, and immediate alerts.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={isUpdating}
              onClick={() => handleToggle("sms", smsEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                smsEnabled ? "bg-teal-700" : "bg-slate-200"
              }`}
              role="switch"
              aria-checked={smsEnabled}
            >
              <span
                className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  smsEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Browser / Push Channel */}
          <div className="flex items-center justify-between py-3.5">
            <div className="flex items-center gap-3.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-slate-50 text-slate-700">
                <Smartphone size={16} />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  In-App & Push Notifications
                </p>
                <p className="text-xs text-slate-500">
                  Real-time toasts and audible chimes for immediate status changes and quotations.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={isUpdating}
              onClick={() => handleToggle("push", pushEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                pushEnabled ? "bg-teal-700" : "bg-slate-200"
              }`}
              role="switch"
              aria-checked={pushEnabled}
            >
              <span
                className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  pushEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
