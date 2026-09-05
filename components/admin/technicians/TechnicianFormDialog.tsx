"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

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
import { technicianSchema, type TechnicianValues } from "@/lib/validation";
import type { AdminTechnician } from "@/types/domain";

interface TechnicianFormDialogProps {
  open: boolean;
  technician?: AdminTechnician | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TechnicianValues) => void;
}

function defaultValuesFromTechnician(
  technician?: AdminTechnician | null,
): TechnicianValues {
  return {
    fullName: technician?.displayName ?? "",
    email: technician?.email ?? "",
    phone: technician?.phone ?? "",
    status: technician?.status ?? "ACTIVE",
    availability: technician?.availability ?? "AVAILABLE",
    notes: technician?.notes ?? "",
    password: "",
  };
}

export function TechnicianFormDialog({
  open,
  technician,
  onOpenChange,
  onSubmit,
}: TechnicianFormDialogProps) {
  const form = useForm<TechnicianValues>({
    resolver: zodResolver(technicianSchema),
    values: defaultValuesFromTechnician(technician),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {technician ? "Edit Technician" : "Add Technician"}
          </DialogTitle>
          <DialogDescription>
            Manage operational technician details only. HR and payroll fields stay out
            of this workflow.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-5"
          onSubmit={form.handleSubmit((values) => {
            onSubmit(values);
            form.reset(defaultValuesFromTechnician(technician));
          })}
        >
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-slate-950">
                Personal Information
              </p>
              <p className="text-sm text-slate-500">
                Core contact details used across scheduling and orders.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900">Full Name *</label>
                <Input {...form.register("fullName")} />
                {form.formState.errors.fullName ? (
                  <p className="text-sm text-rose-700">
                    {form.formState.errors.fullName.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900">Email *</label>
                <Input {...form.register("email")} />
                {form.formState.errors.email ? (
                  <p className="text-sm text-rose-700">
                    {form.formState.errors.email.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900">Phone *</label>
                <Input {...form.register("phone")} />
                {form.formState.errors.phone ? (
                  <p className="text-sm text-rose-700">
                    {form.formState.errors.phone.message}
                  </p>
                ) : null}
              </div>
              {!technician ? (
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-900">Password *</label>
                  <Input
                    type="password"
                    {...form.register("password", {
                      validate: (value) => {
                        if (technician) return true;
                        if (!value?.trim()) return "Password is required.";
                        if (value.trim().length < 8) {
                          return "Password must be at least 8 characters.";
                        }
                        if (!/[A-Za-z]/.test(value)) {
                          return "Password must include at least 1 letter.";
                        }
                        if (!/\d/.test(value)) {
                          return "Password must include at least 1 number.";
                        }
                        return true;
                      },
                    })}
                    placeholder="Temporary login password"
                  />
                  <p className="text-xs text-slate-500">
                    Admin sets the initial password when creating a technician account.
                  </p>
                  {form.formState.errors.password ? (
                    <p className="text-sm text-rose-700">
                      {form.formState.errors.password.message}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-slate-950">Work Information</p>
              <p className="text-sm text-slate-500">
                Status controls assignment eligibility. Availability reflects baseline
                duty state before schedule conflicts are applied.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900">Status</label>
                <Controller
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900">
                  Default Availability
                </label>
                <Controller
                  control={form.control}
                  name="availability"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AVAILABLE">Available</SelectItem>
                        <SelectItem value="BUSY">Busy</SelectItem>
                        <SelectItem value="ON_BREAK">On Break</SelectItem>
                        <SelectItem value="OFF_DUTY">Off Duty</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900">Admin Notes</label>
            <Textarea
              {...form.register("notes")}
              placeholder="Optional internal notes for dispatch or assignment context."
            />
            {form.formState.errors.notes ? (
              <p className="text-sm text-rose-700">
                {form.formState.errors.notes.message}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
              Close
            </Button>
            <Button type="submit">
              {technician ? "Save Technician" : "Create Technician"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
