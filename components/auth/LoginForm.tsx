"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { FormField } from "@/components/forms/FormField";
import { FormStatus } from "@/components/forms/FormStatus";
import { inputClassName } from "@/components/forms/formStyles";
import { Button } from "@/components/ui/Button";
import { useSchemaForm } from "@/lib/use-schema-form";
import { loginSchema } from "@/lib/validation";
import { toast } from "sonner";
import { useLoginMutation } from "@/redux/api/authApi";
import { useAppDispatch } from "@/redux/hooks";
import { setCredentials } from "@/redux/slices/authSlice";
import type { TechnicianProfileDto } from "@/redux/api/technicianApi";

import { Zap } from "lucide-react";
import { OneClickLoginModal, type DemoRoleAccount } from "./OneClickLoginModal";
import { PasswordInput } from "./PasswordInput";

export function LoginForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [loginMutation, { isLoading: isApiLoggingIn }] = useLoginMutation();
  const [quickLoginOpen, setQuickLoginOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  const performLogin = async (
    email: string,
    password: string,
    roleLabel?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const rawResponse = await loginMutation({
        email,
        password,
      }).unwrap();

      // Support both direct AuthResponse and wrapped { success: true, data: { user, accessToken, technicianProfile } }
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

      const techProfile =
        (dataObj.technicianProfile as TechnicianProfileDto) ||
        (dataObj.profile as TechnicianProfileDto) ||
        ((dataObj.user as Record<string, unknown>)?.technicianProfile as TechnicianProfileDto) ||
        ((user as unknown as Record<string, unknown>)?.technicianProfile as TechnicianProfileDto) ||
        null;

      if (techProfile) {
        user.technicianProfile = techProfile;
        if (!user.avatarUrl && techProfile.avatarUrl) {
          user.avatarUrl = techProfile.avatarUrl;
        }
      }

      dispatch(
        setCredentials({
          user,
          token,
          technicianProfile: techProfile,
        })
      );

      const displayName =
        user.fullName ||
        (user.firstName
          ? `${user.firstName} ${user.lastName || ""}`.trim()
          : user.email);

      toast.success(
        `Signed in successfully${roleLabel ? ` as ${roleLabel}` : ""}!`,
        {
          description: `Welcome back, ${displayName}!`,
        }
      );

      const userRole = String(user.role || "").toUpperCase();
      if (userRole === "ADMIN") {
        router.push("/admin");
      } else if (userRole === "TECHNICIAN") {
        router.push("/technician");
      } else {
        router.push("/user");
      }

      return { success: true };
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

      return { success: false, error: errorMessage };
    }
  };

  const form = useSchemaForm({
    schema: loginSchema,
    initialValues: {
      email: "",
      password: "",
    },
    onValidSubmit: async (values) => {
      const result = await performLogin(values.email, values.password);
      if (result.success) {
        return {
          type: "success",
          message: "Signed in successfully. Redirecting to dashboard...",
        };
      }
      return {
        type: "error",
        message: result.error || "Sign in failed.",
      };
    },
  });

  const handleSelectDemoRole = async (role: DemoRoleAccount) => {
    setSelectedRoleId(role.id);
    form.setFieldValue("email", role.email);
    form.setFieldValue("password", "Password123!");
    const result = await performLogin(role.email, "Password123!", role.title);
    if (result.success) {
      setQuickLoginOpen(false);
    }
    setSelectedRoleId(null);
  };

  const isSubmitting = form.isSubmitting || isApiLoggingIn;

  return (
    <>
      <form className="space-y-5" noValidate onSubmit={form.handleSubmit}>
        <FormStatus status={form.status} />

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
          <PasswordInput
            {...form.getInputProps("password")}
            autoComplete="current-password"
            placeholder="Enter your password..."
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
          {isSubmitting && !selectedRoleId ? "Signing in..." : "Log In"}
        </Button>

        <div className="relative my-2 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <span className="relative bg-white px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            or quick demo
          </span>
        </div>

        <Button
          className="w-full rounded-[var(--radius-control)] py-6 text-base border-teal-200/90 bg-teal-50/50 text-teal-950 hover:bg-teal-100/70 hover:border-teal-300 font-semibold flex items-center justify-center gap-2 transition shadow-sm"
          disabled={isSubmitting}
          onClick={() => setQuickLoginOpen(true)}
          type="button"
          variant="outline"
        >
          <Zap className="size-4 text-amber-500 fill-amber-400" />
          One Click Login
          <span className="ml-1 rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-bold text-teal-800">
            Demo Roles
          </span>
        </Button>

        <p className="text-center text-sm text-slate-600 pt-1">
          Don&apos;t have an account?{" "}
          <Link
            className="font-semibold text-primary transition-opacity hover:opacity-80"
            href="/auth/register"
          >
            Sign up
          </Link>
        </p>
      </form>

      <OneClickLoginModal
        open={quickLoginOpen}
        onOpenChange={setQuickLoginOpen}
        onSelectRole={handleSelectDemoRole}
        isLoading={isSubmitting}
        selectedRoleId={selectedRoleId}
      />
    </>
  );
}
