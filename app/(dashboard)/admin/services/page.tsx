"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Activity,
  Archive,
  CheckCircle2,
  Compass,
  Edit3,
  Eye,
  EyeOff,
  HomeIcon,
  MoreHorizontal,
  Plus,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Upload,
  Wrench,
  XCircle,
} from "lucide-react";
import type { ElementType } from "react";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { AdminSearchInput } from "@/components/admin/AdminSearchInput";
import { FormField } from "@/components/forms/FormField";
import { Button } from "@/components/ui/Button";
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
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import {
  createSharedServiceCatalog,
  deleteSharedServiceCatalog,
  getSharedPublicServices,
  getSharedServiceRequests,
  toggleSharedServiceCatalogStatus,
  updateSharedServiceCatalog,
} from "@/data/mock/shared-business-store";
import { useSharedBusinessStoreVersion } from "@/hooks/useSharedBusinessStoreVersion";
import { cn } from "@/lib/utils";
import {
  serviceCatalogSchema,
  type ServiceCatalogValues,
} from "@/lib/validation";
import type {
  PublicServiceGroup,
  PublicServiceIconKey,
  ServiceOffering,
} from "@/types/domain";

type ServiceFilter = "all" | "ACTIVE" | "INACTIVE";
type ServiceSort =
  | "newest"
  | "oldest"
  | "name-asc"
  | "name-desc"
  | "display-order";

const statusFilterOptions: Array<{ label: string; value: ServiceFilter }> = [
  { label: "All", value: "all" },
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
];

const sortOptions: Array<{ label: string; value: ServiceSort }> = [
  { label: "Newest", value: "newest" },
  { label: "Oldest", value: "oldest" },
  { label: "Name A-Z", value: "name-asc" },
  { label: "Name Z-A", value: "name-desc" },
  { label: "Display Order", value: "display-order" },
];

const groupOptions: PublicServiceGroup[] = [
  "Service & Maintenance",
  "Installation",
];

const iconOptions: Array<{ label: string; value: PublicServiceIconKey }> = [
  { label: "Wrench", value: "wrench" },
  { label: "Activity", value: "activity" },
  { label: "Shield", value: "shield" },
  { label: "Sliders", value: "sliders" },
  { label: "Home Plus", value: "home-plus" },
  { label: "Upload", value: "upload" },
  { label: "Compass", value: "compass" },
  { label: "Sparkles", value: "sparkles" },
];

const iconByKey: Record<PublicServiceIconKey, ElementType> = {
  "home-plus": HomeIcon,
  wrench: Wrench,
  activity: Activity,
  shield: ShieldCheck,
  sparkles: Sparkles,
  sliders: SlidersHorizontal,
  upload: Upload,
  compass: Compass,
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function StatusPill({ status }: { status: ServiceOffering["status"] }) {
  const active = status === "ACTIVE";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
        active ? "bg-teal-50 text-teal-800" : "bg-slate-100 text-slate-600",
      )}
    >
      {active ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function PublicVisibilityPill({ status }: { status: ServiceOffering["status"] }) {
  const visible = status === "ACTIVE";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
        visible ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800",
      )}
    >
      {visible ? <Eye size={13} /> : <EyeOff size={13} />}
      {visible ? "Visible" : "Hidden"}
    </span>
  );
}

interface ServiceFormDialogProps {
  editingService: ServiceOffering | null;
  onOpenChange: (open: boolean) => void;
  onSave: (values: ServiceCatalogValues, editingSlug?: string) => void;
  open: boolean;
  services: ServiceOffering[];
}

