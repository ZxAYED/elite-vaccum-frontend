"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { FormField } from "@/components/forms/FormField";
import { FormStatus } from "@/components/forms/FormStatus";
import { inputClassName } from "@/components/forms/formStyles";
import { Button } from "@/components/ui/Button";
import { useSchemaForm, type FormSubmissionState } from "@/lib/use-schema-form";
import { registerSchema } from "@/lib/validation";
import google from "@/public/common/google.png";

export function RegisterForm() {
  const [googleStatus, setGoogleStatus] = useState<FormSubmissionState>({
    type: "idle",
  });
  const form = useSchemaForm({
    schema: registerSchema,
    initialValues: {
      fullName: "",
      email: "",
      password: "",
      termsAccepted: false,
    },
    onValidSubmit: async () => ({
      type: "ready",
      message:
        "Registration details passed validation. Account creation will be enabled once the auth backend is connected.",
    }),
  });

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
          placeholder="Jordan Mercer..."
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
        disabled={form.isSubmitting}
        type="submit"
      >
        {form.isSubmitting ? "Validating..." : "Create Account"}
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
