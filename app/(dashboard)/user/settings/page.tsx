"use client";

import { useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Building2, Eye, EyeOff, Mail, Phone, RefreshCw, Save, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { PageHeader } from "@/components/customer-portal/PageHeader";
import { NotificationPreferencesCard } from "@/components/notifications/NotificationPreferencesCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useChangePasswordMutation, useGetMeQuery, useLogoutMutation } from "@/redux/api/authApi";
import { useGetCustomerByIdQuery, useUpdateCustomerProfileMutation } from "@/redux/api/customersApi";

const passwordSchema = z
  .object({
    oldPassword: z.string().min(1, "Current password is required."),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .regex(/[A-Za-z]/, "Password must include at least 1 letter.")
      .regex(/\d/, "Password must include at least 1 number."),
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((value) => value.oldPassword !== value.newPassword, {
    path: ["newPassword"],
    message: "New password must be different from the current password.",
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

type CustomerDraft = {
  displayName: string;
  email: string;
  phone: string;
  cellphone: string;
  company: string;
};

function getFullName(firstName?: string, lastName?: string, fallback?: string) {
  return [firstName, lastName].filter(Boolean).join(" ").trim() || fallback || "";
}

export default function UserSettingsPage() {
  const {
    data: authUser,
    isError: isAuthError,
    isLoading: isAuthLoading,
    refetch: refetchAuth,
  } = useGetMeQuery();
  const customerId = authUser?.customerId ?? authUser?.id;
  const {
    data: customer,
    isError: isCustomerError,
    isFetching: isCustomerFetching,
    isLoading: isCustomerLoading,
    refetch: refetchCustomer,
  } = useGetCustomerByIdQuery(customerId ?? "", { skip: !customerId });

  const [updateCustomerProfile, { isLoading: isSavingProfile }] =
    useUpdateCustomerProfileMutation();
  const [changePassword, { isLoading: isChangingPassword }] =
    useChangePasswordMutation();
  const [logout] = useLogoutMutation();

  const [draft, setDraft] = useState<Partial<CustomerDraft>>({});
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordAttempted, setPasswordAttempted] = useState(false);

  const profileValues: CustomerDraft = {
    displayName:
      draft.displayName ??
      customer?.displayName ??
      getFullName(authUser?.firstName, authUser?.lastName, authUser?.fullName),
    email: draft.email ?? customer?.email ?? authUser?.email ?? "",
    phone: draft.phone ?? customer?.phone ?? authUser?.phone ?? "",
    cellphone: draft.cellphone ?? customer?.cellphone ?? "",
    company: draft.company ?? customer?.company ?? "",
  };

  const hasProfileChanges = Object.keys(draft).length > 0;
  const passwordErrors = useMemo(() => {
    const parsed = passwordSchema.safeParse({
      oldPassword,
      newPassword,
      confirmPassword,
    });

    if (parsed.success) return {};
    return Object.fromEntries(
      parsed.error.issues.map((issue) => [issue.path[0], issue.message]),
    ) as Record<string, string>;
  }, [confirmPassword, newPassword, oldPassword]);

  function updateDraft<Key extends keyof CustomerDraft>(
    key: Key,
    value: CustomerDraft[Key],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!customerId) {
      toast.error("Account identity could not be loaded.");
      return;
    }

    if (!profileValues.displayName.trim() || !profileValues.email.trim()) {
      toast.error("Name and email are required.");
      return;
    }

    try {
      await updateCustomerProfile({
        id: customerId,
        data: {
          displayName: profileValues.displayName.trim(),
          email: profileValues.email.trim(),
          phone: profileValues.phone.trim(),
          cellphone: profileValues.cellphone.trim(),
          company: profileValues.company.trim(),
        },
      }).unwrap();
      setDraft({});
      toast.success("Profile updated successfully.");
    } catch {
      toast.error("Could not update your profile. Please try again.");
    }
  }

  async function handleChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordAttempted(true);
    const parsed = passwordSchema.safeParse({
      oldPassword,
      newPassword,
      confirmPassword,
    });

    if (!parsed.success) return;

    try {
      await changePassword({
        oldPassword: parsed.data.oldPassword,
        newPassword: parsed.data.newPassword,
      }).unwrap();
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordAttempted(false);
      toast.success("Password changed successfully.");
    } catch (error) {
      const message = (error as { data?: { message?: string | string[] } }).data?.message;
      toast.error(
        (Array.isArray(message) ? message.join(", ") : message) ||
          "Could not change your password. Check your current password and try again.",
      );
    }
  }

  async function handleLogout() {
    try {
      await logout().unwrap();
      toast.success("Signed out successfully.");
    } catch {
      toast.error("Could not sign out. Please try again.");
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Profile & Settings"
        eyebrow="Customer Portal"
        description="Manage account details, contact information, password security, and notification preferences."
      />

      {isAuthError || isCustomerError ? (
        <section className="flex flex-col gap-3 rounded-lg border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between">
          <p>Profile data could not be loaded from the account APIs.</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              void refetchAuth();
              if (customerId) void refetchCustomer();
            }}
          >
            <RefreshCw className="size-4" />
            Retry
          </Button>
        </section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.12fr)_minmax(22rem,0.88fr)]">
        <form
          onSubmit={handleSaveProfile}
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs sm:p-6"
        >
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex size-11 items-center justify-center rounded-md border border-teal-200 bg-teal-50 text-teal-800">
                <UserRound size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-950">Account profile</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Identity comes from `/auth/me`; customer details are saved through `/customers/:id`.
                </p>
              </div>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-800">
              <ShieldCheck size={15} />
              {authUser?.isActive === false ? "Inactive" : "Active"}
            </div>
          </div>

          {isAuthLoading || isCustomerLoading ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {[0, 1, 2, 3, 4].map((item) => (
                <div key={item} className="h-20 animate-pulse rounded-md bg-slate-100" />
              ))}
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Full name">
                <Input
                  value={profileValues.displayName}
                  onChange={(event) => updateDraft("displayName", event.target.value)}
                  placeholder="Customer name"
                />
              </Field>
              <Field label="Email">
                <Input
                  type="email"
                  value={profileValues.email}
                  onChange={(event) => updateDraft("email", event.target.value)}
                  placeholder="customer@example.com"
                />
              </Field>
              <Field label="Phone">
                <Input
                  value={profileValues.phone}
                  onChange={(event) => updateDraft("phone", event.target.value)}
                  placeholder="+1-555-000-1111"
                />
              </Field>
              <Field label="Cellphone">
                <Input
                  value={profileValues.cellphone}
                  onChange={(event) => updateDraft("cellphone", event.target.value)}
                  placeholder="Optional"
                />
              </Field>
              <Field label="Company" className="md:col-span-2">
                <Input
                  value={profileValues.company}
                  onChange={(event) => updateDraft("company", event.target.value)}
                  placeholder="Optional"
                />
              </Field>
            </div>
          )}

          <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
              <span className="inline-flex items-center gap-2">
                <Mail className="size-4 text-teal-700" />
                {profileValues.email || "No email loaded"}
              </span>
              <span className="inline-flex items-center gap-2">
                <Phone className="size-4 text-teal-700" />
                {profileValues.phone || "No phone loaded"}
              </span>
              <span className="inline-flex items-center gap-2 sm:col-span-2">
                <Building2 className="size-4 text-teal-700" />
                {profileValues.company || "No company on file"}
              </span>
            </div>
            <Button
              type="submit"
              disabled={!hasProfileChanges || isSavingProfile || isCustomerFetching}
            >
              <Save className="size-4" />
              {isSavingProfile ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </form>

        <form
          onSubmit={handleChangePassword}
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs sm:p-6"
        >
          <div className="border-b border-slate-100 pb-5">
            <h2 className="text-lg font-bold text-slate-950">Password change</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Update your portal password through `/auth/change-password`.
            </p>
          </div>

          <div className="mt-5 grid gap-4">
            <PasswordField
              id="customer-current-password"
              label="Current password"
              value={oldPassword}
              onChange={setOldPassword}
              show={showCurrentPassword}
              onToggle={() => setShowCurrentPassword((current) => !current)}
              error={passwordAttempted ? passwordErrors.oldPassword : undefined}
            />
            <PasswordField
              id="customer-new-password"
              label="New password"
              value={newPassword}
              onChange={setNewPassword}
              show={showNewPassword}
              onToggle={() => setShowNewPassword((current) => !current)}
              error={passwordAttempted ? passwordErrors.newPassword : undefined}
            />
            <PasswordField
              id="customer-confirm-password"
              label="Confirm new password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              show={showNewPassword}
              onToggle={() => setShowNewPassword((current) => !current)}
              error={passwordAttempted ? passwordErrors.confirmPassword : undefined}
            />
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-between">
            <Button type="button" variant="outline" onClick={handleLogout}>
              Sign Out
            </Button>
            <Button type="submit" disabled={isChangingPassword}>
              {isChangingPassword ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </form>
      </div>

      <NotificationPreferencesCard />
    </div>
  );
}

function Field({
  children,
  className,
  label,
}: {
  children: ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <label className={className}>
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function PasswordField({
  error,
  id,
  label,
  onChange,
  onToggle,
  show,
  value,
}: {
  error?: string;
  id: string;
  label: string;
  onChange: (value: string) => void;
  onToggle: () => void;
  show: boolean;
  value: string;
}) {
  return (
    <label>
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <div className="relative mt-2">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="pr-12"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)]"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
    </label>
  );
}
