"use client";

import React, { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useUserSession } from "@/hooks/queries/useAuth";
import { Navbar } from "@/components/layout/Navbar";
import { DashboardContext } from "@/lib/context";
import Loading from "@/components/layout/Loading";

export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session, isLoading } = useUserSession();

  const currentUser = session?.user || null;
  const permissions = session?.permissions || session?.role || null;
  const role = session?.role || "read_only";

  useEffect(() => {
    if (!isLoading && session && !session.isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, session, router]);

  const contextValue = React.useMemo(
    () => ({ permissions, role, user: currentUser }),
    [permissions, role, currentUser]
  );

  return (
    <DashboardContext.Provider value={contextValue}>
      <Navbar access={permissions} user={currentUser}>
        <Suspense fallback={<Loading />}>
          {children}
        </Suspense>
      </Navbar>
    </DashboardContext.Provider>
  );
}
