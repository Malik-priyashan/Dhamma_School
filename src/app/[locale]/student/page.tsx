"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { AnnouncingForm } from "../../features/announcing";
import { fetchCurrentUser } from "../../features/auth/api/authApi";
import { getUserRole } from "../../../lib/authUtils";
import LoadingPage from "../../components/ui/LoadingPage";

export default function AnnouncingPage() {
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
    <main className="min-h-screen py-12 bg-slate-50">
      <div className="px-4">
        <AnnouncingForm />
      </div>
    </main>
  );
}
