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
    <article className="rounded-3xl bg-white p-5 shadow-[0_18px_50px_-40px_rgba(28,79,80,0.45)] ring-1 ring-teal-100">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
            <MapPin size={22} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-primary">{property.name}</h3>
              {isPrimary ? (
                <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-800">
                  Primary
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-sm leading-6 text-gray-600">{property.address}</p>
            <p className="mt-1 text-sm text-gray-500">
              Avg response: {property.avgResponse}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Button size="sm" variant="soft">
          <Edit size={15} />
          Edit
        </Button>
        <Button size="sm" variant="outline">
          {isPrimary ? "Default location" : "Set primary"}
        </Button>
        <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700">
          <Trash2 size={15} />
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
        <Button>
          <Plus size={18} />
          Add Location
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[min(94vw,48rem)]">
        <DialogHeader>
          <DialogTitle>Add service location</DialogTitle>
          <DialogDescription>
            Save a property for future service requests. This is frontend-only mock
            behavior for now.
          </DialogDescription>
        </DialogHeader>

        <form className="mt-6 space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            {locationFields.map((field) => (
              <label
                className={field.wide ? "md:col-span-2" : undefined}
                key={field.label}
              >
                <span className="text-sm font-semibold text-slate-900">
                  {field.label}
                </span>
                <Input className="mt-2" placeholder={field.placeholder} />
              </label>
            ))}
          </div>

          <label>
            <span className="text-sm font-semibold text-slate-900">
              Service access notes
            </span>
            <Textarea
              className="mt-2 min-h-28"
              placeholder="Gate code, parking instructions, power unit location, pets, or technician notes..."
            />
          </label>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={() => setOpen(false)}>
            Save Location
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AccountProfile() {
  return (
    <div className="min-h-screen">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">
            Profile
          </p>
          <h1 className="mt-2 text-3xl font-bold text-primary">Account Profile</h1>
          <p className="mt-2 max-w-2xl text-gray-600">
            Manage contact details, service locations, and authorized sessions.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-teal-800 shadow-sm ring-1 ring-teal-100">
          <ShieldCheck size={16} />
          Account secure
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-3xl bg-white p-6 shadow-[0_18px_50px_-42px_rgba(28,79,80,0.5)] ring-1 ring-teal-100">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <Image
              alt="Customer profile avatar"
              className="size-24 rounded-3xl object-cover"
              src={image}
            />
            <div>
              <h2 className="text-2xl font-semibold text-primary">
                {mockCurrentCustomer.displayName}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Member since {formatLongDate(mockCurrentUser.createdAt)}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
                  Customer Portal
                </span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Verified phone
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            <div className="flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-700">
              <Mail className="text-teal-700" size={18} />
              {mockCurrentUser.email}
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-700">
              <Phone className="text-teal-700" size={18} />
              {mockCurrentUser.phone}
            </div>
          </div>

          <Button className="mt-6 w-full" variant="outline">
            <Edit size={18} />
            Edit Profile
          </Button>
        </section>

        <section className="rounded-3xl bg-primary p-6 text-white shadow-[0_24px_70px_-48px_rgba(28,79,80,0.7)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-100">
            Concierge Support
          </p>
          <h2 className="mt-3 text-2xl font-semibold">Priority service context</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">
            Saved locations and access notes help the team route service requests
            faster, especially when a technician needs power-unit or inlet access.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              ["Locations", mockSavedProperties.length],
              ["Orders", mockCurrentCustomer.totalOrders],
              ["Response", "under 1h"],
            ].map(([label, value]) => (
              <div className="rounded-2xl bg-white/10 p-4" key={label}>
                <p className="text-2xl font-semibold">{value}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/60">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-3xl bg-white p-6 shadow-[0_18px_50px_-42px_rgba(28,79,80,0.5)] ring-1 ring-teal-100">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">
              Locations
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-primary">
              Managed service locations
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Dispatch addresses, access notes, and preferred service locations.
            </p>
          </div>
          <LocationModal />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {mockSavedProperties.map((property) => (
            <LocationCard key={property.id} property={property} />
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-3xl bg-white p-6 shadow-[0_18px_50px_-42px_rgba(28,79,80,0.5)] ring-1 ring-teal-100">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-primary">Safety & Sessions</h2>
            <p className="mt-1 text-sm text-gray-600">
              Monitor authorized devices and account access.
            </p>
          </div>
          <Button variant="outline">
            <LogOut size={18} />
            Sign out other devices
          </Button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {mockAuthorizedDevices.map((device) => {
            const Icon = device.icon ?? Laptop;

            return (
              <article
                className="rounded-3xl bg-gray-50 p-5 ring-1 ring-gray-100"
                key={device.name}
              >
                <div className="flex items-center gap-4">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-white text-teal-700">
                    <Icon size={22} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{device.name}</p>
                    <p className="text-sm text-gray-500">{device.location}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-gray-600">
                  {device.isCurrent ? "Current session" : device.lastActiveLabel}
                </p>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
