import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const LEADS_QUERY_KEY = ["leads"];
export const LEAD_MEMBERS_KEY = (leadId: any) => ["leadMembers", leadId];

interface LeadsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}

// Fetch all lead categories enriched with member count
export function useLeadsQuery({ page = 0, limit = 10, search = "" }: LeadsQueryParams = {}) {
  return useQuery({
    queryKey: [...LEADS_QUERY_KEY, { page, limit, search }],
    queryFn: async () => {
      const res = await fetch(`/api/leads?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
      if (!res.ok) throw new Error("Failed to fetch leads");
      const json = await res.json();
      return {
        leads: json.leads || [],
        total: json.total || 0,
      };
    },
    staleTime: 1000 * 60 * 2,
  });
}

// Create lead category mutation
export function useCreateLeadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (title: string) => {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error("Failed to create lead category");
      const json = await res.json();
      return json.lead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEADS_QUERY_KEY });
      toast.success("Lead category created successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create lead category");
    },
  });
}

// Update lead category mutation
export function useUpdateLeadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, title }: { id: any; title: string | null }) => {
      const res = await fetch("/api/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, title }),
      });
      if (!res.ok) throw new Error("Failed to update lead category");
      const json = await res.json();
      return json.lead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEADS_QUERY_KEY });
      toast.success("Lead category updated successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update lead category");
    },
  });
}

// Delete lead category mutation
export function useDeleteLeadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: any) => {
      const res = await fetch(`/api/leads?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete lead category");
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEADS_QUERY_KEY });
      toast.success("Lead category deleted");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete lead category");
    },
  });
}

// Fetch members under a specific lead category
export function useLeadMembersQuery(leadId: any) {
  return useQuery({
    queryKey: LEAD_MEMBERS_KEY(leadId),
    queryFn: async () => {
      if (!leadId) return [];
      const res = await fetch(`/api/leads/${leadId}/members`);
      if (!res.ok) throw new Error("Failed to fetch lead members");
      const json = await res.json();
      return json.members || [];
    },
    enabled: Boolean(leadId),
    staleTime: 1000 * 60 * 2,
  });
}

// Add member to lead category
export function useAddLeadMemberMutation(leadId: any) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberPayload: any) => {
      const res = await fetch(`/api/leads/${leadId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(memberPayload),
      });
      if (!res.ok) throw new Error("Failed to add member");
      const json = await res.json();
      return json.member;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEAD_MEMBERS_KEY(leadId) });
      queryClient.invalidateQueries({ queryKey: LEADS_QUERY_KEY });
      toast.success("Member added successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to add member");
    },
  });
}

// Update member in lead category
export function useUpdateLeadMemberMutation(leadId: any) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...patch }: any) => {
      const res = await fetch(`/api/leads/${leadId}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      if (!res.ok) throw new Error("Failed to update member");
      const json = await res.json();
      return json.member;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEAD_MEMBERS_KEY(leadId) });
      toast.success("Member updated successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update member");
    },
  });
}

// Delete member from lead category
export function useDeleteLeadMemberMutation(leadId: any) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberId: any) => {
      const res = await fetch(`/api/leads/${leadId}/members?memberId=${memberId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete member");
      return memberId;
    },
    onSuccess: (memberId) => {
      queryClient.setQueryData(
        LEAD_MEMBERS_KEY(leadId),
        (old: any[]) => old?.filter((m) => m.id !== memberId) || [],
      );
      queryClient.invalidateQueries({ queryKey: LEADS_QUERY_KEY });
      toast.success("Member deleted");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete member");
    },
  });
}

export const useCreateLeadMemberMutation = useAddLeadMemberMutation;
