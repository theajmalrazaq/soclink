"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { queryClient } from "@/lib/queryClient";
import { USER_SESSION_QUERY_KEY } from "@/hooks/queries/useAuth";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  const router = useRouter();
  const [_loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email ? String(email) : "",
        password: password ? String(password) : "",
      });
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: USER_SESSION_QUERY_KEY });
      router.push("/");
    } catch (err: any) {
      toast(
        <div>
          <strong>Login Failed!!</strong>
          <div>{err?.message || "Check your details and try again."}</div>
        </div>,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm onSubmit={handleLogin} />
      </div>
    </div>
  );
}
