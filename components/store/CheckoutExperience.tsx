"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Banknote, Check, CreditCard, Loader2, MapPin, MapPinned, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { FormField } from "@/components/forms/FormField";
import { FadeIn, Pressable, StaggerGroup, StaggerItem } from "@/components/motion/Animated";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/RadioGroup";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import type { Address, User } from "@/types/domain";
import { useCartSync } from "@/hooks/useCartSync";
import { useCreateStoreOrderMutation, type CreateOrderRequest } from "@/redux/api/ordersApi";
import {
  useValidateCartMutation,
  useGetActiveCartQuery,
  useAddItemToCartMutation,
} from "@/redux/api/cartApi";
import { useGetSavedAddressesQuery } from "@/redux/api/addressesApi";
import { useGetMeQuery } from "@/redux/api/authApi";
import { useAppSelector } from "@/redux/hooks";

import { CartItemRow } from "./CartItemRow";
import { OrderTotals } from "./OrderTotals";

interface ShippingFormState {
  fullName: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  country: string;
  state: string;
  city: string;
  postalCode: string;
  notes: string;
  saveAddress: boolean;
}

type PaymentMethod = "STRIPE" | "COD";

const PAYMENT_METHODS: Array<{
  value: PaymentMethod;
  label: string;
  description: string;
  icon: typeof CreditCard;
}> = [
  {
    value: "STRIPE",
    label: "Pay online",
    description: "Secure card payment via Stripe. You'll be redirected to complete it.",
    icon: CreditCard,
  },
  {
    value: "COD",
    label: "Cash on delivery",
    description: "Pay the technician in cash when your order arrives.",
    icon: Banknote,
  },
];

function resolveUserFullName(user: User | null): string {
  if (!user) return "";
  const composed = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return composed || user.fullName?.trim() || "";
}

function createFormState(user: User | null, address?: Address): ShippingFormState {
  return {
    fullName: resolveUserFullName(user),
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    line1: address?.line1 ?? "",
    line2: address?.line2 ?? "",
    country: address?.country || "USA",
    state: address?.state ?? "",
    city: address?.city ?? "",
    postalCode: address?.postalCode ?? "",
    notes: "",
    saveAddress: true,
  };
}

