"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock3,
  Edit3,
  FileVideo,
  MapPin,
  PackagePlus,
  Phone,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import { FormField } from "@/components/forms/FormField";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
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
  addTechnicianEvidence,
  removeTechnicianEvidence,
  replaceTechnicianPartsUsage,
  submitTechnicianServiceReport,
  updateTechnicianEta,
  updateTechnicianOperationalStatus,
  updateTechnicianPropertyProfile,
  upsertTechnicianReportContent,
} from "@/data/mock/admin-schedule-state";
import {
  getCurrentTechnicianProfile,
  getTechnicianCustomerLabel,
  getTechnicianOrderPhone,
  getTechnicianPrimaryAction,
} from "@/data/mock/technician-dashboard";
import {
  createSharedCustomerUnit,
  getSharedCustomerById,
  upsertSharedCustomerFeature,
  upsertSharedCustomerInletFloor,
  updateSharedCustomerUnit,
} from "@/data/mock/shared-business-store";
import { useSharedAdminScheduleStateVersion } from "@/hooks/useSharedAdminScheduleStateVersion";
import { useSharedBusinessStoreVersion } from "@/hooks/useSharedBusinessStoreVersion";
import { formatShortDateTime } from "@/lib/formatters";
import type {
  AdminServiceOrder,
  CustomerFeatureType,
  CustomerInletFloor,
  CustomerVacuumUnit,
  ServiceOrderStatus,
  TechnicianEvidenceCategory,
  TechnicianEvidenceStage,
  TechnicianPartUsage,
} from "@/types/domain";

import {
  AdminSurface,
  TechnicianRouteShell,
} from "./TechnicianRouteShell";

const etaSchema = z.object({
  minutes: z.number().int().min(1).max(240),
});

const equipmentSchema = z.object({
  manufacturer: z.string().optional(),
  modelNumber: z.string().optional(),
  serialNumber: z.string().optional(),
  unitLocation: z.string().optional(),
  problemLocation: z.string().optional(),
});

const reportSchema = z.object({
  diagnosisFindings: z.string().min(10, "Add technician findings."),
  workPerformed: z.string().min(10, "Summarize work performed."),
  technicianNotes: z.string().min(10, "Add technician notes."),
  recommendations: z.string().optional(),
  partsUsed: z.array(
    z.object({
      id: z.string(),
      name: z.string().min(1, "Part name is required."),
      quantity: z.number().int().min(1),
      sku: z.string().optional(),
      note: z.string().optional(),
    }),
  ),
});

const unitSchema = z.object({
  id: z.string(),
  unitNumber: z.string().min(1),
  manufacturer: z.string().min(1),
  model: z.string().min(1),
  serialNumber: z.string().optional(),
  location: z.string().min(1),
  notes: z.string().optional(),
});

const inletFloorSchema = z.object({
  id: z.string(),
  label: z.string().min(1),
  hdh: z.coerce.number().int().min(0).max(50),
  chameleon: z.coerce.number().int().min(0).max(50),
  chameleonElite: z.coerce.number().int().min(0).max(50),
  standard: z.coerce.number().int().min(0).max(50),
  notes: z.string().optional(),
});

const featureSchema = z.object({
  id: z.string(),
  type: z.enum(["VacPan", "Spot Vacuum", "Wally Flex"]),
  quantity: z.coerce.number().int().min(1).max(25),
  locations: z.string().min(1),
  notes: z.string().optional(),
});

const evidenceStageOptions: Array<{
  label: string;
  value: TechnicianEvidenceStage;
}> = [
  { label: "Before Service", value: "before-service" },
  { label: "During Service", value: "during-service" },
  { label: "After Service", value: "after-service" },
];

const evidenceCategoryOptions: Array<{
  label: string;
  value: TechnicianEvidenceCategory;
}> = [
  { label: "Machine", value: "machine" },
  { label: "Model / Serial Label", value: "model-serial-label" },
  { label: "Damaged / Problem Area", value: "damaged-area" },
  { label: "Inlet / Hose / Accessory", value: "inlet-hose-accessory" },
  { label: "Other Evidence", value: "other" },
];

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function canSetEta(status: ServiceOrderStatus) {
  return ["scheduled", "rescheduled", "technician-assigned", "on-the-way"].includes(
    status,
  );
}

function isReportLocked(order: AdminServiceOrder) {
  return Boolean(order.technicianReport.lockedAt) || order.status === "report-submitted";
}

function formatEvidenceStageLabel(stage: TechnicianEvidenceStage) {
  return evidenceStageOptions.find((item) => item.value === stage)?.label ?? stage;
}

function formatEvidenceCategoryLabel(category: TechnicianEvidenceCategory) {
  return evidenceCategoryOptions.find((item) => item.value === category)?.label ?? category;
}

