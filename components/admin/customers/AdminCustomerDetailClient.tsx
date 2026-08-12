"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CreditCard,
  Home,
  Mail,
  MapPin,
  NotebookPen,
  Phone,
  Plus,
  Settings2,
  ShieldCheck,
  Trash2,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import {
  AdminPageHeader,
  AdminPageShell,
  AdminSurface,
} from "@/components/admin/AdminPageShell";
import { FormField } from "@/components/forms/FormField";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { TypeBadge } from "@/components/customer-portal/TypeBadge";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
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
import { getAdminOrders, getAdminOrderInvoice } from "@/data/mock/admin-orders";
import { getSharedAdminScheduleRecords } from "@/data/mock/admin-schedule-state";
import { mockPayments } from "@/data/mock/payments";
import {
  archiveSharedCustomerProperty,
  archiveSharedCustomerUnit,
  createSharedCustomerInternalNote,
  createSharedCustomerProperty,
  createSharedCustomerUnit,
  deleteSharedCustomerFeature,
  getSharedCustomerById,
  getSharedCustomerPrimaryAddress,
  getSharedQuotations,
  getSharedServiceRequests,
  toggleSharedCustomerStatus,
  updateSharedCustomer,
  updateSharedCustomerProperty,
  updateSharedCustomerUnit,
  upsertSharedCustomerFeature,
  upsertSharedCustomerInletFloor,
} from "@/data/mock/shared-business-store";
import { useSharedBusinessStoreVersion } from "@/hooks/useSharedBusinessStoreVersion";
import {
  formatCurrencyUsd,
  formatLongDate,
  formatShortDateTime,
} from "@/lib/formatters";
import {
  customerFeatureSchema,
  customerInletFloorSchema,
  customerInternalNoteSchema,
  customerOverviewSchema,
  customerPropertySchema,
  customerUnitSchema,
  type CustomerFeatureValues,
  type CustomerInletFloorValues,
  type CustomerInternalNoteValues,
  type CustomerOverviewValues,
  type CustomerPropertyValues,
  type CustomerUnitValues,
} from "@/lib/validation";
import { cn } from "@/lib/utils";
import type {
  Address,
  Customer,
  CustomerFeature,
  CustomerInletFloor,
  CustomerProperty,
  CustomerVacuumUnit,
} from "@/types/domain";

type DetailTab =
  | "overview"
  | "properties"
  | "history"
  | "orders"
  | "billing"
  | "notes";

const detailTabs: Array<{ label: string; value: DetailTab }> = [
  { label: "Overview", value: "overview" },
  { label: "Properties & Systems", value: "properties" },
  { label: "Service History", value: "history" },
  { label: "Orders", value: "orders" },
  { label: "Billing", value: "billing" },
  { label: "Internal Notes", value: "notes" },
];

const propertyTypes = [
  "primary-residence",
  "vacation-home",
  "townhouse",
  "apartment",
  "commercial",
  "other",
] as const;

const featureTypes = ["VacPan", "Spot Vacuum", "Wally Flex"] as const;

function toId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeOptional(value?: string) {
  return value?.trim() ? value.trim() : undefined;
}

function getStatusLabel(status: Customer["status"]) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getCustomerStatusTone(status: Customer["status"]) {
  if (status === "active") return "accepted";
  if (status === "inactive") return "cancelled";
  return "quoted";
}

function getPropertyTypeLabel(value: CustomerProperty["propertyType"]) {
  const labels: Record<CustomerProperty["propertyType"], string> = {
    apartment: "Apartment",
    commercial: "Commercial",
    other: "Other",
    "primary-residence": "Primary Residence",
    townhouse: "Townhouse",
    "vacation-home": "Vacation Home",
  };

  return labels[value];
}

function buildAddressLabel(address: Address) {
  return `${address.line1}, ${address.city}, ${address.state} ${address.postalCode}`;
}

function getCustomerServiceRequests(customerId: string) {
  return getSharedServiceRequests()
    .filter((request) => request.customerId === customerId)
    .sort(
      (left, right) =>
        new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime(),
    );
}

function getCustomerOrders(customerId: string) {
  return getAdminOrders()
    .filter((order) => order.customerId === customerId)
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );
}

function getCustomerSchedules(customerId: string) {
  return getSharedAdminScheduleRecords()
    .filter((record) => record.customerId === customerId)
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );
}

