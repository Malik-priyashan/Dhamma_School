"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { fetchCurrentUser } from "../../features/auth/api/authApi";
import { getUserRole } from "../../../lib/authUtils";

export default function AdminPage() {
  const router = useRouter();
  const locale = useLocale();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function syncAuth() {
      try {
        await fetchCurrentUser();
        const role = getUserRole();

        if (role !== 'ADMIN') {
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

  if (!isAuthenticated) return null;

  return (
    <main className="min-h-screen bg-slate-50 flex-1 ml-64 p-8 pt-12">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-slate-900 border-b border-slate-200 pb-4">
          Admin Dashboard
        </h1>
        <p className="text-slate-600">
          Welcome to the Admin Dashboard.
        </p>
      </div>
    </main>
  );
}
