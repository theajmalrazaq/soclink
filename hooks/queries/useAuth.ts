import { apiFetch } from "@/lib/apiFetch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { saveEmailConfig } from "@/lib/emailConfig";

export const USER_SESSION_QUERY_KEY = ["userSession"];

export function useUserSession() {
  return useQuery({
    queryKey: USER_SESSION_QUERY_KEY,
    queryFn: async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return {
          user: null,
          role: null,
          permissions: null,
          isAuthenticated: false,
        };
      }

      let res = await apiFetch("/api/me");
      if (res.status === 403 && typeof window !== "undefined") {
        const pending = localStorage.getItem("socflow_pending_setup");
        let setup: any = null;
        try { setup = pending ? JSON.parse(pending) : null; } catch { localStorage.removeItem("socflow_pending_setup"); }
        if (!setup && user.user_metadata?.society_name) {
          setup = {
            name: user.user_metadata.name || user.user_metadata.society_name,
            email: user.email,
            config: { brandName: user.user_metadata.society_name, supportEmail: user.email },
          };
        }
        if (setup && setup.email?.toLowerCase() === user.email?.toLowerCase()) {
            const bootstrap = await apiFetch("/api/users", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: setup.name, email: setup.email }),
            });
            if (bootstrap.ok) {
              try { await saveEmailConfig(setup.config, true); } catch (error) { console.warn("Could not save initial branding", error); }
              localStorage.removeItem("socflow_pending_setup");
              res = await apiFetch("/api/me");
            }
        }
      }
      if (!res.ok) {
        return { user: null, role: null, permissions: null, isAuthenticated: false };
      }
      const { user: account } = await res.json();
      const userData = {
        id: account.id,
        userId: account.userId || user.id,
        name: account.name || user.email?.split("@")[0] || "User",
        email: user.email || account.email || "",
        role: account.role || "Member",
      };
      const permissions = account.permissions || account.role;

      const sessionResult = {
        user: userData,
        role: userData.role,
        permissions,
        isAuthenticated: true,
      };

      return sessionResult;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