function getCustomerBillingRows(customerId: string) {
  const orders = getCustomerOrders(customerId);
  const paymentRows = mockPayments
    .filter((payment) => payment.customerId === customerId)
    .map((payment) => {
      const order = orders.find((entry) => entry.id === payment.orderId);
      return {
        amount: payment.amountUsd,
        date: payment.processedAt,
        id: payment.id,
        kind: order?.type ?? "Service",
        sourceId: payment.orderId,
        status: payment.status,
      };
    });

  const invoiceRows = orders.flatMap((order) => {
    const invoice = getAdminOrderInvoice(order);
    if (!invoice) return [];

    return [
      {
        amount: invoice.totals.totalUsd,
        date: invoice.createdAt,
        id: invoice.id,
        kind: order.type,
        sourceId: order.id,
        status: invoice.status,
      },
    ];
  });

  return [...paymentRows, ...invoiceRows].sort(
    (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime(),
  );
}

function OverviewForm({
  customer,
}: {
  customer: Customer;
}) {
  const form = useForm<CustomerOverviewValues>({
    resolver: zodResolver(customerOverviewSchema),
    defaultValues: {
      bestContactTime: customer.bestContactTime ?? "",
      cellphone: customer.cellphone ?? "",
      company: customer.company ?? "",
      customerPreferences: customer.customerPreferences ?? "",
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      preferredContactMethod: customer.preferredContactMethod,
      status: customer.status,
    },
  });

  function onSubmit(values: CustomerOverviewValues) {
    updateSharedCustomer(customer.id, {
      bestContactTime: normalizeOptional(values.bestContactTime),
      cellphone: normalizeOptional(values.cellphone),
      company: normalizeOptional(values.company),
      customerPreferences: normalizeOptional(values.customerPreferences),
      displayName: `${values.firstName} ${values.lastName}`.trim(),
      email: values.email,
      firstName: values.firstName,
      lastName: values.lastName,
      phone: values.phone,
      preferredContactMethod: values.preferredContactMethod,
      status: values.status,
    });
  }

  return (
    <AdminSurface>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Account Information</h2>
          <p className="mt-1 text-sm text-slate-500">
            Basic customer contact data shared across requests, orders, quotations, and schedules.
          </p>
        </div>
        <StatusBadge
          label={getStatusLabel(customer.status)}
          status={getCustomerStatusTone(customer.status)}
        />
      </div>

      <form className="mt-5 space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            error={form.formState.errors.firstName?.message}
            htmlFor="customer-first-name"
            label="First Name"
            required
          >
            <Input id="customer-first-name" {...form.register("firstName")} />
          </FormField>
          <FormField
            error={form.formState.errors.lastName?.message}
            htmlFor="customer-last-name"
            label="Last Name"
            required
          >
            <Input id="customer-last-name" {...form.register("lastName")} />
          </FormField>
          <FormField
            error={form.formState.errors.email?.message}
            htmlFor="customer-email"
            label="Email"
            required
          >
            <Input id="customer-email" {...form.register("email")} />
          </FormField>
          <FormField
            error={form.formState.errors.phone?.message}
            htmlFor="customer-phone"
            label="Phone"
            required
          >
            <Input id="customer-phone" {...form.register("phone")} />
          </FormField>
          <FormField
            error={form.formState.errors.cellphone?.message}
            htmlFor="customer-cellphone"
            label="Cellphone"
          >
            <Input id="customer-cellphone" {...form.register("cellphone")} />
          </FormField>
          <FormField
            error={form.formState.errors.company?.message}
            htmlFor="customer-company"
            label="Company"
          >
            <Input id="customer-company" {...form.register("company")} />
          </FormField>
          <FormField
            error={form.formState.errors.preferredContactMethod?.message}
            htmlFor="customer-preferred-contact"
            label="Preferred Contact"
          >
            <Controller
              control={form.control}
              name="preferredContactMethod"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value ?? ""}>
                  <SelectTrigger id="customer-preferred-contact">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="text">Text</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
          <FormField
            error={form.formState.errors.status?.message}
            htmlFor="customer-status"
            label="Account Status"
            required
          >
            <Controller
              control={form.control}
              name="status"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id="customer-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
          <FormField
            error={form.formState.errors.bestContactTime?.message}
            htmlFor="customer-best-contact-time"
            label="Best Contact Time"
          >
            <Input id="customer-best-contact-time" {...form.register("bestContactTime")} />
          </FormField>
        </div>

        <FormField
          error={form.formState.errors.customerPreferences?.message}
          htmlFor="customer-preferences"
          label="Customer Preferences"
        >
          <Textarea
            className="min-h-28"
            id="customer-preferences"
            {...form.register("customerPreferences")}
          />
        </FormField>

        <div className="flex justify-end">
          <Button type="submit">Save Account Info</Button>
        </div>
      </form>
    </AdminSurface>
  );
}

