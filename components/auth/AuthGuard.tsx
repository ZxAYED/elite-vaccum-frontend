"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppSelector } from "@/redux/hooks";
import { getCookie } from "@/lib/cookies";
import { AUTH_TOKEN_KEY } from "@/redux/constants";
import type { UserRole } from "@/types/domain";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

function subscribe(callback: () => void) {
  // Listen for storage or custom events if needed
  window.addEventListener("focus", callback);
  return () => window.removeEventListener("focus", callback);
}

function getStoredToken() {
  return getCookie(AUTH_TOKEN_KEY);
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token } = useAppSelector((state) => state.auth);

  const clientToken = useSyncExternalStore(
    subscribe,
    getStoredToken,
    () => null
  );
  const activeToken = clientToken || token;

  const isRoleAllowed =
    !allowedRoles ||
    !user?.role ||
    allowedRoles.some(
      (role) => String(role).toUpperCase() === String(user.role).toUpperCase()
    );

  const isAuthorized = Boolean(activeToken && isRoleAllowed);

  useEffect(() => {
    if (!activeToken) {
      router.replace(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
    } else if (!isRoleAllowed) {
      router.replace("/auth/login");
    }
  }, [activeToken, isRoleAllowed, router, pathname]);

  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8faf9]">
        <div className="flex flex-col items-center gap-3">
          <div className="size-9 animate-spin rounded-full border-3 border-teal-200 border-t-teal-700" />
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Checking session...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
