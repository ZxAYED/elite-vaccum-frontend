import type { ReactNode } from "react";

import {
  AdminPageHeader,
  AdminPageShell,
  AdminStatCard,
  AdminSurface,
} from "@/components/admin/AdminPageShell";

export function TechnicianRouteShell({
  action,
  children,
  description,
  eyebrow,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  description?: string;
  eyebrow?: string;
  title: string;
}) {
  return (
    <AdminPageShell>
      <AdminPageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        action={action}
      />
      {children}
    </AdminPageShell>
  );
}

export { AdminStatCard, AdminSurface };
