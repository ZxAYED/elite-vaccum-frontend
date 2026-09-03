"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Check, CheckCircle2, Info, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch, type FieldErrors } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { DatePicker } from "@/components/ui/DatePicker";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import type { ServiceOffering, ServiceRequestAttachment } from "@/types/domain";
import { mockCurrentUser } from "@/data/mock/user";
import { createSharedServiceRequest } from "@/data/mock/shared-business-store";
import { cn } from "@/lib/utils";

import { FormField } from "./FormField";
import { FormSection } from "./FormSection";
import { MediaUploader } from "./MediaUploader";
import { RequestSummary } from "./RequestSummary";
import {
  serviceRequestSchema,
  mediaConstraints,
  type ServiceRequestFormValues,
  type ServiceRequestUrgency,
} from "./service-request-schema";

import {
  useGetAvailableSlotsQuery,
  type ScheduleSlot,
} from "@/redux/api/servicesApi";
import { useSubmitServiceRequestMutation } from "@/redux/api/serviceRequestsApi";
import { toast } from "sonner";

interface ServiceRequestFormProps {
  service: ServiceOffering;
  defaultValues: Pick<
    ServiceRequestFormValues,
    "fullName" | "phone" | "address" | "city" | "state" | "zipCode"
  >;
}

const timeWindows = [
  "Morning - 8:00 AM to 11:00 AM",
  "Midday - 11:00 AM to 2:00 PM",
  "Afternoon - 2:00 PM to 5:00 PM",
  "Evening - 5:00 PM to 7:00 PM",
];

function isWindowBooked(
  windowLabel: string,
  slots?: ScheduleSlot[],
): boolean {
  if (!slots || !Array.isArray(slots) || slots.length === 0) return false;

  const normalizedWindow = windowLabel.toLowerCase();

  return slots.some((slot) => {
    const isBookedStatus =
      slot.isBooked === true ||
      (typeof slot.status === "string" &&
        slot.status.trim().toUpperCase() === "BOOKED");

    if (!isBookedStatus) return false;

    const timeWindowStr = (slot.timeWindow || "").toLowerCase();
    const startStr = (slot.startTime || "").toLowerCase();
    const endStr = (slot.endTime || "").toLowerCase();
    const slotCombined = `${timeWindowStr} ${startStr} ${endStr}`.trim();

    if (!slotCombined) return false;

    if (
      timeWindowStr &&
      (timeWindowStr === normalizedWindow ||
        normalizedWindow.includes(timeWindowStr) ||
        timeWindowStr.includes(normalizedWindow))
    ) {
      return true;
    }

    if (
      normalizedWindow.includes("morning") &&
      (slotCombined.includes("morning") ||
        slotCombined.includes("8:00") ||
        slotCombined.includes("08:00") ||
        slotCombined.includes("9:00") ||
        slotCombined.includes("09:00") ||
        slotCombined.includes("10:00"))
    ) {
      return true;
    }
    if (
      normalizedWindow.includes("midday") &&
      (slotCombined.includes("midday") ||
        slotCombined.includes("11:00") ||
        slotCombined.includes("12:00") ||
        slotCombined.includes("1:00") ||
        slotCombined.includes("13:00"))
    ) {
      return true;
    }
    if (
      normalizedWindow.includes("afternoon") &&
      (slotCombined.includes("afternoon") ||
        slotCombined.includes("2:00") ||
        slotCombined.includes("14:00") ||
        slotCombined.includes("3:00") ||
        slotCombined.includes("15:00") ||
        slotCombined.includes("4:00") ||
        slotCombined.includes("16:00"))
    ) {
      return true;
    }
    if (
      normalizedWindow.includes("evening") &&
      (slotCombined.includes("evening") ||
        slotCombined.includes("5:00") ||
        slotCombined.includes("17:00") ||
        slotCombined.includes("6:00") ||
        slotCombined.includes("18:00") ||
        slotCombined.includes("7:00") ||
        slotCombined.includes("19:00"))
    ) {
      return true;
    }

    return false;
  });
}

const problemLocations = [
  "Basement",
  "Garage",
  "Utility Room",
  "First Floor",
  "Second Floor",
  "Kitchen",
  "Hallway",
  "Other",
];

const symptoms = [
  "Unit not turning on",
  "Unit does not shut off",
  "Clogged",
  "Low suction",
  "Retractable hose problem",
  "Broken inlet",
  "Noise",
  "Other",
];

