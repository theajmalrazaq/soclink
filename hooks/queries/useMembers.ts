import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const MEMBERS_QUERY_KEY = ["members"];
export const MEMBERS_STATS_KEY = ["membersStats"];

interface MembersQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  team?: string;
  search?: string;
}

export function useMembersQuery({
  page = 0,
  limit = 10,
  status = "all",
  team = "all",
  search = "",
}: MembersQueryParams = {}) {
  return useQuery({
    queryKey: [...MEMBERS_QUERY_KEY, { page, limit, status, team, search }],
    queryFn: async () => {
      const res = await fetch(
        `/api/members?page=${page}&limit=${limit}&status=${status}&team=${team}&search=${encodeURIComponent(search)}`
      );
      if (!res.ok) throw new Error("Failed to fetch members");
      const json = await res.json();
      return {
        data: json.data || [],
        total: json.total || 0,
      };
    },
    staleTime: 1000 * 60,
  });
}

// Members Stats for Home and dashboard
export function useMembersStatsQuery() {
  return useQuery({
    queryKey: MEMBERS_STATS_KEY,
    queryFn: async () => {
      const res = await fetch("/api/members?stats=true");
      if (!res.ok) throw new Error("Failed to fetch member stats");
      const json = await res.json();
      return json.stats || { total: 0, active: 0, inactive: 0 };
    },
    staleTime: 1000 * 60 * 3,
  });
}

// Create Member Mutation
export function useCreateMemberMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberPayload: any) => {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(memberPayload),
      });
      if (!res.ok) throw new Error("Failed to create member");
      const json = await res.json();
      return json.member;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEMBERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: MEMBERS_STATS_KEY });
      toast.success("Member created successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create member");
    },
  });
}

// Update Member Mutation
export function useUpdateMemberMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...patch }: any) => {
      const res = await fetch("/api/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      if (!res.ok) throw new Error("Failed to update member");
      const json = await res.json();
      return json.member;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEMBERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: MEMBERS_STATS_KEY });
      toast.success("Member updated successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update member");
    },
  });
}

export const useUpdateMemberStatusMutation = useUpdateMemberMutation;

// Delete Member Mutation
export function useDeleteMemberMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: any) => {
      const res = await fetch(`/api/members?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete member");
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEMBERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: MEMBERS_STATS_KEY });
      toast.success("Member deleted successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete member");
    },
  });
}
