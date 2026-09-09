"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
  setCartItems,
} from "@/redux/slices/cartSlice";
import {
  useGetActiveCartQuery,
  useAddItemToCartMutation,
  useUpdateCartItemQuantityMutation,
  useRemoveCartItemMutation,
  useClearServerCartMutation,
} from "@/redux/api/cartApi";
import { baseApi } from "@/redux/api/baseApi";
import { calculateCartTotals } from "@/lib/store";
import type { CartItemDto } from "@/redux/api/cartApi";
import type { CartProduct, Product } from "@/types/domain";

/**
 * The cart endpoint documents flat item fields (`name`, `priceUsd`, `imageUrl`),
 * but responses can also nest them under `product`. Read both shapes so a
 * hydrated cart never renders as a nameless $0 row.
 */
function toCartProduct(serverItem: CartItemDto): CartProduct {
  const nested = (serverItem as CartItemDto & { product?: Record<string, unknown> })
    .product;
  const pick = <T,>(flat: T | undefined, key: string): T | undefined =>
    flat !== undefined && flat !== null && flat !== ""
      ? flat
      : (nested?.[key] as T | undefined);

  const productId =
    pick(serverItem.productId, "id") ?? (nested?.id as string | undefined) ?? "";
  const name = pick(serverItem.name, "name") ?? "";
  const sku = pick(serverItem.sku, "sku");
  const rawPrice = pick<string | number>(serverItem.priceUsd, "priceUsd");
  const priceUsd = Number(rawPrice);
  const imageUrl = pick(serverItem.imageUrl, "primaryImageUrl");

  return {
    productId,
    quantity: Number(serverItem.quantity) || 1,
    product: {
      id: productId,
      name,
      slug: sku ? sku.toLowerCase() : productId,
      sku,
      priceUsd: Number.isFinite(priceUsd) ? priceUsd : 0,
      status: "active",
      availability: serverItem.isAvailable === false ? "out-of-stock" : "in-stock",
      images: imageUrl ? [imageUrl] : undefined,
      imageAlt: name,
      summary: "",
      description: "",
      isFeatured: false,
    } as unknown as Product,
  };
}

export function useCartSync() {
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.cart.items);
  const clearedAt = useAppSelector((state) => state.cart.clearedAt);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const { data: serverCart } = useGetActiveCartQuery(undefined, {
    skip: !isAuthenticated,
  });

  const [addItemToCartApi] = useAddItemToCartMutation();
  const [updateQuantityApi] = useUpdateCartItemQuantityMutation();
  const [removeCartItemApi] = useRemoveCartItemMutation();
  const [clearServerCartApi] = useClearServerCartMutation();

  // Keep ref to latest server cart items to avoid stale closures in callbacks
  const serverItemsRef = useRef(serverCart?.items ?? []);
  useEffect(() => {
    serverItemsRef.current = serverCart?.items ?? [];
  }, [serverCart?.items]);

  // Initial sync: if local cart is empty but authenticated server cart has items,
  // hydrate local Redux store from server cart items
  const hasHydratedFromServer = useRef(false);
  useEffect(() => {
    if (
      isAuthenticated &&
      !hasHydratedFromServer.current &&
      // The cart was emptied in this session; a server response that still
      // lists the old items is stale and must not be hydrated back in.
      clearedAt === null &&
      items.length === 0 &&
      serverCart?.items &&
      serverCart.items.length > 0
    ) {
      hasHydratedFromServer.current = true;
      dispatch(setCartItems(serverCart.items.map(toCartProduct)));
    }
  }, [isAuthenticated, clearedAt, items.length, serverCart?.items, dispatch]);

  const totals = useMemo(() => calculateCartTotals(items), [items]);

  const addProduct = useCallback(
    async (product: Product, quantity = 1) => {
      // 1. Immediately update Redux store
      dispatch(
        addToCart({
          productId: product.id,
          quantity,
          product,
        }),
      );

      // 2. If authenticated, sync with Cart API
      if (isAuthenticated) {
        try {
          await addItemToCartApi({
            productId: product.id,
            quantity,
          }).unwrap();
        } catch {
          // Graceful fallback for mock or offline products
        }
      }
    },
    [dispatch, isAuthenticated, addItemToCartApi],
  );

  const updateProductQuantity = useCallback(
    async (productId: string, nextQuantity: number) => {
      // 1. Immediately update Redux store
      dispatch(
        updateQuantity({
          productId,
          quantity: nextQuantity,
        }),
      );

      // 2. If authenticated, sync with Cart API
      if (isAuthenticated) {
        const serverItem = serverItemsRef.current.find(
          (item) => item.productId === productId,
        );

        if (nextQuantity <= 0) {
          if (serverItem) {
            try {
              await removeCartItemApi(serverItem.id).unwrap();
            } catch {
              // Graceful fallback
            }
          }
        } else {
          if (serverItem) {
            try {
              await updateQuantityApi({
                itemId: serverItem.id,
                quantity: nextQuantity,
              }).unwrap();
            } catch {
              // Graceful fallback
            }
          } else {
            try {
              await addItemToCartApi({
                productId,
                quantity: nextQuantity,
              }).unwrap();
            } catch {
              // Graceful fallback
            }
          }
        }
      }
    },
    [
      dispatch,
      isAuthenticated,
      removeCartItemApi,
      updateQuantityApi,
      addItemToCartApi,
    ],
  );

  const removeProduct = useCallback(
    async (productId: string) => {
      // 1. Immediately update Redux store
      dispatch(removeFromCart(productId));

      // 2. If authenticated, sync with Cart API
      if (isAuthenticated) {
        const serverItem = serverItemsRef.current.find(
          (item) => item.productId === productId,
        );
        if (serverItem) {
          try {
            await removeCartItemApi(serverItem.id).unwrap();
          } catch {
            // Graceful fallback
          }
        }
      }
    },
    [dispatch, isAuthenticated, removeCartItemApi],
  );

  const emptyCart = useCallback(async () => {
    // 1. Immediately update Redux store
    dispatch(clearCart());

    // 2. If authenticated, clear Cart API
    if (isAuthenticated) {
      try {
        await clearServerCartApi().unwrap();
      } catch {
        // Graceful fallback — e.g. the backend already consumed the cart while
        // creating the order, so DELETE /store/cart reports nothing to clear.
      }
      // Drop the cached cart either way. `invalidatesTags` only fires on a
      // successful mutation, which would otherwise leave every consumer of
      // `getActiveCart` (badge, checkout summary) reading the pre-order cart.
      dispatch(baseApi.util.invalidateTags(["Cart"]));
    }
  }, [dispatch, isAuthenticated, clearServerCartApi]);

  return {
    items,
    totals,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    addProduct,
    updateProductQuantity,
    removeProduct,
    emptyCart,
    serverCart,
  };
}
