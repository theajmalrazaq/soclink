"use client";

import { createContext, useContext } from "react";

export interface DashboardContextType {
  permissions: any;
  role: string;
  user: any;
}

export const DashboardContext = createContext<DashboardContextType>({
  permissions: null,
  role: "read_only",
  user: null,
});

export function useDashboardContext() {
  return useContext(DashboardContext);
}

// Seamless alias for migrated pages
export const useOutletContext = useDashboardContext;
