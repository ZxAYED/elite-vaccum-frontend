"use client";

import React from "react";
import { Bell, Mail, MessageSquare, RefreshCw, Smartphone } from "lucide-react";
import { toast } from "sonner";
import {
  type NotificationPreferencesDto,
  useGetNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
} from "@/redux/api/notificationsApi";
import { Switch } from "@/components/ui/Switch";
import { Button } from "@/components/ui/Button";

type PreferenceChannel =
  | "emailNotifications"
  | "smsNotifications"
  | "pushNotifications";

type EventPreferenceKey =
  | "orderUpdates"
  | "serviceUpdates"
  | "billingUpdates"
  | "marketing";

const channelRows: Array<{
  key: PreferenceChannel;
  title: string;
  description: string;
  icon: typeof Mail;
}> = [
  {
    key: "emailNotifications",
    title: "Email Notifications",
    description: "Receive invoice summaries, quotation approvals, and scheduled visit confirmations.",
    icon: Mail,
  },
  {
    key: "smsNotifications",
    title: "SMS Text Messages",
    description: "Urgent technician arrival windows and immediate operational alerts.",
    icon: MessageSquare,
  },
  {
    key: "pushNotifications",
    title: "In-App & Push Notifications",
    description: "Real-time portal alerts for order, billing, and service status changes.",
    icon: Smartphone,
  },
];

const eventRows: Array<{
  key: EventPreferenceKey;
  title: string;
  description: string;
}> = [
  {
    key: "orderUpdates",
    title: "Order updates",
    description: "Shipment, delivery, and product order lifecycle notices.",
  },
  {
    key: "serviceUpdates",
    title: "Service updates",
    description: "Appointment, technician, quotation, and completion notices.",
  },
  {
    key: "billingUpdates",
    title: "Billing updates",
    description: "Invoice, payment, refund, and receipt notifications.",
  },
  {
    key: "marketing",
    title: "Marketing",
    description: "Optional maintenance reminders and promotional messages.",
  },
];

function defaultPreferences(
  preferences?: NotificationPreferencesDto,
): NonNullable<NotificationPreferencesDto["preferences"]> {
  return {
    orderUpdates: preferences?.preferences?.orderUpdates ?? true,
    serviceUpdates: preferences?.preferences?.serviceUpdates ?? true,
    billingUpdates: preferences?.preferences?.billingUpdates ?? true,
    marketing: preferences?.preferences?.marketing ?? false,
    ...(preferences?.preferences ?? {}),
  };
}

export function NotificationPreferencesCard() {
  const {
    data: preferences,
    isError,
    isLoading,
    refetch,
  } = useGetNotificationPreferencesQuery();
  const [updatePreferences, { isLoading: isUpdating }] = useUpdateNotificationPreferencesMutation();

  const handleChannelToggle = async (channel: PreferenceChannel, currentValue: boolean) => {
    try {
      await updatePreferences({
        [channel]: !currentValue,
        preferences: defaultPreferences(preferences),
      }).unwrap();
      toast.success(
        `${channelRows.find((row) => row.key === channel)?.title ?? "Notifications"} ${
          !currentValue ? "enabled" : "disabled"
        }.`,
      );
    } catch {
      toast.error("Failed to update notification preference.");
    }
  };

  const handleEventToggle = async (key: EventPreferenceKey, currentValue: boolean) => {
    try {
      await updatePreferences({
        emailNotifications: preferences?.emailNotifications ?? true,
        smsNotifications: preferences?.smsNotifications ?? false,
        pushNotifications: preferences?.pushNotifications ?? true,
        preferences: {
          ...defaultPreferences(preferences),
          [key]: !currentValue,
        },
      }).unwrap();
      toast.success("Notification preference updated.");
    } catch {
      toast.error("Failed to update notification preference.");
    }
  };

  const eventPreferences = defaultPreferences(preferences);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
        <div className="flex size-10 items-center justify-center rounded-md bg-teal-50 text-teal-800">
          <Bell size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-slate-900">
            Notification Delivery Preferences
          </h3>
          <p className="text-sm text-slate-500">
            Choose how you receive appointment reminders, status updates, and billing receipts.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-5 space-y-3">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-16 animate-pulse rounded-md bg-slate-100" />
          ))}
        </div>
      ) : isError ? (
        <div className="mt-5 flex flex-col gap-3 rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between">
          <span>Notification preferences could not be loaded.</span>
          <Button type="button" size="sm" variant="outline" onClick={() => refetch()}>
            <RefreshCw className="size-4" />
            Retry
          </Button>
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          <div className="divide-y divide-slate-100">
            {channelRows.map((row) => {
              const Icon = row.icon;
              const enabled = preferences?.[row.key] ?? row.key !== "smsNotifications";
              return (
                <div
                  key={row.key}
                  className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-slate-50 text-slate-700">
                      <Icon size={17} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{row.title}</p>
                      <p className="max-w-2xl text-sm leading-5 text-slate-500">
                        {row.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={enabled}
                    disabled={isUpdating}
                    aria-label={`Toggle ${row.title}`}
                    onCheckedChange={() => handleChannelToggle(row.key, enabled)}
                  />
                </div>
              );
            })}
          </div>

          <div className="rounded-md bg-slate-50 p-4">
            <h4 className="text-sm font-semibold text-slate-900">Event preferences</h4>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {eventRows.map((row) => {
                const enabled = Boolean(eventPreferences[row.key]);
                return (
                  <div
                    key={row.key}
                    className="flex items-start justify-between gap-4 rounded-md bg-white p-3 shadow-xs"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{row.title}</p>
                      <p className="text-xs leading-5 text-slate-500">{row.description}</p>
                    </div>
                    <Switch
                      checked={enabled}
                      disabled={isUpdating}
                      aria-label={`Toggle ${row.title}`}
                      onCheckedChange={() => handleEventToggle(row.key, enabled)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
