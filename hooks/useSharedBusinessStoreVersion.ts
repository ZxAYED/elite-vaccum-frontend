"use client";

import { useEffect, useState } from "react";

import { subscribeSharedBusinessStore } from "@/data/mock/shared-business-store";

export function useSharedBusinessStoreVersion() {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeSharedBusinessStore(() => {
      setVersion((current) => current + 1);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return version;
}
