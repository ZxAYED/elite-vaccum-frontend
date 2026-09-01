"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { FormField } from "@/components/forms/FormField";
import { FormStatus } from "@/components/forms/FormStatus";
import { inputClassName } from "@/components/forms/formStyles";
import { Button } from "@/components/ui/Button";
import { useSchemaForm, type FormSubmissionState } from "@/lib/use-schema-form";
import { forgotPasswordSchema } from "@/lib/validation";
import {
  useForgotPasswordMutation,
  useResetPasswordMutation,
} from "@/redux/api/authApi";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [forgotPasswordMutation, { isLoading: isRequesting }] =
    useForgotPasswordMutation();
  const [resetPasswordMutation, { isLoading: isResetting }] =
    useResetPasswordMutation();

  const [requestedEmail, setRequestedEmail] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [stepStatus, setStepStatus] = useState<FormSubmissionState>({
    type: "idle",
  });

  const form = useSchemaForm({
    schema: forgotPasswordSchema,
    initialValues: {
      email: "",
    },
    onValidSubmit: async (values) => {
      try {
        const response = await forgotPasswordMutation({
          email: values.email,
        }).unwrap();

        setRequestedEmail(values.email);
        toast.success("Verification code sent!", {
          description: "Check your email for the password reset code.",
        });

        setStepStatus({
          type: "success",
          message:
            response.message ||
            "Password reset OTP sent. Check your inbox and enter your code below.",
        });

        return {
          type: "success",
          message: "OTP sent.",
        };
      } catch (err: unknown) {
        const anyErr = err as {
          data?: { message?: string | string[]; error?: string };
          message?: string;
        };
        const errorMessage =
          (Array.isArray(anyErr.data?.message)
            ? anyErr.data.message.join(", ")
            : anyErr.data?.message) ||
          anyErr.data?.error ||
          "Failed to request password reset. Please verify your email address.";

        toast.error("Request failed", {
          description: errorMessage,
        });

        return {
          type: "error",
          message: errorMessage,
        };
      }
    },
  });

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestedEmail || !otpCode.trim() || !newPassword.trim()) return;

    try {
      const response = await resetPasswordMutation({
        email: requestedEmail,
        otp: otpCode.trim(),
        newPassword: newPassword.trim(),
      }).unwrap();

      toast.success("Password reset successfully!", {
        description: "Redirecting to login...",
      });

      setStepStatus({
        type: "success",
        message:
          response.message ||
          "Password reset successfully! Redirecting to login...",
      });

      setTimeout(() => {
        router.push("/auth/login");
      }, 1200);
    } catch (err: unknown) {
      const anyErr = err as {
        data?: { message?: string | string[]; error?: string };
        message?: string;
      };
      const errorMessage =
        (Array.isArray(anyErr.data?.message)
          ? anyErr.data.message.join(", ")
          : anyErr.data?.message) ||
        anyErr.data?.error ||
        "Failed to reset password. Please check your OTP code.";

      toast.error("Password reset failed", {
        description: errorMessage,
      });

      setStepStatus({
        type: "error",
        message: errorMessage,
      });
    }
  };

  // Step 2: OTP & New Password Entry
  if (requestedEmail) {
    return (
      <form className="space-y-5" onSubmit={handleResetPassword} noValidate>
        <FormStatus status={stepStatus} />

        <div className="rounded-2xl border border-teal-100 bg-teal-50/60 p-4 text-sm text-slate-700">
          <p className="font-semibold text-primary">Reset Your Password</p>
          <p className="mt-1 text-slate-600">
            Enter the OTP sent to{" "}
            <strong className="text-slate-900">{requestedEmail}</strong> and
            your new password.
          </p>
        </div>

        <FormField htmlFor="otp" label="Verification Code (OTP)" required>
          <input
            id="otp"
            name="otp"
            autoComplete="one-time-code"
            className={`${inputClassName} text-center tracking-widest text-lg font-bold`}
            maxLength={6}
            placeholder="• • • • •"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
            type="text"
            required
          />
        </FormField>

        <FormField htmlFor="newPassword" label="New Password" required>
          <input
            id="newPassword"
            name="newPassword"
            autoComplete="new-password"
            className={inputClassName}
            placeholder="Enter new secure password..."
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            type="password"
            minLength={8}
            required
          />
        </FormField>

        <Button
          className="w-full rounded-[var(--radius-control)] py-6 text-base"
          disabled={isResetting || !otpCode.trim() || newPassword.length < 8}
          type="submit"
        >
          {isResetting ? "Updating Password..." : "Set New Password"}
        </Button>

        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => {
              setRequestedEmail(null);
              setOtpCode("");
              setNewPassword("");
              setStepStatus({ type: "idle" });
            }}
            className="text-slate-500 hover:text-slate-700"
          >
            Change email
          </button>

          <Link
            className="font-semibold text-primary transition-opacity hover:opacity-80"
            href="/auth/login"
          >
            Back to login
          </Link>
        </div>
      </form>
    );
  }

  const isSubmitting = form.isSubmitting || isRequesting;

  return (
    <form className="space-y-5" noValidate onSubmit={form.handleSubmit}>
      <FormStatus status={form.status} />

      <FormField
        error={form.errors.email}
        hint="Use the same address you plan to log in with."
        htmlFor="email"
        label="Email"
        required
      >
        <input
          {...form.getInputProps("email")}
          autoComplete="email"
          className={inputClassName}
          inputMode="email"
          placeholder="name@example.com..."
          spellCheck={false}
          type="email"
        />
      </FormField>

      <Button
        className="w-full rounded-[var(--radius-control)] py-6 text-base"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Sending OTP..." : "Request Password Reset"}
      </Button>

      <Link
        className="inline-flex text-sm font-semibold text-primary transition-opacity hover:opacity-80"
        href="/auth/login"
      >
        Back to login
      </Link>
    </form>
  );
}
