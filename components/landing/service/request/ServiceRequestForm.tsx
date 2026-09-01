"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CheckCircle2, Info, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/Button";
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

import { FormField } from "./FormField";
import { FormSection } from "./FormSection";
import { MediaUploader } from "./MediaUploader";
import { RequestSummary } from "./RequestSummary";
import {
  serviceRequestSchema,
  mediaConstraints,
  type ServiceRequestFormValues,
} from "./service-request-schema";

import { useGetAvailableSlotsQuery } from "@/redux/api/servicesApi";
import { useSubmitServiceRequestMutation } from "@/redux/api/serviceRequestsApi";
import { toast } from "sonner";

interface ServiceRequestFormProps {
  service: ServiceOffering;
  defaultValues: Pick<
    ServiceRequestFormValues,
    "fullName" | "email" | "phone" | "address" | "city" | "state" | "zipCode"
  >;
}

const timeWindows = [
  "Morning - 8:00 AM to 11:00 AM",
  "Midday - 11:00 AM to 2:00 PM",
  "Afternoon - 2:00 PM to 5:00 PM",
  "Evening - 5:00 PM to 7:00 PM",
];

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
    formState: { errors, isSubmitting, isSubmitSuccessful },
    handleSubmit,
    register,
  } = form;
  const [submittedRequestId, setSubmittedRequestId] = useState<string | null>(null);

  const watchedValues = useWatch({ control });
  const media = watchedValues.media ?? [];
  const showOtherLocation = watchedValues.problemLocation === "Other";

  const [submitServiceRequestMutation] = useSubmitServiceRequestMutation();

  const requestedDate = watchedValues.requestedDate;
  const { data: slotsResponse, isLoading: isLoadingSlots } =
    useGetAvailableSlotsQuery(requestedDate ?? "", {
      skip: !requestedDate,
    });
  const availableSlots = slotsResponse?.slots;

  async function onSubmit(values: ServiceRequestFormValues) {
    const localRequest = createSharedServiceRequest({
      serviceSlug: service.slug,
      customerId: mockCurrentUser.customerId ?? "cust-1001",
      fullName: values.fullName,
      email: values.email,
      phone: values.phone,
      address: values.address,
      city: values.city,
      state: values.state,
      zipCode: values.zipCode,
      requestedDate: values.requestedDate,
      requestedTime: values.requestedTime,
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
    setSubmittedRequestId(localRequest.id);

    try {
      const formData = new FormData();
      const payloadDto = {
        serviceSlug: service.slug,
        fullName: values.fullName,
        phone: values.phone,
        email: values.email,
        address: values.address,
        city: values.city,
        state: values.state,
        zipCode: values.zipCode,
        problemLocation: values.problemLocation,
        otherProblemLocation: values.otherProblemLocation,
        preferredDate: values.requestedDate,
        timeWindow: values.requestedTime,
        problemDescription: values.problemDescription,
        symptoms: values.symptoms,
        manufacturer: values.manufacturer,
        modelNumber: values.modelNumber,
        serialNumber: values.serialNumber,
        unitLocation: values.unitLocation,
        additionalNotes: values.additionalNotes,
      };
      formData.append("data", JSON.stringify(payloadDto));

      if (values.media && values.media.length > 0) {
        values.media.forEach((item) => {
          if (item.file) {
            formData.append("attachments", item.file);
          }
        });
      }

      const res = await submitServiceRequestMutation(formData).unwrap();
      if (res?.id) {
        setSubmittedRequestId(res.id);
      }
      toast.success("Service request submitted successfully!", {
        description: `Request ID: ${res?.id || localRequest.id}`,
      });
    } catch {
      // Fallback handled by local shared store
    }
  }

  if (isSubmitSuccessful) {
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
    <main className="bg-[linear-gradient(180deg,#effcfa_0%,#ffffff_34%)] py-12 md:py-18">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mx-auto grid max-w-360 gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:px-8"
      >
        <div className="min-w-0">
          <div>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-teal-700"
            >
              <ArrowLeft size={16} />
              Change Service
            </Link>
            <div className="mt-8 rounded-[1.35rem] bg-white p-6 shadow-[0_28px_90px_-62px_rgba(28,79,80,0.7)] ring-1 ring-teal-100 md:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-teal-700">
                Request a Service
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-primary md:text-5xl">
                {service.title}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
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
                  <FormField label="Email Address" error={errors.email?.message}>
                    <Input
                      autoComplete="email"
                      className={inputClassName}
                      type="email"
                      {...register("email")}
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
                    <Input
                      type="date"
                      className={inputClassName}
                      min={mediaConstraints.minimumRequestedDate}
                      {...register("requestedDate")}
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
                          disabled={!requestedDate || isLoadingSlots}
                        >
                          <SelectTrigger className="bg-slate-50 shadow-none">
                            <SelectValue
                              placeholder={
                                !requestedDate
                                  ? "Select a service date first..."
                                  : isLoadingSlots
                                    ? "Checking available slots..."
                                    : "Select a time window..."
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {availableSlots && availableSlots.length > 0 ? (
                              availableSlots.map((slot) => {
                                const isBooked =
                                  slot.isBooked || slot.status === "BOOKED";
                                return (
                                  <SelectItem
                                    key={
                                      slot.timeWindow ||
                                      `${slot.startTime}-${slot.endTime}`
                                    }
                                    value={slot.timeWindow}
                                    disabled={isBooked}
                                  >
                                    {slot.timeWindow}{" "}
                                    {isBooked ? "(Booked)" : ""}
                                  </SelectItem>
                                );
                              })
                            ) : (
                              timeWindows.map((windowLabel) => (
                                <SelectItem
                                  key={windowLabel}
                                  value={windowLabel}
                                >
                                  {windowLabel}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
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
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {symptoms.map((symptom) => (
                    <label
                      key={symptom}
                      className="flex items-center gap-3 rounded-[1rem] bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
                    >
                      <input
                        type="checkbox"
                        value={symptom}
                        className="size-4 rounded border-teal-200 accent-primary"
                        {...register("symptoms")}
                      />
                      {symptom}
                    </label>
                  ))}
                </div>
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

        <div className="lg:pt-36">
          <RequestSummary
            serviceTitle={service.title}
            requestedDate={watchedValues.requestedDate}
            requestedTime={watchedValues.requestedTime}
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
