"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Activity,
  Archive,
  Building2,
  CheckCircle2,
  Compass,
  Edit3,
  Eye,
  EyeOff,
  Home as HomeIcon,
  Loader2,
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
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

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
import {
  useCreateServiceMutation,
  useDeleteServiceMutation,
  useGetAllServicesListQuery,
  useUpdateServiceMutation,
} from "@/redux/api/servicesApi";
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

const groupOptions: Array<{ label: string; value: PublicServiceGroup }> = [
  { label: "Service & Maintenance", value: "Service & Maintenance" },
  { label: "Installation", value: "Installation" },
];

const SYMPTOM_OPTIONS = [
  { key: "UNIT_NOT_TURNING_ON", label: "Unit not turning on" },
  { key: "UNIT_DOES_NOT_SHUT_OFF", label: "Unit does not shut off" },
  { key: "CLOGGED", label: "Clogged line" },
  { key: "LOW_SUCTION", label: "Low suction" },
  { key: "WALL_OR_POWER_HOSE_PROBLEM", label: "Wall / hose problem" },
  { key: "BROKEN_INLET", label: "Broken inlet valve" },
  { key: "NOISE", label: "Excessive motor noise" },
  { key: "OTHER", label: "Other symptom" },
];

const iconOptions: Array<{ label: string; value: string }> = [
  { label: "Wrench (Repair / Maintenance)", value: "wrench" },
  { label: "Building 2 (Commercial Systems)", value: "Building2" },
  { label: "Home (Residential)", value: "home-plus" },
  { label: "Activity (Motor / Diagnostics)", value: "activity" },
  { label: "Shield (Inspection / Warranty)", value: "shield" },
  { label: "Sliders (Tune-up / Filter)", value: "sliders" },
  { label: "Sparkles (Deep Clean / Sanitization)", value: "sparkles" },
  { label: "Compass (Engineering / Blueprinting)", value: "compass" },
  { label: "Upload (Piping / Exhaust)", value: "upload" },
];

const iconByKey: Record<string, ElementType> = {
  "home-plus": HomeIcon,
  Home: HomeIcon,
  wrench: Wrench,
  Wrench: Wrench,
  activity: Activity,
  Activity: Activity,
  shield: ShieldCheck,
  ShieldCheck: ShieldCheck,
  sparkles: Sparkles,
  Sparkles: Sparkles,
  sliders: SlidersHorizontal,
  Sliders: SlidersHorizontal,
  upload: Upload,
  compass: Compass,
  Building2: Building2,
};

function formatGroup(group?: string) {
  if (group === "SERVICE_AND_MAINTENANCE" || group === "Service & Maintenance") {
    return "Service & Maintenance";
  }
  if (group === "INSTALLATION" || group === "Installation") {
    return "Installation";
  }
  return group || "Service & Maintenance";
}

function toApiGroup(group: string) {
  if (group === "Service & Maintenance" || group === "SERVICE_AND_MAINTENANCE") {
    return "SERVICE_AND_MAINTENANCE";
  }
  if (group === "Installation" || group === "INSTALLATION") {
    return "INSTALLATION";
  }
  return group;
}


function formatDate(value?: string) {
  if (!value) return "Recently";
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return "Recently";
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(d);
  } catch {
    return "Recently";
  }
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
  onSave: (values: ServiceCatalogValues, editingService?: ServiceOffering | null) => Promise<void> | void;
  open: boolean;
  services: ServiceOffering[];
  isSubmitting?: boolean;
}

