import { createClient } from "@supabase/supabase-js";

function getSupabaseConfig(): { url: string; key: string } {
  if (typeof window !== "undefined") {
    const customUrl = localStorage.getItem("custom_supabase_url");
    const customKey = localStorage.getItem("custom_supabase_anon_key");
    if (customUrl && customKey) {
      return {
        url: customUrl.trim(),
        key: customKey.trim(),
      };
    }
  }

  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    "";

  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    "";

  return { url, key };
}

const config = getSupabaseConfig();

export const supabase = createClient(
  config.url || "https://placeholder.supabase.co",
  config.key || "placeholder"
);
export const Supabase = supabase;
export default supabase;
