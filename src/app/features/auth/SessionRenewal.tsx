"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { fetchCurrentUser, renewSessionIfNeeded, sessionNeedsRenewal } from './api/authApi';

export default function SessionRenewal() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname?.includes('/login') || pathname?.includes('/register')) return;

    let active = true;
    let checking = false;
    let interval: ReturnType<typeof setInterval> | undefined;

    async function checkSession() {
      if (!active || checking || !sessionNeedsRenewal()) return;
      checking = true;
      try {
        await renewSessionIfNeeded();
      } finally {
        checking = false;
      }
    }

    function onVisibilityChange() {
      if (document.visibilityState === 'visible') void checkSession();
    }

    // The header uses the same shared request. Start renewing only after a
    // server-verified session is present, including one recovered on page load.
    void fetchCurrentUser().then(() => {
      if (!active) return;
      void checkSession();
      interval = setInterval(() => void checkSession(), 60_000);
      document.addEventListener('visibilitychange', onVisibilityChange);
    }).catch(() => {});

    return () => {
      active = false;
      if (interval) clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [pathname]);

  return null;
}
