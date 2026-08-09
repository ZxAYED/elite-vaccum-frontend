import type { Metadata } from "next";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { RegisterForm } from "@/components/auth/RegisterForm";
import registerImage from "@/public/auth/regis.png";

export const metadata: Metadata = {
  title: "Sign Up - Elite Central Vacuum",
  description: "Create your Elite Central Vacuum account.",
};

export default function RegisterPage() {
  return (
    <AuthLayout
      description="Create an account to save properties, prepare service requests, and manage future maintenance online."
      image={registerImage}
      imageAlt="Elite Central Vacuum customer creating a service account"
      title="Sign Up"
    >
      <RegisterForm />
    </AuthLayout>
  );
}
