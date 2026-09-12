import { useQuery } from "@tanstack/react-query";
export const DASHBOARD_QUERY_KEY = ["dashboardHome"];

export function useDashboardDataQuery() {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEY,
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      const json = await res.json();
      return json;
    },
    staleTime: 1000 * 60 * 2,
  });
}
