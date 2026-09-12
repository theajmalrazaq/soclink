import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const EMAILS_QUERY_KEY = ["emails"];

interface EmailsQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export function useEmailsQuery({ page = 0, limit = 10, status = "all", search = "" }: EmailsQueryParams = {}) {
  return useQuery({
    queryKey: [...EMAILS_QUERY_KEY, { page, limit, status, search }],
    queryFn: async () => {
      const res = await fetch(
        `/api/emails?page=${page}&limit=${limit}&status=${status}&search=${encodeURIComponent(search)}`
      );
      if (!res.ok) throw new Error("Failed to fetch emails");
      const json = await res.json();
      return {
        data: json.data || [],
        total: json.total || 0,
      };
    },
    staleTime: 1000 * 60,
  });
}

// Update Email Status Mutation
export function useUpdateEmailStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: number | string; status: any }) => {
      const res = await fetch("/api/emails", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      const json = await res.json();
      return json.email;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMAILS_QUERY_KEY });
      toast.success("Message status updated");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update status");
    },
  });
}

// Delete Email / Contact Inquiry Mutation
export function useDeleteEmailMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number | string) => {
      const res = await fetch(`/api/emails?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete email inquiry");
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMAILS_QUERY_KEY });
      toast.success("Inquiry deleted successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete inquiry");
    },
  });
}
