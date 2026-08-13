"use client";

import { useEffect, useState } from "react";

import { subscribeSharedAdminScheduleState } from "@/data/mock/admin-schedule-state";

export function useSharedAdminScheduleStateVersion() {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeSharedAdminScheduleState(() => {
      setVersion((current) => current + 1);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return version;
}