function stageTone(stage: TechnicianEvidenceStage) {
  if (stage === "before-service") return "bg-amber-100 text-amber-800";
  if (stage === "during-service") return "bg-blue-100 text-blue-800";
  return "bg-emerald-100 text-emerald-800";
}

export function TechnicianJobDetailClient({ order }: { order: AdminServiceOrder }) {
  useSharedAdminScheduleStateVersion();
  useSharedBusinessStoreVersion();

  const technician = getCurrentTechnicianProfile();
  const customer = getSharedCustomerById(order.customerId);
  const property =
    customer?.properties?.find((item) => item.label === order.serviceLocation.label) ??
    customer?.properties?.[0];
  const locked = isReportLocked(order);
  const primaryAction = getTechnicianPrimaryAction(order.status);

  const etaForm = useForm<z.infer<typeof etaSchema>>({
    resolver: zodResolver(etaSchema),
    defaultValues: {
      minutes: order.technicianEta?.minutes ?? 25,
    },
  });

  const equipmentForm = useForm<z.infer<typeof equipmentSchema>>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      manufacturer: order.equipment?.manufacturer ?? "",
      modelNumber: order.equipment?.modelNumber ?? "",
      serialNumber: order.equipment?.serialNumber ?? "",
      unitLocation: order.equipment?.unitLocation ?? "",
      problemLocation: order.problemLocation ?? "",
    },
  });

  const reportForm = useForm<z.infer<typeof reportSchema>>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      diagnosisFindings: order.technicianReport.diagnosisFindings,
      workPerformed: order.technicianReport.workPerformed,
      technicianNotes: order.technicianReport.technicianNotes,
      recommendations: order.technicianReport.recommendations,
      partsUsed: order.technicianReport.partsUsed,
    },
  });

  const partsArray = useFieldArray({
    control: reportForm.control,
    name: "partsUsed",
  });

  const [statusError, setStatusError] = useState("");
  const [etaDialogOpen, setEtaDialogOpen] = useState(false);
  const [customEtaMode, setCustomEtaMode] = useState(false);
  const [evidenceStage, setEvidenceStage] =
    useState<TechnicianEvidenceStage>("before-service");
  const [evidenceCategory, setEvidenceCategory] =
    useState<TechnicianEvidenceCategory>("machine");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidenceNote, setEvidenceNote] = useState("");
  const [evidenceError, setEvidenceError] = useState("");
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [newUnitOpen, setNewUnitOpen] = useState(false);
  const [newFloorOpen, setNewFloorOpen] = useState(false);
  const [newFeatureOpen, setNewFeatureOpen] = useState(false);
  const [etaPreset, setEtaPreset] = useState(
    order.technicianEta ? String(order.technicianEta.minutes) : "20",
  );
  const [newUnitDraft, setNewUnitDraft] = useState<z.infer<typeof unitSchema>>({
    id: createId("unit"),
    unitNumber: "",
    manufacturer: "",
    model: "",
    serialNumber: "",
    location: "",
    notes: "",
  });
  const [newFloorDraft, setNewFloorDraft] = useState<z.infer<typeof inletFloorSchema>>({
    id: createId("floor"),
    label: "",
    hdh: 0,
    chameleon: 0,
    chameleonElite: 0,
    standard: 0,
    notes: "",
  });
  const [newFeatureDraft, setNewFeatureDraft] = useState<z.infer<typeof featureSchema>>({
    id: createId("feature"),
    type: "VacPan",
    quantity: 1,
    locations: "",
    notes: "",
  });

  const propertyUnits = property?.vacuumUnits ?? [];
  const inletFloors = property?.inletFloors ?? [];
  const features = property?.additionalFeatures ?? [];

  const originalCustomerEvidence = useMemo(
    () => order.attachments.filter((item) => item.kind === "photo" || item.kind === "video"),
    [order.attachments],
  );

  function handleEquipmentSubmit(values: z.infer<typeof equipmentSchema>) {
    updateTechnicianPropertyProfile(order.id, {
      equipment: {
        manufacturer: values.manufacturer?.trim() || undefined,
        modelNumber: values.modelNumber?.trim() || undefined,
        serialNumber: values.serialNumber?.trim() || undefined,
        unitLocation: values.unitLocation?.trim() || undefined,
      },
      problemLocation: values.problemLocation?.trim() || undefined,
    });
  }

  function handleStatusUpdate(
    toStatus: Exclude<ServiceOrderStatus, "completed" | "cancelled">,
  ) {
    const result = updateTechnicianOperationalStatus({
      orderId: order.id,
      toStatus,
      actorLabel: technician.displayName,
    });

    if (result.error) {
      setStatusError(result.error);
      return;
    }

    setStatusError("");
  }

  function handleEtaDialogSubmit() {
    const minutesValue = customEtaMode
      ? etaForm.getValues("minutes")
      : Number(etaPreset);

    const parsed = etaSchema.safeParse({ minutes: minutesValue });
    if (!parsed.success) {
      etaForm.setError("minutes", { message: parsed.error.issues[0]?.message });
      return;
    }

    updateTechnicianEta(order.id, {
      minutes: parsed.data.minutes,
      updatedBy: technician.displayName,
    });
    setEtaDialogOpen(false);
  }

  function handleReportSave(values: z.infer<typeof reportSchema>) {
    const parts: TechnicianPartUsage[] = values.partsUsed.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      sku: item.sku?.trim() || undefined,
      note: item.note?.trim() || undefined,
    }));

    upsertTechnicianReportContent(order.id, {
      diagnosisFindings: values.diagnosisFindings,
      workPerformed: values.workPerformed,
      technicianNotes: values.technicianNotes,
      recommendations: values.recommendations?.trim() || "",
      partsUsed: parts,
    });
    replaceTechnicianPartsUsage(order.id, parts);
  }

  function handleSubmitReport() {
    const values = reportForm.getValues();
    const parsed = reportSchema.safeParse(values);

    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const path = issue.path.join(".") as
          | "diagnosisFindings"
          | "workPerformed"
          | "technicianNotes"
          | "recommendations"
          | `partsUsed.${number}.name`
          | `partsUsed.${number}.quantity`;
        reportForm.setError(path as never, { message: issue.message });
      });
      return;
    }

    handleReportSave(parsed.data);
    const result = submitTechnicianServiceReport(order.id, technician.displayName);
    if (!result.error) {
      setConfirmSubmitOpen(false);
    }
  }

  function handleAddEvidence() {
    if (!evidenceFile) {
      setEvidenceError("Choose a photo or video file.");
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp", "video/mp4", "video/quicktime"].includes(evidenceFile.type)) {
      setEvidenceError("Upload JPG, PNG, WebP, MP4, or MOV.");
      return;
    }

    addTechnicianEvidence(order.id, {
      fileName: evidenceFile.name,
      fileType: evidenceFile.type,
      sizeBytes: evidenceFile.size,
      kind: evidenceFile.type.startsWith("video/") ? "video" : "photo",
      stage: evidenceStage,
      category: evidenceCategory,
      note: evidenceNote.trim() || undefined,
    });

    setEvidenceFile(null);
    setEvidenceNote("");
    setEvidenceError("");
  }

  function handleCreateUnit() {
    const parsed = unitSchema.safeParse(newUnitDraft);
    if (!parsed.success || !property) return;

    createSharedCustomerUnit(customer!.id, property.id, {
      id: parsed.data.id,
      unitNumber: parsed.data.unitNumber,
      manufacturer: parsed.data.manufacturer,
      model: parsed.data.model,
      serialNumber: parsed.data.serialNumber?.trim() || undefined,
      location: parsed.data.location,
      notes: parsed.data.notes?.trim() || undefined,
      status: "active",
    });

    setNewUnitDraft({
      id: createId("unit"),
      unitNumber: "",
      manufacturer: "",
      model: "",
      serialNumber: "",
      location: "",
      notes: "",
    });
    setNewUnitOpen(false);
  }

  function handleCreateFloor() {
    const parsed = inletFloorSchema.safeParse(newFloorDraft);
    if (!parsed.success || !property) return;

    upsertSharedCustomerInletFloor(customer!.id, property.id, parsed.data as CustomerInletFloor);
    setNewFloorDraft({
      id: createId("floor"),
      label: "",
      hdh: 0,
      chameleon: 0,
      chameleonElite: 0,
      standard: 0,
      notes: "",
    });
    setNewFloorOpen(false);
  }

  function handleCreateFeature() {
    const parsed = featureSchema.safeParse(newFeatureDraft);
    if (!parsed.success || !property) return;

    upsertSharedCustomerFeature(customer!.id, property.id, {
      id: parsed.data.id,
      type: parsed.data.type as CustomerFeatureType,
      quantity: parsed.data.quantity,
      locations: parsed.data.locations
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      notes: parsed.data.notes?.trim() || undefined,
    });
    setNewFeatureDraft({
      id: createId("feature"),
      type: "VacPan",
      quantity: 1,
      locations: "",
      notes: "",
    });
    setNewFeatureOpen(false);
  }

  function handleUnitPatch(unit: CustomerVacuumUnit, patch: Partial<CustomerVacuumUnit>) {
    if (!property || !customer) return;
    updateSharedCustomerUnit(customer.id, property.id, unit.id, patch);
  }

  return (
    <TechnicianRouteShell
      eyebrow="Field Service Job"
      title={order.serviceName}
      description={`Service Order ${order.id} for ${getTechnicianCustomerLabel(order)}`}
      action={
        <Button asChild variant="outline">
          <Link href="/technician/jobs">Back to jobs</Link>
        </Button>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <AdminSurface>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={order.status} />
              <span className="text-sm text-slate-500">{order.id}</span>
              {order.technicianEta ? (
                <StatusBadge
                  status="on-the-way"
                  label={`ETA ${order.technicianEta.minutes} min`}
                />
              ) : null}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <InfoCard
                icon={CalendarDays}
                label="Requested Schedule"
                value={order.requestedSchedule.label ?? `${order.requestedSchedule.date} ${order.requestedSchedule.time}`}
              />
              <InfoCard
                icon={Clock3}
                label="Current Schedule"
                value={order.currentSchedule.label ?? `${order.currentSchedule.date} ${order.currentSchedule.time}`}
              />
              <InfoCard
                icon={MapPin}
                label="Address"
                value={`${order.serviceLocation.line1}, ${order.serviceLocation.city}, ${order.serviceLocation.state} ${order.serviceLocation.postalCode}`}
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${order.serviceLocation.line1}, ${order.serviceLocation.city}, ${order.serviceLocation.state} ${order.serviceLocation.postalCode}`,
                )}`}
              />
              <InfoCard
                icon={Phone}
                label="Customer Contact"
                value={getTechnicianOrderPhone(order)}
                href={`tel:${getTechnicianOrderPhone(order)}`}
              />
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  Customer
                </p>
                <p className="mt-2 font-semibold text-slate-900">
                  {getTechnicianCustomerLabel(order)}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  Admin Instructions
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {order.technicianInstruction ?? "No admin instruction recorded."}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Service Request Description
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {order.problemSummary}
              </p>
              {order.customerNotes ? (
                <div className="mt-4 border-t border-slate-200 pt-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    Customer Notes
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {order.customerNotes}
                  </p>
                </div>
              ) : null}
            </div>
          </AdminSurface>

          <AdminSurface>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">Operational Workflow</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Follow the live service workflow from travel through report submission.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {order.timeline.map((item) => (
                <div
                  key={item.key}
                  className={`rounded-xl px-4 py-3 text-sm font-medium ${
                    item.active
                      ? "bg-primary text-white"
                      : item.complete
                        ? "bg-teal-50 text-teal-800"
                        : "bg-slate-50 text-slate-500"
                  }`}
                >
                  {item.label}
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto]">
              <div className="rounded-xl bg-slate-50 p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium text-slate-500">
                    {order.technicianEta
                      ? `ETA: ${order.technicianEta.minutes} minutes`
                      : "ETA: Not set"}
                  </span>
                  {order.status === "arrived" && order.technicianEta?.updatedAt ? (
                    <span className="text-sm font-medium text-slate-500">
                      Arrived at {formatShortDateTime(order.technicianEta.updatedAt)}
                    </span>
                  ) : null}
                </div>
                {statusError ? (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    <AlertCircle size={16} />
                    {statusError}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap items-end justify-end gap-2">
                {canSetEta(order.status) && !locked ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStatusError("");
                      setEtaDialogOpen(true);
                    }}
                  >
                    <Edit3 size={16} />
                    {order.technicianEta ? "Update ETA" : "Set ETA"}
                  </Button>
                ) : null}
                {primaryAction && primaryAction.nextStatus !== "report-submitted" && !locked ? (
                  <Button
                    onClick={() =>
                      handleStatusUpdate(
                        primaryAction.nextStatus as Exclude<
                          ServiceOrderStatus,
                          "completed" | "cancelled"
                        >,
                      )
                    }
                  >
                    {primaryAction.label}
                  </Button>
                ) : null}
                {order.status === "in-progress" && !locked ? (
                  <Button onClick={() => setConfirmSubmitOpen(true)}>
                    Submit Service Report
                  </Button>
                ) : null}
              </div>
            </div>
          </AdminSurface>

          <AdminSurface>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">System / Equipment Profile</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Update the property and system profile discovered during service.
                </p>
              </div>
              {property ? (
                <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
                  {property.label}
                </span>
              ) : null}
            </div>

            <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={equipmentForm.handleSubmit(handleEquipmentSubmit)}>
              <FormField label="Manufacturer" htmlFor="equipment-manufacturer">
                <Input id="equipment-manufacturer" disabled={locked} {...equipmentForm.register("manufacturer")} />
              </FormField>
              <FormField label="Model Number" htmlFor="equipment-model">
                <Input id="equipment-model" disabled={locked} {...equipmentForm.register("modelNumber")} />
              </FormField>
              <FormField label="Serial Number" htmlFor="equipment-serial">
                <Input id="equipment-serial" disabled={locked} {...equipmentForm.register("serialNumber")} />
              </FormField>
              <FormField label="Unit Location" htmlFor="equipment-location">
                <Input id="equipment-location" disabled={locked} {...equipmentForm.register("unitLocation")} />
              </FormField>
              <FormField className="md:col-span-2" label="Problem Location" htmlFor="problem-location">
                <Input id="problem-location" disabled={locked} {...equipmentForm.register("problemLocation")} />
              </FormField>
              <div className="md:col-span-2 flex justify-end">
                <Button type="submit" variant="outline" disabled={locked}>
                  <Save size={16} />
                  Save Equipment
                </Button>
              </div>
            </form>

            {property ? (
              <div className="mt-6 space-y-6">
                <SectionGroup
                  title="Main Vacuum Units"
                  action={
                    <Button size="sm" variant="outline" onClick={() => setNewUnitOpen(true)} disabled={locked}>
                      <Plus size={15} />
                      Add Unit
                    </Button>
                  }
                >
                  {propertyUnits.length === 0 ? (
                    <EmptyState text="No units recorded for this property yet." />
                  ) : (
                    <div className="space-y-3">
                      {propertyUnits.map((unit) => (
                        <div key={unit.id} className="rounded-xl bg-slate-50 p-4">
                          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                            <InlineEditable
                              label="Unit #"
                              value={unit.unitNumber}
                              disabled={locked}
                              onSave={(value) => handleUnitPatch(unit, { unitNumber: value })}
                            />
                            <InlineEditable
                              label="Manufacturer"
                              value={unit.manufacturer}
                              disabled={locked}
                              onSave={(value) => handleUnitPatch(unit, { manufacturer: value })}
                            />
                            <InlineEditable
                              label="Model"
                              value={unit.model}
                              disabled={locked}
                              onSave={(value) => handleUnitPatch(unit, { model: value })}
                            />
                            <InlineEditable
                              label="Serial"
                              value={unit.serialNumber ?? ""}
                              disabled={locked}
                              onSave={(value) => handleUnitPatch(unit, { serialNumber: value || undefined })}
                            />
                            <InlineEditable
                              label="Location"
                              value={unit.location}
                              disabled={locked}
                              onSave={(value) => handleUnitPatch(unit, { location: value })}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionGroup>

                <SectionGroup
                  title="Floors & Ports"
                  action={
                    <Button size="sm" variant="outline" onClick={() => setNewFloorOpen(true)} disabled={locked}>
                      <Plus size={15} />
                      Add Floor
                    </Button>
                  }
                >
                  {inletFloors.length === 0 ? (
                    <EmptyState text="No inlet floor profile recorded yet." />
                  ) : (
                    <div className="space-y-3">
                      {inletFloors.map((floor) => (
                        <div key={floor.id} className="rounded-xl bg-slate-50 p-4">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-slate-900">{floor.label}</p>
                              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                <CountChip label="HDH" value={floor.hdh} />
                                <CountChip label="Chameleon" value={floor.chameleon} />
                                <CountChip label="Chameleon-Elite" value={floor.chameleonElite} />
                                <CountChip label="Standard" value={floor.standard} />
                              </div>
                              {floor.notes ? (
                                <p className="mt-3 text-sm text-slate-600">{floor.notes}</p>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionGroup>

                <SectionGroup
                  title="Additional Features"
                  action={
                    <Button size="sm" variant="outline" onClick={() => setNewFeatureOpen(true)} disabled={locked}>
                      <Plus size={15} />
                      Add Feature
                    </Button>
                  }
                >
                  {features.length === 0 ? (
                    <EmptyState text="No VacPan, Spot Vacuum, or Wally Flex data recorded yet." />
                  ) : (
                    <div className="space-y-3">
                      {features.map((feature) => (
                        <div key={feature.id} className="rounded-xl bg-slate-50 p-4">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                              <p className="font-semibold text-slate-900">{feature.type}</p>
                              <p className="mt-1 text-sm text-slate-600">
                                Qty {feature.quantity} • {feature.locations.join(", ")}
                              </p>
                              {feature.notes ? (
                                <p className="mt-2 text-sm text-slate-600">{feature.notes}</p>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionGroup>
              </div>
            ) : (
              <div className="mt-6 rounded-xl border border-dashed border-teal-200 bg-teal-50/40 px-4 py-6 text-sm text-slate-600">
                No internal property profile is currently linked to this service address.
              </div>
            )}
          </AdminSurface>
        </div>

        <div className="space-y-4">
          <AdminSurface>
            <h2 className="text-xl font-semibold text-slate-950">Customer Submitted Evidence</h2>
            <p className="mt-1 text-sm text-slate-500">
              Review the original media and supporting evidence provided with the request.
            </p>
            <div className="mt-5 space-y-3">
              {originalCustomerEvidence.length === 0 ? (
                <EmptyState text="No customer photo or video evidence was submitted." />
              ) : (
                originalCustomerEvidence.map((item) => (
                  <div key={item.id} className="rounded-xl bg-slate-50 p-4">
                    <div className="flex items-center gap-3">
                      {item.kind === "video" ? (
                        <FileVideo size={18} className="text-teal-700" />
                      ) : (
                        <Camera size={18} className="text-teal-700" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">{item.fileName}</p>
                        <p className="text-sm text-slate-500">{item.fileType}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </AdminSurface>

          <AdminSurface>
            <h2 className="text-xl font-semibold text-slate-950">Technician Evidence</h2>
            <div className="mt-5 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Stage" htmlFor="technician-evidence-stage">
                  <Select
                    onValueChange={(value) => setEvidenceStage(value as TechnicianEvidenceStage)}
                    value={evidenceStage}
                    disabled={locked}
                  >
                    <SelectTrigger id="technician-evidence-stage">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {evidenceStageOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Category" htmlFor="technician-evidence-category">
                  <Select
                    onValueChange={(value) => setEvidenceCategory(value as TechnicianEvidenceCategory)}
                    value={evidenceCategory}
                    disabled={locked}
                  >
                    <SelectTrigger id="technician-evidence-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {evidenceCategoryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField className="md:col-span-2" label="Photo or Video" htmlFor="technician-evidence-file">
                  <Input
                    id="technician-evidence-file"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
                    disabled={locked}
                    onChange={(event) => {
                      setEvidenceFile(event.target.files?.[0] ?? null);
                      setEvidenceError("");
                    }}
                  />
                </FormField>
                <FormField className="md:col-span-2" label="Optional Note" htmlFor="technician-evidence-note">
                  <Textarea
                    id="technician-evidence-note"
                    disabled={locked}
                    value={evidenceNote}
                    onChange={(event) => setEvidenceNote(event.target.value)}
                  />
                </FormField>
              </div>
              {evidenceError ? <p className="text-sm text-red-700">{evidenceError}</p> : null}
              <div className="flex justify-end">
                <Button onClick={handleAddEvidence} variant="outline" disabled={locked}>
                  <Camera size={16} />
                  Add Evidence
                </Button>
              </div>

              <div className="space-y-3">
                {order.technicianReport.evidence.length === 0 ? (
                  <EmptyState text="No technician evidence has been added yet." />
                ) : (
                  order.technicianReport.evidence.map((item) => (
                    <div key={item.id} className="rounded-xl bg-slate-50 p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex min-h-7 items-center rounded-xl px-3 py-1 text-xs font-semibold ${stageTone(item.stage)}`}>
                              {formatEvidenceStageLabel(item.stage)}
                            </span>
                            <span className="rounded-xl bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                              {formatEvidenceCategoryLabel(item.category)}
                            </span>
                          </div>
                          <p className="mt-3 truncate font-semibold text-slate-900">{item.fileName}</p>
                          <p className="mt-1 text-sm text-slate-500">{item.fileType}</p>
                          {item.note ? (
                            <p className="mt-2 text-sm text-slate-600">{item.note}</p>
                          ) : null}
                        </div>
                        <Button
                          size="icon-sm"
                          variant="outline"
                          disabled={locked}
                          onClick={() => removeTechnicianEvidence(order.id, item.id)}
                        >
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </AdminSurface>

          <AdminSurface>
            <div className="flex items-center gap-3">
              <PackagePlus size={20} className="text-teal-700" />
              <div>
                <h2 className="text-xl font-semibold text-slate-950">Service Report</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Submit findings, work performed, parts/materials, notes, and recommendations.
                </p>
              </div>
            </div>

            <form className="mt-5 space-y-4" onSubmit={reportForm.handleSubmit(handleReportSave)}>
              <FormField
                label="Diagnosis / Findings"
                htmlFor="report-diagnosis"
                error={reportForm.formState.errors.diagnosisFindings?.message}
              >
                <Textarea
                  id="report-diagnosis"
                  className="min-h-28"
                  disabled={locked}
                  {...reportForm.register("diagnosisFindings")}
                />
              </FormField>
              <FormField
                label="Work Performed"
                htmlFor="report-work"
                error={reportForm.formState.errors.workPerformed?.message}
              >
                <Textarea
                  id="report-work"
                  className="min-h-28"
                  disabled={locked}
                  {...reportForm.register("workPerformed")}
                />
              </FormField>
              <FormField
                label="Technician Notes"
                htmlFor="report-notes"
                error={reportForm.formState.errors.technicianNotes?.message}
              >
                <Textarea
                  id="report-notes"
                  className="min-h-28"
                  disabled={locked}
                  {...reportForm.register("technicianNotes")}
                />
              </FormField>
              <FormField
                label="Recommendations"
                htmlFor="report-recommendations"
                error={reportForm.formState.errors.recommendations?.message}
              >
                <Textarea
                  id="report-recommendations"
                  className="min-h-24"
                  disabled={locked}
                  {...reportForm.register("recommendations")}
                />
              </FormField>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-slate-950">Parts / Materials Used</h3>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={locked}
                    onClick={() =>
                      partsArray.append({
                        id: createId("part"),
                        name: "",
                        quantity: 1,
                        sku: "",
                        note: "",
                      })
                    }
                  >
                    <Plus size={15} />
                    Add Part
                  </Button>
                </div>

                <div className="mt-4 space-y-3">
                  {partsArray.fields.length === 0 ? (
                    <EmptyState text="No parts or materials recorded yet." />
                  ) : (
                    partsArray.fields.map((field, index) => (
                      <div key={field.id} className="rounded-xl bg-slate-50 p-4">
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                          <FormField
                            label="Item / Part"
                            htmlFor={`part-name-${field.id}`}
                            error={reportForm.formState.errors.partsUsed?.[index]?.name?.message}
                          >
                            <Input
                              id={`part-name-${field.id}`}
                              disabled={locked}
                              {...reportForm.register(`partsUsed.${index}.name`)}
                            />
                          </FormField>
                          <FormField
                            label="Quantity"
                            htmlFor={`part-quantity-${field.id}`}
                            error={reportForm.formState.errors.partsUsed?.[index]?.quantity?.message}
                          >
                            <Input
                              id={`part-quantity-${field.id}`}
                              type="number"
                              min={1}
                              disabled={locked}
                              {...reportForm.register(`partsUsed.${index}.quantity`, {
                                valueAsNumber: true,
                              })}
                            />
                          </FormField>
                          <FormField label="SKU / Part Ref" htmlFor={`part-sku-${field.id}`}>
                            <Input
                              id={`part-sku-${field.id}`}
                              disabled={locked}
                              {...reportForm.register(`partsUsed.${index}.sku`)}
                            />
                          </FormField>
                          <FormField label="Note" htmlFor={`part-note-${field.id}`}>
                            <Input
                              id={`part-note-${field.id}`}
                              disabled={locked}
                              {...reportForm.register(`partsUsed.${index}.note`)}
                            />
                          </FormField>
                        </div>
                        <div className="mt-3 flex justify-end">
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="outline"
                            disabled={locked}
                            onClick={() => partsArray.remove(index)}
                          >
                            <Trash2 size={15} />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button type="submit" variant="outline" disabled={locked}>
                  <Save size={16} />
                  Save Draft
                </Button>
                <Button type="button" disabled={locked} onClick={() => setConfirmSubmitOpen(true)}>
                  <CheckCircle2 size={16} />
                  Submit Service Report
                </Button>
              </div>
            </form>

            <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              Submitted: {order.technicianReport.submittedAt ? formatShortDateTime(order.technicianReport.submittedAt) : "Not submitted"}.
              {locked ? " Report is locked for technician editing." : " Report remains editable until submission."}
            </div>
          </AdminSurface>
        </div>
      </div>

      <Dialog open={etaDialogOpen} onOpenChange={setEtaDialogOpen}>
        <DialogContent className="w-[min(94vw,28rem)]">
          <DialogHeader>
            <DialogTitle>{order.technicianEta ? "Update ETA" : "Set ETA"}</DialogTitle>
            <DialogDescription>
              Save the current arrival estimate for the customer and dispatch workflow.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 space-y-4">
            <FormField label="ETA Preset" htmlFor="technician-eta-preset">
              <Select
                value={customEtaMode ? "custom" : etaPreset}
                onValueChange={(value) => {
                  if (value === "custom") {
                    setCustomEtaMode(true);
                    return;
                  }

                  setCustomEtaMode(false);
                  setEtaPreset(value);
                  etaForm.clearErrors("minutes");
                }}
              >
                <SelectTrigger id="technician-eta-preset">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 min</SelectItem>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="20">20 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="45">45 min</SelectItem>
                  <SelectItem value="60">60 min</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            {customEtaMode ? (
              <FormField
                label="ETA in Minutes"
                htmlFor="technician-eta-minutes"
                error={etaForm.formState.errors.minutes?.message}
              >
                <Input
                  id="technician-eta-minutes"
                  type="number"
                  min={1}
                  step={1}
                  {...etaForm.register("minutes", { valueAsNumber: true })}
                />
              </FormField>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEtaDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEtaDialogSubmit}>Save ETA</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmSubmitOpen} onOpenChange={setConfirmSubmitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Service Report?</DialogTitle>
            <DialogDescription>
              Submission locks the technician report and moves the service order to Report Submitted. Final completion still belongs to admin.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmSubmitOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitReport}>Confirm Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={newUnitOpen} onOpenChange={setNewUnitOpen}>
        <DialogContent className="w-[min(94vw,40rem)]">
          <DialogHeader>
            <DialogTitle>Add Vacuum Unit</DialogTitle>
            <DialogDescription>
              Internal property/system profile information for assigned service work.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <InlineDraftField label="Unit #" value={newUnitDraft.unitNumber} onChange={(value) => setNewUnitDraft((current) => ({ ...current, unitNumber: value }))} />
            <InlineDraftField label="Manufacturer" value={newUnitDraft.manufacturer} onChange={(value) => setNewUnitDraft((current) => ({ ...current, manufacturer: value }))} />
            <InlineDraftField label="Model" value={newUnitDraft.model} onChange={(value) => setNewUnitDraft((current) => ({ ...current, model: value }))} />
            <InlineDraftField label="Serial Number" value={newUnitDraft.serialNumber ?? ""} onChange={(value) => setNewUnitDraft((current) => ({ ...current, serialNumber: value }))} />
            <InlineDraftField label="Unit Location" value={newUnitDraft.location} onChange={(value) => setNewUnitDraft((current) => ({ ...current, location: value }))} />
            <InlineDraftField label="Notes" value={newUnitDraft.notes ?? ""} onChange={(value) => setNewUnitDraft((current) => ({ ...current, notes: value }))} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewUnitOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateUnit}>Save Unit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={newFloorOpen} onOpenChange={setNewFloorOpen}>
        <DialogContent className="w-[min(94vw,40rem)]">
          <DialogHeader>
            <DialogTitle>Add Floor / Port Profile</DialogTitle>
            <DialogDescription>
              Supports flexible floor labels and central vacuum port counts.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <InlineDraftField label="Floor Label" value={newFloorDraft.label} onChange={(value) => setNewFloorDraft((current) => ({ ...current, label: value }))} />
            <NumberDraftField label="HDH" value={newFloorDraft.hdh} onChange={(value) => setNewFloorDraft((current) => ({ ...current, hdh: value }))} />
            <NumberDraftField label="Chameleon" value={newFloorDraft.chameleon} onChange={(value) => setNewFloorDraft((current) => ({ ...current, chameleon: value }))} />
            <NumberDraftField label="Chameleon-Elite" value={newFloorDraft.chameleonElite} onChange={(value) => setNewFloorDraft((current) => ({ ...current, chameleonElite: value }))} />
            <NumberDraftField label="Standard" value={newFloorDraft.standard} onChange={(value) => setNewFloorDraft((current) => ({ ...current, standard: value }))} />
            <InlineDraftField label="Notes" value={newFloorDraft.notes ?? ""} onChange={(value) => setNewFloorDraft((current) => ({ ...current, notes: value }))} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFloorOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFloor}>Save Floor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={newFeatureOpen} onOpenChange={setNewFeatureOpen}>
        <DialogContent className="w-[min(94vw,40rem)]">
          <DialogHeader>
            <DialogTitle>Add Additional Feature</DialogTitle>
            <DialogDescription>
              Internal feature quantities and location notes for VacPan, Spot Vacuum, and Wally Flex.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <FormField label="Feature Type" htmlFor="feature-type">
              <Select
                onValueChange={(value) => setNewFeatureDraft((current) => ({ ...current, type: value as CustomerFeatureType }))}
                value={newFeatureDraft.type}
              >
                <SelectTrigger id="feature-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VacPan">VacPan</SelectItem>
                  <SelectItem value="Spot Vacuum">Spot Vacuum</SelectItem>
                  <SelectItem value="Wally Flex">Wally Flex</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <NumberDraftField label="Quantity" value={newFeatureDraft.quantity} onChange={(value) => setNewFeatureDraft((current) => ({ ...current, quantity: value }))} />
            <InlineDraftField label="Locations (comma separated)" value={newFeatureDraft.locations} onChange={(value) => setNewFeatureDraft((current) => ({ ...current, locations: value }))} />
            <InlineDraftField label="Notes" value={newFeatureDraft.notes ?? ""} onChange={(value) => setNewFeatureDraft((current) => ({ ...current, notes: value }))} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFeatureOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFeature}>Save Feature</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TechnicianRouteShell>
  );
}

function SectionGroup({
  action,
  children,
  title,
}: {
  action?: React.ReactNode;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-teal-200 bg-teal-50/40 px-4 py-6 text-center text-sm text-slate-600">
      {text}
    </div>
  );
}

function CountChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white px-3 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  href,
  label,
  value,
}: {
  href?: string;
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-teal-800">
        <Icon size={16} />
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      </div>
      {href ? (
        <a
          href={href}
          target={href.startsWith("http") ? "_blank" : undefined}
          rel={href.startsWith("http") ? "noreferrer" : undefined}
          className="mt-3 block text-sm font-semibold text-slate-900 transition hover:text-teal-700"
        >
          {value}
        </a>
      ) : (
        <p className="mt-3 text-sm font-semibold text-slate-900">{value}</p>
      )}
    </div>
  );
}

function InlineEditable({
  disabled,
  label,
  onSave,
  value,
}: {
  disabled: boolean;
  label: string;
  onSave: (value: string) => void;
  value: string;
}) {
  const [draft, setDraft] = useState(value);

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <Input
        value={draft}
        disabled={disabled}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => {
          if (draft !== value) onSave(draft.trim());
        }}
      />
    </div>
  );
}

function InlineDraftField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <FormField label={label} htmlFor={label}>
      <Input id={label} value={value} onChange={(event) => onChange(event.target.value)} />
    </FormField>
  );
}

function NumberDraftField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <FormField label={label} htmlFor={label}>
      <Input
        id={label}
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value || 0))}
      />
    </FormField>
  );
}
