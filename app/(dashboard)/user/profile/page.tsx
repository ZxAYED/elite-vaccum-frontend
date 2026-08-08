"use client";

import Image from "next/image";
import {
  Edit,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Plus,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import {
  mockAuthorizedDevices,
  mockCurrentCustomer,
  mockCurrentUser,
  mockSavedProperties,
} from "@/data/mock/user";
import { formatLongDate } from "@/lib/formatters";
import image from "@/public/dashboard/user/user.jpg";

export default function AccountProfile() {
  return (
    <div className="min-h-screen">
      <div>
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl text-primary">Account Profile</h1>
            <p className="mt-1 text-gray-600">
              Manage your personal data, properties, and security settings.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 shadow-sm">
            <div className="flex size-5 items-center justify-center rounded-full bg-teal-500">
              <ShieldCheck className="text-white" size={12} />
            </div>
            <span className="text-sm font-medium text-gray-700">
              ACCOUNT SECURE
            </span>
          </div>
        </div>

        <div className="mb-10 grid gap-6 lg:grid-cols-2">
          <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow">
            <div className="p-6 md:p-8">
              <div className="mb-6 flex items-start gap-4">
                <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-full pt-8">
                  <Image alt="Customer profile avatar" className="rounded-lg" src={image} />
                </div>

                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {mockCurrentCustomer.displayName}
                  </h2>
                  <p className="mt-1 text-gray-500">
                    Member since {formatLongDate(mockCurrentUser.createdAt)}
                  </p>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-3 text-gray-700">
                      <Mail className="text-gray-500" size={18} />
                      <span>{mockCurrentUser.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                      <Phone className="text-gray-500" size={18} />
                      <span>{mockCurrentUser.phone}</span>
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                        Verified
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <Button className="w-full bg-teal-600 text-white hover:bg-teal-700">
                <Edit size={18} />
                Edit Profile
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl bg-linear-to-br from-teal-700 to-teal-800 text-white shadow-xl">
            <div className="p-6 md:p-8">
              <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold md:text-2xl">
                    Concierge Support
                  </h2>
                  <p className="text-teal-100/90">
                    Priority assistance for plan members.
                  </p>
                </div>
              </div>

              <p className="py-4 text-teal-200">Avg response under 1 hour</p>

              <div className="flex flex-col gap-4 pt-12 sm:flex-row">
                <Button className="flex-1 bg-white text-teal-800 shadow-md hover:bg-teal-50">
                  Standard Care Plan
                </Button>
                <Button className="flex-1 border border-white/30 bg-teal-600/30 text-white hover:bg-teal-600/50">
                  Upgrade Plan
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-12">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-full bg-teal-100">
            <MapPin className="text-teal-600" size={18} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Saved Properties</h2>
        </div>

        <p className="mb-6 text-gray-600">
          Dispatch locations for your central vacuum services.
        </p>

        <div className="relative mb-8">
          <input
            className="w-full rounded-xl border border-teal-200 bg-white py-3 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            placeholder="Search properties..."
            type="text"
          />
          <MapPin
            className="absolute right-4 top-1/2 -translate-y-1/2 text-teal-500"
            size={20}
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {mockSavedProperties.map((property) => (
            <div
              className={`relative overflow-hidden rounded-2xl shadow-md transition-all hover:shadow-lg ${
                property.type === "PRIMARY"
                  ? "border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100"
                  : "bg-gradient-to-br from-teal-700 to-teal-800 text-white"
              }`}
              key={property.id}
            >
              <div className="p-6">
                <div className="mb-3 flex items-start justify-between">
                  <h3 className="text-lg font-bold">{property.name}</h3>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      property.type === "PRIMARY"
                        ? "border border-teal-200 bg-teal-100 text-teal-800"
                        : "bg-white/20 text-white backdrop-blur-sm"
                    }`}
                  >
                    {property.type === "PRIMARY"
                      ? "PRIMARY PROPERTY"
                      : "SET AS PRIMARY"}
                  </span>
                </div>

                <p
                  className={`mb-1 text-sm ${
                    property.type === "PRIMARY" ? "text-gray-700" : "text-teal-100/90"
                  }`}
                >
                  {property.address}
                </p>

                <p
                  className={`text-sm ${
                    property.type === "PRIMARY" ? "text-gray-600" : "text-teal-200"
                  }`}
                >
                  Avg response: {property.avgResponse}
                </p>

                <div className="mt-6 flex gap-3">
                  <button
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors ${
                      property.type === "PRIMARY"
                        ? "border border-teal-200 bg-teal-100 text-teal-800 hover:bg-teal-200"
                        : "border border-white/30 bg-white/15 text-white hover:bg-white/25"
                    }`}
                    type="button"
                  >
                    <Edit size={16} />
                    Edit
                  </button>

                  <button
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors ${
                      property.type === "PRIMARY"
                        ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                        : "border border-white/30 bg-white/10 text-white hover:bg-white/20"
                    }`}
                    type="button"
                  >
                    <Trash2 size={16} />
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center gap-3">
          <button
            className="flex size-16 items-center justify-center rounded-full bg-teal-600 text-white shadow-lg transition-transform hover:scale-105 hover:bg-teal-700"
            type="button"
          >
            <Plus size={28} />
          </button>
          <span className="font-medium text-gray-700">Register New Property</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow">
        <div className="border-b border-gray-200 p-6">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-green-100">
              <ShieldCheck className="text-green-600" size={18} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Safety & Sessions
            </h2>
          </div>
          <p className="text-gray-600">
            Monitor your account activity and authorized devices.
          </p>
        </div>

        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-800">
            AUTHORIZED ACCESS
          </h3>

          <div className="grid gap-5 sm:grid-cols-2">
            {mockAuthorizedDevices.map((device) => {
              const Icon = device.icon;

              return (
                <div
                  className={`flex items-center gap-4 rounded-xl border p-5 ${
                    device.isCurrent
                      ? "border-teal-500 bg-teal-50/60"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  key={device.name}
                >
                  <div className="flex size-12 items-center justify-center rounded-lg bg-gray-100">
                    <Icon className="text-gray-700" size={24} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900">{device.name}</div>
                    <div className="text-sm text-gray-600">{device.location}</div>

                    {device.isCurrent ? (
                      <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-medium text-teal-700">
                        <span className="size-2 rounded-full bg-teal-500" />
                        Current Session
                      </div>
                    ) : (
                      <div className="mt-1.5 text-xs text-gray-500">
                        {device.lastActiveLabel}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Button
              className="flex-1 border-teal-600 text-teal-700 hover:bg-teal-50"
              variant="outline"
            >
              <LogOut size={18} />
              Sign Out of All Other Devices
            </Button>

            <Button className="flex-1 bg-red-600 text-white shadow-sm hover:bg-red-700">
              <XCircle size={18} />
              Terminate Current Session
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
