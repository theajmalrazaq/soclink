import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const APP_SETTINGS_QUERY_KEY = ["appSettings"];

export function useAppSettingsQuery() {
  return useQuery({
    queryKey: APP_SETTINGS_QUERY_KEY,
    queryFn: async () => {
      try {
        const res = await fetch("/api/settings");
        if (!res.ok) throw new Error("Failed to fetch settings");
        const json = await res.json();
        return (
          json.settings || {
            id: null,
            induction: true,
            upcomingevent: false,
            upcomingeventstatus: true,
          }
        );
      } catch (err) {
        console.warn("Error fetching appSettings:", err);
        return {
          id: null,
          induction: true,
          upcomingevent: false,
          upcomingeventstatus: true,
        };
      }
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateAppSettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patch: any) => {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Failed to update settings");
      const json = await res.json();
      return json.settings;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(APP_SETTINGS_QUERY_KEY, (oldData: any) => ({
        ...oldData,
        ...data,
      }));
      queryClient.invalidateQueries({ queryKey: APP_SETTINGS_QUERY_KEY });
      toast.success("Settings updated successfully");
    },
    onError: (err: any) => {
      console.error("Error updating appSettings:", err);
      toast.error("Failed to update settings");
    },
  });
}