const symptomKeyMap: Record<string, string> = {
  "Unit not turning on": "UNIT_NOT_TURNING_ON",
  "Unit does not shut off": "UNIT_DOES_NOT_SHUT_OFF",
  "Clogged": "CLOGGED",
  "Low suction": "LOW_SUCTION",
  "Retractable hose problem": "WALL_OR_POWER_HOSE_PROBLEM",
  "Broken inlet": "BROKEN_INLET",
  "Noise": "NOISE",
  "Other": "OTHER",
};

const urgencyOptions: Array<{
  value: ServiceRequestUrgency;
  label: string;
  badge: string;
  description: string;
  selectedClasses: string;
  dotClasses: string;
}> = [
  {
    value: "LOW",
    label: "Low",
    badge: "Flexible",
    description: "Routine checkup or flexible timeline",
    selectedClasses:
      "border-slate-400 bg-slate-100/90 text-slate-900 shadow-xs ring-1 ring-slate-400/30",
    dotClasses: "bg-slate-400",
  },
  {
    value: "MEDIUM",
    label: "Medium",
    badge: "Default",
    description: "Standard repair within normal scheduling",
    selectedClasses:
      "border-primary bg-teal-50/80 text-primary shadow-xs ring-1 ring-primary/30",
    dotClasses: "bg-teal-600",
  },
  {
    value: "HIGH",
    label: "High",
    badge: "Priority",
    description: "Impacting daily use, prompt visit needed",
    selectedClasses:
      "border-amber-500 bg-amber-50/80 text-amber-950 shadow-xs ring-1 ring-amber-500/30",
    dotClasses: "bg-amber-500",
  },
  {
    value: "EMERGENCY",
    label: "Emergency",
    badge: "Immediate",
    description: "System breakdown or urgent stoppage",
    selectedClasses:
      "border-rose-500 bg-rose-50/80 text-rose-950 shadow-xs ring-1 ring-rose-500/30",
    dotClasses: "bg-rose-500 animate-pulse",
  },
];

const fieldGridClassName = "grid gap-5 md:grid-cols-2";
const inputClassName = "bg-slate-50 shadow-none focus-visible:bg-white";

function toServiceRequestAttachments(
  media: ServiceRequestFormValues["media"],
): ServiceRequestAttachment[] {
  const uploadedAt = new Date().toISOString();

  return media.map((file) => ({
    id: file.id,
    fileName: file.name,
    fileType: file.type,
    sizeBytes: file.size,
    uploadedAt,
    kind: file.type.startsWith("video/") ? "video" : "photo",
  }));
}

