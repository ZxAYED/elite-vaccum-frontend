"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff, LockKeyhole, SlidersHorizontal } from "lucide-react";
import { z } from "zod";

import {
  AdminSurface,
  TechnicianRouteShell,
} from "@/components/technician/TechnicianRouteShell";
import { Button } from "@/components/ui/Button";
import { NotificationPreferencesCard } from "@/components/notifications/NotificationPreferencesCard";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { toast } from "sonner";
import { useChangePasswordMutation } from "@/redux/api/authApi";
import {
  useGetTechnicianProfileQuery,
  useUpdateTechnicianAvailabilityMutation,
} from "@/redux/api/technicianApi";

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

const TIMEZONES = [
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
];

export default function TechnicianSettingsPage() {
  // Phase 17.4 profile provides the current availability + timezone.
  const { data: technician } = useGetTechnicianProfileQuery();
  const [updateAvailabilityApi, { isLoading: isUpdatingAvailability }] =
    useUpdateTechnicianAvailabilityMutation();
  const [changePasswordApi, { isLoading: isChangingPassword }] =
    useChangePasswordMutation();

  // Draft overlay so the server value stays authoritative until changed,
  // without seeding state from an effect.
  const [availabilityDraft, setAvailabilityDraft] = useState<string | null>(null);
  const [timezoneDraft, setTimezoneDraft] = useState<string | null>(null);
  const availability =
    availabilityDraft ?? technician?.availability ?? "AVAILABLE";
  const timezone = timezoneDraft ?? technician?.timezone ?? "America/New_York";

  async function persistAvailability(nextAvailability: string, nextTimezone: string) {
    try {
      // Phase 17.5 PATCH /technicians/me/availability
      await updateAvailabilityApi({
        availability: nextAvailability as
          | "AVAILABLE"
          | "BUSY"
          | "ON_BREAK"
          | "OFF_DUTY",
        timezone: nextTimezone,
      }).unwrap();
      toast.success("Availability updated.");
    } catch {
      toast.error("Could not update availability. Please try again.");
    }
  }

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

  async function handleUpdatePassword() {
    setPasswordSubmitAttempted(true);
    const parsed = passwordFormSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!parsed.success) return;

    try {
      // Phase 1.9 POST /auth/change-password
      await changePasswordApi({
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
      }).unwrap();
      setPasswordUpdated(true);
      setPasswordSubmitAttempted(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed successfully.");
    } catch (err) {
      const message =
        (err as { data?: { message?: string | string[] } }).data?.message;
      toast.error(
        (Array.isArray(message) ? message.join(", ") : message) ||
          "Could not change your password. Check your current password and try again.",
      );
    }
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
            <Button disabled={isChangingPassword} onClick={handleUpdatePassword}>
              {isChangingPassword ? "Updating..." : "Update Password"}
            </Button>
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
                  disabled={isUpdatingAvailability}
                  onValueChange={(value) => {
                    setAvailabilityDraft(value);
                    void persistAvailability(value, timezone);
                  }}
                >
                  <SelectTrigger className="bg-slate-50 shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AVAILABLE">Available</SelectItem>
                    <SelectItem value="BUSY">Busy</SelectItem>
                    <SelectItem value="ON_BREAK">On Break</SelectItem>
                    <SelectItem value="OFF_DUTY">Off Duty</SelectItem>
                  </SelectContent>
                </Select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">Timezone</span>
                <Select
                  value={timezone}
                  disabled={isUpdatingAvailability}
                  onValueChange={(value) => {
                    setTimezoneDraft(value);
                    void persistAvailability(availability, value);
                  }}
                >
                  <SelectTrigger className="bg-slate-50 shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((zone) => (
                      <SelectItem key={zone.value} value={zone.value}>
                        {zone.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            </div>
          </AdminSurface>

          <NotificationPreferencesCard />

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

