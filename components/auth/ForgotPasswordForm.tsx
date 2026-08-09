"use client";

import Link from "next/link";

import { FormField } from "@/components/forms/FormField";
import { FormStatus } from "@/components/forms/FormStatus";
import { inputClassName } from "@/components/forms/formStyles";
import { Button } from "@/components/ui/Button";
import { useSchemaForm } from "@/lib/use-schema-form";
import { forgotPasswordSchema } from "@/lib/validation";

export function ForgotPasswordForm() {
  const form = useSchemaForm({
    schema: forgotPasswordSchema,
    initialValues: {
      email: "",
    },
    onValidSubmit: async () => ({
      type: "success",
      message:
        "Email confirmed. Reset instructions will be sent once the password-reset API is connected.",
    }),
  });

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
        disabled={form.isSubmitting}
        type="submit"
      >
        {form.isSubmitting ? "Preparing..." : "Request Password Reset"}
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
