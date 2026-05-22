"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { StudentForm } from "../../features/studentform";
import { fetchCurrentUser } from "../../features/auth/api/authApi";
import { getUserRole } from "../../../lib/authUtils";
import LoadingPage from "../../components/ui/LoadingPage";

export default function JoinUsPage() {
  const router = useRouter();
  const locale = useLocale();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function syncAuth() {
      try {
        await fetchCurrentUser();
        const role = getUserRole();
        
        if (role !== 'STUDENT') {
          router.push(`/${locale}`);
          return;
        }

        if (isMounted) {
          setIsAuthenticated(true);
        }
      } catch {
        if (isMounted) {
          setIsAuthenticated(false);
          router.push(`/${locale}/login`);
        }
      }
    }

    syncAuth();

    return () => {
      isMounted = false;
    };
  }, [locale, router]);

  if (isAuthenticated === null) return <LoadingPage />;
  if (!isAuthenticated) return null;

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#e0f2fe_0,#f8fafc_34%,#fff7ed_100%)] pb-16">
      <div className="pointer-events-none absolute left-0 top-0 h-72 w-72 rounded-full bg-sky-200/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-amber-200/30 blur-3xl" />
      <div className="relative px-4">
        <StudentForm />
      </div>
    </main>
  );
}