function ServiceFormDialog({
  editingService,
  onOpenChange,
  onSave,
  open,
  services,
  isSubmitting = false,
}: ServiceFormDialogProps) {
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
      summary: editingService?.summary ?? "",
      description: editingService?.description ?? "",
      group: formatGroup(editingService?.group),
      iconKey: editingService?.iconKey ?? "wrench",
      status: editingService?.status ?? "ACTIVE",
      recommendedSymptoms: editingService?.recommendedSymptoms ?? [],
    },
  });

  const selectedSymptoms = useWatch({
    control,
    name: "recommendedSymptoms",
  }) || [];

  function closeDialog() {
    onOpenChange(false);
  }

  async function submit(values: ServiceCatalogValues) {
    const duplicateName = services.some(
      (service) =>
        service.slug !== editingService?.slug &&
        service.id !== editingService?.id &&
        service.title.toLowerCase() === values.title.toLowerCase(),
    );

    if (duplicateName) {
      setError("title", {
        message: "A service with this name already exists.",
        type: "manual",
      });
      return;
    }

    await onSave(values, editingService);
    closeDialog();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto w-[min(94vw,44rem)]">
        <DialogHeader>
          <DialogTitle>
            {editingService ? "Edit Service" : "Add Service"}
          </DialogTitle>
          <DialogDescription>
            {editingService
              ? "Update central vacuum service scope, details, and intake recommendations."
              : "Create a dynamic service offering for customer scheduling and intake."}
          </DialogDescription>
        </DialogHeader>

        <form className="mt-5 space-y-5" onSubmit={handleSubmit(submit)}>
          <FormField
            error={errors.title?.message}
            htmlFor="service-title"
            label="Service Title"
            hint="Display name shown across customer portal and service catalog."
            required
          >
            <Input
              id="service-title"
              placeholder="e.g. Turnkey Central Vacuum Installation"
              {...register("title")}
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
                        <SelectItem key={group.value} value={group.value}>
                          {group.label}
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
              label="Visual Icon"
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

          <FormField
            error={errors.summary?.message}
            htmlFor="service-summary"
            label="Summary"
            hint="Displayed in catalog cards and customer overviews."
            required
          >
            <Input
              id="service-summary"
              placeholder="Complete rough-in and piping installation for new home constructions and renovations."
              {...register("summary")}
            />
          </FormField>

          <FormField
            error={errors.description?.message}
            htmlFor="service-description"
            label="Detailed Scope & Description"
            hint="Comprehensive diagnostic details, field steps, and coverage."
          >
            <Textarea
              className="min-h-24"
              id="service-description"
              placeholder="Comprehensive diagnostic details, field steps, and coverage for complete central vacuum setup including PVC lines and low-voltage wall inlets."
              {...register("description")}
            />
          </FormField>

          {/* Recommended Intake Symptoms */}
          <div className="space-y-2 rounded-xl border border-teal-100 bg-teal-50/30 p-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-teal-900">
                Recommended Intake Symptoms
              </label>
              <span className="text-xs text-slate-500">
                {selectedSymptoms.length} selected
              </span>
            </div>
            <p className="text-xs text-slate-600">
              When customers select these symptoms during request intake, this service will be suggested.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {SYMPTOM_OPTIONS.map((sym) => {
                const isSelected = selectedSymptoms.includes(sym.key);
                return (
                  <button
                    type="button"
                    key={sym.key}
                    onClick={() => {
                      const current = selectedSymptoms || [];
                      const next = isSelected
                        ? current.filter((k) => k !== sym.key)
                        : [...current, sym.key];
                      setValue("recommendedSymptoms", next, { shouldDirty: true });
                    }}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition cursor-pointer",
                      isSelected
                        ? "bg-teal-700 text-white shadow-sm hover:bg-teal-800"
                        : "bg-white text-slate-700 border border-slate-200 hover:border-teal-300 hover:text-teal-900",
                    )}
                  >
                    {isSelected ? <CheckCircle2 size={13} /> : <Plus size={13} />}
                    {sym.label}
                  </button>
                );
              })}
            </div>
          </div>

          <FormField
            error={errors.status?.message}
            htmlFor="service-status"
            label="Catalog Status"
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
                    <SelectItem value="ACTIVE">Active (Live in Public Catalog)</SelectItem>
                    <SelectItem value="INACTIVE">Inactive (Admin / Draft Only)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={closeDialog} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-[130px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving...
                </>
              ) : editingService ? (
                "Save Changes"
              ) : (
                "Create Service"
              )}
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
  const [editingService, setEditingService] = useState<ServiceOffering | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ServiceOffering | null>(null);

  // RTK Query hooks
  const { data: apiServices, isLoading: isLoadingApiServices } = useGetAllServicesListQuery();
  const [createServiceApi, { isLoading: isCreating }] = useCreateServiceMutation();
  const [updateServiceApi, { isLoading: isUpdating }] = useUpdateServiceMutation();
  const [deleteServiceApi, { isLoading: isDeleting }] = useDeleteServiceMutation();

  const mockServices = getSharedPublicServices();
  const serviceRequests = getSharedServiceRequests();

  const services: ServiceOffering[] = useMemo(() => {
    if (apiServices && apiServices.length > 0) {
      return apiServices;
    }
    return mockServices;
  }, [apiServices, mockServices]);

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
              new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
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
              new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
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
        const count = service.requestCount ?? requestCounts[service.serviceId] ?? 0;
        if (count > 0) stats.referenced += 1;
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

  async function saveService(values: ServiceCatalogValues, existing?: ServiceOffering | null) {
    const payload = {
      title: values.title.trim(),
      group: toApiGroup(values.group),
      summary: values.summary.trim(),
      description: values.description?.trim() || undefined,
      iconKey: values.iconKey,
      recommendedSymptoms: values.recommendedSymptoms || [],
      status: values.status,
    };

    const localValues = {
      title: values.title.trim(),
      summary: values.summary.trim(),
      description: values.description?.trim(),
      group: (values.group === "Installation" || values.group === "INSTALLATION"
        ? "Installation"
        : "Service & Maintenance") as PublicServiceGroup,
      iconKey: values.iconKey as PublicServiceIconKey,
      status: values.status,
      recommendedSymptoms: values.recommendedSymptoms || [],
    };

    if (existing) {
      const identifier = existing.id || existing.serviceId || existing.slug;
      try {
        await updateServiceApi({
          id: identifier,
          body: payload,
        }).unwrap();
        toast.success(`Service "${values.title}" updated successfully.`);
      } catch {
        // Fallback to local store
        updateSharedServiceCatalog(existing.slug, localValues);
        toast.success(`Service "${values.title}" updated in local catalog.`);
      }
      return;
    }

    try {
      await createServiceApi(payload).unwrap();
      toast.success(`Service "${values.title}" created successfully.`);
    } catch {
      // Fallback to local store
      createSharedServiceCatalog(localValues);
      toast.success(`Service "${values.title}" created in local catalog.`);
    }
  }

  async function toggleStatus(service: ServiceOffering) {
    const newStatus = service.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const identifier = service.id || service.serviceId || service.slug;

    try {
      await updateServiceApi({
        id: identifier,
        body: { status: newStatus },
      }).unwrap();
      toast.success(`Service "${service.title}" set to ${newStatus}.`);
    } catch {
      toggleSharedServiceCatalogStatus(service.slug);
      toast.success(`Service "${service.title}" toggled to ${newStatus} (local).`);
    }
  }

  function requestDelete(service: ServiceOffering) {
    setDeleteTarget(service);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const identifier = deleteTarget.id || deleteTarget.serviceId || deleteTarget.slug;

    try {
      const res = await deleteServiceApi(identifier).unwrap();
      if (res?.action === "deactivated") {
        toast.info(
          res.message ||
            `Service has existing request history and was automatically deactivated to INACTIVE to preserve records.`,
        );
      } else {
        toast.success(res?.message || `Service "${deleteTarget.title}" deleted.`);
      }
    } catch {
      deleteSharedServiceCatalog(deleteTarget.slug);
      toast.success(`Service "${deleteTarget.title}" deleted from local catalog.`);
    } finally {
      setDeleteTarget(null);
    }
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
              Central Vacuum Services
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-teal-950">
              Services Catalog
            </h1>
            <p className="mt-2 max-w-2xl text-base leading-7 text-slate-600">
              Manage dynamic vacuum service offerings, intake recommendations, public catalog visibility, and lifecycle status.
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
            { label: "Inactive / Draft", value: totals.inactive },
            { label: "With Active Requests", value: totals.referenced },
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
                    "h-10 rounded-lg text-sm font-semibold transition cursor-pointer",
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

          {isLoadingApiServices && services.length === 0 ? (
            <div className="mt-5 flex items-center justify-center py-16">
              <Loader2 className="size-8 animate-spin text-teal-700" />
            </div>
          ) : services.length === 0 ? (
            <div className="mt-5 rounded-lg border border-dashed border-teal-200 bg-teal-50/40 px-6 py-10 text-center">
              <Archive className="mx-auto text-teal-700" size={34} />
              <h2 className="mt-4 text-xl font-semibold text-teal-950">
                No services in catalog yet
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
                      <th className="px-5 py-4">Requests</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Public Visibility</th>
                      <th className="px-5 py-4">Updated</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-teal-100">
                    {filteredServices.map((service) => {
                      const Icon = iconByKey[service.iconKey] || Wrench;
                      const reqCount = service.requestCount ?? requestCounts[service.serviceId] ?? 0;

                      return (
                        <tr className="bg-white hover:bg-teal-50/20 transition" key={service.slug}>
                          <td className="px-5 py-5">
                            <div className="flex items-start gap-4">
                              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-800">
                                <Icon size={20} />
                              </span>
                              <div>
                                <p className="font-semibold text-teal-950">
                                  {service.title}
                                </p>
                                <p className="mt-1 max-w-md text-sm text-slate-500 line-clamp-2">
                                  {service.summary}
                                </p>
                                <div className="mt-2 flex items-center gap-2">
                                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
                                    {formatGroup(service.group)}
                                  </span>
                                  {service.recommendedSymptoms && service.recommendedSymptoms.length > 0 && (
                                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                                      {service.recommendedSymptoms.length} intake symptom{service.recommendedSymptoms.length === 1 ? "" : "s"}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-5">
                            <code className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-600 font-mono">
                              {service.slug}
                            </code>
                          </td>
                          <td className="px-5 py-5">
                            <span className={cn(
                              "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold",
                              reqCount > 0
                                ? "bg-teal-50 text-teal-900 border border-teal-200"
                                : "bg-slate-50 text-slate-500 border border-slate-200",
                            )}>
                              {reqCount} request{reqCount === 1 ? "" : "s"}
                            </span>
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
                  const Icon = iconByKey[service.iconKey] || Wrench;
                  const reqCount = service.requestCount ?? requestCounts[service.serviceId] ?? 0;

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
                            <div className="flex items-center gap-2">
                              <StatusPill status={service.status} />
                              <span className="rounded bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-800">
                                {reqCount} req{reqCount === 1 ? "" : "s"}
                              </span>
                            </div>
                            <h2 className="mt-2 text-xl font-semibold text-teal-950">
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
          isSubmitting={isCreating || isUpdating}
        />
      ) : null}

      {/* Delete / Deactivate Confirmation Dialog */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Service?</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 pt-2 text-sm text-slate-600">
                <p>
                  Are you sure you want to remove{" "}
                  <span className="font-semibold text-slate-900">
                    {deleteTarget?.title}
                  </span>
                  ?
                </p>
                <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
                  <p className="font-semibold">Automatic Integrity Rule:</p>
                  <p className="mt-1">
                    If this service has historical requests or customer bookings, it will be automatically and safely deactivated to <strong>INACTIVE</strong> so past requests and quotations remain intact. If unused, it will be permanently deleted.
                  </p>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="min-w-[130px]"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Delete Service"
              )}
            </Button>
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
          Edit Service
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
          Delete Service
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
