"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Camera, Mail, Phone, ShieldCheck, Trash2, Wrench } from "lucide-react";

import {
  AdminSurface,
  TechnicianRouteShell,
} from "@/components/technician/TechnicianRouteShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  getCurrentTechnicianProfile,
  getTechnicianJobsThisMonth,
  getTechnicianUpcomingOrders,
  updateCurrentTechnicianProfile,
} from "@/data/mock/technician-dashboard";
import { useSharedAdminScheduleStateVersion } from "@/hooks/useSharedAdminScheduleStateVersion";

const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export default function TechnicianProfilePage() {
  useSharedAdminScheduleStateVersion();
  const technician = getCurrentTechnicianProfile();
  const jobsThisMonth = getTechnicianJobsThisMonth();
  const upcomingAssignments = getTechnicianUpcomingOrders().length;

  const [editMode, setEditMode] = useState(false);
  const [fullName, setFullName] = useState(technician.displayName);
  const [phone, setPhone] = useState(technician.phone);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState("");

  const initials = useMemo(
    () =>
      technician.displayName
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    [technician.displayName],
  );

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  function handlePhotoChange(file: File | null) {
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setAvatarError("Upload JPG, JPEG, PNG, or WEBP.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setAvatarError("Photo must be 5 MB or smaller.");
      return;
    }

    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatarPreview(URL.createObjectURL(file));
    setAvatarError("");
  }

  function handleSaveProfile() {
    updateCurrentTechnicianProfile({
      displayName: fullName.trim(),
      phone: phone.trim(),
    });
    setEditMode(false);
  }

  return (
    <TechnicianRouteShell
      eyebrow="Technician Account"
      title="My Profile"
      description="Personal details, service summary, and recent completed work."
    >
      <div className="grid gap-4 xl:grid-cols-[0.94fr_1.06fr]">
        <AdminSurface>
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            <div className="relative">
              <div className="flex size-28 items-center justify-center overflow-hidden rounded-3xl bg-teal-50 text-2xl font-semibold text-primary">
                {avatarPreview ? (
                  <Image
                    src={avatarPreview}
                    alt={`${technician.displayName} profile preview`}
                    width={112}
                    height={112}
                    className="size-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>

              <label className="absolute -bottom-2 -right-2 flex size-11 cursor-pointer items-center justify-center rounded-full bg-primary text-white shadow-sm">
                <Camera size={18} />
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="sr-only"
                  onChange={(event) => handlePhotoChange(event.target.files?.[0] ?? null)}
                />
              </label>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-950">
                    {technician.displayName}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">Field Technician</p>
                </div>
                <Button
                  variant={editMode ? "outline" : "default"}
                  onClick={() => setEditMode((current) => !current)}
                >
                  {editMode ? "Cancel" : "Edit Profile"}
                </Button>
              </div>

              <div className="mt-5 grid gap-3">
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <Mail size={16} className="text-teal-700" />
                  {technician.email}
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <Phone size={16} className="text-teal-700" />
                  {technician.phone}
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <Wrench size={16} className="text-teal-700" />
                  {technician.availability === "OFF_DUTY"
                    ? "Off Duty"
                    : technician.availability === "BUSY"
                      ? "Busy"
                      : "Available"}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <label className="cursor-pointer">
                    Change Photo
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      className="sr-only"
                      onChange={(event) =>
                        handlePhotoChange(event.target.files?.[0] ?? null)
                      }
                    />
                  </label>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
                    setAvatarPreview(null);
                  }}
                >
                  <Trash2 size={15} />
                  Remove Photo
                </Button>
              </div>

              {avatarError ? (
                <p className="mt-3 text-sm text-red-700">{avatarError}</p>
              ) : null}
            </div>
          </div>

          {editMode ? (
            <div className="mt-6 grid gap-4 border-t border-slate-100 pt-6 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">Full Name</span>
                <Input value={fullName} onChange={(event) => setFullName(event.target.value)} />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">Phone</span>
                <Input value={phone} onChange={(event) => setPhone(event.target.value)} />
              </label>
              <div className="md:col-span-2 flex justify-end">
                <Button onClick={handleSaveProfile}>Save Profile</Button>
              </div>
            </div>
          ) : null}
        </AdminSurface>

        <AdminSurface>
          <div className="mb-6 flex items-center gap-3">
            <ShieldCheck size={22} className="text-teal-700" />
            <h2 className="text-2xl font-semibold text-primary">Service Summary</h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <SummaryCard label="Completed Jobs" value={technician.completedJobs} />
            <SummaryCard label="Jobs This Month" value={jobsThisMonth} />
            <SummaryCard label="Upcoming Assignments" value={upcomingAssignments} />
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold text-slate-950">Specializations</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {technician.specializations.map((item) => (
                <div
                  key={item}
                  className="rounded-xl bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </AdminSurface>
      </div>
    </TechnicianRouteShell>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-primary">
        {value}
      </p>
    </div>
  );
}
