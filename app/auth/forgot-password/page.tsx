import type { Metadata } from "next";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import loginImage from "@/public/auth/login.png";

export const metadata: Metadata = {
  title: "Forgot Password - Elite Central Vacuum",
  description: "Prepare a password reset request for your Elite Central Vacuum account.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      description="Enter the email linked to your account. This screen validates the request now and is ready for backend reset delivery next."
      image={loginImage}
      imageAlt="Calm home interior prepared for Elite Central Vacuum support"
      title="Forgot Password"
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
