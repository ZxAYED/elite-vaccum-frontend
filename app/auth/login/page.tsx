import type { Metadata } from "next";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";
import loginImage from "@/public/auth/login.png";

export const metadata: Metadata = {
  title: "Login - Elite Central Vacuum",
  description: "Login to your Elite Central Vacuum account.",
};

export default function LoginPage() {
  return (
    <AuthLayout
      description="Welcome back. Review your service history, upcoming appointments, and property details from one place."
      image={loginImage}
      imageAlt="Homeowner reviewing a clean home after vacuum service"
      title="Log In"
    >
      <LoginForm />
    </AuthLayout>
  );
}