export function CheckoutExperience() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const wasCancelled = searchParams.get("cancelled") === "true";
  const { items, totals, updateProductQuantity, removeProduct, emptyCart } =
    useCartSync();

  // Contact details come from the authenticated session, refreshed from
  // `GET /auth/me` so a stale cookie payload never prefills the order.
  const authUser = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const { data: currentUser } = useGetMeQuery(undefined, { skip: !isAuthenticated });
  const user = currentUser ?? authUser;

  const { data: savedAddressesData, isLoading: isLoadingAddresses } =
    useGetSavedAddressesQuery();
  const { data: serverCart } = useGetActiveCartQuery();
  const [addItemToCartMutation] = useAddItemToCartMutation();
  const [validateCartMutation] = useValidateCartMutation();
  const [createOrderMutation, { isLoading: isCreatingOrder }] =
    useCreateStoreOrderMutation();

  // Saved addresses come solely from `GET /store/addresses`. When the customer
  // has none, the inline form below is the only path — no seeded placeholders.
  const addresses = useMemo<Address[]>(
    () =>
      (savedAddressesData ?? []).map((a) => ({
        id: a.id,
        label: a.label || `${a.line1 || a.street || "Address"}, ${a.city}`,
        line1: a.line1 || a.street || "",
        line2: a.line2 ?? a.apartment ?? "",
        city: a.city,
        state: a.state,
        postalCode: a.postalCode || a.zipCode || "",
        country: a.country || "",
        isDefault: a.isDefault ?? false,
      })),
    [savedAddressesData],
  );

  const isUuid = (id?: string | null): id is string =>
    Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    addresses[0]?.id && isUuid(addresses[0].id) ? addresses[0].id : null,
  );
  const [pendingAddressId, setPendingAddressId] = useState<string>(
    addresses[0]?.id ?? "",
  );
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("STRIPE");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [formState, setFormState] = useState<ShippingFormState>(() =>
    createFormState(user, addresses[0]),
  );

  useEffect(() => {
    if (addresses.length > 0) {
      const activeAddr =
        addresses.find((a) => a.id === selectedAddressId) ||
        addresses.find((a) => a.isDefault) ||
        addresses[0];
      if (activeAddr) {
        if (!selectedAddressId && isUuid(activeAddr.id)) {
          setSelectedAddressId(activeAddr.id);
        }
        if (!pendingAddressId) {
          setPendingAddressId(activeAddr.id);
        }
        setFormState((current) => {
          if (!current.line1) {
            return {
              ...current,
              line1: activeAddr.line1,
              line2: activeAddr.line2 || "",
              city: activeAddr.city,
              state: activeAddr.state,
              postalCode: activeAddr.postalCode,
              country: activeAddr.country || current.country,
            };
          }
          return current;
        });
      }
    }
  }, [addresses, selectedAddressId, pendingAddressId]);

  // The session may resolve after first paint, so backfill untouched contact
  // fields once the real user lands.
  useEffect(() => {
    if (!user) return;
    setFormState((current) => ({
      ...current,
      fullName: current.fullName || resolveUserFullName(user),
      email: current.email || user.email || "",
      phone: current.phone || user.phone || "",
    }));
  }, [user]);

  const selectedAddress = addresses.find((address) => address.id === selectedAddressId);

  const handleUseNewAddress = () => {
    setSelectedAddressId(null);
    setPendingAddressId("");
    setFormState((current) => ({
      ...current,
      line1: "",
      line2: "",
      city: "",
      state: "",
      postalCode: "",
      saveAddress: true,
    }));
  };

  const applyAddress = (value: string) => {
    setSelectedAddressId(value);
    setPendingAddressId(value);
    const nextAddress = addresses.find((address) => address.id === value);
    if (nextAddress) {
      setFormState((current) => ({
        ...current,
        line1: nextAddress.line1,
        line2: nextAddress.line2 || "",
        city: nextAddress.city,
        state: nextAddress.state,
        postalCode: nextAddress.postalCode,
        country: nextAddress.country || current.country,
      }));
    }
    setAddressDialogOpen(false);
  };

  const handleAddressFieldChange = (
    field: "line1" | "line2" | "city" | "state" | "postalCode",
    value: string,
  ) => {
    if (selectedAddressId) {
      setSelectedAddressId(null);
    }
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};
    if (!formState.email.trim() || !formState.email.includes("@")) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (!formState.fullName.trim() || formState.fullName.trim().length < 2) {
      nextErrors.fullName = "Enter your full name.";
    }
    if (!formState.phone.trim() || formState.phone.trim().length < 7) {
      nextErrors.phone = "Enter a valid phone number.";
    }
    if (!formState.line1.trim()) {
      nextErrors.line1 = "Street address is required.";
    }
    if (!formState.city.trim()) {
      nextErrors.city = "City is required.";
    }
    if (!formState.state.trim()) {
      nextErrors.state = "State is required.";
    }
    if (!formState.postalCode.trim()) {
      nextErrors.postalCode = "Zip code is required.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);

    if (items.length === 0) {
      const msg = "Your shopping cart is empty. Please add products to your cart before proceeding to checkout.";
      setCheckoutError(msg);
      toast.error(msg);
      return;
    }
    if (!validateForm()) return;

    setIsSubmitting(true);

    // Ensure server cart is synchronized with local items
    if (serverCart && serverCart.items.length === 0 && items.length > 0) {
      for (const item of items) {
        try {
          await addItemToCartMutation({
            productId: item.productId,
            quantity: item.quantity,
          }).unwrap();
        } catch {
          // ignore if already present
        }
      }
    }

    try {
      const validation = await validateCartMutation().unwrap();
      if (validation && !validation.isValid && validation.invalidItems?.length) {
        const msg = "Some items in your cart are no longer available. Please review your cart.";
        setCheckoutError(msg);
        toast.error(msg);
        setIsSubmitting(false);
        return;
      }
    } catch {
      // Continue if endpoint not available
    }

    // Case 1: If User Selects an Existing / Previous Address
    // Send the UUID using deliveryAddressId (do not send the deliveryAddress object).
    // Case 2: If User Inputs a New Address
    // Send the new address object using deliveryAddress (do not send deliveryAddressId).
    const contactPayload = {
      paymentMethod,
      recipientName: formState.fullName.trim(),
      contactPhone: formState.phone.trim(),
      contactEmail: formState.email.trim(),
      ...(formState.notes?.trim() ? { notes: formState.notes.trim() } : {}),
    };

    const orderPayload: CreateOrderRequest = isUuid(selectedAddressId)
      ? {
          deliveryAddressId: selectedAddressId,
          ...contactPayload,
        }
      : {
          deliveryAddress: {
            label: formState.fullName.trim() || "Home",
            line1: formState.line1.trim(),
            ...(formState.line2.trim() ? { line2: formState.line2.trim() } : {}),
            city: formState.city.trim(),
            state: formState.state.trim(),
            postalCode: formState.postalCode.trim(),
            country: formState.country || "USA",
            isDefault: Boolean(formState.saveAddress),
          },
          ...contactPayload,
        };

    try {
      const orderResult = await createOrderMutation(orderPayload).unwrap();
      const orderId = orderResult.order?.id;

      // Cash on delivery settles offline — `checkoutUrl` and `sessionId` come
      // back null for COD, so there is nothing to redirect to.
      if (paymentMethod === "STRIPE") {
        if (orderResult.checkoutUrl) {
          toast.success("Redirecting to Stripe...", {
            description: "Forwarding to secure checkout payment.",
          });
          // The cart is intentionally left intact: cancelling at Stripe returns
          // here with `?cancelled=true` and the order can be retried. It is
          // emptied on the success page instead.
          window.location.href = orderResult.checkoutUrl;
          return;
        }

        // A STRIPE order with no pay link means Stripe was unreachable; the
        // order was rolled back to FAILED and stock restored.
        const message =
          orderResult.message ||
          "We couldn't reach our payment provider. Your order was not charged — please try again.";
        setCheckoutError(message);
        toast.error("Payment unavailable", { description: message });
        return;
      }

      await emptyCart();
      toast.success("Order placed successfully!", {
        description:
          paymentMethod === "COD"
            ? `Order ${orderId || "confirmed"}. Pay in cash on delivery.`
            : `Order ${orderId || "confirmed"}. Receipt is ready.`,
      });
      router.push(
        `/checkout/success?method=${paymentMethod}${orderId ? `&order_id=${encodeURIComponent(orderId)}` : ""}`,
      );
    } catch (err: unknown) {
      const anyErr = err as {
        data?: {
          message?: string | string[];
          error?: string;
          statusCode?: number;
          code?: string;
        };
        message?: string;
      };

      const baseMessage =
        (Array.isArray(anyErr.data?.message)
          ? anyErr.data.message.join(", ")
          : anyErr.data?.message) ||
        anyErr.data?.error ||
        anyErr.message ||
        "Failed to place order. Please try again.";

      // 503 means Stripe was unavailable: the order was rolled back to FAILED
      // and stock restored, so retrying is safe and nothing was charged.
      const errorMessage =
        (anyErr as { status?: number }).status === 503 ||
        anyErr.data?.statusCode === 503
          ? `${baseMessage} Nothing was charged — please try placing the order again.`
          : baseMessage;

      setCheckoutError(errorMessage);
      toast.error("Checkout failed", {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthGuard>
      <form onSubmit={handlePlaceOrder} className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_30rem]">
      <FadeIn className="landing-card landing-card-soft p-6 sm:p-8">
        <p className="text-sm text-slate-500">Home &gt; Store &gt; Check out</p>

        {wasCancelled ? (
          <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50/90 p-4 text-sm text-amber-950 shadow-xs">
            <p className="font-semibold">Payment Session Cancelled</p>
            <p className="mt-1 text-xs text-amber-800 leading-relaxed">
              Your Stripe payment session was cancelled. Your cart and shipping details are preserved below so you can try placing the order again whenever you&apos;re ready.
            </p>
          </div>
        ) : null}

        <div className="mt-6 space-y-8">
          <div>
            <h2 className="text-3xl font-semibold text-primary">Contact Information</h2>
            <div className="mt-5">
              <FormField htmlFor="email" label="Email" required error={errors.email}>
                <Input
                  id="email"
                  type="email"
                  value={formState.email}
                  onChange={(event) => {
                    setFormState((current) => ({
                      ...current,
                      email: event.target.value,
                    }));
                    if (errors.email) {
                      setErrors((prev) => ({ ...prev, email: "" }));
                    }
                  }}
                />
              </FormField>
            </div>
          </div>

          <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-3xl font-semibold text-primary">Shipping Address</h2>
              <Dialog
                open={addressDialogOpen}
                onOpenChange={(open) => {
                  setAddressDialogOpen(open);
                  if (open && (selectedAddressId || addresses[0]?.id)) {
                    setPendingAddressId(selectedAddressId || addresses[0].id);
                  }
                }}
              >
                <Pressable>
                  <DialogTrigger asChild>
                    <Button type="button" size="pill" variant="outline">
                      <MapPinned size={16} />
                      Select address
                    </Button>
                  </DialogTrigger>
                </Pressable>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Select a saved address</DialogTitle>
                    <DialogDescription>
                      Choose a saved residence and we&apos;ll prefill the checkout form with
                      the stored delivery details.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="mt-4 max-h-80 overflow-y-auto space-y-3 pr-1">
                    <button
                      type="button"
                      onClick={() => {
                        handleUseNewAddress();
                        setAddressDialogOpen(false);
                      }}
                      className="group flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-teal-300 bg-teal-50/40 p-3 text-sm font-semibold text-teal-800 transition hover:border-teal-500 hover:bg-teal-100/60"
                    >
                      <Plus className="size-4 text-teal-700" />
                      <span>+ Enter a new address</span>
                    </button>

                    {isLoadingAddresses ? (
                      <div className="space-y-3 py-2">
                        <div className="h-20 animate-pulse rounded-2xl bg-teal-50/70 border border-teal-100" />
                        <div className="h-20 animate-pulse rounded-2xl bg-teal-50/70 border border-teal-100" />
                      </div>
                    ) : addresses.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-teal-200 bg-teal-50/40 p-6 text-center">
                        <MapPin className="mx-auto size-8 text-teal-600/70" />
                        <p className="mt-2 text-sm font-semibold text-slate-800">
                          No saved addresses found
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Enter your address in the form below to proceed with checkout.
                        </p>
                      </div>
                    ) : (
                      addresses.map((address) => {
                        const isSelected = address.id === pendingAddressId;
                        return (
                          <button
                            type="button"
                            key={address.id}
                            onClick={() => setPendingAddressId(address.id)}
                            onDoubleClick={() => applyAddress(address.id)}
                            className={`group relative flex w-full text-left items-start gap-3.5 rounded-2xl border p-4 transition-all duration-150 ${
                              isSelected
                                ? "border-teal-600 bg-teal-50/70 shadow-xs ring-1 ring-teal-600"
                                : "border-slate-200 bg-white hover:border-teal-300 hover:bg-slate-50/70"
                            }`}
                          >
                            <div
                              className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border transition ${
                                isSelected
                                  ? "border-[#1c4f50] bg-[#1c4f50]"
                                  : "border-slate-300 group-hover:border-teal-500"
                              }`}
                            >
                              {isSelected ? (
                                <Check className="size-3 text-white stroke-[3]" />
                              ) : null}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-900 text-sm">
                                  {address.label}
                                </span>
                                {address.isDefault ? (
                                  <span className="rounded-md bg-teal-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal-800">
                                    Default
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-1 text-xs sm:text-sm font-medium text-slate-600">
                                {address.line1}
                                {address.line2 ? `, ${address.line2}` : ""}
                              </p>
                              <p className="text-xs text-slate-500">
                                {address.city}, {address.state} {address.postalCode} • {address.country}
                              </p>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>

                  <DialogFooter className="mt-6 flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="pill"
                      onClick={() => setAddressDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="pill"
                      disabled={!pendingAddressId || addresses.length === 0}
                      onClick={() => applyAddress(pendingAddressId)}
                    >
                      Use this address
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {selectedAddress && isUuid(selectedAddressId) ? (
              <div className="mt-5 rounded-2xl border border-teal-200 bg-teal-50/50 p-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-xl bg-teal-600/10 p-2 text-teal-800">
                      <MapPinned className="size-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-teal-100/80 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-teal-800">
                          Saved Address
                        </span>
                        <span className="text-sm font-semibold text-primary">
                          {selectedAddress.label}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-700">
                        {selectedAddress.line1}
                        {selectedAddress.line2 ? `, ${selectedAddress.line2}` : ""}
                      </p>
                      <p className="text-xs text-slate-500">
                        {selectedAddress.city}, {selectedAddress.state} {selectedAddress.postalCode} • {selectedAddress.country}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-4">
                <div className="flex items-center gap-2.5">
                  <span className="size-2 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                  <span className="text-sm font-medium text-slate-700">
                    Entering a new shipping address
                  </span>
                </div>
                {addresses.length > 0 ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-full text-xs self-start sm:self-center"
                    onClick={() => setAddressDialogOpen(true)}
                  >
                    <MapPinned className="mr-1 size-3.5" />
                    Select from saved addresses
                  </Button>
                ) : null}
              </div>
            )}

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <FormField htmlFor="full-name" label="Name" required error={errors.fullName}>
                <Input
                  id="full-name"
                  value={formState.fullName}
                  onChange={(event) => {
                    setFormState((current) => ({
                      ...current,
                      fullName: event.target.value,
                    }));
                    if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: "" }));
                  }}
                />
              </FormField>

              <FormField htmlFor="phone" label="Phone Number" required error={errors.phone}>
                <Input
                  id="phone"
                  value={formState.phone}
                  onChange={(event) => {
                    setFormState((current) => ({
                      ...current,
                      phone: event.target.value,
                    }));
                    if (errors.phone) setErrors((prev) => ({ ...prev, phone: "" }));
                  }}
                />
              </FormField>
            </div>

            <div className="mt-5">
              <FormField htmlFor="line1" label="Street address" required error={errors.line1}>
                <Input
                  id="line1"
                  value={formState.line1}
                  onChange={(event) => handleAddressFieldChange("line1", event.target.value)}
                />
              </FormField>
            </div>

            <div className="mt-5">
              <FormField htmlFor="line2" label="Apartment / Suite">
                <Input
                  id="line2"
                  value={formState.line2}
                  onChange={(event) => handleAddressFieldChange("line2", event.target.value)}
                />
              </FormField>
            </div>

            <div className="mt-5">
              <FormField htmlFor="country-trigger" label="Country" required>
                <Select
                  value={formState.country}
                  onValueChange={(value) =>
                    setFormState((current) => ({
                      ...current,
                      country: value,
                    }))
                  }
                >
                  <SelectTrigger id="country-trigger">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USA">United States</SelectItem>
                    <SelectItem value="Bangladesh">Bangladesh</SelectItem>
                    <SelectItem value="Canada">Canada</SelectItem>
                    <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-3">
              <FormField htmlFor="state" label="State" required error={errors.state}>
                <Input
                  id="state"
                  value={formState.state}
                  onChange={(event) => handleAddressFieldChange("state", event.target.value)}
                />
              </FormField>

              <FormField htmlFor="city" label="City" required error={errors.city}>
                <Input
                  id="city"
                  value={formState.city}
                  onChange={(event) => handleAddressFieldChange("city", event.target.value)}
                />
              </FormField>

              <FormField htmlFor="postal-code" label="Zip code" required error={errors.postalCode}>
                <Input
                  id="postal-code"
                  value={formState.postalCode}
                  onChange={(event) => handleAddressFieldChange("postalCode", event.target.value)}
                />
              </FormField>
            </div>

            <div className="mt-5">
              <FormField htmlFor="delivery-notes" label="Delivery Notes (Optional)">
                <Input
                  id="delivery-notes"
                  placeholder="e.g. Please leave at the front door if no answer"
                  value={formState.notes}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                />
              </FormField>
            </div>

            {!isUuid(selectedAddressId) ? (
              <label className="mt-6 flex items-center gap-3 text-sm text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formState.saveAddress}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      saveAddress: event.target.checked,
                    }))
                  }
                  className="size-5 rounded border border-teal-200 accent-[#1c4f50]"
                />
                Save this address to my address book for future purchases
              </label>
            ) : null}
          </div>

          <div>
            <h2 className="text-3xl font-semibold text-primary">Payment Method</h2>
            <RadioGroup
              className="mt-5 gap-3 sm:grid-cols-2"
              value={paymentMethod}
              onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
              aria-label="Payment method"
            >
              {PAYMENT_METHODS.map(({ value, label, description, icon: Icon }) => {
                const isSelected = paymentMethod === value;
                return (
                  <label
                    key={value}
                    htmlFor={`payment-${value}`}
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all duration-150 ${
                      isSelected
                        ? "border-teal-600 bg-teal-50/70 ring-1 ring-teal-600"
                        : "border-slate-200 bg-white hover:border-teal-300 hover:bg-slate-50/70"
                    }`}
                  >
                    <RadioGroupItem
                      id={`payment-${value}`}
                      value={value}
                      className="mt-0.5 size-5"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <Icon size={16} className="text-teal-700" aria-hidden />
                        {label}
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed text-slate-500">
                        {description}
                      </span>
                    </span>
                  </label>
                );
              })}
            </RadioGroup>
          </div>
        </div>
      </FadeIn>

      <FadeIn
        className="landing-card landing-card-soft h-fit p-6 xl:sticky xl:top-24"
        delay={0.08}
      >
        <h2 className="text-2xl font-semibold text-primary">Order Summary</h2>

        <StaggerGroup className="mt-5 space-y-4" delay={0.05}>
          {items.map((item) => (
            <StaggerItem key={item.productId}>
              <CartItemRow
                item={item}
                compact
                onDecrease={() =>
                  updateProductQuantity(item.productId, item.quantity - 1)
                }
                onIncrease={() =>
                  updateProductQuantity(item.productId, item.quantity + 1)
                }
                onRemove={() => removeProduct(item.productId)}
              />
            </StaggerItem>
          ))}
          {items.length === 0 ? (
            <p className="rounded-xl border border-dashed border-teal-200 bg-teal-50/40 p-4 text-center text-sm text-slate-500">
              Your cart is empty.{" "}
              <Link href="/store" className="font-semibold text-primary underline">
                Browse store
              </Link>
            </p>
          ) : null}
        </StaggerGroup>

        <div className="mt-6">
          <OrderTotals totals={totals} />
        </div>

        {checkoutError ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-800 shadow-xs">
            <div className="flex items-start gap-2.5">
              <span className="font-semibold text-red-900 shrink-0">Checkout Error:</span>
              <p className="flex-1 text-red-700 leading-relaxed text-xs sm:text-sm">{checkoutError}</p>
            </div>
          </div>
        ) : null}

        <Pressable className="mt-6 w-full">
          <Button
            type="submit"
            className="w-full"
            size="pill"
            disabled={items.length === 0 || isSubmitting || isCreatingOrder}
          >
            {isSubmitting || isCreatingOrder ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Processing Order...
              </>
            ) : paymentMethod === "STRIPE" ? (
              "Continue to Payment"
            ) : (
              "Place Order"
            )}
          </Button>
        </Pressable>

        <p className="mt-4 text-center text-sm leading-6 text-slate-500">
          By placing this order, you agree to our Terms of Service and Privacy
          Policy.{" "}
          {paymentMethod === "STRIPE"
            ? "You'll be redirected to Stripe for a secure 256-bit SSL encrypted payment."
            : "Please have the exact amount ready for the delivery driver."}
        </p>
      </FadeIn>
    </form>
    </AuthGuard>
  );
}
