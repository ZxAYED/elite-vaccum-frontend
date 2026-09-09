"use client";

import { useState, useMemo } from "react";
import {
  CalendarDays,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { DatePicker } from "@/components/ui/DatePicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { toast } from "sonner";
import { useRescheduleServiceRequestMutation } from "@/redux/api/serviceRequestsApi";
import { useGetAdminTechniciansListQuery } from "@/redux/api/technicianApi";
import { rescheduleSharedServiceRequest } from "@/data/mock/shared-business-store";
import type { ServiceRequest, ServiceScheduleWindow } from "@/types/domain";

const TIME_OPTIONS = [
  "08:00 AM",
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
  "06:00 PM",
];

const PRESET_SHIFTS = [
  { label: "Morning", startTime: "08:00 AM", endTime: "10:00 AM" },
  { label: "Midday", startTime: "11:00 AM", endTime: "01:00 PM" },
  { label: "Afternoon", startTime: "01:00 PM", endTime: "03:00 PM" },
  { label: "Late Day", startTime: "03:00 PM", endTime: "05:00 PM" },
];

interface RescheduleServiceRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceRequest: ServiceRequest | null;
  onSuccess?: () => void;
}

interface RescheduleFormProps {
  serviceRequest: ServiceRequest;
  onClose: () => void;
  onSuccess?: () => void;
}

function RescheduleServiceRequestForm({
  serviceRequest,
  onClose,
  onSuccess,
}: RescheduleFormProps) {
  const [rescheduleServiceRequest, { isLoading: isSubmitting }] =
    useRescheduleServiceRequestMutation();

  const { data: techsData } = useGetAdminTechniciansListQuery();

  const initialDate =
    serviceRequest.preferredDate ||
    serviceRequest.requestedSchedule?.date ||
    serviceRequest.currentSchedule?.date ||
    new Date().toISOString().split("T")[0];

  const currentWindow = serviceRequest.currentSchedule as
    | (ServiceScheduleWindow & { startTime?: string; endTime?: string })
    | undefined;

  const [date, setDate] = useState(initialDate);
  const [startTime, setStartTime] = useState(
    currentWindow?.startTime || "01:00 PM",
  );
  const [endTime, setEndTime] = useState(
    currentWindow?.endTime || "03:00 PM",
  );
  const [technicianId, setTechnicianId] = useState(
    serviceRequest.assignedTechnicianId || "",
  );
  const [adminNote, setAdminNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const technicians = useMemo(() => {
    return techsData?.items || [];
  }, [techsData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date) {
      setError("Please select a date for the appointment.");
      return;
    }
    if (!startTime) {
      setError("Please select a start time.");
      return;
    }

    setError(null);

    const payload = {
      date,
      startTime,
      endTime: endTime || undefined,
      technicianId: technicianId || undefined,
      adminNote: adminNote.trim() || undefined,
    };

    try {
      await rescheduleServiceRequest({
        id: serviceRequest.id,
        body: payload,
      }).unwrap();

      // Update local shared state cache for smooth sync
      rescheduleSharedServiceRequest(serviceRequest.id, payload);

      toast.success("Service request rescheduled successfully", {
        description: `New appointment scheduled for ${date} at ${startTime}${
          endTime ? ` - ${endTime}` : ""
        }.`,
      });

      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      // If server returned an error, check if it's network/demo and update locally
      const apiErr = err as { data?: { message?: string | string[] } };
      const serverMessage = Array.isArray(apiErr?.data?.message)
        ? apiErr.data.message.join(", ")
        : apiErr?.data?.message;

      // Update local shared store as optimistic fallback
      rescheduleSharedServiceRequest(serviceRequest.id, payload);

      if (serverMessage) {
        toast.error(`Reschedule error: ${serverMessage}`);
      } else {
        toast.success("Service request appointment updated locally.");
      }

      onSuccess?.();
      onClose();
    }
  };

  const currentScheduleDisplay =
    serviceRequest.currentSchedule?.label ||
    (serviceRequest.preferredDate
      ? `${serviceRequest.preferredDate} (${serviceRequest.preferredTime || "Standard Window"})`
      : "Not yet scheduled");

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      {/* Current schedule info box */}
      <div className="rounded-lg border border-teal-100 bg-teal-50/50 p-3 text-sm">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-teal-800">
          <span>Current Schedule</span>
          <span>{serviceRequest.title || "Elite Vacuum Service"}</span>
        </div>
        <p className="mt-1 font-medium text-slate-800">
          {currentScheduleDisplay}
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Quick shift presets */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Quick Time Windows
        </label>
        <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PRESET_SHIFTS.map((preset) => {
            const isActive =
              startTime === preset.startTime && endTime === preset.endTime;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setStartTime(preset.startTime);
                  setEndTime(preset.endTime);
                }}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                  isActive
                    ? "border-primary bg-primary text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50/40"
                }`}
              >
                <div>{preset.label}</div>
                <div className="text-[10px] opacity-80">
                  {preset.startTime.replace(":00", "")} - {preset.endTime.replace(":00", "")}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Date and Time Fields */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5 sm:col-span-1">
          <label className="text-sm font-medium text-slate-900">
            New Date *
          </label>
          <DatePicker
            value={date}
            onChange={(newDate) => setDate(newDate)}
            placeholder="Select date"
            className="w-full bg-white"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-900">
            Start Time *
          </label>
          <Select value={startTime} onValueChange={setStartTime}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Start Time" />
            </SelectTrigger>
            <SelectContent>
              {TIME_OPTIONS.map((time) => (
                <SelectItem key={time} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-900">
            End Time
          </label>
          <Select value={endTime} onValueChange={setEndTime}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="End Time" />
            </SelectTrigger>
            <SelectContent>
              {TIME_OPTIONS.map((time) => (
                <SelectItem key={time} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Technician Assignment */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-900 flex items-center justify-between">
          <span>Assigned Technician</span>
          <span className="text-xs text-slate-400 font-normal">Optional</span>
        </label>
        <Select
          value={technicianId}
          onValueChange={(val) => setTechnicianId(val === "unassigned" ? "" : val)}
        >
          <SelectTrigger className="bg-white">
            <SelectValue placeholder="Select a field technician..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned">Leave Unassigned</SelectItem>
            {technicians.map((tech) => (
              <SelectItem key={tech.id} value={tech.id}>
                {tech.displayName} ({tech.phone || tech.email || "Technician"})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Admin Note */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-900">
          Admin Note / Reason
        </label>
        <Textarea
          value={adminNote}
          onChange={(e) => setAdminNote(e.target.value)}
          placeholder="e.g. Rescheduled per customer phone request."
          rows={3}
          className="resize-none bg-white"
        />
      </div>

      <DialogFooter className="pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="min-w-32">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Rescheduling...
            </>
          ) : (
            "Save Reschedule"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function RescheduleServiceRequestModal({
  open,
  onOpenChange,
  serviceRequest,
  onSuccess,
}: RescheduleServiceRequestModalProps) {
  if (!serviceRequest) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <CalendarDays className="size-5 text-primary" />
            Reschedule Service Request
          </DialogTitle>
          <DialogDescription>
            Update the service date, appointment time window, or assigned technician
            for request #{serviceRequest.id}.
          </DialogDescription>
        </DialogHeader>

        {open && (
          <RescheduleServiceRequestForm
            key={`${serviceRequest.id}-${serviceRequest.currentSchedule?.date || serviceRequest.preferredDate || ""}`}
            serviceRequest={serviceRequest}
            onClose={() => onOpenChange(false)}
            onSuccess={onSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
