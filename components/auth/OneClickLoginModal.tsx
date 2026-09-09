"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { ArrowRight, Loader2, ShieldCheck, User, Wrench, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DemoRoleAccount {
  id: "admin" | "technician" | "user";
  title: string;
  roleBadge: string;
  badgeClass: string;
  iconBgClass: string;
  iconColorClass: string;
  email: string;
  description: string;
  destination: string;
}

export const DEMO_ROLES: DemoRoleAccount[] = [
  {
    id: "admin",
    title: "Administrator",
    roleBadge: "ADMIN",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    iconBgClass: "bg-emerald-100/80",
    iconColorClass: "text-emerald-700",
    email: "admin@elitecentralvac.com",
    description: "Manage product catalog, inventory, categories, quotes, and store settings.",
    destination: "/admin",
  },
  {
    id: "technician",
    title: "Service Technician",
    roleBadge: "TECHNICIAN",
    badgeClass: "bg-sky-50 text-sky-800 border-sky-200",
    iconBgClass: "bg-sky-100/80",
    iconColorClass: "text-sky-700",
    email: "technician@elitecentralvac.com",
    description: "Access assigned installation jobs, diagnostics, equipment specs, and repair status.",
    destination: "/technician",
  },
  {
    id: "user",
    title: "Customer / User",
    roleBadge: "USER",
    badgeClass: "bg-teal-50 text-teal-800 border-teal-200",
    iconBgClass: "bg-teal-100/80",
    iconColorClass: "text-teal-700",
    email: "zayed@yzcalo.com",
    description: "Browse products, place orders, book service appointments, and manage profile.",
    destination: "/user",
  },
];

interface OneClickLoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectRole: (role: DemoRoleAccount) => Promise<void>;
  isLoading: boolean;
  selectedRoleId: string | null;
}

export function OneClickLoginModal({
  open,
  onOpenChange,
  onSelectRole,
  isLoading,
  selectedRoleId,
}: OneClickLoginModalProps) {
  const getRoleIcon = (id: DemoRoleAccount["id"]) => {
    switch (id) {
      case "admin":
        return <ShieldCheck className="size-5" />;
      case "technician":
        return <Wrench className="size-5" />;
      case "user":
      default:
        return <User className="size-5" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6 sm:p-7">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600 shadow-sm">
              <Zap className="size-5 fill-amber-500" />
            </span>
            <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-teal-950">
              One Click Login
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm leading-relaxed text-slate-600">
            Select a demo role below to instantly sign in and test the platform with its assigned permissions.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3">
          {DEMO_ROLES.map((role) => {
            const isThisLoggingIn = isLoading && selectedRoleId === role.id;
            const isAnotherLoggingIn = isLoading && selectedRoleId !== role.id;

            return (
              <button
                key={role.id}
                type="button"
                disabled={isLoading}
                onClick={() => onSelectRole(role)}
                className={cn(
                  "group relative w-full text-left rounded-xl border p-4 transition-all duration-200",
                  "bg-white hover:bg-slate-50/80 shadow-sm hover:shadow-md",
                  isThisLoggingIn
                    ? "border-teal-500 bg-teal-50/40 ring-2 ring-teal-500/20"
                    : "border-slate-200 hover:border-teal-300",
                  isAnotherLoggingIn && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105",
                        role.iconBgClass,
                        role.iconColorClass
                      )}
                    >
                      {getRoleIcon(role.id)}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900 text-base">
                          {role.title}
                        </span>
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[11px] font-bold tracking-wider uppercase",
                            role.badgeClass
                          )}
                        >
                          {role.roleBadge}
                        </span>
                      </div>

                      <p className="text-xs font-medium text-slate-500 font-mono">
                        {role.email}
                      </p>

                      <p className="text-xs leading-relaxed text-slate-600 pt-0.5">
                        {role.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center pt-1 shrink-0">
                    {isThisLoggingIn ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-teal-700 bg-teal-100/70 px-2.5 py-1 rounded-lg">
                        <Loader2 className="size-3.5 animate-spin" />
                        Signing in...
                      </span>
                    ) : (
                      <span className="flex size-8 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-600 transition-all duration-200 group-hover:border-[#1c4f50] group-hover:bg-[#1c4f50] group-hover:text-white group-hover:translate-x-0.5 group-hover:shadow-sm">
                        <ArrowRight className="size-4 transition-colors duration-200" />
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-lg bg-slate-50 p-3 border border-slate-200/80 text-center">
          <p className="text-xs text-slate-600">
            Password for all demo accounts:{" "}
            <code className="rounded bg-slate-200/80 px-1.5 py-0.5 font-mono font-semibold text-slate-800">
              Password123!
            </code>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
