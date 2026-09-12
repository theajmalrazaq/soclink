import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const INDUCTIONS_QUERY_KEY = ["inductions"];
export const INDUCTIONS_STATS_KEY = ["inductionsStats"];

interface InductionsQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  team?: string;
  search?: string;
}

// Inductions Query with filters and pagination
export function useInductionsQuery({
  page = 0,
  limit = 10,
  status = "all",
  team = "all",
  search = "",
}: InductionsQueryParams = {}) {
  return useQuery({
    queryKey: [...INDUCTIONS_QUERY_KEY, { page, limit, status, team, search }],
    queryFn: async () => {
      const res = await fetch(
        `/api/inductions?page=${page}&limit=${limit}&status=${status}&team=${team}&search=${encodeURIComponent(search)}`
      );
      if (!res.ok) throw new Error("Failed to fetch inductions");
      const json = await res.json();
      return {
        data: json.data || [],
        total: json.total || 0,
      };
    },
    staleTime: 1000 * 60,
  });
}

// Inductions Stats Query for Dashboard / Home
export function useInductionsStatsQuery() {
  return useQuery({
    queryKey: INDUCTIONS_STATS_KEY,
    queryFn: async () => {
      const res = await fetch("/api/inductions?stats=true");
      if (!res.ok) throw new Error("Failed to fetch induction stats");
      const json = await res.json();
      return json.stats || { total: 0, selected: 0, rejected: 0, waiting: 0 };
    },
    staleTime: 1000 * 60 * 3,
  });
}

// Update Induction Applicant Status Mutation
export function useUpdateInductionStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: any; status: any }) => {
      const res = await fetch("/api/inductions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      const json = await res.json();
      return json.induction;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: INDUCTIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: INDUCTIONS_STATS_KEY });
      const statusLabel =
        data.status === true ? "Selected" : data.status === false ? "Rejected" : "Moved to Waiting";
      toast.success(`Applicant status updated to ${statusLabel}`);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update applicant status");
    },
  });
}

// Delete Induction Applicant Mutation
export function useDeleteInductionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: any) => {
      const res = await fetch(`/api/inductions?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete applicant");
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INDUCTIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: INDUCTIONS_STATS_KEY });
      toast.success("Applicant deleted successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete applicant");
    },
  });
}

// Add Induction Applicant Mutation
export function useAddInductionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/inductions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to add applicant");
      const json = await res.json();
      return json.induction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INDUCTIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: INDUCTIONS_STATS_KEY });
      toast.success("Applicant added successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to add applicant");
    },
  });
}

export const useBulkUpdateInductionStatusMutation = useUpdateInductionStatusMutation;
