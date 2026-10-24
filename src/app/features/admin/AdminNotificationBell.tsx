"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { fetchCurrentUser, renewSessionIfNeeded } from "../auth/api/authApi";
import { AdminNotification, fetchAdminNotifications, NotificationKind } from "./notifications";

type SavedState = { read: string[]; deleted: string[] };
type Filter = "all" | NotificationKind;
const STORAGE_PREFIX = "dhamma_school_admin_notifications_v1:";
const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "student", label: "Student Requests" },
  { id: "prefect", label: "Prefect Board" },
  { id: "announcing", label: "Announcing" },
  { id: "message", label: "Messages" },
];

function loadState(key: string): SavedState {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "{}");
    return {
      read: Array.isArray(value.read) ? value.read.filter((id: unknown) => typeof id === "string") : [],
      deleted: Array.isArray(value.deleted) ? value.deleted.filter((id: unknown) => typeof id === "string") : [],
    };
  } catch {
    return { read: [], deleted: [] };
  }
}

function timeLabel(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Recently" : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function AdminNotificationBell({ locale }: { locale: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const savedRef = useRef<SavedState>({ read: [], deleted: [] });
  const refreshInFlight = useRef(false);
  const refreshQueued = useRef(false);
  const [storageKey, setStorageKey] = useState("");
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [saved, setSaved] = useState<SavedState>({ read: [], deleted: [] });
  const [failedSources, setFailedSources] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    let active = true;
    fetchCurrentUser().then((user) => {
      if (!active) return;
      const account = user as Record<string, unknown>;
      const id = account.id || account._id || account.userId || account.userID || account.email;
      if (id) {
        const key = `${STORAGE_PREFIX}${String(id)}`;
        const stored = loadState(key);
        savedRef.current = stored;
        setSaved(stored);
        setStorageKey(key);
      }
    }).catch(() => setIsLoading(false));
    return () => { active = false; };
  }, []);

  const refresh = useCallback(async () => {
    if (!storageKey) return;
    if (refreshInFlight.current) {
      refreshQueued.current = true;
      return;
    }
    refreshInFlight.current = true;
    try {
      do {
        refreshQueued.current = false;
        try {
          const result = await fetchAdminNotifications();
          setItems((current) => [
            ...current.filter((item) => result.failedSources.includes(item.screen)),
            ...result.items,
          ].sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0)));
          setFailedSources(result.failedSources);
        } catch {
          setFailedSources(["Notifications"]);
        }
      } while (refreshQueued.current);
    } finally {
      refreshInFlight.current = false;
      setIsLoading(false);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) return;
    void refresh();
    let active = true;
    let stream: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let reconnectDelay = 2000;
    const connect = async () => {
      if (!active) return;
      await renewSessionIfNeeded().catch(() => false);
      if (!active) return;
      const connection = new EventSource('/api/proxy/notifications/stream', { withCredentials: true });
      stream = connection;
      connection.addEventListener('change', () => {
        if (active && stream === connection) void refresh();
      });
      connection.addEventListener('ready', () => {
        if (!active || stream !== connection) return;
        setIsLive(true);
        reconnectDelay = 2000;
        void refresh();
      });
      connection.addEventListener('error', () => {
        if (!active || stream !== connection) return;
        setIsLive(false);
        connection.close();
        stream = null;
        if (reconnectTimer) clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(() => { void connect(); }, reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, 30000);
      });
    };
    void connect();
    const onVisible = () => { if (document.visibilityState === "visible") void refresh(); };
    const onStorage = (event: StorageEvent) => {
      if (event.key === storageKey) {
        const stored = loadState(storageKey);
        savedRef.current = stored;
        setSaved(stored);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("storage", onStorage);
    return () => {
      active = false;
      stream?.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("storage", onStorage);
    };
  }, [refresh, storageKey]);

  useEffect(() => { setIsOpen(false); }, [pathname]);

  useEffect(() => {
    if (!isOpen) return;
    const onPointer = (event: PointerEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  const save = useCallback((next: SavedState) => {
    savedRef.current = next;
    setSaved(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* Browser storage may be unavailable. */ }
  }, [storageKey]);
  const markRead = useCallback((ids: string[]) => {
    const current = savedRef.current;
    const newIds = ids.filter((id) => !current.read.includes(id));
    if (newIds.length) save({ ...current, read: [...current.read, ...newIds] });
  }, [save]);
  const deleted = useMemo(() => new Set(saved.deleted), [saved.deleted]);
  const read = useMemo(() => new Set(saved.read), [saved.read]);
  const available = useMemo(() => items.filter((item) => !deleted.has(item.id)), [items, deleted]);
  const unreadCount = available.filter((item) => !read.has(item.id) && !item.isRead).length;
  const shown = useMemo(() => filter === "all" ? available : available.filter((item) => item.kind === filter), [available, filter]);

  useEffect(() => {
    if (!isOpen || !listRef.current || typeof IntersectionObserver === "undefined") return;
    const root = listRef.current;
    const observer = new IntersectionObserver((entries) => {
      const seen = entries
        .filter((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.35)
        .map((entry) => (entry.target as HTMLElement).dataset.notificationId)
        .filter((id): id is string => Boolean(id));
      if (seen.length) markRead(seen);
    }, { root, threshold: [0.35] });
    root.querySelectorAll<HTMLElement>("[data-notification-id]").forEach((row) => observer.observe(row));
    return () => observer.disconnect();
  }, [isOpen, shown, markRead]);

  const openNotification = (item: AdminNotification) => {
    markRead([item.id]);
    setIsOpen(false);
    router.push(`/${locale}${item.href}`);
  };
  const removeNotification = (id: string) => {
    const current = savedRef.current;
    save({ ...current, deleted: [...current.deleted, id] });
  };

  return <div ref={panelRef} className="fixed right-4 top-4 z-[60] md:right-8 md:top-6">
    <button type="button" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`} aria-haspopup="dialog" aria-expanded={isOpen}
      onClick={() => { setIsOpen((open) => !open); if (!isOpen) void refresh(); }}
      className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-lg shadow-slate-900/10 transition hover:border-blue-200 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
      <svg aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" /></svg>
      {unreadCount > 0 && <span className="absolute -right-2 -top-2 flex min-h-6 min-w-6 items-center justify-center rounded-full border-2 border-white bg-red-600 px-1 text-[11px] font-bold leading-none text-white" aria-hidden="true">{unreadCount > 99 ? "99+" : unreadCount}</span>}
    </button>

    {isOpen && <section role="dialog" aria-label="Notifications" className="absolute right-0 top-14 flex max-h-[calc(100dvh-5.5rem)] w-[min(calc(100vw-2rem),450px)] flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-2xl shadow-slate-900/20">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <div><h2 className="text-lg font-bold text-slate-900">Notifications</h2><p className="flex items-center gap-2 text-xs text-slate-500">{unreadCount} unread <span aria-label={isLive ? "Live updates connected" : "Live updates disconnected"} title={isLive ? "Live updates connected" : "Live updates disconnected"} className={`h-2 w-2 rounded-full ${isLive ? "bg-emerald-500" : "bg-amber-400"}`} /></p></div>
        <button type="button" aria-label="Close notifications" onClick={() => setIsOpen(false)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900">✕</button>
      </div>
      <div className="flex flex-wrap gap-2 border-b border-slate-100 px-4 py-3" aria-label="Notification screens">
        {filters.map(({ id, label }) => <button key={id} type="button" onClick={() => setFilter(id)} aria-pressed={filter === id}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${filter === id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{label}</button>)}
      </div>
      {available.length > 0 && <div className="flex justify-end gap-3 border-b border-slate-100 px-5 py-2 text-xs font-semibold">
        <button type="button" onClick={() => markRead(available.map((item) => item.id))} className="text-blue-700 hover:underline">Mark all read</button>
        <button type="button" onClick={() => { const current = savedRef.current; save({ ...current, deleted: [...new Set([...current.deleted, ...available.map((item) => item.id)])] }); }} className="text-slate-500 hover:text-red-600 hover:underline">Clear all</button>
      </div>}
      <div ref={listRef} className="min-h-0 overflow-y-auto overscroll-contain px-1 pb-2">
        {failedSources.length > 0 && <p role="status" className="mx-4 mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">Could not refresh {failedSources.join(", ")}. Showing available notifications.</p>}
        {isLoading && <p className="px-5 py-8 text-center text-sm text-slate-500">Loading notifications…</p>}
        {!isLoading && shown.length === 0 && <p className="px-5 py-10 text-center text-sm text-slate-500">No notifications on this screen.</p>}
        {shown.map((item) => <div key={item.id} data-notification-id={!read.has(item.id) && !item.isRead ? item.id : undefined} className={`flex items-start gap-2 border-b border-slate-100 px-3 py-2 last:border-0 ${read.has(item.id) || item.isRead ? "bg-white" : "bg-blue-50/60"}`}>
          <button type="button" onClick={() => openNotification(item)} className="min-w-0 flex-1 rounded-xl px-2 py-2 text-left transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
            <span className="flex flex-wrap items-center gap-2"><span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">{item.screen}</span>{!read.has(item.id) && !item.isRead && <span className="h-2 w-2 rounded-full bg-blue-600" aria-label="Unread" />}</span>
            <span className="mt-1 block break-words text-sm font-bold text-slate-900">{item.title}</span>
            <span className="mt-0.5 block whitespace-pre-wrap break-words text-sm leading-5 text-slate-600">{item.detail}</span>
            <span className="mt-1 block text-[11px] text-slate-400">{timeLabel(item.createdAt)}</span>
          </button>
          <button type="button" aria-label={`Delete notification from ${item.screen}: ${item.title}`} title="Delete notification" onClick={() => removeNotification(item.id)} className="mt-2 rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
            <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M4 7h16M10 11v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3" /></svg>
          </button>
        </div>)}
      </div>
    </section>}
  </div>;
}
