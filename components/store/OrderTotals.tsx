import { formatCurrencyUsd } from "@/lib/formatters";
import type { CartTotals } from "@/lib/store";

interface OrderTotalsProps {
  totals: CartTotals;
  showTax?: boolean;
}

export function OrderTotals({
  totals,
  showTax = true,
}: OrderTotalsProps) {
  return (
    <div className="space-y-4 text-sm text-slate-600">
      <div className="flex items-center justify-between">
        <span>Subtotal</span>
        <span className="font-medium text-slate-900">
          {formatCurrencyUsd(totals.subtotal)}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span>Shipping</span>
        <span className="font-medium text-slate-900">
          {totals.shipping === 0 ? "Free" : formatCurrencyUsd(totals.shipping)}
        </span>
      </div>
      {showTax ? (
        <div className="flex items-center justify-between">
          <span>Estimated tax</span>
          <span className="font-medium text-slate-900">
            {formatCurrencyUsd(totals.tax)}
          </span>
        </div>
      ) : null}
      <div className="flex items-center justify-between border-t border-teal-100 pt-4">
        <span className="text-xl font-semibold text-slate-950">Total</span>
        <span className="text-3xl font-semibold text-primary">
          {formatCurrencyUsd(totals.total)}
        </span>
      </div>
    </div>
  );
}
