"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Search,
  Star,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Textarea } from "@/components/ui/Textarea";
import { getTechnicianAvailabilityOptions } from "@/data/mock/admin-orders";
import { cn } from "@/lib/utils";
import {
  useGetAdminTechniciansListQuery,
  type TechnicianProfileDto,
} from "@/redux/api/technicianApi";

export interface AssignTechnicianModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  subtitle?: string;
  currentTechnicianId?: string;
  contextInfo?: {
    serviceName?: string;
    customerName?: string;
    date?: string;
    timeWindow?: string;
    location?: string;
  };
  onAssign: (technicianId: string, notes?: string, technician?: TechnicianProfileDto) => Promise<void> | void;
  isAssigning?: boolean;
}

export function AssignTechnicianModal({
  open,
  onOpenChange,
  title = "Assign Field Technician",
  subtitle = "Select an available technician to dispatch for this appointment.",
  currentTechnicianId,
  contextInfo,
  onAssign,
  isAssigning = false,
}: AssignTechnicianModalProps) {
  const [selectedTechId, setSelectedTechId] = useState<string>(currentTechnicianId || "");
  const [notes, setNotes] = useState("");
  const [filterMode, setFilterMode] = useState<"available" | "all">("available");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch real technicians list from Phase 17 API (GET /technicians?page=1&limit=50)
  const { data: apiData, isLoading: isLoadingTechs } = useGetAdminTechniciansListQuery(
    { page: 1, limit: 50 },
    { skip: !open },
  );

  // Synchronize initial selection when dialog opens
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setNotes("");
      setSearchQuery("");
      setFilterMode("available");
    } else {
      setSelectedTechId(currentTechnicianId || "");
    }
    onOpenChange(nextOpen);
  };

  // Build unified technician list (with mock fallback if API returns empty)
  const allTechnicians = useMemo<TechnicianProfileDto[]>(() => {
    const apiItems = apiData?.items || [];
    if (apiItems.length > 0) {
      return apiItems;
    }

    // Fallback to local mock data if API items are empty
    const fallbackOptions = getTechnicianAvailabilityOptions();
    return fallbackOptions.map((opt) => ({
      id: opt.technicianId,
      userId: `user-${opt.technicianId}`,
      displayName: opt.displayName,
      email: `${opt.displayName.toLowerCase().replace(/\s+/g, ".")}@elitecentralvac.com`,
      phone: "+1 (555) 234-5678",
      role: "TECHNICIAN",
      status: "ACTIVE",
      availability: opt.status === "available" ? "AVAILABLE" : opt.status === "busy" ? "BUSY" : "OFF_DUTY",
      rating: "4.92",
      completedJobs: 38,
      isVerified: true,
      specializations: ["VACUUM_REPAIR", "INSTALLATION", "PIPE_UNCLOGGING"],
    }));
  }, [apiData]);

  // Filter based on tab and search
  const filteredTechnicians = useMemo(() => {
    return allTechnicians.filter((tech) => {
      // Tab filter
      const isAvailable =
        tech.availability === "AVAILABLE" ||
        tech.availability?.toLowerCase() === "available";
      if (filterMode === "available" && !isAvailable) {
        // If it is the currently selected technician, still allow seeing them
        if (tech.id !== selectedTechId) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = tech.displayName.toLowerCase().includes(query);
        const matchesEmail = tech.email?.toLowerCase().includes(query);
        const matchesSpecs = tech.specializations?.some((s) =>
          s.toLowerCase().replace(/_/g, " ").includes(query),
        );
        return matchesName || matchesEmail || matchesSpecs;
      }

      return true;
    });
  }, [allTechnicians, filterMode, searchQuery, selectedTechId]);

  const selectedTechnician = allTechnicians.find((t) => t.id === selectedTechId);

  const availableCount = allTechnicians.filter(
    (t) => t.availability === "AVAILABLE" || t.availability?.toLowerCase() === "available",
  ).length;

  const handleConfirm = async () => {
    if (!selectedTechId) return;
    await onAssign(selectedTechId, notes.trim() || undefined, selectedTechnician);
    handleOpenChange(false);
  };

  const getAvailabilityBadge = (rawAvailability?: string) => {
    const norm = (rawAvailability || "OFF_DUTY").toUpperCase().replace(/-/g, "_");
    switch (norm) {
      case "AVAILABLE":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Available
          </span>
        );
      case "BUSY":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
            <span className="size-1.5 rounded-full bg-amber-500" />
            Busy
          </span>
        );
      case "ON_BREAK":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
            <span className="size-1.5 rounded-full bg-purple-500" />
            On Break
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
            <span className="size-1.5 rounded-full bg-slate-400" />
            Off Duty
          </span>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-2xl flex flex-col p-0 gap-0">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-teal-100 bg-[#f7fbfa]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-teal-950 flex items-center gap-2">
              <UserRound className="size-5 text-teal-700" />
              {title}
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              {subtitle}
            </DialogDescription>
          </DialogHeader>

          {/* Optional context info preview */}
          {contextInfo && (
            <div className="mt-3 rounded-xl border border-teal-100 bg-white p-3.5 text-xs text-slate-700 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-teal-50 pb-2">
                <span className="font-semibold text-teal-950 text-sm">
                  {contextInfo.serviceName || "Central Vacuum Service"}
                </span>
                {contextInfo.customerName && (
                  <span className="rounded-md bg-teal-50 px-2 py-0.5 font-medium text-teal-800">
                    Customer: {contextInfo.customerName}
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-slate-500">
                {contextInfo.date && (
                  <div className="flex items-center gap-1">
                    <CalendarDays size={13} className="text-teal-600" />
                    <span>{contextInfo.date}</span>
                  </div>
                )}
                {contextInfo.timeWindow && (
                  <div className="flex items-center gap-1">
                    <Clock size={13} className="text-teal-600" />
                    <span>{contextInfo.timeWindow}</span>
                  </div>
                )}
                {contextInfo.location && (
                  <div className="flex items-center gap-1">
                    <MapPin size={13} className="text-teal-600" />
                    <span className="truncate max-w-[240px]">{contextInfo.location}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Filter and search bar */}
        <div className="px-6 py-3 border-b border-teal-100 bg-white flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="inline-flex rounded-lg border border-teal-100 bg-teal-50/50 p-1">
            <button
              type="button"
              onClick={() => setFilterMode("available")}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-semibold transition",
                filterMode === "available"
                  ? "bg-primary text-white shadow-sm"
                  : "text-slate-600 hover:text-primary",
              )}
            >
              Available Now ({availableCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("all")}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-semibold transition",
                filterMode === "all"
                  ? "bg-primary text-white shadow-sm"
                  : "text-slate-600 hover:text-primary",
              )}
            >
              All Techs ({allTechnicians.length})
            </button>
          </div>

          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, skill..."
              className="w-full rounded-xl border border-teal-100 bg-slate-50/50 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-teal-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
            />
          </div>
        </div>

        {/* Technician list body */}
        <div className="p-6 overflow-y-auto max-h-[42vh] space-y-3 bg-slate-50/30">
          {isLoadingTechs ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="size-6 animate-spin text-primary" />
              <p className="mt-2 text-xs font-medium">Loading field technicians...</p>
            </div>
          ) : filteredTechnicians.length === 0 ? (
            <div className="rounded-xl border border-dashed border-teal-200 bg-teal-50/30 py-8 text-center text-sm text-slate-600">
              <p className="font-semibold text-slate-800">No technicians found</p>
              <p className="mt-1 text-xs text-slate-500">
                {filterMode === "available"
                  ? "No technicians are currently marked available. Switch to 'All Techs' to assign anyway."
                  : "Try adjusting your search criteria."}
              </p>
            </div>
          ) : (
            filteredTechnicians.map((tech) => {
              const isSelected = selectedTechId === tech.id;

              return (
                <div
                  key={tech.id}
                  onClick={() => setSelectedTechId(tech.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedTechId(tech.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className={cn(
                    "group relative rounded-xl border p-3.5 text-left transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40",
                    isSelected
                      ? "border-teal-500 bg-teal-50/70 shadow-sm"
                      : "border-slate-200 bg-white hover:border-teal-300 hover:bg-slate-50/70",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Left: Avatar + Details */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={cn(
                          "size-10 shrink-0 rounded-full flex items-center justify-center font-bold text-sm",
                          isSelected
                            ? "bg-primary text-white"
                            : "bg-teal-100 text-teal-800",
                        )}
                      >
                        {tech.displayName
                          .split(" ")
                          .map((p) => p[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-900 truncate">
                            {tech.displayName}
                          </h4>
                          {tech.rating && (
                            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-amber-600">
                              <Star size={12} className="fill-amber-400 text-amber-500" />
                              {tech.rating}
                            </span>
                          )}
                          {tech.completedJobs !== undefined && (
                            <span className="text-[11px] text-slate-500">
                              ({tech.completedJobs} jobs)
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                          {tech.phone && (
                            <span className="inline-flex items-center gap-1">
                              <Phone size={11} className="text-slate-400" />
                              {tech.phone}
                            </span>
                          )}
                          {tech.email && (
                            <span className="inline-flex items-center gap-1">
                              <Mail size={11} className="text-slate-400" />
                              {tech.email}
                            </span>
                          )}
                        </div>

                        {tech.specializations && tech.specializations.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {tech.specializations.map((spec) => (
                              <span
                                key={spec}
                                className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600"
                              >
                                {spec.replace(/_/g, " ")}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Availability badge + Check indicator */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {getAvailabilityBadge(tech.availability)}

                      <div
                        className={cn(
                          "size-5 rounded-full border flex items-center justify-center transition-colors",
                          isSelected
                            ? "border-teal-700 bg-teal-700 text-white"
                            : "border-slate-300 bg-white group-hover:border-teal-400",
                        )}
                      >
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Note textarea & Footer */}
        <div className="p-6 pt-4 border-t border-teal-100 bg-white space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 block mb-1.5">
              Assignment / Dispatch Note (Optional)
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Assigned as primary technician for on-site diagnostic & vacuum unclogging..."
              rows={2}
              className="text-xs resize-none"
            />
          </div>

          <DialogFooter className="flex-row items-center justify-between gap-3 sm:justify-between pt-2">
            <div className="text-xs text-slate-500">
              {selectedTechnician ? (
                <span>
                  Assigning:{" "}
                  <strong className="text-teal-950 font-semibold">
                    {selectedTechnician.displayName}
                  </strong>
                </span>
              ) : (
                <span>Select a technician to confirm</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleOpenChange(false)}
                disabled={isAssigning}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!selectedTechId || isAssigning}
                onClick={handleConfirm}
                className="bg-primary text-white hover:bg-teal-700 font-semibold"
              >
                {isAssigning ? (
                  <>
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-1.5 size-3.5" />
                    Confirm Assignment
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
