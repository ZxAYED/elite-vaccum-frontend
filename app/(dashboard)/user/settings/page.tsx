"use client";

import { useState } from "react";
import {
  Bell,
  Clock,
  CreditCard,
  FileText,
  Laptop,
  LogOut,
  Package,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/customer-portal/PageHeader";
import { NotificationPreferencesCard } from "@/components/notifications/NotificationPreferencesCard";
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
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Settings & Preferences"
        eyebrow="Customer Portal"
        description="Configure your notifications and account security controls."
      />

      <div className="space-y-6">
        {/* Real API Notification Delivery Preferences */}
        <NotificationPreferencesCard />

        {/* SECTION 1: NOTIFICATIONS */}
        <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-md border border-teal-200 bg-teal-50 text-teal-800">
                <Bell size={16} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Notification Alerts</h2>
                <p className="text-xs text-slate-500 font-normal">
                  Select which events trigger email and SMS notifications.
                </p>
              </div>
            </div>

            <div className="hidden items-center gap-8 pr-2 text-xs font-bold uppercase tracking-wider text-slate-400 sm:flex">
              <span className="w-12 text-center">Email</span>
              <span className="w-12 text-center">SMS</span>
            </div>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {notifications.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 py-4 first:pt-1 last:pb-1 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                      <Icon size={15} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{item.label}</h3>
                      <p className="text-xs text-slate-500 font-normal">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-8 pt-1 sm:justify-end sm:pt-0">
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

        {/* SECTION 2: ACCOUNT & SECURITY */}
        <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="flex size-9 items-center justify-center rounded-md border border-teal-200 bg-teal-50 text-teal-800">
              <ShieldCheck size={16} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Security & Sessions</h2>
              <p className="text-xs text-slate-500 font-normal">
                Manage your active login sessions and authorized device security.
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 rounded-md border border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-md bg-white text-slate-700 shadow-xs border border-slate-200">
                <Laptop size={16} />
              </div>
              <div>
                <p className="font-bold text-xs text-slate-900">Active Devices & Browsers</p>
                <p className="text-[11px] text-slate-500 font-normal">
                  Signed in on 1 current device and 2 other sessions.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setLogoutModalOpen(true)}
              className="rounded-md text-xs font-medium"
            >
              <LogOut size={13} className="mr-1.5" />
              Log Out All Other Devices
            </Button>
          </div>
        </section>

        {/* SECTION 3: DANGER ZONE */}
        <section className="rounded-lg border border-rose-200 bg-rose-50/20 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center gap-2.5 border-b border-rose-100 pb-3">
            <div className="flex size-9 items-center justify-center rounded-md bg-rose-100 text-rose-800 border border-rose-200">
              <ShieldAlert size={16} />
            </div>
            <div>
              <h2 className="text-base font-bold text-rose-950">Danger Zone</h2>
              <p className="text-xs text-rose-700/80 font-normal">
                Irreversible account changes and data removal options.
              </p>
            </div>
          </div>

          <div className="mt-4 divide-y divide-rose-100 rounded-md border border-rose-100 bg-white p-4">
            <div className="flex flex-col gap-3 pb-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900">Deactivate Customer Account</h3>
                <p className="text-[11px] text-slate-500 font-normal">
                  Temporarily pause active service contracts and hide portal access.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeactivateModalOpen(true)}
                className="rounded-md border-slate-200 text-xs font-medium"
              >
                Deactivate Account
              </Button>
            </div>

            <div className="flex flex-col gap-3 pt-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xs font-bold text-rose-950">Delete Account & Stored Data</h3>
                <p className="text-[11px] text-slate-500 font-normal">
                  Permanently erase your central vacuum equipment records, warranties, and profile.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setDeleteModalOpen(true)}
                className="rounded-md bg-rose-600 text-white hover:bg-rose-700 text-xs font-medium"
              >
                <Trash2 size={13} className="mr-1.5" />
                Delete Account
              </Button>
            </div>
          </div>
        </section>
      </div>

      {/* MODAL: LOG OUT ALL DEVICES */}
      <Dialog open={logoutModalOpen} onOpenChange={setLogoutModalOpen}>
        <DialogContent className="sm:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Log out of all devices?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600">
              This will immediately invalidate all active access tokens on your other phones,
              tablets, and computers. You will remain logged in on this current browser.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLogoutModalOpen(false)}
              className="rounded-md"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleLogoutAllDevices}
              className="rounded-md bg-teal-700 text-white hover:bg-teal-800"
            >
              Confirm Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: DEACTIVATE ACCOUNT */}
      <Dialog open={deactivateModalOpen} onOpenChange={setDeactivateModalOpen}>
        <DialogContent className="sm:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Deactivate your account?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600">
              Your service history and vacuum warranties will be frozen. You can reactivate anytime
              by contacting Elite Central Vacuum support.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeactivateModalOpen(false)}
              className="rounded-md"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleDeactivateAccount}
              className="rounded-md bg-amber-600 text-white hover:bg-amber-700"
            >
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: DELETE ACCOUNT */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-950">
              Delete account permanently?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600">
              This action cannot be undone. All central vacuum records, invoices, service
              appointments, and address books will be irreversibly erased.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5 py-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Type <span className="font-bold text-rose-600">DELETE</span> to confirm:
            </label>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className="h-9 rounded-md border-rose-200 bg-rose-50/40 text-xs font-semibold focus-visible:bg-white"
            />
          </div>

          <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDeleteModalOpen(false);
                setDeleteConfirmText("");
              }}
              className="rounded-md"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText.trim().toUpperCase() !== "DELETE"}
              className="rounded-md bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
            >
              Permanently Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
