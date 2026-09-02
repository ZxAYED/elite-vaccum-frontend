"use client";

import Image from "next/image";
import { useState } from "react";
import {
  Edit,
  Laptop,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  mockAuthorizedDevices,
  mockCurrentCustomer,
  mockCurrentUser,
  mockSavedProperties,
  type SavedProperty,
} from "@/data/mock/user";
import { formatLongDate } from "@/lib/formatters";
import image from "@/public/dashboard/user/user.jpg";

const locationFields = [
  { label: "Location label", placeholder: "Primary Residence", wide: false },
  { label: "Full name", placeholder: "Avery Stone", wide: false },
  { label: "Phone number", placeholder: "+1 (203) 555-0148", wide: false },
  { label: "Street address", placeholder: "123 Heritage Lane", wide: true },
  { label: "Apartment / Suite", placeholder: "Suite, unit, or floor", wide: true },
  { label: "City", placeholder: "Greenwich", wide: false },
  { label: "State", placeholder: "CT", wide: false },
  { label: "Zip code", placeholder: "06830", wide: false },
] as const;

function LocationCard({ property }: { property: SavedProperty }) {
  const isPrimary = property.type === "PRIMARY";

  return (
    <article className="rounded-md border border-slate-200 bg-slate-50/50 p-4 shadow-xs transition hover:bg-white hover:border-teal-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-teal-200 bg-teal-50 text-teal-800">
            <MapPin size={16} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="text-sm font-bold text-slate-900">{property.name}</h3>
              {isPrimary ? (
                <span className="rounded-md bg-teal-100 border border-teal-200 px-2 py-0.2 text-[10px] font-semibold text-teal-800">
                  Primary
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-slate-600 font-medium">{property.address}</p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Avg response: {property.avgResponse}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-slate-200/60">
        <Button size="sm" variant="outline" className="rounded-md h-7 text-xs font-medium">
          <Edit size={12} className="mr-1" />
          Edit
        </Button>
        <Button size="sm" variant="ghost" className="rounded-md h-7 text-xs font-medium text-slate-700">
          {isPrimary ? "Default location" : "Set primary"}
        </Button>
        <Button size="sm" variant="ghost" className="rounded-md h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-medium">
          <Trash2 size={12} className="mr-1" />
          Remove
        </Button>
      </div>
    </article>
  );
}

function LocationModal() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="rounded-md font-medium">
          <Plus size={14} className="mr-1.5" />
          Add Location
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[min(94vw,48rem)] rounded-lg">
        <DialogHeader>
          <DialogTitle>Add service location</DialogTitle>
          <DialogDescription>
            Save a property for future service requests and dispatch routing.
          </DialogDescription>
        </DialogHeader>

        <form className="mt-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            {locationFields.map((field) => (
              <label
                className={field.wide ? "md:col-span-2" : undefined}
                key={field.label}
              >
                <span className="text-xs font-semibold text-slate-700">
                  {field.label}
                </span>
                <Input className="mt-1 h-9 rounded-md text-xs" placeholder={field.placeholder} />
              </label>
            ))}
          </div>

          <label>
            <span className="text-xs font-semibold text-slate-700">
              Service access notes
            </span>
            <Textarea
              className="mt-1 min-h-24 rounded-md text-xs"
              placeholder="Gate code, parking instructions, power unit location, pets, or technician notes..."
            />
          </label>
        </form>

        <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
          <Button type="button" variant="outline" size="sm" className="rounded-md" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" size="sm" className="rounded-md" onClick={() => setOpen(false)}>
            Save Location
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AccountProfile() {
  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
            Account Profile
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900">User Profile & Addresses</h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            Manage your personal details, service locations, and authorized sessions.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-1.5 rounded-md border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800 shadow-xs">
          <ShieldCheck size={14} className="text-teal-700" />
          Account verified
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6 shadow-xs lg:col-span-6 space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Image
              alt="Customer profile avatar"
              className="size-20 rounded-md object-cover border border-slate-200"
              src={image}
            />
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {mockCurrentCustomer.displayName}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Member since {formatLongDate(mockCurrentUser.createdAt)}
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <span className="rounded-md bg-teal-50 border border-teal-200 px-2.5 py-0.5 text-xs font-semibold text-teal-800">
                  Customer Portal
                </span>
                <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                  Verified phone
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2.5 rounded-md border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 font-medium text-slate-800">
              <Mail className="text-teal-700" size={15} />
              {mockCurrentUser.email}
            </div>
            <div className="flex items-center gap-2.5 rounded-md border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 font-medium text-slate-800">
              <Phone className="text-teal-700" size={15} />
              {mockCurrentUser.phone}
            </div>
          </div>

          <Button className="w-full rounded-md font-medium" size="sm" variant="outline">
            <Edit size={14} className="mr-1.5" />
            Edit Profile Info
          </Button>
        </section>

        <section className="rounded-lg border border-teal-800 bg-teal-900 p-5 sm:p-6 text-white shadow-xs lg:col-span-6 flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-300">
              Concierge Priority Support
            </p>
            <h2 className="mt-1 text-lg font-bold">Priority Service Context</h2>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-teal-100/80 font-normal">
              Saved property locations and access notes help our technical dispatch team route service calls faster, ensuring technicians arrive equipped for your unit.
            </p>
          </div>
          <div className="mt-5 grid gap-2.5 grid-cols-3 pt-4 border-t border-white/10">
            {[
              ["Locations", mockSavedProperties.length],
              ["Orders", mockCurrentCustomer.totalOrders],
              ["Response", "under 1h"],
            ].map(([label, value]) => (
              <div className="rounded-md bg-white/10 p-3 text-center" key={label}>
                <p className="text-lg font-bold text-white">{value}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-teal-200/80 font-medium">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Managed Service Properties
            </h2>
            <p className="text-xs text-slate-500 font-normal">
              Dispatch addresses, access notes, and preferred service locations.
            </p>
          </div>
          <LocationModal />
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2">
          {mockSavedProperties.map((property) => (
            <LocationCard key={property.id} property={property} />
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Active Sessions & Security</h2>
            <p className="text-xs text-slate-500 font-normal">
              Monitor authorized devices and active browser sessions.
            </p>
          </div>
          <Button variant="outline" size="sm" className="rounded-md text-xs font-medium">
            <LogOut size={13} className="mr-1.5" />
            Sign out other devices
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {mockAuthorizedDevices.map((device) => {
            const Icon = device.icon ?? Laptop;

            return (
              <article
                className="rounded-md border border-slate-200 bg-slate-50/50 p-3.5"
                key={device.name}
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-md border border-teal-200 bg-white text-teal-800 shadow-xs">
                    <Icon size={16} />
                  </div>
                  <div>
                    <p className="font-bold text-xs text-slate-900">{device.name}</p>
                    <p className="text-[11px] text-slate-500">{device.location}</p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-600 font-medium">
                  {device.isCurrent ? "Current active session" : device.lastActiveLabel}
                </p>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
