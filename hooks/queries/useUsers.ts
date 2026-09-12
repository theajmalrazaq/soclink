import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { USER_SESSION_QUERY_KEY } from "./useAuth";

export const USERS_QUERY_KEY = ["users"];

export function useUsersQuery() {
  return useQuery({
    queryKey: USERS_QUERY_KEY,
    queryFn: async () => {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      const json = await res.json();
      return json.users || [];
    },
    staleTime: 1000 * 60 * 2,
  });
}

// Create User Mutation
export function useCreateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, email, password, role, permissionMatrix }: any) => {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role, permissionMatrix }),
      });
      if (!res.ok) throw new Error("Failed to create user");
      const json = await res.json();
      return json.user;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      toast.success(`User ${data?.name || "account"} created successfully!`);
    },
    onError: (err: any) => {
      console.error("Create User Error:", err);
      toast.error(err.message || "Failed to create user");
    },
  });
}

// Update User Permissions / Role Mutation
export function useUpdateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, permissions, role }: any) => {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, permissions, role }),
      });
      if (!res.ok) throw new Error("Failed to update user");
      const json = await res.json();
      return json.user;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: USER_SESSION_QUERY_KEY });
      toast.success(`Updated permissions for ${data?.name || "user"}`);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update permissions");
    },
  });
}

// Delete User Mutation
export function useDeleteUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (user: any) => {
      const res = await fetch(`/api/users?id=${user.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete user");
      return user;
    },
    onSuccess: (user: any) => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      toast.success(`Deleted user ${user?.name || ""}`);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete user");
    },
  });
}
