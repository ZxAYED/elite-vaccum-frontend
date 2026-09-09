import { formatCurrencyUsd } from "@/lib/formatters";
import { SHIPPING_FEE_LABEL, type CartTotals } from "@/lib/store";

interface OrderTotalsProps {
  totals: CartTotals;
  showTax?: boolean;
}

export function OrderTotals({ totals, showTax = true }: OrderTotalsProps) {
  const hasOrder = totals.subtotal > 0 || totals.shipping > 0;

  return (
    <div className="space-y-4 text-sm text-slate-600">
      <div className="flex items-center justify-between">
        <span>Subtotal</span>
        <span className="font-medium text-slate-900">
          {formatCurrencyUsd(totals.subtotal)}
        </span>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <span>
            Shipping
            <span className="ml-1.5 rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">
              {SHIPPING_FEE_LABEL} flat
            </span>
          </span>
          <span className="font-medium text-slate-900">
            {formatCurrencyUsd(totals.shipping)}
          </span>
        </div>
        <p className="mt-1.5 text-xs leading-5 text-slate-500">
          A flat {SHIPPING_FEE_LABEL} shipping charge is applied once per order,
          no matter how many products you buy.
        </p>
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

      {!hasOrder ? (
        <p className="text-xs text-slate-400">
          Add a product to see shipping and tax for your order.
        </p>
      ) : null}
    </div>
  );
}
