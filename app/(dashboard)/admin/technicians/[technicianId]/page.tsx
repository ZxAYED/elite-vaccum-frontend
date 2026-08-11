import { AdminTechnicianDetailClient } from "@/components/admin/technicians/AdminTechnicianDetailClient";

interface AdminTechnicianDetailPageProps {
  params: Promise<{
    technicianId: string;
  }>;
}

export default async function AdminTechnicianDetailPage({
  params,
}: AdminTechnicianDetailPageProps) {
  const { technicianId } = await params;

  return <AdminTechnicianDetailClient technicianId={technicianId} />;
}
