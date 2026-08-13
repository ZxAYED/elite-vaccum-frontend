import Link from "next/link";

import {
  AdminSurface,
  TechnicianRouteShell,
} from "@/components/technician/TechnicianRouteShell";
import { Button } from "@/components/ui/Button";
import { TechnicianJobDetailClient } from "@/components/technician/TechnicianJobDetailClient";
import { getTechnicianOrderById } from "@/data/mock/technician-dashboard";

interface TechnicianJobDetailPageProps {
  params: Promise<{ serviceOrderId: string }>;
}

export default async function TechnicianJobDetailPage({
  params,
}: TechnicianJobDetailPageProps) {
  const { serviceOrderId } = await params;
  const order = getTechnicianOrderById(serviceOrderId);

  if (!order) {
    return (
      <TechnicianRouteShell
        eyebrow="Field Service Job"
        title="Job not found"
        description="The requested service order is not assigned to this technician or no longer exists."
      >
        <AdminSurface className="max-w-2xl">
          <p className="text-sm leading-6 text-slate-600">
            Check the service order ID or return to the assigned jobs list.
          </p>
          <div className="mt-5">
            <Button asChild>
              <Link href="/technician/jobs">Back to My Jobs</Link>
            </Button>
          </div>
        </AdminSurface>
      </TechnicianRouteShell>
    );
  }

  return <TechnicianJobDetailClient order={order} />;
}
