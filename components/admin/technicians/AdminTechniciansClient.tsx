"use client";

import {
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import {
  AdminPageHeader,
  AdminPageShell,
  AdminStatCard,
  AdminSurface,
} from "@/components/admin/AdminPageShell";
import { AdminSearchInput } from "@/components/admin/AdminSearchInput";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import {
  canDeleteTechnician,
  createAdminTechnician,
  deleteAdminTechnician,
  getAdminTechnicianById,
  getAdminTechnicians,
  getTechnicianTodaySchedules,
  getTechnicianUpcomingSchedules,
  hasFutureAssignments,
  updateAdminTechnician,
} from "@/data/mock/technicians";
import type { TechnicianValues } from "@/lib/validation";
import type { AdminTechnician, AdminTechnicianStatus, TechnicianAvailability } from "@/types/domain";
import { toast } from "sonner";
import {
  useGetAdminTechniciansListQuery,
  useCreateTechnicianMutation,
  useUpdateTechnicianMutation,
  useDeleteTechnicianMutation,
  type TechnicianProfileDto,
} from "@/redux/api/technicianApi";

import { TechnicianFormDialog } from "./TechnicianFormDialog";
import {
  getTechnicianAvailabilityMeta,
  type TechnicianAvailabilityFilter,
  type TechnicianSortValue,
} from "./technician-utils";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function mapProfileDtoToAdminTechnician(dto: TechnicianProfileDto): AdminTechnician {
  return {
    id: dto.id,
    userId: dto.userId || `user-${dto.id}`,
    displayName: dto.displayName,
    email: dto.email,
    phone: dto.phone || "",
    status: (dto.status === "INACTIVE" ? "INACTIVE" : "ACTIVE") as AdminTechnicianStatus,
    availability: (dto.availability as TechnicianAvailability) || "AVAILABLE",
    rating: typeof dto.rating === "number" ? dto.rating : parseFloat(dto.rating || "5") || 5,
    completedJobs: dto.completedJobs ?? dto._count?.assignedJobs ?? 0,
    verified: dto.isVerified ?? true,
    specializations: dto.specializations && dto.specializations.length > 0 ? dto.specializations : ["General Service"],
    notes: dto.adminNotes || dto.bio || undefined,
    createdAt: dto.createdAt || new Date().toISOString(),
    updatedAt: dto.updatedAt || new Date().toISOString(),
  };
}

export function AdminTechniciansClient() {
  const [technicians, setTechnicians] = useState<AdminTechnician[]>(() =>
    clone(getAdminTechnicians()),
  );
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<TechnicianAvailabilityFilter>("all");
  const [sort, setSort] = useState<TechnicianSortValue>("name-asc");
  const [formOpen, setFormOpen] = useState(false);
  const [editingTechnicianId, setEditingTechnicianId] = useState<string | null>(null);
  const [deactivateTargetId, setDeactivateTargetId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const {
    data: apiData,
    isLoading,
    refetch,
  } = useGetAdminTechniciansListQuery({
    search: search.trim() || undefined,
  });
  const [createTechnicianApi] = useCreateTechnicianMutation();
  const [updateTechnicianApi] = useUpdateTechnicianMutation();
  const [deleteTechnicianApi] = useDeleteTechnicianMutation();

  function syncTechnicians() {
    setTechnicians(clone(getAdminTechnicians()));
  }

  const apiTechnicians = useMemo(() => {
    if (!apiData?.items) return null;
    return apiData.items.map(mapProfileDtoToAdminTechnician);
  }, [apiData]);

  // Use API technicians if loaded, falling back to mock or merging
  const allDisplayTechnicians = useMemo<AdminTechnician[]>(() => {
    if (apiTechnicians) {
      if (apiTechnicians.length === 0 && !search.trim()) {
        // If API returned 0 items but mock has items, fallback to mock
        return technicians.length > 0 ? technicians : [];
      }
      return apiTechnicians;
    }
    return technicians;
  }, [apiTechnicians, technicians, search]);

  const editingTechnician = editingTechnicianId
    ? allDisplayTechnicians.find((t) => t.id === editingTechnicianId) ??
      getAdminTechnicianById(editingTechnicianId) ??
      null
    : null;
  const deactivateTarget = deactivateTargetId
    ? allDisplayTechnicians.find((t) => t.id === deactivateTargetId) ??
      getAdminTechnicianById(deactivateTargetId)
    : undefined;
  const deleteTarget = deleteTargetId
    ? allDisplayTechnicians.find((t) => t.id === deleteTargetId) ??
      getAdminTechnicianById(deleteTargetId)
    : undefined;

  function openCreate() {
    setEditingTechnicianId(null);
    setFormOpen(true);
  }

  function openEdit(technicianId: string) {
    setEditingTechnicianId(technicianId);
    setFormOpen(true);
  }

  async function save(values: TechnicianValues) {
    if (editingTechnicianId) {
      updateAdminTechnician(editingTechnicianId, {
        displayName: values.fullName,
        email: values.email,
        phone: values.phone,
        status: values.status,
        availability: values.availability,
        notes: values.notes || undefined,
      });

      try {
        await updateTechnicianApi({
          id: editingTechnicianId,
          body: {
            displayName: values.fullName,
            email: values.email,
            phone: values.phone,
            status: values.status,
          },
        }).unwrap();
        toast.success("Technician updated successfully.");
        refetch();
      } catch (err: unknown) {
        const apiErr = err as { data?: { message?: string | string[] } };
        const msg = Array.isArray(apiErr?.data?.message)
          ? apiErr.data.message.join(", ")
          : apiErr?.data?.message;
        toast.info(msg || "Technician updated locally.");
      }
    } else {
      createAdminTechnician({
        userId: `user-${values.fullName.toLowerCase().replace(/\s+/g, "-")}`,
        displayName: values.fullName,
        email: values.email,
        phone: values.phone,
        status: values.status,
        availability: values.availability,
        notes: values.notes || undefined,
        rating: 5,
        completedJobs: 0,
        verified: true,
        specializations: ["General Service"],
      });

      try {
        const createPayload: Record<string, unknown> = {
          displayName: values.fullName,
          email: values.email,
          phone: values.phone,
          status: values.status,
        };
        if (values.password?.trim()) {
          createPayload.password = values.password.trim();
        }

        await createTechnicianApi(createPayload).unwrap();
        toast.success("Technician created successfully.");
        refetch();
      } catch (err: unknown) {
        const apiErr = err as { data?: { message?: string | string[] } };
        const msg = Array.isArray(apiErr?.data?.message)
          ? apiErr.data.message.join(", ")
          : apiErr?.data?.message;
        toast.error(msg || "Failed to create technician on server, created locally.");
      }
    }

    syncTechnicians();
    setFormOpen(false);
    setEditingTechnicianId(null);
  }

  async function handleToggleStatus(target: AdminTechnician) {
    const nextStatus = target.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const nextAvailability = target.status === "ACTIVE" ? "OFF_DUTY" : "AVAILABLE";

    updateAdminTechnician(target.id, {
      status: nextStatus,
      availability: nextAvailability,
    });

    try {
      await updateTechnicianApi({
        id: target.id,
        body: { status: nextStatus },
      }).unwrap();
      toast.success(
        `Technician ${nextStatus === "ACTIVE" ? "activated" : "deactivated"}.`,
      );
      refetch();
    } catch {
      toast.info(`Status updated locally.`);
    }

    syncTechnicians();
    setDeactivateTargetId(null);
  }

  async function handleDelete(targetId: string) {
    deleteAdminTechnician(targetId);

    try {
      await deleteTechnicianApi(targetId).unwrap();
      toast.success("Technician deleted successfully.");
      refetch();
    } catch {
      toast.info("Technician deleted locally.");
    }

    syncTechnicians();
    setDeleteTargetId(null);
  }

  const filteredTechnicians = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return allDisplayTechnicians
      .filter((technician) => {
        if (!normalizedSearch) return true;

        const haystack = [
          technician.displayName,
          technician.email,
          technician.phone,
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(normalizedSearch);
      })
      .filter((technician) => {
        const availabilityMeta = getTechnicianAvailabilityMeta(technician);
        const jobsToday = getTechnicianTodaySchedules(technician.id).length;

        switch (filter) {
          case "available":
            return availabilityMeta.label === "Available";
          case "busy":
            return availabilityMeta.label === "Busy";
          case "inactive":
            return technician.status === "INACTIVE";
          case "assigned-today":
            return jobsToday > 0;
          case "no-jobs-today":
            return jobsToday === 0;
          default:
            return true;
        }
      })
      .sort((left, right) => {
        switch (sort) {
          case "name-desc":
            return right.displayName.localeCompare(left.displayName);
          case "most-jobs":
            return (
              getTechnicianUpcomingSchedules(right.id).length -
              getTechnicianUpcomingSchedules(left.id).length
            );
          case "fewest-jobs":
            return (
              getTechnicianUpcomingSchedules(left.id).length -
              getTechnicianUpcomingSchedules(right.id).length
            );
          case "recently-added":
            return (
              new Date(right.createdAt).getTime() -
              new Date(left.createdAt).getTime()
            );
          default:
            return left.displayName.localeCompare(right.displayName);
        }
      });
  }, [filter, search, sort, allDisplayTechnicians]);

  const stats = useMemo(() => {
    const availableCount = allDisplayTechnicians.filter(
      (technician) => getTechnicianAvailabilityMeta(technician).label === "Available",
    ).length;
    const busyCount = allDisplayTechnicians.filter(
      (technician) => getTechnicianAvailabilityMeta(technician).label === "Busy",
    ).length;
    const inactiveCount = allDisplayTechnicians.filter(
      (technician) => technician.status === "INACTIVE",
    ).length;

    return [
      { label: "Total", value: allDisplayTechnicians.length },
      { label: "Available", value: availableCount, tone: "success" as const },
      { label: "Busy", value: busyCount, tone: "soft" as const },
      { label: "Inactive", value: inactiveCount, tone: "warning" as const },
    ];
  }, [allDisplayTechnicians]);

  return (
    <AdminPageShell>
      <AdminPageHeader
        action={
          <Button onClick={openCreate}>
            <Plus size={16} />
            Add Technician
          </Button>
        }
        description="Manage technicians, availability, and service assignments."
        eyebrow="Team"
        title="Technicians"
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <AdminStatCard
            key={stat.label}
            label={stat.label}
            tone={stat.tone}
            value={stat.value}
          />
        ))}
      </div>

      <AdminSurface className="space-y-4">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_220px_220px]">
          <AdminSearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name, email, or phone..."
            ariaLabel="Search technicians"
          />

          <Select onValueChange={(value) => setFilter(value as TechnicianAvailabilityFilter)} value={filter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="busy">Busy</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="assigned-today">Assigned Today</SelectItem>
              <SelectItem value="no-jobs-today">No Jobs Today</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={(value) => setSort(value as TechnicianSortValue)} value={sort}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Name A-Z</SelectItem>
              <SelectItem value="name-desc">Name Z-A</SelectItem>
              <SelectItem value="most-jobs">Most Jobs</SelectItem>
              <SelectItem value="fewest-jobs">Fewest Jobs</SelectItem>
              <SelectItem value="recently-added">Recently Added</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading && allDisplayTechnicians.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Loader2 className="size-8 animate-spin text-primary" />
            <span className="mt-3 text-sm font-medium">Loading technicians...</span>
          </div>
        ) : filteredTechnicians.length === 0 ? (
          allDisplayTechnicians.length === 0 ? (
            <EmptyState
              icon={UserCheck}
              title="No technicians found"
              description="Add field technicians to assign service dispatch jobs, evaluate territory coverage, and track work orders."
              action={{
                label: "Add Technician",
                onClick: openCreate,
              }}
              tone="dashed"
              className="py-16"
            />
          ) : (
            <EmptyState
              icon={Search}
              title="No technicians match your filters"
              description="Try adjusting your search query, status filter, or sort selection."
              action={{
                label: "Clear Filters",
                onClick: () => {
                  setSearch("");
                  setFilter("all");
                  setSort("name-asc");
                },
                variant: "outline",
              }}
              tone="dashed"
              className="py-12"
            />
          )
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-lg border border-teal-100 xl:block">
              <div className="grid grid-cols-[1.3fr_1fr_180px_140px_150px_120px_76px] bg-teal-50/70 px-5 py-3 text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
                <span>Technician</span>
                <span>Contact</span>
                <span>Availability</span>
                <span>Today&apos;s Jobs</span>
                <span>Upcoming Jobs</span>
                <span>Status</span>
                <span className="text-right">Actions</span>
              </div>
              <div className="divide-y divide-teal-100 bg-white">
                {filteredTechnicians.map((technician) => {
                  const availabilityMeta = getTechnicianAvailabilityMeta(technician);
                  const todayJobs = getTechnicianTodaySchedules(technician.id).length;
                  const upcomingJobs = getTechnicianUpcomingSchedules(technician.id).length;

                  return (
                    <div
                      className="grid grid-cols-[1.3fr_1fr_180px_140px_150px_120px_76px] items-center gap-4 px-5 py-4"
                      key={technician.id}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-lg font-semibold text-primary">
                          {technician.displayName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-950">
                            {technician.displayName}
                          </p>
                          <p className="truncate text-sm text-slate-500">
                            {technician.specializations.join(" • ")}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-slate-600">
                        <p className="truncate">{technician.email}</p>
                        <p className="mt-1">{technician.phone}</p>
                      </div>
                      <div>
                        <StatusBadge
                          label={availabilityMeta.label}
                          status={availabilityMeta.badgeStatus}
                        />
                      </div>
                      <p className="font-medium text-slate-900">{todayJobs}</p>
                      <p className="font-medium text-slate-900">{upcomingJobs}</p>
                      <div>
                        <StatusBadge
                          label={technician.status === "ACTIVE" ? "Active" : "Inactive"}
                          status={technician.status === "ACTIVE" ? "accepted" : "cancelled"}
                        />
                      </div>
                      <div className="flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              aria-label={`Open actions for ${technician.displayName}`}
                              className="inline-flex size-10 items-center justify-center rounded-lg border border-teal-100 bg-white text-slate-600 transition hover:border-teal-200 hover:bg-teal-50 hover:text-primary"
                              type="button"
                            >
                              <MoreHorizontal size={18} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/technicians/${technician.id}`}>View</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => openEdit(technician.id)}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href="/admin/schedule">View Schedule</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => setDeactivateTargetId(technician.id)}>
                              {technician.status === "ACTIVE" ? "Deactivate" : "Activate"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-rose-700 focus:bg-rose-50 focus:text-rose-800"
                              onSelect={() => setDeleteTargetId(technician.id)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 xl:hidden">
              {filteredTechnicians.map((technician) => {
                const availabilityMeta = getTechnicianAvailabilityMeta(technician);

                return (
                  <div className="rounded-lg border border-teal-100 bg-white p-4" key={technician.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-semibold text-slate-950">
                          {technician.displayName}
                        </h2>
                        <p className="truncate text-sm text-slate-500">{technician.email}</p>
                        <p className="mt-1 text-sm text-slate-500">{technician.phone}</p>
                      </div>
                      <StatusBadge
                        label={availabilityMeta.label}
                        status={availabilityMeta.badgeStatus}
                      />
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                        <span className="font-medium text-slate-900">Today:</span>{" "}
                        {getTechnicianTodaySchedules(technician.id).length} jobs
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                        <span className="font-medium text-slate-900">Upcoming:</span>{" "}
                        {getTechnicianUpcomingSchedules(technician.id).length} jobs
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/technicians/${technician.id}`}>View</Link>
                      </Button>
                      <Button onClick={() => openEdit(technician.id)} size="sm" variant="outline">
                        Edit
                      </Button>
                      <Button
                        onClick={() => setDeactivateTargetId(technician.id)}
                        size="sm"
                        variant="outline"
                      >
                        {technician.status === "ACTIVE" ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </AdminSurface>

      <TechnicianFormDialog
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingTechnicianId(null);
        }}
        onSubmit={save}
        open={formOpen}
        technician={editingTechnician}
      />

      <Dialog
        onOpenChange={(open) => {
          if (!open) setDeactivateTargetId(null);
        }}
        open={Boolean(deactivateTarget)}
      >
        <DialogContent>
          {deactivateTarget ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {deactivateTarget.status === "ACTIVE"
                    ? "Deactivate Technician?"
                    : "Activate Technician?"}
                </DialogTitle>
                <DialogDescription>
                  {deactivateTarget.status === "ACTIVE"
                    ? hasFutureAssignments(deactivateTarget.id) > 0
                      ? `${deactivateTarget.displayName} currently has ${hasFutureAssignments(deactivateTarget.id)} upcoming service appointment${hasFutureAssignments(deactivateTarget.id) === 1 ? "" : "s"}. Reassign them when possible.`
                      : "This removes the technician from normal future assignment selection."
                    : "This restores the technician to active assignment rotation."}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={() => setDeactivateTargetId(null)} variant="outline">
                  Cancel
                </Button>
                <Button
                  onClick={() => handleToggleStatus(deactivateTarget)}
                  variant={deactivateTarget.status === "ACTIVE" ? "destructive" : "default"}
                >
                  {deactivateTarget.status === "ACTIVE"
                    ? "Deactivate Anyway"
                    : "Activate Technician"}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        onOpenChange={(open) => {
          if (!open) setDeleteTargetId(null);
        }}
        open={Boolean(deleteTarget)}
      >
        <DialogContent>
          {deleteTarget ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {canDeleteTechnician(deleteTarget.id)
                    ? "Delete Technician"
                    : "Cannot Delete Technician"}
                </DialogTitle>
                <DialogDescription>
                  {canDeleteTechnician(deleteTarget.id)
                    ? "This technician has no linked service history or assignments."
                    : "This technician is linked to existing service records. Deactivate instead to preserve history."}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={() => setDeleteTargetId(null)} variant="outline">
                  Close
                </Button>
                {canDeleteTechnician(deleteTarget.id) ? (
                  <Button
                    onClick={() => handleDelete(deleteTarget.id)}
                    variant="destructive"
                  >
                    Delete Technician
                  </Button>
                ) : null}
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
}
