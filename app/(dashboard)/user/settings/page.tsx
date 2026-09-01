"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Bell,
  Clock,
  CreditCard,
  FileText,
  Globe2,
  Laptop,
  LogOut,
  Package,
  Save,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/customer-portal/PageHeader";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  icon: typeof Bell;
  category: "Service & Orders" | "Financial & Quotations" | "System Care";
  email: boolean;
  sms: boolean;
}

const defaultNotifications: NotificationSetting[] = [
  {
    id: "orders",
    label: "Order & Parts Tracking",
    description: "Real-time updates on replacement parts, accessories, and unit shipments.",
    icon: Package,
    category: "Service & Orders",
    email: true,
    sms: true,
  },
  {
    id: "services",
    label: "Service Appointments & Technician Dispatch",
    description: "Technician arrival ETA, schedule confirmations, and completion summaries.",
    icon: Wrench,
    category: "Service & Orders",
    email: true,
    sms: true,
  },
  {
    id: "quotations",
    label: "Quotations & Estimates",
    description: "Alerts when a repair or installation estimate is ready for your review and approval.",
    icon: FileText,
    category: "Financial & Quotations",
    email: true,
    sms: false,
  },
  {
    id: "payments",
    label: "Billing & Invoices",
    description: "Payment receipts, automated charge confirmations, and invoice statements.",
    icon: CreditCard,
    category: "Financial & Quotations",
    email: true,
    sms: false,
  },
  {
    id: "reminders",
    label: "Preventative Maintenance & Filter Reminders",
    description: "Automated seasonal reminders to check canister bags, motor filters, and inlet seals.",
    icon: Clock,
    category: "System Care",
    email: true,
    sms: false,
  },
];

