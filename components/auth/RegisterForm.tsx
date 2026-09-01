"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { FormField } from "@/components/forms/FormField";
import { FormStatus } from "@/components/forms/FormStatus";
import { inputClassName } from "@/components/forms/formStyles";
import { Button } from "@/components/ui/Button";
import { useSchemaForm, type FormSubmissionState } from "@/lib/use-schema-form";
import { registerSchema } from "@/lib/validation";
import google from "@/public/common/google.png";
import { toast } from "sonner";
import {
  useSignupMutation,
  useVerifyOtpMutation,
  useResendOtpMutation,
} from "@/redux/api/authApi";

export function RegisterForm() {
  const router = useRouter();
  const [signupMutation, { isLoading: isSigningUp }] = useSignupMutation();
  const [verifyOtpMutation, { isLoading: isVerifying }] = useVerifyOtpMutation();
  const [resendOtpMutation, { isLoading: isResending }] = useResendOtpMutation();

  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [otpStatus, setOtpStatus] = useState<FormSubmissionState>({
    type: "idle",
  });
  const [googleStatus, setGoogleStatus] = useState<FormSubmissionState>({
    type: "idle",
  });

  const form = useSchemaForm({
    schema: registerSchema,
    initialValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      termsAccepted: false,
    },
    onValidSubmit: async (values) => {
      try {
        const response = await signupMutation({
          fullName: values.fullName.trim(),
          email: values.email.trim(),
          password: values.password,
          phone: values.phone?.trim() || undefined,
        }).unwrap();

        setRegisteredEmail(values.email);
        toast.success("Account created successfully!", {
          description: "We've sent a 5-digit verification code to your email.",
        });

        setOtpStatus({
          type: "success",
          message:
            response.message ||
            "Registration successful! Enter the 5-digit verification code sent to your email.",
        });

        return {
          type: "success",
          message: "Verification code sent.",
        };
      } catch (err: unknown) {
        const errorData = err as { data?: { message?: string } };
        const errorMessage =
          errorData?.data?.message ||
          "Unable to register. Please try again with a different email.";

        toast.error("Registration failed", {
          description: errorMessage,
        });

        return {
          type: "error",
          message: errorMessage,
        };
      }
    },
  });

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registeredEmail || !otpCode.trim()) return;

    try {
      const response = await verifyOtpMutation({
        email: registeredEmail,
        otp: otpCode.trim(),
      }).unwrap();

      toast.success("Email verified successfully!", {
        description: "Redirecting to login...",
      });

      setOtpStatus({
        type: "success",
        message: response.message || "Email verified! Redirecting to login...",
      });

      setTimeout(() => {
        router.push("/auth/login");
      }, 1200);
    } catch (err: unknown) {
      const errorData = err as { data?: { message?: string } };
      const errorMessage =
        errorData?.data?.message ||
        "Invalid or expired OTP code. Please try again.";

      toast.error("Verification failed", {
        description: errorMessage,
      });

      setOtpStatus({
        type: "error",
        message: errorMessage,
      });
    }
  };

  const handleResendOtp = async () => {
    if (!registeredEmail) return;
    try {
      const response = await resendOtpMutation({
        email: registeredEmail,
      }).unwrap();

      toast.success("Verification code resent", {
        description: "A fresh code was sent to your email.",
      });

      setOtpStatus({
        type: "success",
        message: response.message || "New verification code sent to your email.",
      });
    } catch (err: unknown) {
      const errorData = err as { data?: { message?: string } };
      const errorMessage =
        errorData?.data?.message ||
        "Failed to resend code. Please try again in a moment.";

      toast.error("Resend failed", {
        description: errorMessage,
      });

      setOtpStatus({
        type: "error",
        message: errorMessage,
      });
    }
  };

  // OTP Verification Step
  if (registeredEmail) {
    return (
      <form className="space-y-5" onSubmit={handleVerifyOtp} noValidate>
        <FormStatus status={otpStatus} />

        <div className="rounded-2xl border border-teal-100 bg-teal-50/60 p-4 text-sm text-slate-700">
          <p className="font-semibold text-primary">Verify Your Email</p>
          <p className="mt-1 text-slate-600">
            We sent a 5-digit verification code to{" "}
            <strong className="text-slate-900">{registeredEmail}</strong>.
          </p>
        </div>

        <FormField htmlFor="otp" label="5-Digit Verification Code" required>
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

        <Button
          className="w-full rounded-[var(--radius-control)] py-6 text-base"
          disabled={isVerifying || !otpCode.trim()}
          type="submit"
        >
          {isVerifying ? "Verifying..." : "Verify Code & Proceed"}
        </Button>

        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            disabled={isResending}
            onClick={handleResendOtp}
            className="font-semibold text-primary transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            {isResending ? "Resending..." : "Resend Code"}
          </button>

          <button
            type="button"
            onClick={() => {
              setRegisteredEmail(null);
              setOtpCode("");
              setOtpStatus({ type: "idle" });
            }}
            className="text-slate-500 hover:text-slate-700"
          >
            Use different email
          </button>
        </div>
      </form>
    );
  }

  const isSubmitting = form.isSubmitting || isSigningUp;

  return (
    <form className="space-y-5" noValidate onSubmit={form.handleSubmit}>
      <FormStatus
        status={googleStatus.type === "idle" ? form.status : googleStatus}
      />

      <FormField
        error={form.errors.fullName}
        htmlFor="fullName"
        label="Full Name"
        required
      >
        <input
          {...form.getInputProps("fullName")}
          autoComplete="name"
          className={inputClassName}
          placeholder="Jane Doe"
          type="text"
        />
      </FormField>

      <FormField
        error={form.errors.email}
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

      <FormField
        error={form.errors.phone}
        hint="Optional. Used for service scheduling updates."
        htmlFor="phone"
        label="Phone Number"
      >
        <input
          {...form.getInputProps("phone")}
          autoComplete="tel"
          className={inputClassName}
          inputMode="tel"
          placeholder="+1 (555) 000-0000"
          type="tel"
        />
      </FormField>

      <FormField
        error={form.errors.password}
        hint="Use at least 8 characters with 1 letter and 1 number."
        htmlFor="password"
        label="Password"
        required
      >
        <input
          {...form.getInputProps("password")}
          autoComplete="new-password"
          className={inputClassName}
          placeholder="Create a secure password..."
          type="password"
        />
      </FormField>

      <div className="space-y-2">
        <label
          className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
          htmlFor="termsAccepted"
        >
          <input
            {...form.getCheckboxProps("termsAccepted")}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)]"
            type="checkbox"
          />
          <span>
            I agree to the{" "}
            <Link className="font-semibold text-primary" href="/terms">
              service terms
            </Link>{" "}
            and{" "}
            <Link className="font-semibold text-primary" href="/privacy">
              privacy policy
            </Link>
            .
          </span>
        </label>
        {form.errors.termsAccepted ? (
          <p
            className="text-sm text-red-700"
            id={form.getErrorId("termsAccepted")}
            role="alert"
          >
            {form.errors.termsAccepted}
          </p>
        ) : null}
      </div>

      <Button
        className="mt-2 w-full rounded-[var(--radius-control)] py-6 text-base"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Creating Account..." : "Create Account"}
      </Button>

      <Button
        className="w-full rounded-[var(--radius-control)] py-6 text-base"
        onClick={() =>
          setGoogleStatus({
            type: "ready",
            message:
              "Google registration is ready for OAuth wiring. Connect the auth provider to complete account creation.",
          })
        }
        type="button"
        variant="outline"
      >
        <Image alt="" className="h-5 w-5" src={google} />
        Continue with Google
      </Button>

      <p className="text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link
          className="font-semibold text-primary transition-opacity hover:opacity-80"
          href="/auth/login"
        >
          Log in
        </Link>
      </p>
    </form>
  );
}
