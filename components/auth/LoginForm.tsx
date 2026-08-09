"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { FormField } from "@/components/forms/FormField";
import { FormStatus } from "@/components/forms/FormStatus";
import { inputClassName } from "@/components/forms/formStyles";
import { Button } from "@/components/ui/Button";
import { useSchemaForm, type FormSubmissionState } from "@/lib/use-schema-form";
import { loginSchema } from "@/lib/validation";
import google from "@/public/common/google.png";

export function LoginForm() {
  const [googleStatus, setGoogleStatus] = useState<FormSubmissionState>({
    type: "idle",
  });
  const form = useSchemaForm({
    schema: loginSchema,
    initialValues: {
      email: "",
      password: "",
    },
    onValidSubmit: async () => ({
      type: "ready",
      message:
        "Credentials look valid. Sign-in will begin once the authentication API is connected.",
    }),
  });

  return (
    <form className="space-y-5" noValidate onSubmit={form.handleSubmit}>
      <FormStatus
        status={googleStatus.type === "idle" ? form.status : googleStatus}
      />

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
        htmlFor="password"
        label="Password"
        required
      >
        <input
          {...form.getInputProps("password")}
          autoComplete="current-password"
          className={inputClassName}
          placeholder="Enter your password..."
          type="password"
        />
      </FormField>

      <div className="flex justify-end">
        <Link
          className="text-sm font-semibold text-primary transition-opacity hover:opacity-80"
          href="/auth/forgot-password"
        >
          Forgot password?
        </Link>
      </div>

      <Button
        className="mt-2 w-full rounded-[var(--radius-control)] py-6 text-base"
        disabled={form.isSubmitting}
        type="submit"
      >
        {form.isSubmitting ? "Validating..." : "Log In"}
      </Button>

      <Button
        className="w-full rounded-[var(--radius-control)] py-6 text-base"
        onClick={() =>
          setGoogleStatus({
            type: "ready",
            message:
              "Google sign-in is ready for OAuth wiring. Connect the auth provider to complete this flow.",
          })
        }
        type="button"
        variant="outline"
      >
        <Image alt="" className="h-5 w-5" src={google} />
        Continue with Google
      </Button>

      <p className="text-center text-sm text-slate-600">
        Don&apos;t have an account?{" "}
        <Link
          className="font-semibold text-primary transition-opacity hover:opacity-80"
          href="/auth/register"
        >
          Sign up
        </Link>
      </p>
    </form>
  );
}