function PropertyDialog({
  customerId,
  onOpenChange,
  open,
  property,
}: {
  customerId: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  property?: CustomerProperty;
}) {
  const hasBasement = !!property?.hasBasement;
  const hasSubBasement = !!property?.hasSubBasement;
  const form = useForm<CustomerPropertyValues>({
    resolver: zodResolver(customerPropertySchema),
    defaultValues: {
      accessInformation: property?.accessInformation ?? "",
      city: property?.address.city ?? "",
      country: property?.address.country ?? "United States",
      floors: property?.floors ?? 1,
      hasBasement: property?.hasBasement ?? false,
      hasSubBasement: property?.hasSubBasement ?? false,
      internalNotes: property?.internalNotes ?? "",
      label: property?.label ?? "",
      line1: property?.address.line1 ?? "",
      line2: property?.address.line2 ?? "",
      postalCode: property?.address.postalCode ?? "",
      propertyType: property?.propertyType ?? "primary-residence",
      state: property?.address.state ?? "",
    },
  });

  function onSubmit(values: CustomerPropertyValues) {
    const address: Address = {
      city: values.city,
      country: values.country,
      id: property?.address.id ?? toId("addr"),
      label: values.label,
      line1: values.line1,
      line2: normalizeOptional(values.line2),
      postalCode: values.postalCode,
      state: values.state,
    };

    if (property) {
      updateSharedCustomerProperty(customerId, property.id, {
        accessInformation: normalizeOptional(values.accessInformation),
        address,
        floors: values.floors,
        hasBasement: values.hasBasement,
        hasSubBasement: values.hasSubBasement,
        internalNotes: normalizeOptional(values.internalNotes),
        label: values.label,
        propertyType: values.propertyType,
      });
    } else {
      createSharedCustomerProperty(customerId, {
        accessInformation: normalizeOptional(values.accessInformation),
        additionalFeatures: [],
        address,
        floors: values.floors,
        hasBasement: values.hasBasement,
        hasSubBasement: values.hasSubBasement,
        id: toId("property"),
        inletFloors: [],
        internalNotes: normalizeOptional(values.internalNotes),
        label: values.label,
        propertyType: values.propertyType,
        status: "active",
        vacuumUnits: [],
      });
    }

    onOpenChange(false);
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="w-[min(96vw,56rem)] max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{property ? "Edit Property" : "Add Property"}</DialogTitle>
          <DialogDescription>
            Internal property and system profile data stays available to admin and technician views only.
          </DialogDescription>
        </DialogHeader>

        <form className="mt-5 space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              error={form.formState.errors.label?.message}
              htmlFor="property-label"
              label="Property Label"
              required
            >
              <Input id="property-label" {...form.register("label")} />
            </FormField>
            <FormField
              error={form.formState.errors.propertyType?.message}
              htmlFor="property-type"
              label="Property Type"
              required
            >
              <Controller
                control={form.control}
                name="propertyType"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="property-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {propertyTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {getPropertyTypeLabel(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              error={form.formState.errors.line1?.message}
              htmlFor="property-address-line1"
              label="Address Line 1"
              required
            >
              <Input id="property-address-line1" {...form.register("line1")} />
            </FormField>
            <FormField
              error={form.formState.errors.line2?.message}
              htmlFor="property-address-line2"
              label="Address Line 2"
            >
              <Input id="property-address-line2" {...form.register("line2")} />
            </FormField>
            <FormField
              error={form.formState.errors.city?.message}
              htmlFor="property-address-city"
              label="City"
              required
            >
              <Input id="property-address-city" {...form.register("city")} />
            </FormField>
            <FormField
              error={form.formState.errors.state?.message}
              htmlFor="property-address-state"
              label="State"
              required
            >
              <Input id="property-address-state" {...form.register("state")} />
            </FormField>
            <FormField
              error={form.formState.errors.postalCode?.message}
              htmlFor="property-address-postal"
              label="Postal Code"
              required
            >
              <Input id="property-address-postal" {...form.register("postalCode")} />
            </FormField>
            <FormField
              error={form.formState.errors.country?.message}
              htmlFor="property-address-country"
              label="Country"
              required
            >
              <Input id="property-address-country" {...form.register("country")} />
            </FormField>
            <FormField
              error={form.formState.errors.floors?.message}
              htmlFor="property-floors"
              label="Number of Floors"
              required
            >
              <Input
                id="property-floors"
                type="number"
                {...form.register("floors", { valueAsNumber: true })}
              />
            </FormField>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Checkbox
              checked={hasBasement}
              label="Property has basement"
              onChange={(event) => form.setValue("hasBasement", event.target.checked)}
            />
            <Checkbox
              checked={hasSubBasement}
              label="Property has sub-basement"
              onChange={(event) => form.setValue("hasSubBasement", event.target.checked)}
            />
          </div>

          <FormField
            error={form.formState.errors.accessInformation?.message}
            htmlFor="property-access"
            label="Access Information"
          >
            <Textarea id="property-access" {...form.register("accessInformation")} />
          </FormField>

          <FormField
            error={form.formState.errors.internalNotes?.message}
            htmlFor="property-notes"
            label="Internal Property Notes"
          >
            <Textarea id="property-notes" {...form.register("internalNotes")} />
          </FormField>

          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
              Cancel
            </Button>
            <Button type="submit">{property ? "Save Property" : "Create Property"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UnitDialog({
  customerId,
  onOpenChange,
  open,
  propertyId,
  unit,
}: {
  customerId: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  propertyId: string;
  unit?: CustomerVacuumUnit;
}) {
  const form = useForm<CustomerUnitValues>({
    resolver: zodResolver(customerUnitSchema),
    defaultValues: {
      location: unit?.location ?? "",
      manufacturer: unit?.manufacturer ?? "",
      model: unit?.model ?? "",
      notes: unit?.notes ?? "",
      serialNumber: unit?.serialNumber ?? "",
      unitNumber: unit?.unitNumber ?? "",
    },
  });

  function onSubmit(values: CustomerUnitValues) {
    if (unit) {
      updateSharedCustomerUnit(customerId, propertyId, unit.id, {
        location: values.location,
        manufacturer: values.manufacturer,
        model: values.model,
        notes: normalizeOptional(values.notes),
        serialNumber: normalizeOptional(values.serialNumber),
        unitNumber: values.unitNumber,
      });
    } else {
      createSharedCustomerUnit(customerId, propertyId, {
        id: toId("unit"),
        location: values.location,
        manufacturer: values.manufacturer,
        model: values.model,
        notes: normalizeOptional(values.notes),
        serialNumber: normalizeOptional(values.serialNumber),
        status: "active",
        unitNumber: values.unitNumber,
      });
    }

    onOpenChange(false);
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="w-[min(94vw,40rem)]">
        <DialogHeader>
          <DialogTitle>{unit ? "Edit Vacuum Unit" : "Add Vacuum Unit"}</DialogTitle>
          <DialogDescription>
            Track manufacturer, model, serial, location, and field notes per property.
          </DialogDescription>
        </DialogHeader>

        <form className="mt-5 space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              error={form.formState.errors.unitNumber?.message}
              htmlFor="unit-number"
              label="Unit Number"
              required
            >
              <Input id="unit-number" {...form.register("unitNumber")} />
            </FormField>
            <FormField
              error={form.formState.errors.location?.message}
              htmlFor="unit-location"
              label="Location"
              required
            >
              <Input id="unit-location" {...form.register("location")} />
            </FormField>
            <FormField
              error={form.formState.errors.manufacturer?.message}
              htmlFor="unit-manufacturer"
              label="Manufacturer"
              required
            >
              <Input id="unit-manufacturer" {...form.register("manufacturer")} />
            </FormField>
            <FormField
              error={form.formState.errors.model?.message}
              htmlFor="unit-model"
              label="Model"
              required
            >
              <Input id="unit-model" {...form.register("model")} />
            </FormField>
            <FormField
              error={form.formState.errors.serialNumber?.message}
              htmlFor="unit-serial"
              label="Serial Number"
            >
              <Input id="unit-serial" {...form.register("serialNumber")} />
            </FormField>
          </div>

          <FormField
            error={form.formState.errors.notes?.message}
            htmlFor="unit-notes"
            label="Unit Notes"
          >
            <Textarea id="unit-notes" {...form.register("notes")} />
          </FormField>

          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
              Cancel
            </Button>
            <Button type="submit">{unit ? "Save Unit" : "Create Unit"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function InletFloorDialog({
  customerId,
  floor,
  onOpenChange,
  open,
  propertyId,
}: {
  customerId: string;
  floor?: CustomerInletFloor;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  propertyId: string;
}) {
  const form = useForm<CustomerInletFloorValues>({
    resolver: zodResolver(customerInletFloorSchema),
    defaultValues: {
      chameleon: floor?.chameleon ?? 0,
      chameleonElite: floor?.chameleonElite ?? 0,
      hdh: floor?.hdh ?? 0,
      label: floor?.label ?? "",
      notes: floor?.notes ?? "",
      standard: floor?.standard ?? 0,
    },
  });

  function onSubmit(values: CustomerInletFloorValues) {
    upsertSharedCustomerInletFloor(customerId, propertyId, {
      chameleon: values.chameleon,
      chameleonElite: values.chameleonElite,
      hdh: values.hdh,
      id: floor?.id ?? toId("floor"),
      label: values.label,
      notes: normalizeOptional(values.notes),
      standard: values.standard,
    });
    onOpenChange(false);
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="w-[min(94vw,42rem)]">
        <DialogHeader>
          <DialogTitle>{floor ? "Edit Inlet Floor" : "Add Inlet Floor"}</DialogTitle>
          <DialogDescription>
            Flexible floor records support HDH, Chameleon, Chameleon-Elite, and Standard inlet counts.
          </DialogDescription>
        </DialogHeader>

        <form className="mt-5 space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            error={form.formState.errors.label?.message}
            htmlFor="floor-label"
            label="Floor Label"
            required
          >
            <Input id="floor-label" {...form.register("label")} />
          </FormField>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              error={form.formState.errors.hdh?.message}
              htmlFor="floor-hdh"
              label="HDH"
            >
              <Input
                id="floor-hdh"
                type="number"
                {...form.register("hdh", { valueAsNumber: true })}
              />
            </FormField>
            <FormField
              error={form.formState.errors.chameleon?.message}
              htmlFor="floor-chameleon"
              label="Chameleon"
            >
              <Input
                id="floor-chameleon"
                type="number"
                {...form.register("chameleon", { valueAsNumber: true })}
              />
            </FormField>
            <FormField
              error={form.formState.errors.chameleonElite?.message}
              htmlFor="floor-chameleon-elite"
              label="Chameleon-Elite"
            >
              <Input
                id="floor-chameleon-elite"
                type="number"
                {...form.register("chameleonElite", { valueAsNumber: true })}
              />
            </FormField>
            <FormField
              error={form.formState.errors.standard?.message}
              htmlFor="floor-standard"
              label="Standard"
            >
              <Input
                id="floor-standard"
                type="number"
                {...form.register("standard", { valueAsNumber: true })}
              />
            </FormField>
          </div>

          <FormField
            error={form.formState.errors.notes?.message}
            htmlFor="floor-notes"
            label="Location Notes"
          >
            <Textarea id="floor-notes" {...form.register("notes")} />
          </FormField>

          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
              Cancel
            </Button>
            <Button type="submit">{floor ? "Save Floor" : "Create Floor"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FeatureDialog({
  customerId,
  feature,
  onOpenChange,
  open,
  propertyId,
}: {
  customerId: string;
  feature?: CustomerFeature;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  propertyId: string;
}) {
  const form = useForm<CustomerFeatureValues>({
    resolver: zodResolver(customerFeatureSchema),
    defaultValues: {
      locations: feature?.locations.join(", ") ?? "",
      notes: feature?.notes ?? "",
      quantity: feature?.quantity ?? 1,
      type: feature?.type ?? "VacPan",
    },
  });

  function onSubmit(values: CustomerFeatureValues) {
    upsertSharedCustomerFeature(customerId, propertyId, {
      id: feature?.id ?? toId("feature"),
      locations: values.locations
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      notes: normalizeOptional(values.notes),
      quantity: values.quantity,
      type: values.type,
    });
    onOpenChange(false);
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="w-[min(94vw,40rem)]">
        <DialogHeader>
          <DialogTitle>{feature ? "Edit Feature" : "Add Feature"}</DialogTitle>
          <DialogDescription>
            Track additional system features such as VacPan, Spot Vacuum, and Wally Flex by quantity and location.
          </DialogDescription>
        </DialogHeader>

        <form className="mt-5 space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              error={form.formState.errors.type?.message}
              htmlFor="feature-type"
              label="Feature Type"
              required
            >
              <Controller
                control={form.control}
                name="type"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="feature-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {featureTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormField>
            <FormField
              error={form.formState.errors.quantity?.message}
              htmlFor="feature-quantity"
              label="Quantity"
              required
            >
              <Input
                id="feature-quantity"
                type="number"
                {...form.register("quantity", { valueAsNumber: true })}
              />
            </FormField>
          </div>

          <FormField
            error={form.formState.errors.locations?.message}
            htmlFor="feature-locations"
            label="Locations"
            required
            hint="Separate multiple locations with commas."
          >
            <Input id="feature-locations" {...form.register("locations")} />
          </FormField>

          <FormField
            error={form.formState.errors.notes?.message}
            htmlFor="feature-notes"
            label="Feature Notes"
          >
            <Textarea id="feature-notes" {...form.register("notes")} />
          </FormField>

          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
              Cancel
            </Button>
            <Button type="submit">{feature ? "Save Feature" : "Create Feature"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function InternalNoteDialog({
  customerId,
  onOpenChange,
  open,
}: {
  customerId: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const form = useForm<CustomerInternalNoteValues>({
    resolver: zodResolver(customerInternalNoteSchema),
    defaultValues: {
      body: "",
      title: "",
    },
  });

  function onSubmit(values: CustomerInternalNoteValues) {
    createSharedCustomerInternalNote(customerId, {
      body: values.body,
      createdAt: new Date().toISOString(),
      createdBy: "Admin",
      id: toId("note"),
      title: values.title,
    });
    onOpenChange(false);
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="w-[min(94vw,38rem)]">
        <DialogHeader>
          <DialogTitle>Add Internal Note</DialogTitle>
          <DialogDescription>
            Internal notes are visible only to admin and technician-facing operating screens.
          </DialogDescription>
        </DialogHeader>
        <form className="mt-5 space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            error={form.formState.errors.title?.message}
            htmlFor="internal-note-title"
            label="Title"
            required
          >
            <Input id="internal-note-title" {...form.register("title")} />
          </FormField>
          <FormField
            error={form.formState.errors.body?.message}
            htmlFor="internal-note-body"
            label="Note"
            required
          >
            <Textarea className="min-h-32" id="internal-note-body" {...form.register("body")} />
          </FormField>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
              Cancel
            </Button>
            <Button type="submit">Save Note</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AdminCustomerDetailClient({
  customerId,
}: {
  customerId: string;
}) {
  useSharedBusinessStoreVersion();
  const customer = getSharedCustomerById(customerId);
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [propertyDialogOpen, setPropertyDialogOpen] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [unitDialogState, setUnitDialogState] = useState<{
    propertyId: string;
    unitId?: string;
  } | null>(null);
  const [floorDialogState, setFloorDialogState] = useState<{
    floorId?: string;
    propertyId: string;
  } | null>(null);
  const [featureDialogState, setFeatureDialogState] = useState<{
    featureId?: string;
    propertyId: string;
  } | null>(null);
  const [internalNoteOpen, setInternalNoteOpen] = useState(false);

  if (!customer) {
    return (
      <AdminPageShell>
        <AdminSurface className="text-center text-sm text-slate-600">
          Customer not found.
        </AdminSurface>
      </AdminPageShell>
    );
  }

  const primaryAddress = getSharedCustomerPrimaryAddress(customer.id);
  const serviceRequests = getCustomerServiceRequests(customer.id);
  const quotations = getSharedQuotations().filter((quote) => quote.customerId === customer.id);
  const orders = getCustomerOrders(customer.id);
  const schedules = getCustomerSchedules(customer.id);
  const billingRows = getCustomerBillingRows(customer.id);
  const properties = customer.properties ?? [];
  const editingProperty = editingPropertyId
    ? properties.find((property) => property.id === editingPropertyId)
    : undefined;
  const editingUnit = unitDialogState
    ? properties
        .find((property) => property.id === unitDialogState.propertyId)
        ?.vacuumUnits.find((unit) => unit.id === unitDialogState.unitId)
    : undefined;
  const editingFloor = floorDialogState
    ? properties
        .find((property) => property.id === floorDialogState.propertyId)
        ?.inletFloors.find((floor) => floor.id === floorDialogState.floorId)
    : undefined;
  const editingFeature = featureDialogState
    ? properties
        .find((property) => property.id === featureDialogState.propertyId)
        ?.additionalFeatures.find((feature) => feature.id === featureDialogState.featureId)
    : undefined;

  const serviceHistoryRows = serviceRequests.map((request) => {
    const quotation = quotations.find((entry) => entry.serviceRequestId === request.id);
    const schedule = schedules.find((entry) => entry.serviceRequestId === request.id);
    const order = orders.find(
      (entry) => entry.type === "SERVICE" && entry.serviceRequestId === request.id,
    );

    return {
      order,
      quotation,
      request,
      schedule,
    };
  });

  return (
    <AdminPageShell>
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link
          className="inline-flex items-center gap-2 transition hover:text-primary"
          href="/admin/customers"
        >
          <ArrowLeft size={16} />
          Back to customers
        </Link>
      </div>

      <AdminPageHeader
        eyebrow="Customers"
        title={customer.displayName}
        description="Admin-only customer profile with property, system, and history data reused across service operations and commerce."
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => toggleSharedCustomerStatus(customer.id)}
              variant={customer.status === "active" ? "outline" : "default"}
            >
              {customer.status === "active" ? "Deactivate" : "Activate"}
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/service-requests">View Service Requests</Link>
            </Button>
          </div>
        }
      />

      <AdminSurface className="p-2">
        <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
          {detailTabs.map((tab) => (
            <button
              className={cn(
                "rounded-xl px-4 py-3 text-sm font-semibold transition",
                activeTab === tab.value
                  ? "bg-primary text-white"
                  : "text-slate-600 hover:bg-slate-50 hover:text-primary",
              )}
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </AdminSurface>

      {activeTab === "overview" ? (
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <OverviewForm customer={customer} />

          <div className="space-y-4">
            <AdminSurface>
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-teal-50 text-teal-800">
                  <MapPin size={18} />
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">Addresses</h2>
                  <p className="text-sm text-slate-500">
                    Primary address plus additional saved customer locations.
                  </p>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {customer.addresses.map((address) => (
                  <div
                    className="rounded-xl border border-teal-100 bg-slate-50 p-4"
                    key={address.id}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-900">{address.label}</p>
                      {primaryAddress?.id === address.id ? (
                        <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
                          Primary
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {buildAddressLabel(address)}
                    </p>
                  </div>
                ))}
              </div>
            </AdminSurface>

            <AdminSurface>
              <div className="grid gap-3 sm:grid-cols-2">
                <OverviewTile
                  icon={CalendarDays}
                  label="Joined"
                  value={formatLongDate(customer.joinedAt)}
                />
                <OverviewTile
                  icon={Building2}
                  label="Company"
                  value={customer.company ?? "None"}
                />
                <OverviewTile
                  icon={Home}
                  label="Properties"
                  value={String(properties.length)}
                />
                <OverviewTile
                  icon={Wrench}
                  label="Service Requests"
                  value={String(serviceRequests.length)}
                />
              </div>
            </AdminSurface>
          </div>
        </div>
      ) : null}

      {activeTab === "properties" ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => {
              setEditingPropertyId(null);
              setPropertyDialogOpen(true);
            }}>
              <Plus size={16} />
              Add Property
            </Button>
          </div>

          {properties.length === 0 ? (
            <AdminSurface className="text-center text-sm text-slate-600">
              No internal property profile has been added for this customer yet.
            </AdminSurface>
          ) : (
            properties.map((property) => (
              <AdminSurface className="space-y-5" key={property.id}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-semibold text-slate-950">{property.label}</h2>
                      <StatusBadge
                        label={property.status}
                        status={property.status === "active" ? "accepted" : "cancelled"}
                      />
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {buildAddressLabel(property.address)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => {
                        setEditingPropertyId(property.id);
                        setPropertyDialogOpen(true);
                      }}
                      size="sm"
                      variant="outline"
                    >
                      Edit Property
                    </Button>
                    <Button
                      onClick={() => archiveSharedCustomerProperty(customer.id, property.id)}
                      size="sm"
                      variant="outline"
                    >
                      Archive Property
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                  <PropertyStat label="Type" value={getPropertyTypeLabel(property.propertyType)} />
                  <PropertyStat label="Floors" value={String(property.floors)} />
                  <PropertyStat
                    label="Basement"
                    value={property.hasBasement ? "Yes" : "No"}
                  />
                  <PropertyStat
                    label="Sub-basement"
                    value={property.hasSubBasement ? "Yes" : "No"}
                  />
                  <PropertyStat
                    label="Units"
                    value={String(property.vacuumUnits.filter((unit) => unit.status !== "archived").length)}
                  />
                  <PropertyStat
                    label="Features"
                    value={String(property.additionalFeatures.length)}
                  />
                </div>

                <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
                  <AdminSurface className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-950">Vacuum Units</h3>
                        <p className="text-sm text-slate-500">
                          Manufacturer, model, serial, and internal location per unit.
                        </p>
                      </div>
                      <Button
                        onClick={() =>
                          setUnitDialogState({
                            propertyId: property.id,
                          })
                        }
                        size="sm"
                        variant="outline"
                      >
                        <Plus size={15} />
                        Add Unit
                      </Button>
                    </div>

                    <div className="mt-4 space-y-3">
                      {property.vacuumUnits.length === 0 ? (
                        <EmptyCard text="No units added yet." />
                      ) : (
                        property.vacuumUnits.map((unit) => (
                          <div
                            className="rounded-xl border border-teal-100 bg-slate-50 p-4"
                            key={unit.id}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-slate-900">{unit.unitNumber}</p>
                                  <StatusBadge
                                    label={unit.status}
                                    status={unit.status === "active" ? "accepted" : "cancelled"}
                                  />
                                </div>
                                <p className="mt-1 text-sm text-slate-600">
                                  {unit.manufacturer} - {unit.model}
                                </p>
                                <p className="mt-1 text-sm text-slate-600">
                                  {unit.location}
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                  Serial: {unit.serialNumber ?? "Not recorded"}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() =>
                                    setUnitDialogState({
                                      propertyId: property.id,
                                      unitId: unit.id,
                                    })
                                  }
                                  size="sm"
                                  variant="outline"
                                >
                                  Edit
                                </Button>
                                <Button
                                  onClick={() =>
                                    archiveSharedCustomerUnit(customer.id, property.id, unit.id)
                                  }
                                  size="sm"
                                  variant="outline"
                                >
                                  Archive
                                </Button>
                              </div>
                            </div>
                            {unit.notes ? (
                              <p className="mt-3 text-sm leading-6 text-slate-600">{unit.notes}</p>
                            ) : null}
                          </div>
                        ))
                      )}
                    </div>
                  </AdminSurface>

                  <AdminSurface className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-950">Inlets / Ports by Floor</h3>
                        <p className="text-sm text-slate-500">
                          Flexible floor records with HDH, Chameleon, Chameleon-Elite, and Standard counts.
                        </p>
                      </div>
                      <Button
                        onClick={() =>
                          setFloorDialogState({
                            propertyId: property.id,
                          })
                        }
                        size="sm"
                        variant="outline"
                      >
                        <Plus size={15} />
                        Add Floor
                      </Button>
                    </div>

                    <div className="mt-4 space-y-3">
                      {property.inletFloors.length === 0 ? (
                        <EmptyCard text="No inlet counts recorded yet." />
                      ) : (
                        property.inletFloors.map((floor) => (
                          <div
                            className="rounded-xl border border-teal-100 bg-slate-50 p-4"
                            key={floor.id}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold text-slate-900">{floor.label}</p>
                                <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-600 sm:grid-cols-4">
                                  <CountChip label="HDH" value={floor.hdh} />
                                  <CountChip label="Chameleon" value={floor.chameleon} />
                                  <CountChip
                                    label="Chameleon-Elite"
                                    value={floor.chameleonElite}
                                  />
                                  <CountChip label="Standard" value={floor.standard} />
                                </div>
                                {floor.notes ? (
                                  <p className="mt-3 text-sm leading-6 text-slate-600">{floor.notes}</p>
                                ) : null}
                              </div>
                              <Button
                                onClick={() =>
                                  setFloorDialogState({
                                    floorId: floor.id,
                                    propertyId: property.id,
                                  })
                                }
                                size="sm"
                                variant="outline"
                              >
                                Edit
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </AdminSurface>
                </div>

                <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
                  <AdminSurface className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-950">Additional Features</h3>
                        <p className="text-sm text-slate-500">
                          VacPan, Spot Vacuum, and Wally Flex with quantity, locations, and field notes.
                        </p>
                      </div>
                      <Button
                        onClick={() =>
                          setFeatureDialogState({
                            propertyId: property.id,
                          })
                        }
                        size="sm"
                        variant="outline"
                      >
                        <Plus size={15} />
                        Add Feature
                      </Button>
                    </div>

                    <div className="mt-4 space-y-3">
                      {property.additionalFeatures.length === 0 ? (
                        <EmptyCard text="No additional features recorded yet." />
                      ) : (
                        property.additionalFeatures.map((feature) => (
                          <div
                            className="rounded-xl border border-teal-100 bg-slate-50 p-4"
                            key={feature.id}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold text-slate-900">{feature.type}</p>
                                <p className="mt-1 text-sm text-slate-600">
                                  Quantity: {feature.quantity}
                                </p>
                                <p className="mt-1 text-sm text-slate-600">
                                  {feature.locations.join(", ")}
                                </p>
                                {feature.notes ? (
                                  <p className="mt-2 text-sm leading-6 text-slate-600">
                                    {feature.notes}
                                  </p>
                                ) : null}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() =>
                                    setFeatureDialogState({
                                      featureId: feature.id,
                                      propertyId: property.id,
                                    })
                                  }
                                  size="sm"
                                  variant="outline"
                                >
                                  Edit
                                </Button>
                                <Button
                                  onClick={() =>
                                    deleteSharedCustomerFeature(customer.id, property.id, feature.id)
                                  }
                                  size="icon-sm"
                                  variant="outline"
                                >
                                  <Trash2 size={15} />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </AdminSurface>

                  <AdminSurface className="p-4">
                    <h3 className="text-lg font-semibold text-slate-950">Internal Property Notes</h3>
                    <div className="mt-4 space-y-3">
                      <PropertyNote title="Access">
                        {property.accessInformation ?? "No access information recorded."}
                      </PropertyNote>
                      <PropertyNote title="Internal Note">
                        {property.internalNotes ?? "No internal property note recorded."}
                      </PropertyNote>
                    </div>
                  </AdminSurface>
                </div>
              </AdminSurface>
            ))
          )}
        </div>
      ) : null}

      {activeTab === "history" ? (
        <div className="space-y-4">
          {serviceHistoryRows.length === 0 ? (
            <AdminSurface className="text-center text-sm text-slate-600">
              No service history exists for this customer yet.
            </AdminSurface>
          ) : (
            serviceHistoryRows.map((entry) => (
              <AdminSurface className="space-y-4" key={entry.request.id}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge
                        label={entry.request.status}
                        status={entry.request.status}
                      />
                      {entry.quotation ? (
                        <StatusBadge label={entry.quotation.status} status={entry.quotation.status} />
                      ) : null}
                      {entry.order ? (
                        <StatusBadge label={entry.order.status} status={entry.order.status} />
                      ) : null}
                    </div>
                    <h2 className="mt-3 text-2xl font-semibold text-slate-950">
                      {entry.request.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {entry.request.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/service-requests/${entry.request.id}`}>
                        View Request
                      </Link>
                    </Button>
                    {entry.quotation ? (
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/quotations/${entry.quotation.id}`}>View Quote</Link>
                      </Button>
                    ) : null}
                    {entry.order ? (
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/orders/${entry.order.id}`}>View Order</Link>
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <HistoryTile
                    icon={CalendarDays}
                    label="Requested Schedule"
                    value={entry.request.requestedSchedule?.label ?? `${entry.request.preferredDate} ${entry.request.preferredTime}`}
                  />
                  <HistoryTile
                    icon={Settings2}
                    label="Current Schedule"
                    value={entry.request.currentSchedule?.label ?? "Matches requested schedule"}
                  />
                  <HistoryTile
                    icon={ShieldCheck}
                    label="Technician"
                    value={entry.schedule?.technicianId ?? entry.request.assignedTechnicianId ?? "Unassigned"}
                  />
                  <HistoryTile
                    icon={MapPin}
                    label="Property"
                    value={entry.request.propertyLabel}
                  />
                </div>
              </AdminSurface>
            ))
          )}
        </div>
      ) : null}

      {activeTab === "orders" ? (
        <div className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            {orders.map((order) => (
              <AdminSurface className="space-y-4" key={order.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <TypeBadge type={order.type} />
                      <StatusBadge label={order.status} status={order.status} />
                    </div>
                    <h2 className="mt-3 text-xl font-semibold text-slate-950">{order.id}</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Created {formatLongDate(order.createdAt)}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/orders/${order.id}`}>View Order</Link>
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <OverviewTile
                    icon={CreditCard}
                    label="Total"
                    value={formatCurrencyUsd(order.total.totalUsd)}
                  />
                  <OverviewTile
                    icon={Wrench}
                    label="Linked Source"
                    value={order.type === "SERVICE" ? order.serviceName : `${order.items.length} items`}
                  />
                </div>
              </AdminSurface>
            ))}

            {orders.length === 0 ? (
              <AdminSurface className="text-center text-sm text-slate-600 xl:col-span-2">
                No orders are currently linked to this customer.
              </AdminSurface>
            ) : null}
          </div>
        </div>
      ) : null}

      {activeTab === "billing" ? (
        <div className="space-y-4">
          {billingRows.length === 0 ? (
            <AdminSurface className="text-center text-sm text-slate-600">
              No billing references are available yet.
            </AdminSurface>
          ) : (
            <AdminSurface className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead className="bg-[#f7fbfa] text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    <tr>
                      <th className="px-5 py-4">Reference</th>
                      <th className="px-5 py-4">Type</th>
                      <th className="px-5 py-4">Amount</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Date</th>
                      <th className="px-5 py-4">Order</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-teal-100">
                    {billingRows.map((row) => (
                      <tr key={row.id}>
                        <td className="px-5 py-5 font-semibold text-slate-900">{row.id}</td>
                        <td className="px-5 py-5 text-sm text-slate-600">{row.kind}</td>
                        <td className="px-5 py-5 font-semibold text-teal-950">
                          {formatCurrencyUsd(row.amount)}
                        </td>
                        <td className="px-5 py-5">
                          <StatusBadge label={row.status} status={row.status} />
                        </td>
                        <td className="px-5 py-5 text-sm text-slate-600">
                          {formatLongDate(row.date)}
                        </td>
                        <td className="px-5 py-5">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/admin/orders/${row.sourceId}`}>{row.sourceId}</Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AdminSurface>
          )}
        </div>
      ) : null}

      {activeTab === "notes" ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setInternalNoteOpen(true)}>
              <Plus size={16} />
              Add Internal Note
            </Button>
          </div>
          <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <AdminSurface>
              <h2 className="text-xl font-semibold text-slate-950">Business Notes</h2>
              <div className="mt-5 space-y-3">
                {(customer.internalNotes ?? []).length === 0 ? (
                  <EmptyCard text="No internal notes have been recorded." />
                ) : (
                  customer.internalNotes?.map((note) => (
                    <div className="rounded-xl border border-teal-100 bg-slate-50 p-4" key={note.id}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-slate-900">{note.title}</p>
                        <span className="text-xs text-slate-500">
                          {formatShortDateTime(note.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-teal-800">{note.createdBy}</p>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{note.body}</p>
                    </div>
                  ))
                )}
              </div>
            </AdminSurface>

            <AdminSurface>
              <h2 className="text-xl font-semibold text-slate-950">Operational Summary</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <OverviewTile
                  icon={Mail}
                  label="Preferred Contact"
                  value={customer.preferredContactMethod ?? "Not set"}
                />
                <OverviewTile
                  icon={Phone}
                  label="Best Contact Time"
                  value={customer.bestContactTime ?? "Not set"}
                />
                <OverviewTile
                  icon={MapPin}
                  label="Primary Address"
                  value={primaryAddress?.label ?? "Not set"}
                />
                <OverviewTile
                  icon={NotebookPen}
                  label="Preferences"
                  value={customer.customerPreferences ?? "None recorded"}
                />
              </div>
            </AdminSurface>
          </div>
        </div>
      ) : null}

      <PropertyDialog
        customerId={customer.id}
        onOpenChange={(open) => {
          setPropertyDialogOpen(open);
          if (!open) setEditingPropertyId(null);
        }}
        open={propertyDialogOpen}
        property={editingProperty}
      />

      {unitDialogState ? (
        <UnitDialog
          customerId={customer.id}
          onOpenChange={(open) => {
            if (!open) setUnitDialogState(null);
          }}
          open={Boolean(unitDialogState)}
          propertyId={unitDialogState.propertyId}
          unit={editingUnit}
        />
      ) : null}

      {floorDialogState ? (
        <InletFloorDialog
          customerId={customer.id}
          floor={editingFloor}
          onOpenChange={(open) => {
            if (!open) setFloorDialogState(null);
          }}
          open={Boolean(floorDialogState)}
          propertyId={floorDialogState.propertyId}
        />
      ) : null}

      {featureDialogState ? (
        <FeatureDialog
          customerId={customer.id}
          feature={editingFeature}
          onOpenChange={(open) => {
            if (!open) setFeatureDialogState(null);
          }}
          open={Boolean(featureDialogState)}
          propertyId={featureDialogState.propertyId}
        />
      ) : null}

      <InternalNoteDialog
        customerId={customer.id}
        onOpenChange={setInternalNoteOpen}
        open={internalNoteOpen}
      />
    </AdminPageShell>
  );
}

function OverviewTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-teal-800">
        <Icon size={17} />
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
          {label}
        </p>
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function PropertyStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function CountChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-white px-3 py-2">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function PropertyNote({ children, title }: { children: string; title: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
        {title}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{children}</p>
    </div>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-teal-200 bg-teal-50/40 px-4 py-6 text-center text-sm text-slate-600">
      {text}
    </div>
  );
}

function HistoryTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="flex items-center gap-2">
        <Icon className="text-teal-700" size={16} />
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
          {label}
        </p>
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
