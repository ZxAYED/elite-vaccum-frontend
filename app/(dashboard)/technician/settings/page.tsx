"use client";

import { useMemo, useState } from "react";
import {
  Bell,
  Eye,
  EyeOff,
  LockKeyhole,
  SlidersHorizontal,
} from "lucide-react";
import { z } from "zod";

import {
  AdminSurface,
  TechnicianRouteShell,
} from "@/components/technician/TechnicianRouteShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import {
  getCurrentTechnicianProfile,
  getTechnicianNotificationPreferences,
  getTechnicianSettingsState,
  updateCurrentTechnicianProfile,
  updateTechnicianNotificationPreference,
  updateTechnicianSettingsState,
} from "@/data/mock/technician-dashboard";
import { useSharedAdminScheduleStateVersion } from "@/hooks/useSharedAdminScheduleStateVersion";

const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .regex(/[A-Za-z]/, "Password must include at least 1 letter.")
      .regex(/\d/, "Password must include at least 1 number."),
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((value) => value.newPassword !== value.currentPassword, {
    path: ["newPassword"],
    message: "New password must be different from the current password.",
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export default function TechnicianSettingsPage() {
  useSharedAdminScheduleStateVersion();
  const technician = getCurrentTechnicianProfile();
  const [settingsVersion, setSettingsVersion] = useState(0);
  const notificationPreferences = getTechnicianNotificationPreferences();
  const settings = getTechnicianSettingsState();

  const [availability, setAvailability] = useState(
    technician.availability === "OFF_DUTY" ? "OFF_DUTY" : "AVAILABLE",
  );
  const [timezone, setTimezone] = useState(settings.timezone);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [passwordSubmitAttempted, setPasswordSubmitAttempted] = useState(false);

  const passwordErrors = useMemo(() => {
    const parsed = passwordFormSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (parsed.success) return {};
    return Object.fromEntries(
      parsed.error.issues.map((issue) => [issue.path[0], issue.message]),
    ) as Record<string, string>;
  }, [confirmPassword, currentPassword, newPassword]);

  function handleUpdatePassword() {
    setPasswordSubmitAttempted(true);
    const parsed = passwordFormSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!parsed.success) return;

    setPasswordUpdated(true);
    setPasswordSubmitAttempted(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <TechnicianRouteShell
      eyebrow="Technician Account"
      title="Settings"
      description="Account security, availability, and notification preferences."
    >
      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <AdminSurface>
          <div className="mb-6 flex items-center gap-3">
            <LockKeyhole className="text-teal-700" size={22} />
            <h2 className="text-2xl font-semibold text-primary">Account Security</h2>
          </div>

          <div className="grid gap-4">
            <PasswordField
              error={passwordErrors.currentPassword}
              id="technician-current-password"
              label="Current Password"
              onChange={setCurrentPassword}
              onToggle={() => setShowCurrentPassword((current) => !current)}
              show={showCurrentPassword}
              showError={passwordSubmitAttempted}
              value={currentPassword}
            />
            <PasswordField
              error={passwordErrors.newPassword}
              id="technician-new-password"
              label="New Password"
              onChange={setNewPassword}
              onToggle={() => setShowPassword((current) => !current)}
              show={showPassword}
              showError={passwordSubmitAttempted}
              value={newPassword}
            />
            <PasswordField
              error={passwordErrors.confirmPassword}
              id="technician-confirm-password"
              label="Confirm New Password"
              onChange={setConfirmPassword}
              onToggle={() => setShowPassword((current) => !current)}
              show={showPassword}
              showError={passwordSubmitAttempted}
              value={confirmPassword}
            />
          </div>

          {passwordUpdated ? (
            <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Password updated successfully.
            </p>
          ) : null}

          <div className="mt-5 flex justify-end">
            <Button onClick={handleUpdatePassword}>Update Password</Button>
          </div>
        </AdminSurface>

        <div className="space-y-4">
          <AdminSurface>
            <div className="mb-6 flex items-center gap-3">
              <SlidersHorizontal className="text-teal-700" size={22} />
              <h2 className="text-2xl font-semibold text-primary">Availability</h2>
            </div>

            <div className="grid gap-4">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">Status</span>
                <Select
                  value={availability}
                  onValueChange={(value) => {
                    setAvailability(value);
                    updateCurrentTechnicianProfile({
                      availability: value as "AVAILABLE" | "OFF_DUTY",
                    });
                    setSettingsVersion((current) => current + 1);
                  }}
                >
                  <SelectTrigger className="bg-slate-50 shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AVAILABLE">Available</SelectItem>
                    <SelectItem value="OFF_DUTY">Off Duty</SelectItem>
                  </SelectContent>
                </Select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">Timezone</span>
                <Select
                  value={timezone}
                  onValueChange={(value) => {
                    setTimezone(value);
                    updateTechnicianSettingsState({ timezone: value });
                    setSettingsVersion((current) => current + 1);
                  }}
                >
                  <SelectTrigger className="bg-slate-50 shadow-none">
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
          </AdminSurface>

          <AdminSurface>
            <div className="mb-6 flex items-center gap-3">
              <Bell className="text-teal-700" size={22} />
              <h2 className="text-2xl font-semibold text-primary">
                Notification Preferences
              </h2>
            </div>

            <div className="space-y-5">
              {notificationPreferences.map((item) => (
                <div
                  key={item.key}
                  className="rounded-xl bg-slate-50 p-4"
                  data-settings-version={settingsVersion}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900">{item.label}</h3>
                      <p className="mt-1 text-sm text-slate-500">{item.description}</p>
                    </div>

                    <div className="flex gap-4">
                      <ChannelToggle
                        checked={item.inApp}
                        label="In-App"
                        onCheckedChange={(checked) => {
                          updateTechnicianNotificationPreference(
                            item.key,
                            "inApp",
                            checked,
                          );
                          setSettingsVersion((current) => current + 1);
                        }}
                      />
                      <ChannelToggle
                        checked={item.email}
                        label="Email"
                        onCheckedChange={(checked) => {
                          updateTechnicianNotificationPreference(
                            item.key,
                            "email",
                            checked,
                          );
                          setSettingsVersion((current) => current + 1);
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </AdminSurface>
        </div>
      </div>
    </TechnicianRouteShell>
  );
}

function PasswordField({
  error,
  id,
  label,
  onChange,
  onToggle,
  show,
  showError = false,
  value,
}: {
  error?: string;
  id: string;
  label: string;
  onChange: (value: string) => void;
  onToggle: () => void;
  show: boolean;
  showError?: boolean;
  value: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="pr-12"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-teal-700"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {showError && error ? <p className="text-sm text-red-700">{error}</p> : null}
    </label>
  );
}

function ChannelToggle({
  checked,
  label,
  onCheckedChange,
}: {
  checked: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </label>
  );
}
