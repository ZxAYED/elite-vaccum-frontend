"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  HelpCircle,
  MessageSquare,
  Phone,
  Search,
  Wrench,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useGetFaqsQuery } from "@/redux/api/settingsApi";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  status?: string;
  isActive?: boolean;
}

const defaultFaqs: FaqItem[] = [
  {
    id: "faq-maintenance-1",
    category: "Maintenance",
    question: "How often should I change my central vacuum filter or empty the canister?",
    answer:
      "We recommend inspecting and emptying the dirt receptacle every 3 to 6 months depending on household size and vacuum frequency. Replace permanent or cloth filters annually, or wash them per the manufacturer's instructions if reusable.",
  },
  {
    id: "faq-troubleshooting-1",
    category: "Troubleshooting",
    question: "What should I do if suction suddenly drops in one wall inlet?",
    answer:
      "Check if other inlets have normal suction. If only one inlet is affected, there may be a localized blockage at the 90-degree elbow behind the wall plate. Do not force coat hangers or metal wires into the pipe. Submit a service request and our technicians can use reverse-air or specialized snakes to clear the line safely.",
  },
  {
    id: "faq-general-1",
    category: "General",
    question: "What areas does Elite Central Vacuum service?",
    answer:
      "Elite provides comprehensive in-home central vacuum inspection, repair, and new installations across our designated regional service territory. Contact our support team or enter your address during service checkout to verify immediate coverage.",
  },
  {
    id: "faq-service-1",
    category: "Service & Repairs",
    question: "How does the Elite service request and quotation process work?",
    answer:
      "1. Submit your request online specifying system issues and photos if available.\n2. Our master technicians review the request and issue an itemized scope quotation.\n3. Upon your approval, we confirm your scheduled dispatch slot and assign a certified technician.",
  },
  {
    id: "faq-installation-1",
    category: "Installation",
    question: "Can central vacuums be retrofitted into existing multi-story homes?",
    answer:
      "Yes! Modern low-profile PVC tubing can be routed through closets, drop ceilings, chases, basements, and attic spaces with minimal drywall disruption. Most homes require only 3 to 5 strategically placed inlets to cover up to 5,000 sq. ft.",
  },
  {
    id: "faq-products-1",
    category: "Products & Orders",
    question: "Are Elite hoses and cleaning attachments compatible with other brands?",
    answer:
      "Yes. Most modern central vacuum wall inlets conform to the standard 1.5-inch inner diameter. Our premium hoses and crushproof accessories are compatible with Beam, Electrolux, Nutone, CycloVac, Drainvac, and many others.",
  },
  {
    id: "faq-billing-1",
    category: "Billing",
    question: "What payment methods do you accept for service orders and equipment?",
    answer:
      "We accept all major credit/debit cards (Visa, MasterCard, American Express, Discover), direct ACH bank transfers, and secure online invoice payments through your customer portal.",
  },
];