export function ServiceRequestForm({
  service,
  defaultValues,
}: ServiceRequestFormProps) {
  const form = useForm<ServiceRequestFormValues>({
    resolver: zodResolver(serviceRequestSchema),
    defaultValues: {
      serviceSlug: service.slug,
      serviceTitle: service.title,
      ...defaultValues,
      problemLocation: "",
      otherProblemLocation: "",
      requestedDate: "",
      requestedTime: "",
      urgency: "MEDIUM",
      problemDescription: "",
      symptoms: [],
      manufacturer: "",
      modelNumber: "",
      serialNumber: "",
      unitLocation: "",
      additionalNotes: "",
      media: [],
    },
  });

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = form;
  const [submittedRequestId, setSubmittedRequestId] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const watchedValues = useWatch({ control });
  const media = watchedValues.media ?? [];
  const showOtherLocation = watchedValues.problemLocation === "Other";

  const [submitServiceRequestMutation] = useSubmitServiceRequestMutation();

  const requestedDate = watchedValues.requestedDate;
  const requestedTime = watchedValues.requestedTime;
  const { data: slotsResponse, isLoading: isLoadingSlots } =
    useGetAvailableSlotsQuery(requestedDate ?? "", {
      skip: !requestedDate,
    });
  const availableSlots = useMemo(() => {
    if (!slotsResponse) return undefined;
    if (Array.isArray(slotsResponse)) return slotsResponse;
    if (Array.isArray(slotsResponse.slots)) return slotsResponse.slots;
    const anyResp = slotsResponse as unknown as { data?: { slots?: ScheduleSlot[] } | ScheduleSlot[] };
    if (anyResp.data) {
      if (Array.isArray(anyResp.data)) return anyResp.data;
      if (Array.isArray(anyResp.data.slots)) return anyResp.data.slots;
    }
    return undefined;
  }, [slotsResponse]);

  const setValue = form.setValue;
  useEffect(() => {
    if (
      requestedTime &&
      availableSlots &&
      isWindowBooked(requestedTime, availableSlots)
    ) {
      setValue("requestedTime", "");
      toast.error(
        "The selected time window is booked on this date. Please choose another time.",
      );
    }
  }, [availableSlots, requestedTime, setValue]);

  async function onSubmit(values: ServiceRequestFormValues) {
    const payloadDto = {
      serviceSlug: service.slug,
      fullName: values.fullName,
      phone: values.phone,
      address: values.address,
      city: values.city,
      state: values.state,
      zipCode: values.zipCode,
      problemLocation:
        values.problemLocation === "Other"
          ? values.otherProblemLocation || "Other"
          : values.problemLocation,
      otherProblemLocation: values.otherProblemLocation || undefined,
      preferredDate: values.requestedDate,
      timeWindow: values.requestedTime,
      urgency: values.urgency || "MEDIUM",
      problemDescription: values.problemDescription,
      symptoms: (values.symptoms || []).map(
        (s) => symptomKeyMap[s] || s.toUpperCase().replace(/\s+/g, "_"),
      ),
      manufacturer: values.manufacturer || undefined,
      modelNumber: values.modelNumber || undefined,
      serialNumber: values.serialNumber || undefined,
      unitLocation: values.unitLocation || undefined,
      additionalNotes: values.additionalNotes || undefined,
    };

    try {
      const formData = new FormData();
      formData.append("data", JSON.stringify(payloadDto));

      if (values.media && values.media.length > 0) {
        values.media.forEach((item) => {
          if (item.file) {
            formData.append("attachments", item.file);
          }
        });
      }

      const res = await submitServiceRequestMutation(formData).unwrap();
      const finalId = res?.id || "REQ-SUBMITTED";
      setSubmittedRequestId(finalId);
      setIsSubmitted(true);

      createSharedServiceRequest({
        serviceSlug: service.slug,
        customerId: mockCurrentUser.customerId ?? "cust-1001",
        fullName: values.fullName,
        email: mockCurrentUser.email ?? "customer@example.com",
        phone: values.phone,
        address: values.address,
        city: values.city,
        state: values.state,
        zipCode: values.zipCode,
        requestedDate: values.requestedDate,
        requestedTime: values.requestedTime,
        urgency: values.urgency || "MEDIUM",
        problemDescription: values.problemDescription,
        problemLocation: values.problemLocation,
        otherProblemLocation: values.otherProblemLocation,
        manufacturer: values.manufacturer,
        modelNumber: values.modelNumber,
        serialNumber: values.serialNumber,
        unitLocation: values.unitLocation,
        additionalNotes: values.additionalNotes,
        media: toServiceRequestAttachments(values.media),
      });

      toast.success("Service request submitted successfully!", {
        description: `Request ID: ${finalId}`,
      });
    } catch (err: unknown) {
      console.error("Failed to submit service request:", err);
      const apiErr = err as {
        status?: number;
        data?: {
          message?: string | string[];
          error?: string;
          statusCode?: number;
        };
        message?: string;
        error?: string;
      };
      const message =
        (Array.isArray(apiErr?.data?.message)
          ? apiErr.data.message.join(", ")
          : apiErr?.data?.message) ||
        apiErr?.message ||
        apiErr?.error ||
        "Could not submit service request. Please check your connection or verify your information.";
      toast.error(message, {
        description:
          apiErr?.data?.error || `Status: ${apiErr?.status || "Error"}`,
      });
    }
  }

  const onInvalid = (fieldErrors: FieldErrors<ServiceRequestFormValues>) => {
    const errorKeys = Object.keys(fieldErrors) as Array<keyof ServiceRequestFormValues>;
    if (errorKeys.length === 0) return;

    const firstError = Object.values(fieldErrors)[0];
    const firstMessage =
      typeof firstError?.message === "string" ? firstError.message : undefined;

    const friendlyFieldNames: Record<string, string> = {
      requestedDate: "Service Date",
      requestedTime: "Time Window",
      urgency: "Service Urgency",
      fullName: "Full Name",
      phone: "Phone Number",
      address: "Address",
      city: "City",
      state: "State",
      zipCode: "ZIP Code",
      problemLocation: "Problem Location",
      otherProblemLocation: "Other Location Details",
      problemDescription: "Problem Description",
      media: "Media Uploads",
    };

    const missingLabels = errorKeys
      .map((k) => friendlyFieldNames[k] || k)
      .slice(0, 3)
      .join(", ");

    const errorCount = errorKeys.length;
    const description =
      errorCount > 3
        ? `Please check ${missingLabels} and ${errorCount - 3} other field${errorCount - 3 > 1 ? "s" : ""}.`
        : `Please complete: ${missingLabels}.`;

    toast.error(firstMessage || "Please complete all required fields", {
      description,
      duration: 5000,
    });

    // Auto-scroll smoothly to the first field that requires attention
    setTimeout(() => {
      const firstErrorElement = document.querySelector(
        '[aria-invalid="true"], input[aria-invalid="true"], select[aria-invalid="true"], .text-red-500, .text-red-600, .border-rose-400'
      );
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  if (isSubmitted) {
    return (
      <main className="bg-[linear-gradient(180deg,#effcfa_0%,#ffffff_38%)] py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[var(--brand-soft)] text-primary">
            <CheckCircle2 size={32} />
          </div>
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.24em] text-teal-700">
            Service Request Submitted
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-primary md:text-5xl">
            {submittedRequestId ?? "Service Request Submitted"}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-600">
            Our team will review your request, confirm the schedule, and prepare
            a quotation in the customer dashboard when ready.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="pill">
              <Link href="/user/services">View My Service Requests</Link>
            </Button>
            <Button asChild variant="outline" size="pill">
              <Link href="/services">Start another request</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full min-w-0 bg-[linear-gradient(180deg,#effcfa_0%,#ffffff_34%)] py-8 sm:py-12 md:py-16">
      <form
        onSubmit={handleSubmit(onSubmit, onInvalid)}
        className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem] 2xl:grid-cols-[minmax(0,1fr)_24rem] lg:px-8"
      >
        <div className="w-full min-w-0">
          <div>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-teal-700"
            >
              <ArrowLeft size={16} />
              Change Service
            </Link>
            <div className="mt-6 rounded-[1.35rem] border border-teal-100/80 bg-white p-5 sm:mt-8 sm:p-6 md:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-teal-700">
                Request a Service
              </p>
              <h1 className="mt-3 break-words text-2xl font-semibold tracking-[-0.04em] text-primary sm:text-3xl md:text-4xl lg:text-5xl">
                {service.title}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base sm:leading-7">
                Tell us about your system and what you need help with. The
                selected service is locked for this request.
              </p>
              <div className="mt-5 flex items-start gap-3 rounded-[1rem] bg-[var(--brand-soft)] p-4 text-sm text-primary">
                <Info className="mt-0.5 shrink-0" size={18} />
                <p>
                  The customer chooses the requested visit window here. Admin may
                  later reschedule if technician availability changes.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 space-y-10">
            <div>
              <FormSection
                title="Customer Information"
                description="Basic contact details so our team can confirm the request."
                className="border-t-0"
              >
                <div className={fieldGridClassName}>
                  <FormField label="Full Name" error={errors.fullName?.message}>
                    <Input
                      autoComplete="name"
                      className={inputClassName}
                      {...register("fullName")}
                    />
                  </FormField>
                  <FormField label="Phone Number" error={errors.phone?.message}>
                    <Input
                      autoComplete="tel"
                      className={inputClassName}
                      type="tel"
                      {...register("phone")}
                    />
                  </FormField>
                </div>
              </FormSection>
            </div>

            <div>
              <FormSection
                title="Service Location"
                description="Where should our technician visit?"
              >
                <div className={fieldGridClassName}>
                  <FormField
                    label="Address"
                    error={errors.address?.message}
                    className="md:col-span-2"
                  >
                    <Input
                      autoComplete="street-address"
                      className={inputClassName}
                      {...register("address")}
                    />
                  </FormField>
                  <FormField label="City" error={errors.city?.message}>
                    <Input
                      autoComplete="address-level2"
                      className={inputClassName}
                      {...register("city")}
                    />
                  </FormField>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <FormField label="State" error={errors.state?.message}>
                      <Input
                        autoComplete="address-level1"
                        className={inputClassName}
                        {...register("state")}
                      />
                    </FormField>
                    <FormField label="ZIP Code" error={errors.zipCode?.message}>
                      <Input
                        autoComplete="postal-code"
                        className={inputClassName}
                        {...register("zipCode")}
                      />
                    </FormField>
                  </div>
                  <FormField
                    label="Problem / Unit Location"
                    error={errors.problemLocation?.message}
                  >
                    <Controller
                      control={control}
                      name="problemLocation"
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="bg-slate-50 shadow-none">
                            <SelectValue placeholder="Select a location..." />
                          </SelectTrigger>
                          <SelectContent>
                            {problemLocations.map((location) => (
                              <SelectItem key={location} value={location}>
                                {location}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </FormField>
                  {showOtherLocation ? (
                    <FormField
                      label="Describe Location"
                      error={errors.otherProblemLocation?.message}
                    >
                      <Input
                        className={inputClassName}
                        placeholder="Example: closet behind garage"
                        {...register("otherProblemLocation")}
                      />
                    </FormField>
                  ) : null}
                </div>
              </FormSection>
            </div>

            <div>
              <FormSection
                title="Requested Schedule"
                description="Choose the date and time that works best for you."
              >
                <div className={fieldGridClassName}>
                  <FormField
                    label="Service Date"
                    error={errors.requestedDate?.message}
                  >
                    <Controller
                      control={control}
                      name="requestedDate"
                      render={({ field }) => (
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                          minDate={mediaConstraints.minimumRequestedDate}
                          error={Boolean(errors.requestedDate)}
                        />
                      )}
                    />
                  </FormField>
                  <FormField
                    label="Requested Time"
                    error={errors.requestedTime?.message}
                  >
                    <Controller
                      control={control}
                      name="requestedTime"
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={!requestedDate}
                        >
                          <SelectTrigger className="bg-slate-50 shadow-none">
                            <SelectValue
                              placeholder={
                                !requestedDate
                                  ? "Select a service date first..."
                                  : isLoadingSlots
                                    ? "Checking availability..."
                                    : "Select a time window..."
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {timeWindows.map((windowLabel) => {
                              const isBooked = isWindowBooked(
                                windowLabel,
                                availableSlots,
                              );
                              return (
                                <SelectItem
                                  key={windowLabel}
                                  value={windowLabel}
                                  disabled={isBooked}
                                >
                                  <div className="flex w-full items-center justify-between gap-4">
                                    <span
                                      className={cn(
                                        isBooked &&
                                          "text-slate-400 line-through",
                                      )}
                                    >
                                      {windowLabel}
                                    </span>
                                    {isBooked && (
                                      <span className="rounded bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-600">
                                        Booked
                                      </span>
                                    )}
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </FormField>
                </div>

                <div className="mt-6 border-t border-teal-100/70 pt-6">
                  <FormField
                    label="Service Urgency Level"
                    helper="Default: Medium"
                    error={errors.urgency?.message}
                  >
                    <Controller
                      control={control}
                      name="urgency"
                      render={({ field }) => (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          {urgencyOptions.map((opt) => {
                            const isSelected =
                              (field.value || "MEDIUM") === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => field.onChange(opt.value)}
                                className={cn(
                                  "flex flex-col items-start rounded-2xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                                  isSelected
                                    ? opt.selectedClasses
                                    : "border-slate-200/80 bg-slate-50 text-slate-700 hover:border-teal-200 hover:bg-slate-100/70",
                                )}
                              >
                                <div className="flex w-full items-center justify-between gap-2">
                                  <span className="text-sm font-bold text-slate-900">
                                    {opt.label}
                                  </span>
                                  <span
                                    className={cn(
                                      "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                                      isSelected
                                        ? "bg-white/80 font-bold"
                                        : "bg-slate-200/70 text-slate-600",
                                    )}
                                  >
                                    <span
                                      className={cn(
                                        "size-1.5 rounded-full",
                                        opt.dotClasses,
                                      )}
                                    />
                                    {opt.badge}
                                  </span>
                                </div>
                                <span className="mt-1.5 text-xs leading-relaxed text-slate-500">
                                  {opt.description}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    />
                  </FormField>
                </div>
              </FormSection>
            </div>

            <div>
              <FormSection
                title="Tell Us What's Happening"
                description="Describe the issue clearly so our team can prepare."
              >
                <FormField
                  label="Problem Description"
                  error={errors.problemDescription?.message}
                >
                  <Textarea
                    placeholder="Describe symptoms, when they started, and what areas are affected..."
                    {...register("problemDescription")}
                  />
                </FormField>
                <Controller
                  control={control}
                  name="symptoms"
                  render={({ field }) => {
                    const selectedSymptoms = field.value || [];
                    const toggleSymptom = (symptom: string) => {
                      if (selectedSymptoms.includes(symptom)) {
                        field.onChange(
                          selectedSymptoms.filter((s: string) => s !== symptom),
                        );
                      } else {
                        field.onChange([...selectedSymptoms, symptom]);
                      }
                    };

                    return (
                      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {symptoms.map((symptom) => {
                          const isSelected = selectedSymptoms.includes(symptom);
                          return (
                            <button
                              type="button"
                              key={symptom}
                              onClick={() => toggleSymptom(symptom)}
                              className={cn(
                                "flex items-center gap-3.5 rounded-2xl border p-3.5 text-left text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                                isSelected
                                  ? "border-primary bg-teal-50/70 text-slate-950 shadow-xs ring-1 ring-primary/20"
                                  : "border-slate-200/80 bg-slate-50 text-slate-700 hover:border-teal-200 hover:bg-slate-100/70",
                              )}
                            >
                              <span
                                className={cn(
                                  "flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                                  isSelected
                                    ? "border-primary bg-primary text-white shadow-xs"
                                    : "border-slate-300 bg-white",
                                )}
                              >
                                {isSelected && (
                                  <Check size={14} strokeWidth={3} />
                                )}
                              </span>
                              <span className="select-none leading-snug">
                                {symptom}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    );
                  }}
                />
              </FormSection>
            </div>

            <div>
              <FormSection
                title="Equipment Information"
                description="These details help our technician prepare the right tools and parts."
              >
                <div className={fieldGridClassName}>
                  <FormField label="Manufacturer" helper="Optional">
                    <Input className={inputClassName} {...register("manufacturer")} />
                  </FormField>
                  <FormField label="Model Number" helper="Optional">
                    <Input className={inputClassName} {...register("modelNumber")} />
                  </FormField>
                  <FormField label="Serial Number" helper="Optional">
                    <Input className={inputClassName} {...register("serialNumber")} />
                  </FormField>
                  <FormField label="Unit Location" helper="Optional">
                    <Input
                      className={inputClassName}
                      placeholder="Basement, garage, utility room..."
                      {...register("unitLocation")}
                    />
                  </FormField>
                </div>
                <p className="mt-4 rounded-[1rem] bg-teal-50 px-4 py-3 text-sm text-primary">
                  Cannot find the model or serial number? Upload a clear photo of
                  the equipment label below.
                </p>
              </FormSection>
            </div>

            <div>
              <FormSection
                title="Photos & Videos"
                description="Show us the machine, affected area, damaged part, or a video of the issue."
              >
                <Controller
                  control={control}
                  name="media"
                  render={({ field }) => (
                    <MediaUploader value={field.value} onChange={field.onChange} />
                  )}
                />
                {errors.media?.message ? (
                  <p className="mt-3 text-sm font-semibold text-red-600">
                    {errors.media.message}
                  </p>
                ) : null}
              </FormSection>
            </div>

            <div>
              <FormSection
                title="Additional Notes"
                description="Access instructions, system history, or anything else our team should know."
              >
                <Textarea
                  placeholder="Gate codes, parking notes, prior repair history..."
                  {...register("additionalNotes")}
                />
              </FormSection>
            </div>
          </div>
        </div>

        <div className="w-full min-w-0 lg:pt-14">
          <RequestSummary
            serviceTitle={service.title}
            requestedDate={watchedValues.requestedDate}
            requestedTime={watchedValues.requestedTime}
            urgency={watchedValues.urgency}
            address={watchedValues.address}
            city={watchedValues.city}
            state={watchedValues.state}
            zipCode={watchedValues.zipCode}
            mediaCount={media.length}
            isSubmitting={isSubmitting}
          />
          <div className="mt-5 rounded-[1rem] bg-white p-5 text-sm leading-6 text-slate-500 ring-1 ring-teal-100">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 shrink-0 text-primary" size={18} />
              <p>
                Submitted requests appear in the customer dashboard after this
                mock confirmation. Quotation approval happens later after admin
                review.
              </p>
            </div>
          </div>
        </div>

        <input type="hidden" {...register("serviceSlug")} />
        <input type="hidden" {...register("serviceTitle")} />
      </form>
    </main>
  );
}
