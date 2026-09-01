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
import { loginSchema } from "@/lib/validation";
import google from "@/public/common/google.png";
import { toast } from "sonner";
import { useLoginMutation } from "@/redux/api/authApi";
import { useAppDispatch } from "@/redux/hooks";
import { setCredentials } from "@/redux/slices/authSlice";

export function LoginForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [loginMutation, { isLoading: isApiLoggingIn }] = useLoginMutation();
  const [googleStatus, setGoogleStatus] = useState<FormSubmissionState>({
    type: "idle",
  });

  const form = useSchemaForm({
    schema: loginSchema,
    initialValues: {
      email: "",
      password: "",
    },
    onValidSubmit: async (values) => {
      try {
        const rawResponse = await loginMutation({
          email: values.email,
          password: values.password,
        }).unwrap();

        // Support both direct AuthResponse and wrapped { success: true, data: { user, accessToken } }
        const payload = rawResponse as unknown as Record<string, unknown>;
        const dataObj =
          payload && typeof payload.data === "object" && payload.data !== null
            ? (payload.data as Record<string, unknown>)
            : payload;

        const user =
          (dataObj.user as typeof rawResponse.user) ||
          (payload.user as typeof rawResponse.user);
        const token =
          (dataObj.accessToken as string) ||
          (dataObj.token as string) ||
          (payload.accessToken as string) ||
          (payload.token as string);

        if (!user || !token) {
          throw new Error("Missing user or access token in login response.");
        }

        dispatch(
          setCredentials({
            user,
            token,
          })
        );

        const displayName =
          user.fullName ||
          (user.firstName
            ? `${user.firstName} ${user.lastName || ""}`.trim()
            : user.email);

        toast.success("Signed in successfully!", {
          description: `Welcome back, ${displayName}!`,
        });

        const userRole = String(user.role || "").toUpperCase();
        if (userRole === "ADMIN") {
          router.push("/admin");
        } else if (userRole === "TECHNICIAN") {
          router.push("/technician");
        } else {
          router.push("/user");
        }

        return {
          type: "success",
          message: "Signed in successfully. Redirecting to dashboard...",
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
          "Unable to sign in. Please verify your credentials and try again.";

        toast.error("Sign in failed", {
          description: errorMessage,
        });

        return {
          type: "error",
          message: errorMessage,
        };
      }
    },
  });

  const isSubmitting = form.isSubmitting || isApiLoggingIn;

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
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Signing in..." : "Log In"}
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