export function FaqsClient() {
  const { data: apiFaqs, isLoading } = useGetFaqsQuery();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({
    [defaultFaqs[0].id]: true,
  });

  const faqsList: FaqItem[] = useMemo(() => {
    const rawList: FaqItem[] =
      apiFaqs && apiFaqs.length > 0
        ? apiFaqs
            .filter((f) => f.isActive !== false && f.status !== "Hidden")
            .map((f) => ({
              id: f.id,
              question: f.question,
              answer: f.answer,
              category:
                f.category.charAt(0).toUpperCase() +
                f.category.slice(1).toLowerCase().replace(/_/g, " "),
              status: f.status,
              isActive: f.isActive,
            }))
        : defaultFaqs;

    // Deduplicate by question text to ensure clean, symmetrical UI
    const seen = new Set<string>();
    const deduped: FaqItem[] = [];
    for (const item of rawList) {
      const key = item.question.trim().toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(item);
      }
    }
    return deduped;
  }, [apiFaqs]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    faqsList.forEach((f) => {
      if (f.category) set.add(f.category);
    });
    return ["All", ...Array.from(set)];
  }, [faqsList]);

  const filteredFaqs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return faqsList.filter((f) => {
      const matchesSearch =
        !q ||
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q);
      const matchesCategory =
        selectedCategory === "All" ||
        f.category.toLowerCase() === selectedCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [faqsList, searchQuery, selectedCategory]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7fbfa_0%,#ffffff_100%)]">
      {/* Hero Header */}
      <section className="relative overflow-hidden border-b border-teal-100/60 bg-gradient-to-b from-teal-50/70 to-white px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto w-full max-w-[1400px] text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-200/80 bg-teal-50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-teal-800 shadow-sm">
            <Sparkles className="size-3.5 text-teal-600" />
            <span>Knowledge Base & Help Center</span>
          </div>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-primary sm:text-4xl lg:text-5xl">
            Frequently Asked Questions
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
            Find answers to common questions about central vacuum installation, motor maintenance,
            troubleshooting suction issues, and service orders.
          </p>

          {/* Search Box */}
          <div className="mx-auto mt-8 max-w-2xl">
            <div className="relative flex items-center">
              <Search className="pointer-events-none absolute left-4 size-5 text-teal-600" />
              <Input
                type="search"
                placeholder="Search questions or keywords (e.g., suction, filter, installation)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-13 rounded-2xl border-teal-200 bg-white pl-12 pr-4 text-base shadow-sm ring-teal-500/20 transition focus-visible:border-teal-600 focus-visible:ring-4"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="mx-auto w-full max-w-[1400px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pb-8">
          {categories.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-all",
                  isSelected
                    ? "bg-primary text-white shadow-md shadow-teal-900/15"
                    : "border border-teal-100 bg-white text-slate-600 hover:border-teal-200 hover:bg-teal-50/50 hover:text-primary",
                )}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Results Info */}
        <div className="mb-6 flex items-center justify-between text-sm text-slate-500">
          <span>
            Showing <strong className="font-semibold text-primary">{filteredFaqs.length}</strong>{" "}
            {filteredFaqs.length === 1 ? "question" : "questions"}
            {selectedCategory !== "All" && ` in ${selectedCategory}`}
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs font-semibold text-teal-700 hover:underline"
            >
              Clear search filter
            </button>
          )}
        </div>

        {/* Accordion FAQ List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-2xl border border-teal-100 bg-white/70"
              />
            ))}
          </div>
        ) : filteredFaqs.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-teal-200 bg-white p-12 text-center shadow-sm">
            <HelpCircle className="mx-auto size-12 text-teal-400" />
            <h3 className="mt-4 text-lg font-bold text-primary">No questions found</h3>
            <p className="mt-2 text-sm text-slate-500">
              We couldn&apos;t find any FAQs matching &ldquo;{searchQuery}&rdquo;. Try another term or contact our
              specialists directly.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                }}
              >
                Reset All Filters
              </Button>
              <Button size="sm" asChild>
                <Link href="/contact">Contact Support</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredFaqs.map((faq) => {
              const isExpanded = Boolean(expandedIds[faq.id]);
              return (
                <div
                  key={faq.id}
                  className={cn(
                    "overflow-hidden rounded-2xl border bg-white transition-all",
                    isExpanded
                      ? "border-teal-300/80 shadow-md shadow-teal-950/5 ring-1 ring-teal-200/50"
                      : "border-teal-100/80 hover:border-teal-200 hover:shadow-sm",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleExpand(faq.id)}
                    className="flex w-full items-start justify-between gap-4 p-5 text-left sm:p-6"
                    aria-expanded={isExpanded}
                  >
                    <div className="space-y-1.5">
                      <span className="inline-block rounded-md bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-800 ring-1 ring-teal-200/60">
                        {faq.category}
                      </span>
                      <h2 className="text-base font-bold text-primary sm:text-lg">
                        {faq.question}
                      </h2>
                    </div>
                    <div
                      className={cn(
                        "mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-transform duration-200",
                        isExpanded && "rotate-180 bg-teal-100 text-teal-800",
                      )}
                    >
                      <ChevronDown className="size-4" />
                    </div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                      >
                        <div className="border-t border-teal-50 bg-gradient-to-b from-teal-50/30 to-white px-5 pb-6 pt-4 text-sm leading-relaxed text-slate-700 sm:px-6">
                          <p className="whitespace-pre-line">{faq.answer}</p>
                          <div className="mt-4 flex items-center gap-2 text-xs text-teal-700">
                            <CheckCircle2 className="size-3.5 text-emerald-600" />
                            <span>Verified by Elite Certified Vacuum Specialists</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}

        {/* Still Have Questions CTA */}
        <div className="mt-16 overflow-hidden rounded-3xl border border-teal-200 bg-gradient-to-br from-teal-900 via-primary to-[#0f3435] p-8 text-white shadow-xl sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-teal-800/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-teal-200">
                <ShieldCheck className="size-3.5" />
                <span>Dedicated Customer Care</span>
              </div>
              <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Still have questions or need custom assistance?
              </h3>
              <p className="text-sm text-teal-100/90 sm:text-base">
                Our technicians and customer specialists can troubleshoot your unit, prepare quotes,
                or arrange dispatch directly.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                variant="default"
                className="bg-white text-primary hover:bg-teal-50 hover:text-primary font-semibold"
                asChild
              >
                <Link href="/user/chat">
                  <MessageSquare className="size-4" />
                  Live Chat with Admin
                </Link>
              </Button>
              <Button
                variant="outline"
                className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
                asChild
              >
                <Link href="/services/request">
                  <Wrench className="size-4" />
                  Request Service
                </Link>
              </Button>
              <Button
                variant="outline"
                className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
                asChild
              >
                <Link href="/contact">
                  <Phone className="size-4" />
                  Contact Us
                </Link>
              </Button>
            </div>
          </div>
        </div>
        </div>
      </section>
    </div>
  );
}
