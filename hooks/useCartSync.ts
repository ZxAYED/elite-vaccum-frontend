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
import { calculateCartTotals } from "@/lib/store";
import type { CartProduct } from "@/data/mock/customer-portal";
import type { Product } from "@/types/domain";

export function useCartSync() {
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.cart.items);
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
      items.length === 0 &&
      serverCart?.items &&
      serverCart.items.length > 0
    ) {
      hasHydratedFromServer.current = true;
      const hydratedItems: CartProduct[] = serverCart.items.map((si) => ({
        productId: si.productId,
        quantity: si.quantity,
        product: {
          id: si.productId,
          name: si.name,
          slug: si.sku ? si.sku.toLowerCase() : si.productId,
          sku: si.sku,
          priceUsd: Number(si.priceUsd) || 0,
          status: "active",
          availability: si.isAvailable ? "in-stock" : "out-of-stock",
          primaryImageUrl: si.imageUrl,
          imageAlt: si.name,
          summary: "",
          isFeatured: false,
          rating: 5,
          reviewCount: 0,
        } as unknown as Product,
      }));
      dispatch(setCartItems(hydratedItems));
    }
  }, [isAuthenticated, items.length, serverCart?.items, dispatch]);

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
        // Graceful fallback
      }
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