function ServiceFormDialog({
  editingService,
  onOpenChange,
  onSave,
  open,
  services,
}: ServiceFormDialogProps) {
  const [slugEdited, setSlugEdited] = useState(Boolean(editingService));
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    setError,
    setValue,
  } = useForm<ServiceCatalogValues>({
    resolver: zodResolver(serviceCatalogSchema),
    defaultValues: {
      title: editingService?.title ?? "",
      slug: editingService?.slug ?? "",
      summary: editingService?.summary ?? "",
      description: editingService?.description ?? "",
      group: editingService?.group ?? "Service & Maintenance",
      iconKey: editingService?.iconKey ?? "wrench",
      status: editingService?.status ?? "ACTIVE",
      sortOrder: editingService?.sortOrder ?? services.length + 1,
    },
  });

  function closeDialog() {
    setSlugEdited(false);
    onOpenChange(false);
  }

  function submit(values: ServiceCatalogValues) {
    const duplicateName = services.some(
      (service) =>
        service.slug !== editingService?.slug &&
        service.title.toLowerCase() === values.title.toLowerCase(),
    );
    const duplicateSlug = services.some(
      (service) =>
        service.slug !== editingService?.slug &&
        service.slug.toLowerCase() === values.slug.toLowerCase(),
    );

    if (duplicateName) {
      setError("title", {
        message: "A service with this name already exists.",
        type: "manual",
      });
      return;
    }

    if (duplicateSlug) {
      setError("slug", {
        message: "A service with this slug already exists.",
        type: "manual",
      });
      return;
    }

    onSave(values, editingService?.slug);
    closeDialog();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(94vw,44rem)]">
        <DialogHeader>
          <DialogTitle>
            {editingService ? "Edit Service" : "Add Service"}
          </DialogTitle>
          <DialogDescription>
            Services are the catalog entries customers can request from the
            public services page.
          </DialogDescription>
        </DialogHeader>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit(submit)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              error={errors.title?.message}
              htmlFor="service-title"
              label="Service Name"
              required
            >
              <Input
                id="service-title"
                placeholder="Vacuum Repair"
                {...register("title", {
                  onChange: (event) => {
                    if (!slugEdited) {
                      setValue("slug", slugify(event.target.value), {
                        shouldValidate: true,
                      });
                    }
                  },
                })}
              />
            </FormField>

            <FormField
              error={errors.slug?.message}
              htmlFor="service-slug"
              hint="Changing this slug affects the public service request URL."
              label="Slug"
              required
            >
              <Input
                id="service-slug"
                placeholder="vacuum-repair"
                {...register("slug", {
                  onChange: () => setSlugEdited(true),
                })}
              />
            </FormField>
          </div>

          <FormField
            error={errors.summary?.message}
            htmlFor="service-summary"
            label="Short Description"
            required
          >
            <Input
              id="service-summary"
              placeholder="Diagnostics and repair for suction loss, motor noise, and inlet issues."
              {...register("summary")}
            />
          </FormField>

          <FormField
            error={errors.description?.message}
            htmlFor="service-description"
            label="Detailed Description"
          >
            <Textarea
              className="min-h-28"
              id="service-description"
              placeholder="Describe what this service covers for admins and future public UI."
              {...register("description")}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              error={errors.group?.message}
              htmlFor="service-group"
              label="Service Group"
              required
            >
              <Controller
                control={control}
                name="group"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="service-group">
                      <SelectValue placeholder="Choose group" />
                    </SelectTrigger>
                    <SelectContent>
                      {groupOptions.map((group) => (
                        <SelectItem key={group} value={group}>
                          {group}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField
              error={errors.iconKey?.message}
              htmlFor="service-icon"
              label="Service Icon"
              required
            >
              <Controller
                control={control}
                name="iconKey"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="service-icon">
                      <SelectValue placeholder="Choose icon" />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((icon) => (
                        <SelectItem key={icon.value} value={icon.value}>
                          {icon.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              error={errors.status?.message}
              htmlFor="service-status"
              label="Status"
              required
            >
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="service-status">
                      <SelectValue placeholder="Choose status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>

            <FormField
              error={errors.sortOrder?.message}
              htmlFor="service-sort-order"
              label="Display Order"
              required
            >
              <Input
                id="service-sort-order"
                inputMode="numeric"
                min={1}
                type="number"
                {...register("sortOrder", { valueAsNumber: true })}
              />
            </FormField>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button type="submit">
              {editingService ? "Save Changes" : "Create Service"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminServicesPage() {
  useSharedBusinessStoreVersion();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ServiceFilter>("all");
  const [sort, setSort] = useState<ServiceSort>("display-order");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceOffering | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<ServiceOffering | null>(null);
  const [blockedDelete, setBlockedDelete] = useState<{
    count: number;
    service: ServiceOffering;
  } | null>(null);

  const services = getSharedPublicServices();
  const serviceRequests = getSharedServiceRequests();

  const requestCounts = useMemo(() => {
    return serviceRequests.reduce<Record<string, number>>(
      (counts, request) => {
        counts[request.serviceId] = (counts[request.serviceId] ?? 0) + 1;
        return counts;
      },
      {},
    );
  }, [serviceRequests]);

  const filteredServices = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return services
      .filter((service) => {
        const matchesSearch =
          normalizedQuery.length === 0 ||
          service.title.toLowerCase().includes(normalizedQuery) ||
          service.slug.toLowerCase().includes(normalizedQuery);
        const matchesStatus =
          statusFilter === "all" || service.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        switch (sort) {
          case "oldest":
            return (
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
          case "name-asc":
            return a.title.localeCompare(b.title);
          case "name-desc":
            return b.title.localeCompare(a.title);
          case "display-order":
            return (a.sortOrder ?? 999) - (b.sortOrder ?? 999);
          case "newest":
          default:
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
        }
      });
  }, [query, services, sort, statusFilter]);

  const totals = useMemo(() => {
    return services.reduce(
      (stats, service) => {
        stats.total += 1;
        if (service.status === "ACTIVE") stats.active += 1;
        if (service.status === "INACTIVE") stats.inactive += 1;
        if ((requestCounts[service.serviceId] ?? 0) > 0) stats.referenced += 1;
        return stats;
      },
      { active: 0, inactive: 0, referenced: 0, total: 0 },
    );
  }, [requestCounts, services]);

  function openCreateDialog() {
    setEditingService(null);
    setDialogOpen(true);
  }

  function openEditDialog(service: ServiceOffering) {
    setEditingService(service);
    setDialogOpen(true);
  }

  function saveService(values: ServiceCatalogValues, editingSlug?: string) {
    if (editingSlug) {
      updateSharedServiceCatalog(editingSlug, values);
      return;
    }
    createSharedServiceCatalog(values);
  }

  function toggleStatus(service: ServiceOffering) {
    toggleSharedServiceCatalogStatus(service.slug);
  }

  function requestDelete(service: ServiceOffering) {
    const count = requestCounts[service.serviceId] ?? 0;
    if (count > 0) {
      setBlockedDelete({ service, count });
      return;
    }

    setDeleteTarget(service);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    deleteSharedServiceCatalog(deleteTarget.slug);
    setDeleteTarget(null);
  }

  function clearFilters() {
    setQuery("");
    setStatusFilter("all");
    setSort("display-order");
  }

  return (
    <main className="min-h-screen bg-[#f4f7f7] text-slate-950">
      <section className="space-y-4">
        <div className="flex flex-col gap-3 rounded-lg border border-teal-100 bg-white p-4 shadow-[0_18px_48px_-42px_rgba(28,79,80,0.32)] lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.32em] text-teal-700">
              Service Operations
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-teal-950">
              Services
            </h1>
            <p className="mt-2 max-w-2xl text-base leading-7 text-slate-600">
              Manage the services customers can request.
            </p>
          </div>
          <Button className="h-11 px-5" onClick={openCreateDialog}>
            <Plus size={18} />
            Add Service
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          {[
            { label: "Total Services", value: totals.total },
            { label: "Public Active", value: totals.active },
            { label: "Inactive", value: totals.inactive },
            { label: "With Requests", value: totals.referenced },
          ].map((stat) => (
            <div
              className="rounded-lg border border-teal-100 bg-white p-4 shadow-[0_14px_44px_-36px_rgba(28,79,80,0.34)]"
              key={stat.label}
            >
              <p className="text-sm text-slate-500">{stat.label}</p>
              <p className="mt-2 text-3xl font-semibold text-teal-950">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-teal-100 bg-white p-4 shadow-[0_18px_56px_-44px_rgba(28,79,80,0.34)]">
          <div className="grid gap-3 lg:grid-cols-[1fr_24rem_18rem]">
            <AdminSearchInput
              value={query}
              onChange={setQuery}
              placeholder="Search by service name or slug..."
              ariaLabel="Search services"
            />

            <div className="grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-1">
              {statusFilterOptions.map((option) => (
                <button
                  className={cn(
                    "h-10 rounded-lg text-sm font-semibold transition",
                    statusFilter === option.value
                      ? "bg-primary text-white shadow-[0_14px_30px_-22px_rgba(28,79,80,0.9)]"
                      : "text-slate-600 hover:bg-white hover:text-teal-800",
                  )}
                  key={option.value}
                  onClick={() => setStatusFilter(option.value)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>

            <Select
              onValueChange={(value) => setSort(value as ServiceSort)}
              value={sort}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {services.length === 0 ? (
            <div className="mt-5 rounded-lg border border-dashed border-teal-200 bg-teal-50/40 px-6 py-10 text-center">
              <Archive className="mx-auto text-teal-700" size={34} />
              <h2 className="mt-4 text-xl font-semibold text-teal-950">
                No services yet
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Create services customers can request.
              </p>
              <Button className="mt-5" onClick={openCreateDialog}>
                Add Service
              </Button>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="mt-5 rounded-lg border border-dashed border-teal-200 bg-teal-50/40 px-6 py-10 text-center">
              <Archive className="mx-auto text-teal-700" size={34} />
              <h2 className="mt-4 text-xl font-semibold text-teal-950">
                No services match your filters.
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Try a different search term or status.
              </p>
              <Button className="mt-5" variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <>
              <div className="mt-5 hidden overflow-hidden rounded-lg border border-teal-100 lg:block">
                <table className="w-full border-collapse text-left">
                  <thead className="bg-[#f7fbfa] text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    <tr>
                      <th className="px-5 py-4">Service</th>
                      <th className="px-5 py-4">Slug</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Public Visibility</th>
                      <th className="px-5 py-4">Updated</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-teal-100">
                    {filteredServices.map((service) => {
                      const Icon = iconByKey[service.iconKey];

                      return (
                        <tr className="bg-white" key={service.slug}>
                          <td className="px-5 py-5">
                            <div className="flex items-start gap-4">
                              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-800">
                                <Icon size={20} />
                              </span>
                              <div>
                                <p className="font-semibold text-teal-950">
                                  {service.title}
                                </p>
                                <p className="mt-1 max-w-md text-sm text-slate-500">
                                  {service.summary}
                                </p>
                                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
                                  {service.group}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-5">
                            <code className="rounded-lg bg-slate-100 px-3 py-1 text-sm text-slate-600">
                              {service.slug}
                            </code>
                          </td>
                          <td className="px-5 py-5">
                            <StatusPill status={service.status} />
                          </td>
                          <td className="px-5 py-5">
                            <PublicVisibilityPill status={service.status} />
                          </td>
                          <td className="px-5 py-5 text-sm text-slate-600">
                            {formatDate(service.updatedAt)}
                          </td>
                          <td className="px-5 py-5 text-right">
                            <ServiceActions
                              onDelete={requestDelete}
                              onEdit={openEditDialog}
                              onToggleStatus={toggleStatus}
                              service={service}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 grid gap-4 lg:hidden">
                {filteredServices.map((service) => {
                  const Icon = iconByKey[service.iconKey];

                  return (
                    <article
                      className="rounded-lg border border-teal-100 bg-white p-4 shadow-[0_14px_44px_-36px_rgba(28,79,80,0.34)]"
                      key={service.slug}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-3">
                          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-800">
                            <Icon size={19} />
                          </span>
                          <div>
                            <StatusPill status={service.status} />
                            <h2 className="mt-3 text-xl font-semibold text-teal-950">
                              {service.title}
                            </h2>
                            <p className="mt-1 text-sm leading-6 text-slate-500">
                              {service.summary}
                            </p>
                          </div>
                        </div>
                        <ServiceActions
                          onDelete={requestDelete}
                          onEdit={openEditDialog}
                          onToggleStatus={toggleStatus}
                          service={service}
                        />
                      </div>

                      <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                        <div className="rounded-lg bg-slate-50 p-3">
                          <p className="text-slate-500">Slug</p>
                          <p className="mt-1 break-all font-semibold text-teal-950">
                            {service.slug}
                          </p>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-3">
                          <p className="text-slate-500">Public Visibility</p>
                          <div className="mt-2">
                            <PublicVisibilityPill status={service.status} />
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

      {dialogOpen ? (
        <ServiceFormDialog
          editingService={editingService}
          key={editingService?.slug ?? "create-service"}
          onOpenChange={setDialogOpen}
          onSave={saveService}
          open={dialogOpen}
          services={services}
        />
      ) : null}

      <Dialog open={Boolean(deleteTarget)} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Service?</DialogTitle>
            <DialogDescription>
              This permanently removes{" "}
              <span className="font-semibold text-slate-800">
                {deleteTarget?.title}
              </span>
              . Public request links for this service will no longer resolve.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete Service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(blockedDelete)} onOpenChange={() => setBlockedDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cannot Delete Service</DialogTitle>
            <DialogDescription>
              {blockedDelete?.service.title} is referenced by{" "}
              {blockedDelete?.count} existing service request
              {blockedDelete?.count === 1 ? "" : "s"}. Deactivate the service
              instead to keep historical records intact.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setBlockedDelete(null)}>Understood</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

interface ServiceActionsProps {
  onDelete: (service: ServiceOffering) => void;
  onEdit: (service: ServiceOffering) => void;
  onToggleStatus: (service: ServiceOffering) => void;
  service: ServiceOffering;
}

function ServiceActions({
  onDelete,
  onEdit,
  onToggleStatus,
  service,
}: ServiceActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={`Open actions for ${service.title}`}
          size="icon"
          variant="outline"
        >
          <MoreHorizontal size={18} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onEdit(service)}>
          <Edit3 size={16} />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onToggleStatus(service)}>
          {service.status === "ACTIVE" ? (
            <XCircle size={16} />
          ) : (
            <CheckCircle2 size={16} />
          )}
          {service.status === "ACTIVE" ? "Deactivate" : "Activate"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-700 focus:bg-red-50 focus:text-red-800"
          onSelect={() => onDelete(service)}
        >
          <Trash2 size={16} />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
