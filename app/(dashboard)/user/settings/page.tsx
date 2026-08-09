"use client";

import { useState } from "react";
import { Bell, ShieldCheck, SlidersHorizontal } from "lucide-react";

import { PageHeader } from "@/components/customer-portal/PageHeader";
import { Button } from "@/components/ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";

interface NotificationPreference {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
}

const initialNotifications: NotificationPreference[] = [
  {
    key: "orders",
    label: "Order Updates",
    description: "Stay informed about your system parts delivery status.",
    enabled: true,
  },
  {
    key: "services",
    label: "Service Updates",
    description: "Technician arrival times and appointment changes.",
    enabled: true,
  },
  {
    key: "payments",
    label: "Payment Notifications",
    description: "Receive invoices and confirmation of payments.",
    enabled: false,
  },
  {
    key: "schedule",
    label: "Schedule Reminders",
    description: "Get notified when it is time to check filters or bags.",
    enabled: true,
  },
];

export default function UserSettingsPage() {
  const [notifications, setNotifications] = useState(
    initialNotifications.map((item) => ({ ...item })),
  );
  const [language, setLanguage] = useState("en-US");
  const [timezone, setTimezone] = useState("pt");

  return (
    <div className="min-h-screen">
      <PageHeader
        description="Manage your preferences and customer dashboard notifications."
        eyebrow="Account"
        title="Settings"
      />

      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-3xl bg-white p-6 shadow-[0_20px_60px_-48px_rgba(28,79,80,0.42)] ring-1 ring-teal-100 md:p-8">
          <div className="mb-6 flex items-center gap-3">
            <Bell className="text-teal-700" size={22} />
            <h2 className="text-2xl font-semibold text-primary">Notifications</h2>
          </div>

          <div className="space-y-6">
            {notifications.map((item) => (
              <div
                className="flex items-center justify-between gap-5"
                key={item.key}
              >
                <div>
                  <h3 className="font-semibold text-slate-900">{item.label}</h3>
                  <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                </div>
                <Switch
                  checked={item.enabled}
                  aria-label={`Toggle ${item.label}`}
                  onCheckedChange={(checked) =>
                    setNotifications((current) =>
                      current.map((notification) =>
                        notification.key === item.key
                          ? { ...notification, enabled: checked }
                          : notification,
                      ),
                    )
                  }
                />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-[0_20px_60px_-48px_rgba(28,79,80,0.42)] ring-1 ring-teal-100 md:p-8">
          <div className="mb-6 flex items-center gap-3">
            <SlidersHorizontal className="text-teal-700" size={22} />
            <h2 className="text-2xl font-semibold text-primary">Preferences</h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label>
              <span className="text-sm font-semibold text-slate-700">Language</span>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="mt-2 bg-slate-50 shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en-US">English (United States)</SelectItem>
                  <SelectItem value="en-GB">English (United Kingdom)</SelectItem>
                  <SelectItem value="es-US">Spanish (United States)</SelectItem>
                </SelectContent>
              </Select>
            </label>

            <label>
              <span className="text-sm font-semibold text-slate-700">Timezone</span>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger className="mt-2 bg-slate-50 shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt">Pacific Time (PT)</SelectItem>
                  <SelectItem value="mt">Mountain Time (MT)</SelectItem>
                  <SelectItem value="ct">Central Time (CT)</SelectItem>
                  <SelectItem value="et">Eastern Time (ET)</SelectItem>
                </SelectContent>
              </Select>
            </label>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-[0_20px_60px_-48px_rgba(28,79,80,0.42)] ring-1 ring-teal-100 md:p-8">
          <div className="mb-6 flex items-center gap-3">
            <ShieldCheck className="text-teal-700" size={22} />
            <h2 className="text-2xl font-semibold text-primary">Account Management</h2>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button variant="soft">Logout from all devices</Button>
              <Button variant="ghost">Deactivate Account</Button>
            </div>
            <Button className="bg-red-600 text-white hover:bg-red-700">
              Delete Account
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