export default function UserSettingsPage() {
  const [notifications, setNotifications] = useState<NotificationSetting[]>(defaultNotifications);
  const [language, setLanguage] = useState("en-US");
  const [timezone, setTimezone] = useState("America/New_York");
  const [preferredContact, setPreferredContact] = useState("email");
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  // Dialog States
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const toggleEmailNotification = (id: string, enabled: boolean) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, email: enabled } : item))
    );
    const target = notifications.find((n) => n.id === id);
    toast.success("Email preference updated", {
      description: `${target?.label}: ${enabled ? "Enabled" : "Disabled"}`,
    });
  };

  const toggleSmsNotification = (id: string, enabled: boolean) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, sms: enabled } : item))
    );
    const target = notifications.find((n) => n.id === id);
    toast.success("SMS preference updated", {
      description: `${target?.label}: ${enabled ? "Enabled" : "Disabled"}`,
    });
  };

  const handleSavePreferences = () => {
    setIsSavingPreferences(true);
    setTimeout(() => {
      setIsSavingPreferences(false);
      toast.success("Preferences saved successfully", {
        description: "Your regional and communication settings are up to date.",
      });
    }, 400);
  };

  const handleLogoutAllDevices = () => {
    setLogoutModalOpen(false);
    toast.success("Logged out of all other devices", {
      description: "All active sessions except your current browser have been terminated.",
    });
  };

  const handleDeactivateAccount = () => {
    setDeactivateModalOpen(false);
    toast.info("Account deactivation request submitted", {
      description: "Our customer success team will pause your subscription and reach out to confirm.",
    });
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText.trim().toUpperCase() !== "DELETE") {
      toast.error("Please type DELETE to confirm account deletion.");
      return;
    }
    setDeleteModalOpen(false);
    setDeleteConfirmText("");
    toast.error("Account deletion scheduled", {
      description: "Your account and personal data will be purged in 30 days.",
    });
  };

  return (
    <div className="min-h-screen space-y-8 pb-16 pt-2">
      <PageHeader
        title="Settings & Preferences"
        eyebrow="Customer Portal"
        description="Configure your notifications, regional preferences, and account security controls."
      />

      <div className="mx-auto max-w-5xl space-y-8">
        {/* SECTION 1: NOTIFICATIONS */}
        <section className="rounded-3xl border border-teal-100/90 bg-white p-6 shadow-sm transition-shadow hover:shadow-md md:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-800 ring-1 ring-teal-100">
                <Bell size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Notification Alerts</h2>
                <p className="text-sm text-slate-500">
                  Select which events trigger email and SMS notifications.
                </p>
              </div>
            </div>

            <div className="hidden items-center gap-8 pr-4 text-xs font-bold uppercase tracking-wider text-slate-400 sm:flex">
              <span className="w-12 text-center">Email</span>
              <span className="w-12 text-center">SMS</span>
            </div>
          </div>

          <div className="mt-8 divide-y divide-slate-100">
            {notifications.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600">
                      <Icon size={18} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{item.label}</h3>
                      <p className="mt-0.5 max-w-xl text-sm leading-relaxed text-slate-500">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-8 pt-2 sm:justify-end sm:pt-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 sm:hidden">Email</span>
                      <Switch
                        checked={item.email}
                        aria-label={`Toggle email for ${item.label}`}
                        onCheckedChange={(checked) =>
                          toggleEmailNotification(item.id, checked)
                        }
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 sm:hidden">SMS</span>
                      <Switch
                        checked={item.sms}
                        aria-label={`Toggle SMS for ${item.label}`}
                        onCheckedChange={(checked) =>
                          toggleSmsNotification(item.id, checked)
                        }
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 2: REGIONAL & PREFERENCES */}
        <section className="rounded-3xl border border-teal-100/90 bg-white p-6 shadow-sm transition-shadow hover:shadow-md md:p-8">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-800 ring-1 ring-teal-100">
              <Globe2 size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Regional & System Preferences</h2>
              <p className="text-sm text-slate-500">
                Customize language, local timezone, and contact defaults.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Portal Language
              </label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="h-11 rounded-2xl border-teal-100 bg-slate-50/70 text-sm focus-visible:bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en-US">English (United States)</SelectItem>
                  <SelectItem value="en-CA">English (Canada)</SelectItem>
                  <SelectItem value="es-US">Español (Estados Unidos)</SelectItem>
                  <SelectItem value="fr-CA">Français (Canada)</SelectItem>
                  <SelectItem value="he-IL">עברית (Hebrew)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Local Timezone
              </label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger className="h-11 rounded-2xl border-teal-100 bg-slate-50/70 text-sm focus-visible:bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">Eastern Time (ET - New York)</SelectItem>
                  <SelectItem value="America/Chicago">Central Time (CT - Chicago)</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time (MT - Denver)</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time (PT - Los Angeles)</SelectItem>
                  <SelectItem value="America/Anchorage">Alaska Time (AKT)</SelectItem>
                  <SelectItem value="Pacific/Honolulu">Hawaii Time (HST)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-slate-700">
                Primary Contact Preference for Technicians
              </label>
              <Select value={preferredContact} onValueChange={setPreferredContact}>
                <SelectTrigger className="h-11 rounded-2xl border-teal-100 bg-slate-50/70 text-sm focus-visible:bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email Only</SelectItem>
                  <SelectItem value="sms">SMS / Text Messages Only</SelectItem>
                  <SelectItem value="both">Both Email & SMS Alerts</SelectItem>
                  <SelectItem value="call">Phone Call Before Arrival</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <Button
              onClick={handleSavePreferences}
              disabled={isSavingPreferences}
              className="gap-2 rounded-2xl px-6"
            >
              <Save size={16} />
              {isSavingPreferences ? "Saving..." : "Save Preferences"}
            </Button>
          </div>
        </section>

        {/* SECTION 3: ACCOUNT & SECURITY */}
        <section className="rounded-3xl border border-teal-100/90 bg-white p-6 shadow-sm transition-shadow hover:shadow-md md:p-8">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-800 ring-1 ring-teal-100">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Security & Sessions</h2>
              <p className="text-sm text-slate-500">
                Manage your active login sessions and authorized device security.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm ring-1 ring-slate-200/60">
                <Laptop size={20} />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Active Devices & Browsers</p>
                <p className="text-xs text-slate-500">
                  Signed in on 1 current device and 2 other sessions.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setLogoutModalOpen(true)}
              className="gap-2 rounded-xl text-slate-700 hover:bg-white hover:text-slate-900"
            >
              <LogOut size={15} />
              Log Out All Other Devices
            </Button>
          </div>
        </section>

        {/* SECTION 4: DANGER ZONE */}
        <section className="rounded-3xl border border-rose-200/80 bg-rose-50/30 p-6 shadow-sm md:p-8">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-800 ring-1 ring-rose-200">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-rose-950">Danger Zone</h2>
              <p className="text-sm text-rose-700/80">
                Irreversible account changes and data removal options.
              </p>
            </div>
          </div>

          <div className="mt-6 divide-y divide-rose-100 rounded-2xl border border-rose-100 bg-white p-5">
            <div className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">Deactivate Customer Account</h3>
                <p className="text-xs text-slate-500">
                  Temporarily pause active service contracts and hide portal access.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeactivateModalOpen(true)}
                className="w-fit rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Deactivate Account
              </Button>
            </div>

            <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold text-rose-950">Delete Account & Stored Data</h3>
                <p className="text-xs text-slate-500">
                  Permanently erase your central vacuum equipment records, warranties, and profile.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setDeleteModalOpen(true)}
                className="w-fit gap-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700"
              >
                <Trash2 size={15} />
                Delete Account
              </Button>
            </div>
          </div>
        </section>
      </div>

      {/* MODAL: LOG OUT ALL DEVICES */}
      <Dialog open={logoutModalOpen} onOpenChange={setLogoutModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-amber-200">
              <LogOut size={20} />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-950">
              Log out of all devices?
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600">
              This will immediately invalidate all active access tokens on your other phones,
              tablets, and computers. You will remain logged in on this current browser.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => setLogoutModalOpen(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleLogoutAllDevices}
              className="rounded-xl bg-primary text-white hover:bg-teal-900"
            >
              Confirm Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: DEACTIVATE ACCOUNT */}
      <Dialog open={deactivateModalOpen} onOpenChange={setDeactivateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-amber-200">
              <AlertTriangle size={20} />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-950">
              Deactivate your account?
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600">
              Your service history and vacuum warranties will be frozen. You can reactivate anytime
              by contacting Elite Central Vacuum support.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => setDeactivateModalOpen(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeactivateAccount}
              className="rounded-xl bg-amber-600 text-white hover:bg-amber-700"
            >
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: DELETE ACCOUNT */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 ring-1 ring-rose-200">
              <Trash2 size={20} />
            </div>
            <DialogTitle className="text-lg font-bold text-rose-950">
              Delete account permanently?
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600">
              This action cannot be undone. All central vacuum records, invoices, service
              appointments, and address books will be irreversibly erased.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Type <span className="font-bold text-rose-600">DELETE</span> to confirm:
            </label>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className="h-11 rounded-xl border-rose-200 bg-rose-50/40 text-sm font-semibold focus-visible:bg-white"
            />
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false);
                setDeleteConfirmText("");
              }}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText.trim().toUpperCase() !== "DELETE"}
              className="rounded-xl bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
            >
              Permanently Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
