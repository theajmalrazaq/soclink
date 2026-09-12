import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { getEmailConfig, fetchSmtpConfigFromDB, saveSmtpConfig } from "@/lib/emailConfig";
import { toast } from "sonner";

export const SOCIETY_PROFILE_KEY = ["societyProfile"];
export const SMTP_CONFIG_KEY = ["smtpConfig"];

export function useSocietyProfileQuery() {
  return useQuery({
    queryKey: SOCIETY_PROFILE_KEY,
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return null;

      let currentU: any = null;
      try {
        const res = await fetch("/api/users");
        if (res.ok) {
          const json = await res.json();
          const list = json.users || [];
          currentU = list.find((u: any) => u.email === user.email || u.user_id === user.id);
        }
      } catch (e) {
        console.warn("Could not fetch user record:", e);
      }

      const cfg = getEmailConfig();

      return {
        id: currentU?.id || null,
        name: cfg.brandName || user.user_metadata?.society_name || "",
        username:
          currentU?.society_username ||
          user.user_metadata?.society_username ||
          "",
        email: user.email || cfg.supportEmail || "",
        adminName: currentU?.name || user.user_metadata?.name || user.email?.split("@")[0] || "",
        logoUrl: cfg.logoUrl || "",
        coverUrl: cfg.bannerUrl || "",
        brandingColor: cfg.primaryColor || "#2A43F8",
        instagramUrl: cfg.instagramUrl || "",
        linkedinUrl: cfg.linkedinUrl || "",
      };
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useSmtpConfigQuery() {
  return useQuery({
    queryKey: SMTP_CONFIG_KEY,
    queryFn: async () => {
      const loadedSmtp = await fetchSmtpConfigFromDB();
      return (
        loadedSmtp || {
          user: "",
          pass: "",
          host: "smtp.gmail.com",
          port: 465,
          secure: true,
          fromName: "",
        }
      );
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateSmtpConfigMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (smtpData: any) => {
      await saveSmtpConfig(smtpData);
      return smtpData;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(SMTP_CONFIG_KEY, data);
      toast.success("SMTP Configuration saved successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save SMTP credentials");
    },
  });
}
