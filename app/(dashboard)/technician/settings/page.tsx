"use client";

import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { Camera, Eye, EyeOff, LockKeyhole, Mail, SlidersHorizontal, Trash2, UserRound } from "lucide-react";
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
import { useAppSelector } from "@/redux/hooks";
import { useChangePasswordMutation, useGetMeQuery } from "@/redux/api/authApi";
import {
  useGetTechnicianProfileQuery,
  useRemoveTechnicianPhotoMutation,
  useUpdateTechnicianAvailabilityMutation,
  useUpdateTechnicianProfileMutation,
  useUploadTechnicianPhotoMutation,
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
  const reduxUser = useAppSelector((state) => state.auth.user);
  const reduxTech = useAppSelector((state) => state.auth.technicianProfile);

  const { data: authUserQuery } = useGetMeQuery();
  const authUser = authUserQuery || reduxUser || null;

  // Phase 17.4 profile provides the current availability + timezone.
  const { data: technicianQuery } = useGetTechnicianProfileQuery();
  const technician =
    technicianQuery ||
    reduxTech ||
    (reduxUser?.technicianProfile as typeof technicianQuery) ||
    null;
  const avatarUrl = technician?.avatarUrl || reduxUser?.avatarUrl;
  const [updateAvailabilityApi, { isLoading: isUpdatingAvailability }] =
    useUpdateTechnicianAvailabilityMutation();
  const [updateTechnicianProfile, { isLoading: isSavingProfile }] =
    useUpdateTechnicianProfileMutation();
  const [uploadTechnicianPhoto, { isLoading: isUploadingPhoto }] =
    useUploadTechnicianPhotoMutation();
  const [removeTechnicianPhoto, { isLoading: isRemovingPhoto }] =
    useRemoveTechnicianPhotoMutation();
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
  const [profileDraft, setProfileDraft] = useState<{
    displayName?: string;
    phone?: string;
    specializationsText?: string;
  }>({});

  const profileValues = {
    displayName:
      profileDraft.displayName ??
      technician?.displayName ??
      [authUser?.firstName, authUser?.lastName].filter(Boolean).join(" ").trim() ??
      "",
    phone: profileDraft.phone ?? technician?.phone ?? authUser?.phone ?? "",
    specializationsText:
      profileDraft.specializationsText ?? (technician?.specializations ?? []).join(", "),
  };
  const hasProfileChanges = Object.keys(profileDraft).length > 0;

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

  async function handleSaveProfile() {
    if (!profileValues.displayName.trim()) {
      toast.error("Display name is required.");
      return;
    }

    try {
      await updateTechnicianProfile({
        displayName: profileValues.displayName.trim(),
        phone: profileValues.phone.trim(),
        specializations: profileValues.specializationsText
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      }).unwrap();
      setProfileDraft({});
      toast.success("Technician profile updated.");
    } catch {
      toast.error("Could not update technician profile. Please try again.");
    }
  }

  async function handlePhotoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const formData = new FormData();
    formData.append("photo", file);

    try {
      await uploadTechnicianPhoto(formData).unwrap();
      toast.success("Profile photo uploaded.");
    } catch {
      toast.error("Could not upload profile photo. Please try again.");
    }
  }

  async function handleRemovePhoto() {
    try {
      await removeTechnicianPhoto().unwrap();
      toast.success("Profile photo removed.");
    } catch {
      toast.error("Could not remove profile photo. Please try again.");
    }
  }

  return (
    <TechnicianRouteShell
      eyebrow="Technician Account"
      title="Settings"
      description="Account security, availability, and notification preferences."
    >
      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <AdminSurface className="xl:col-span-2">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:items-start">
            <div className="flex items-start gap-4">
              <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-teal-200 bg-teal-50 text-lg font-semibold text-primary">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt={`${technician?.displayName || reduxUser?.fullName || "Technician"} profile`}
                    className="size-full object-cover"
                  />
                ) : (
                  <UserRound className="size-7" />
                )}
              </div>
              <div className="min-w-0">
                <h2 className="text-2xl font-semibold text-primary">Technician Profile</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {authUser?.email ? (
                    <span className="inline-flex items-center gap-2">
                      <Mail className="size-4 text-teal-700" />
                      {authUser.email}
                    </span>
                  ) : (
                    "Account identity loads from /auth/me."
                  )}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline">
                    <label className="cursor-pointer">
                      <Camera className="size-4" />
                      {isUploadingPhoto ? "Uploading..." : "Upload Photo"}
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        className="sr-only"
                        disabled={isUploadingPhoto}
                        onChange={handlePhotoUpload}
                      />
                    </label>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isRemovingPhoto}
                    onClick={handleRemovePhoto}
                  >
                    <Trash2 className="size-4" />
                    {isRemovingPhoto ? "Removing..." : "Remove Photo"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">Display Name</span>
                <Input
                  value={profileValues.displayName}
                  onChange={(event) =>
                    setProfileDraft((current) => ({
                      ...current,
                      displayName: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">Phone</span>
                <Input
                  value={profileValues.phone}
                  onChange={(event) =>
                    setProfileDraft((current) => ({ ...current, phone: event.target.value }))
                  }
                />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-semibold text-slate-700">Specializations</span>
                <Input
                  value={profileValues.specializationsText}
                  onChange={(event) =>
                    setProfileDraft((current) => ({
                      ...current,
                      specializationsText: event.target.value,
                    }))
                  }
                  placeholder="Maintenance Visits, Accessory Fit Service, Pipe Flush"
                />
              </label>
              <div className="flex justify-end md:col-span-2">
                <Button
                  type="button"
                  disabled={!hasProfileChanges || isSavingProfile}
                  onClick={handleSaveProfile}
                >
                  {isSavingProfile ? "Saving..." : "Save Technician Profile"}
                </Button>
              </div>
            </div>
          </div>
        </AdminSurface>

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
