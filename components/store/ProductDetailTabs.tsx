"use client";

import { useState } from "react";

import type { Product } from "@/types/domain";

const tabLabels = ["Description", "Specifications", "Shipping"] as const;
type TabLabel = (typeof tabLabels)[number];

interface ProductDetailTabsProps {
  product: Product;
}

export function ProductDetailTabs({ product }: ProductDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<TabLabel>("Description");

  return (
    <section className="landing-card landing-card-soft p-6 sm:p-8">
      <div className="flex flex-wrap gap-6 border-b border-teal-100">
        {tabLabels.map((tab) => {
          const isActive = tab === activeTab;

          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`border-b-2 pb-4 text-sm font-semibold transition-colors ${
                isActive
                  ? "border-teal-700 text-slate-950"
                  : "border-transparent text-slate-400 hover:text-slate-700"
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {activeTab === "Description" ? (
        <div className="space-y-5 pt-6 text-sm leading-7 text-slate-600">
          <p>{product.description}</p>
          {product.highlights?.length ? (
            <p>
              Built around real residential service workflows, this item is selected
              for dependable fit, everyday durability, and clean integration with
              Elite Central Vacuum system support.
            </p>
          ) : null}
        </div>
      ) : null}

      {activeTab === "Specifications" ? (
        <div className="grid gap-4 pt-6 md:grid-cols-2">
          {product.specifications?.map((spec) => (
            <div
              key={spec.label}
              className="rounded-[1.15rem] border border-teal-100 bg-white/90 p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700/75">
                {spec.label}
              </p>
              <p className="mt-2 text-sm font-medium text-slate-800">{spec.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      {activeTab === "Shipping" ? (
        <div className="space-y-4 pt-6 text-sm leading-7 text-slate-600">
          {product.shippingNotes?.map((note) => (
            <div
              key={note}
              className="rounded-[1.15rem] border border-teal-100 bg-white/90 p-4"
            >
              {note}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
