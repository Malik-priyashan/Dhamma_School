"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { fetchCurrentUser } from "../auth/api/authApi";
import { getUserRole } from "../../../lib/authUtils";
import LoadingPage from "../../components/ui/LoadingPage";
import { deleteAdminContactThread, fetchAdminContactMessages, markAdminContactThreadRead, sendAdminContactReply } from "../contact/api/contactapi";
import { fetchAllStudents } from "../students/api/studentsApi";

type ThreadMessage = {
  id: string;
  senderName: string;
  text: string;
  role: "USER" | "ADMIN";
  createdAt: string;
  status?: string;
};

type ContactThread = {
  threadId: string;
  primaryContactId: string;
  primaryUserId: string;
  senderName: string;
  studentNames: string[];
  studentIds: string[];
  messages: ThreadMessage[];
  updatedAt: string;
};

type AdminThreadReadState = Record<string, string>;

type NewMessageNotice = {
  count: number;
  senderName: string;
  threadId: string;
} | null;

const ADMIN_CONTACT_THREAD_READ_STORAGE_KEY_PREFIX = "dhamma_school_admin_contact_thread_read_v1";

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function toText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function toStringArray(value: unknown): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (typeof entry === "string") return entry.trim();
        if (entry && typeof entry === "object") {
          const rec = entry as Record<string, unknown>;
          return toText(rec.name || rec.studentName || rec.fullNameWithSurname || rec.fullName || rec.id);
        }
        return "";
      })
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);
  }

  return [];
}

function parseDateValue(value: string): number {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function getAdminThreadReadStorageKey(adminUserId: string): string {
  return `${ADMIN_CONTACT_THREAD_READ_STORAGE_KEY_PREFIX}:${adminUserId || "guest"}`;
}

function readAdminThreadReadState(adminUserId: string): AdminThreadReadState {
  if (typeof window === "undefined") return {};

  try {
    const raw = localStorage.getItem(getAdminThreadReadStorageKey(adminUserId));
    if (!raw) return {};

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};

    return Object.entries(parsed as Record<string, unknown>).reduce<AdminThreadReadState>((acc, [key, value]) => {
      if (typeof value === "string" && value) {
        acc[key] = value;
      }
      return acc;
    }, {});
  } catch {
    return {};
  }
}

function writeAdminThreadReadState(adminUserId: string, state: AdminThreadReadState) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(getAdminThreadReadStorageKey(adminUserId), JSON.stringify(state));
  } catch (error) {
    console.error("Failed to persist admin thread read state", error);
  }
}

function getLatestIncomingMessage(thread: ContactThread): ThreadMessage | null {
  for (let index = thread.messages.length - 1; index >= 0; index -= 1) {
    const message = thread.messages[index];
    if (message.role !== "ADMIN") {
      return message;
    }
  }

  return null;
}

function isIncomingMessageUnread(message: ThreadMessage, thread: ContactThread, readState: AdminThreadReadState): boolean {
  if (message.role === "ADMIN") return false;
  if (toText(message.status).toUpperCase() === "READ") return false;

  const lastReadAt = readState[thread.threadId] || "";
  if (!lastReadAt) return true;

  return parseDateValue(message.createdAt) > parseDateValue(lastReadAt);
}

function getUnreadIncomingMessageCount(thread: ContactThread, readState: AdminThreadReadState): number {
  return thread.messages.filter((message) => isIncomingMessageUnread(message, thread, readState)).length;
}

function isThreadUnread(thread: ContactThread, readState: AdminThreadReadState): boolean {
  return getUnreadIncomingMessageCount(thread, readState) > 0;
}

function sortThreadsByUpdatedAt(items: ContactThread[]): ContactThread[] {
  return [...items].sort((a, b) => parseDateValue(b.updatedAt) - parseDateValue(a.updatedAt));
}

function isAdminSenderName(value: unknown): boolean {
  const normalized = toText(value).toLowerCase();
  return normalized === "admin" || normalized.includes("admin");
}

function resolveMessageRole(
  roleValue: unknown,
  senderNameValue: unknown,
): "USER" | "ADMIN" {
  const roleText = toText(roleValue).toUpperCase();
  if (roleText === "ADMIN" && isAdminSenderName(senderNameValue)) return "ADMIN";
  if (isAdminSenderName(senderNameValue)) return "ADMIN";
  return "USER";
}

function getRecordUserId(record: Record<string, unknown>): string {
  const user = asObject(record.user || record.customer || record.owner || record.submittedBy || record.createdBy);
  return toText(
    record.userId ||
      record.userID ||
      record.customerUserId ||
      record.submittedByUserId ||
      record.createdByUserId ||
      record.ownerUserId ||
      record.accountUserId ||
      user.id ||
      user._id ||
      user.userId ||
      user.userID,
  );
}

function getThreadUserId(record: Record<string, unknown>): string {
  const user = asObject(record.user || record.customer || record.owner || record.submittedBy || record.createdBy);
  return toText(
    record.replyToUserId ||
      record.recipientUserId ||
      record.targetUserId ||
      record.parentUserId ||
      record.threadUserId ||
      record.originalUserId ||
      user.id ||
      user._id ||
      user.userId ||
      user.userID ||
      getRecordUserId(record),
  );
}

function collectRecords(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload.map(asObject);
  const root = asObject(payload);

  const possible = [root.data, root.items, root.results, root.messages, root.contacts];
  for (const candidate of possible) {
    if (Array.isArray(candidate)) {
      return candidate.map(asObject);
    }
  }

  return [];
}

function getStudentDisplayName(value: unknown): string {
  const student = asObject(value);
  return toText(student.fullNameWithSurname || student.nameWithInitials || student.fullName || student.name || student.id);
}

function normalizeThreads(payload: unknown): ContactThread[] {
  const records = collectRecords(payload);
  const threadMap = new Map<string, ContactThread>();

  records.forEach((record, index) => {
    const contactId = toText(record.id || record._id || record.contactId || record.clientMessageId || `contact-${index}`);
    const userId = getRecordUserId(record);
    const threadUserId = getThreadUserId(record);
    const senderName = toText(record.senderName || record.name || record.sender || record.userName || "Unknown Sender");
    const recordIsAdmin = resolveMessageRole(record.role, senderName) === "ADMIN";

    const directStudentNames = toStringArray(record.studentNames);
    const nestedStudentNames = toStringArray(record.students);
    const linkedStudentName = getStudentDisplayName(record.student);
    const userStudents = toStringArray(asObject(record.user).students);
    const fallbackStudentIds = toStringArray(record.studentIds || record.studentId);
    const linkedStudentId = toText(asObject(record.student).id);

    const studentNames = Array.from(new Set([...directStudentNames, ...nestedStudentNames, ...userStudents, linkedStudentName, ...fallbackStudentIds].filter(Boolean)));
    const studentIds = Array.from(new Set([...fallbackStudentIds, linkedStudentId].filter(Boolean)));
    const ownerUserId = recordIsAdmin ? threadUserId || userId : userId || threadUserId;
    const studentThreadId = studentIds[0] ? `student:${studentIds[0]}` : "";
    const userThreadId = ownerUserId ? `user:${ownerUserId}` : "";

    const threadKey =
      toText(record.threadId || record.conversationId || record.chatId || record.groupId) ||
      studentThreadId ||
      userThreadId ||
      `${senderName}|${studentNames.join(",") || contactId}`;

    const createdAt =
      toText(record.createdAt || record.clientSubmittedAt || record.sentAt || record.date || new Date().toISOString());

    const primaryMessageText =
      toText(record.messageContent || record.message || record.content || record.text);
    const primaryRole = resolveMessageRole(record.role, senderName);

    const thread =
      threadMap.get(threadKey) ||
      {
        threadId: threadKey,
        primaryContactId: contactId,
        primaryUserId: recordIsAdmin ? threadUserId || contactId : userId || threadUserId || contactId,
        senderName,
        studentNames,
        studentIds,
        messages: [],
        updatedAt: createdAt,
      };

    if (!threadMap.has(threadKey)) {
      threadMap.set(threadKey, thread);
    }

    thread.studentNames = Array.from(new Set([...thread.studentNames, ...studentNames].filter(Boolean)));
    thread.studentIds = Array.from(new Set([...thread.studentIds, ...studentIds].filter(Boolean)));
    if (primaryRole === "USER" && userId) {
      thread.primaryUserId = userId;
    }
    if (thread.senderName === "Unknown Sender" || isAdminSenderName(thread.senderName)) {
      thread.senderName = senderName;
    }

    if (primaryMessageText) {
      thread.messages.push({
        id: `${contactId}-user`,
        senderName: primaryRole === "ADMIN" ? "Admin" : senderName,
        text: primaryMessageText,
        role: primaryRole,
        createdAt,
        status: toText(record.status || record.readStatus),
      });
    }

    const replyText = toText(record.replyMessage || record.reply || record.adminReply || record.response);
    if (replyText) {
      const replySenderName = toText(record.adminSenderName || record.repliedByName || record.repliedBy || "Admin");
      thread.messages.push({
        id: `${contactId}-admin`,
        senderName: replySenderName,
        text: replyText,
        role: resolveMessageRole(record.replyRole || record.role, replySenderName),
        createdAt: toText(record.replyCreatedAt || record.updatedAt || createdAt),
        status: toText(record.replyStatus || record.status || record.readStatus),
      });
    }

    if (Array.isArray(record.replies)) {
      record.replies.map(asObject).forEach((replyRecord, replyIndex) => {
        const replyMessage = toText(replyRecord.replyMessage || replyRecord.messageContent || replyRecord.message || replyRecord.content);
        if (!replyMessage) return;

        const role = resolveMessageRole(replyRecord.role, replyRecord.senderName || replyRecord.name);

        thread.messages.push({
          id: `${contactId}-reply-${replyIndex}`,
          senderName:
            role === "ADMIN"
              ? "Admin"
              : thread.studentNames[0] || toText(replyRecord.senderName || replyRecord.name || senderName),
          text: replyMessage,
          role,
          createdAt: toText(replyRecord.createdAt || replyRecord.clientSubmittedAt || createdAt),
          status: toText(replyRecord.status || replyRecord.readStatus),
        });
      });
    }

    thread.messages.sort((a, b) => parseDateValue(a.createdAt) - parseDateValue(b.createdAt));
    const latest = thread.messages[thread.messages.length - 1];
    thread.updatedAt = latest?.createdAt || createdAt;
  });

  return sortThreadsByUpdatedAt(Array.from(threadMap.values()));
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function looksLikeId(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;

  if (/^[a-f0-9]{24}$/i.test(trimmed)) return true;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(trimmed)) return true;
  if (trimmed.length >= 12 && !trimmed.includes(" ")) return true;

  return false;
}

function resolveStudentNames(values: string[], studentNameById: Record<string, string>): string[] {
  const resolved = values
    .map((value) => {
      const normalized = value.trim();
      if (!normalized) return "";
      if (studentNameById[normalized]) return studentNameById[normalized];
      if (looksLikeId(normalized)) return "";
      return normalized;
    })
    .filter(Boolean);

  return Array.from(new Set(resolved));
}

function getMessageSenderLabel(
  message: ThreadMessage,
  thread: ContactThread,
  studentNameById: Record<string, string>,
): string {
  if (isAdminSenderName(message.senderName)) return "Admin";

  return message.senderName || thread.senderName || resolveStudentNames(thread.studentNames, studentNameById)[0] || "Unknown Sender";
}

export default function AdminMessagesCenterPage() {
  const router = useRouter();
  const locale = useLocale();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [threads, setThreads] = useState<ContactThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string>("");
  const [replyMessage, setReplyMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isDeletingThread, setIsDeletingThread] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [studentNameById, setStudentNameById] = useState<Record<string, string>>({});
  const [adminUserId, setAdminUserId] = useState("");
  const [adminThreadReadState, setAdminThreadReadState] = useState<AdminThreadReadState>({});
  const [newMessageNotice, setNewMessageNotice] = useState<NewMessageNotice>(null);
  const latestIncomingMessageAtRef = useRef(0);

  useEffect(() => {
    let isMounted = true;

    async function syncAuth() {
      try {
        const currentUser = await fetchCurrentUser();
        const role = getUserRole();

        if (role !== "ADMIN") {
          router.push(`/${locale}`);
          return;
        }

        if (isMounted) {
          setAdminUserId(toText((currentUser as Record<string, unknown>).id || (currentUser as Record<string, unknown>)._id || (currentUser as Record<string, unknown>).userId || (currentUser as Record<string, unknown>).userID));
          const readState = readAdminThreadReadState(toText((currentUser as Record<string, unknown>).id || (currentUser as Record<string, unknown>)._id || (currentUser as Record<string, unknown>).userId || (currentUser as Record<string, unknown>).userID));
          setAdminThreadReadState(readState);
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

  const loadThreads = async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }
    setErrorMessage(null);

    try {
      const [payload, allStudents] = await Promise.all([
        fetchAdminContactMessages(),
        fetchAllStudents().catch(() => []),
      ]);

      const nameMap = (Array.isArray(allStudents) ? allStudents : []).reduce<Record<string, string>>((acc, student) => {
        if (!student?.id) return acc;

        const displayName =
          (typeof student.fullNameWithSurname === "string" && student.fullNameWithSurname.trim()) ||
          (typeof student.nameWithInitials === "string" && student.nameWithInitials.trim()) ||
          "";

        if (displayName) {
          acc[student.id] = displayName;
        }

        return acc;
      }, {});

      setStudentNameById(nameMap);
      const normalized = normalizeThreads(payload);
      const incomingMessages = normalized.flatMap((thread) =>
        thread.messages
          .filter((message) => message.role !== "ADMIN")
          .map((message) => ({ thread, message, time: parseDateValue(message.createdAt) })),
      );
      const latestIncomingMessage = incomingMessages.reduce<(typeof incomingMessages)[number] | null>(
        (latest, current) => (!latest || current.time > latest.time ? current : latest),
        null,
      );
      const newIncomingMessagesCount = latestIncomingMessageAtRef.current
        ? incomingMessages.filter((entry) => entry.time > latestIncomingMessageAtRef.current).length
        : 0;

      if (!showLoading && latestIncomingMessage && newIncomingMessagesCount > 0) {
        setNewMessageNotice({
          count: newIncomingMessagesCount,
          senderName: latestIncomingMessage.thread.senderName || "User",
          threadId: latestIncomingMessage.thread.threadId,
        });
      }

      if (latestIncomingMessage) {
        latestIncomingMessageAtRef.current = Math.max(latestIncomingMessageAtRef.current, latestIncomingMessage.time);
      }

      setThreads(normalized);
      setSelectedThreadId((current) =>
        current && normalized.some((thread) => thread.threadId === current) ? current : "",
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load messages.");
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    loadThreads();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const refreshTimer = window.setInterval(() => {
      void loadThreads(false);
    }, 15000);

    return () => window.clearInterval(refreshTimer);
  }, [isAuthenticated]);

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.threadId === selectedThreadId) || null,
    [selectedThreadId, threads],
  );

  const totalUnreadIncomingMessages = useMemo(
    () => threads.reduce((total, thread) => total + getUnreadIncomingMessageCount(thread, adminThreadReadState), 0),
    [adminThreadReadState, threads],
  );

  useEffect(() => {
    if (!selectedThread || !adminUserId) return;

    const latestIncomingMessage = getLatestIncomingMessage(selectedThread);
    const readAt = latestIncomingMessage?.createdAt || selectedThread.updatedAt;
    if (!readAt) return;

    const unreadCount = getUnreadIncomingMessageCount(selectedThread, adminThreadReadState);

    setAdminThreadReadState((current) => {
      const existingReadAt = current[selectedThread.threadId] || "";
      if (parseDateValue(existingReadAt) >= parseDateValue(readAt)) {
        return current;
      }

      const nextState = {
        ...current,
        [selectedThread.threadId]: readAt,
      };
      writeAdminThreadReadState(adminUserId, nextState);
      return nextState;
    });

    if (unreadCount > 0) {
      void markAdminContactThreadRead({
        contactId: selectedThread.primaryContactId,
        threadId: selectedThread.threadId,
        replyToUserId: selectedThread.primaryUserId || selectedThread.studentIds[0] || undefined,
        userId: adminUserId || undefined,
        adminUserId: adminUserId || undefined,
        studentIds: selectedThread.studentIds,
        senderName: "Admin",
        readAt,
      }).catch((error) => {
        console.error("Failed to mark admin contact thread as read", error);
      });
    }
  }, [adminThreadReadState, adminUserId, selectedThread?.threadId, selectedThread?.updatedAt]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const title = "Message Center";
    document.title = totalUnreadIncomingMessages > 0 ? `(${totalUnreadIncomingMessages}) ${title}` : title;
  }, [totalUnreadIncomingMessages]);

  const handleThreadOpen = (threadId: string) => {
    setSelectedThreadId(threadId);
    setNewMessageNotice((current) => (current?.threadId === threadId ? null : current));
  };

  const handleReplySend = async () => {
    if (!selectedThread) return;

    const message = replyMessage.trim();
    const replyToUserId = selectedThread.primaryUserId || selectedThread.studentIds[0] || "";
    const studentIds = selectedThread.studentIds.length > 0
      ? selectedThread.studentIds
      : replyToUserId
        ? [replyToUserId]
        : [];

    if (!message) {
      setErrorMessage("Reply message is required.");
      return;
    }

    setIsSendingReply(true);
    setErrorMessage(null);

    try {
      await sendAdminContactReply({
        contactId: selectedThread.primaryContactId,
        replyToUserId: replyToUserId || undefined,
        userId: adminUserId || undefined,
        adminUserId: adminUserId || undefined,
        studentIds,
        senderName: "Admin",
        replyMessage: message,
      });

      setThreads((prev) =>
        sortThreadsByUpdatedAt(prev.map((thread) => {
          if (thread.threadId !== selectedThread.threadId) return thread;

          const now = new Date().toISOString();
          return {
            ...thread,
            updatedAt: now,
            messages: [
              ...thread.messages,
              {
                id: `local-admin-reply-${Date.now()}`,
                senderName: "Admin",
                text: message,
                role: "ADMIN",
                createdAt: now,
                status: "READ",
              },
            ],
          };
        })),
      );

      setReplyMessage("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to send admin reply.");
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleDeleteThread = async () => {
    if (!selectedThread || isDeletingThread) return;

    const confirmDelete = window.confirm(
      "Delete the full chat history from the database? This removes the conversation for both sides and cannot be undone.",
    );

    if (!confirmDelete) return;

    setIsDeletingThread(true);
    setErrorMessage(null);

    try {
      await deleteAdminContactThread({
        contactId: selectedThread.primaryContactId,
        threadId: selectedThread.threadId,
        replyToUserId: selectedThread.primaryUserId || selectedThread.studentIds[0] || undefined,
        userId: adminUserId || undefined,
        adminUserId: adminUserId || undefined,
        studentIds: selectedThread.studentIds,
        senderName: "Admin",
      });

      // Reload threads from the server to ensure the database deleted the full conversation.
      // If the backend didn't remove all messages, the refreshed list will show remaining items.
      await loadThreads(true);
      setReplyMessage("");
      setSelectedThreadId("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to delete chat.");
    } finally {
      setIsDeletingThread(false);
    }
  };

  if (isAuthenticated === null) return <LoadingPage />;
  if (!isAuthenticated) return null;

  return (
    <main className="min-h-screen overflow-hidden bg-white px-4 pb-4 pt-8 sm:px-6 md:ml-64 md:pt-4">
      <div className="mx-auto flex h-[calc(100vh)] w-full max-w-[96rem] flex-col">
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="border-b border-slate-100 px-5 py-4 sm:px-6 sm:py-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-sky-700">Admin Chat</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Message Center
            </h1>
          </div>

          {errorMessage && (
            <div className="mx-6 mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 sm:mx-8">
              {errorMessage}
            </div>
          )}

          {newMessageNotice && (
            <button
              type="button"
              onClick={() => handleThreadOpen(newMessageNotice.threadId)}
              className="mx-5 mt-4 flex w-[calc(100%-2.5rem)] items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-left text-xs text-rose-800 transition hover:bg-rose-100 sm:mx-6 sm:w-[calc(100%-3rem)]"
            >
              <span>
                {newMessageNotice.count} new message{newMessageNotice.count === 1 ? "" : "s"} from {newMessageNotice.senderName}
              </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Open</span>
            </button>
          )}

          <div className="grid flex-1 min-h-0 gap-0 lg:grid-cols-[330px_minmax(0,1fr)]">
              <aside className="flex min-h-0 flex-col border-b border-emerald-700/10 bg-[#efeae2] px-3 py-3 sm:px-4 lg:border-b-0 lg:border-r lg:px-3">
                <div className="mb-3 flex items-center justify-between rounded-3xl border border-emerald-700/10 bg-white px-3 py-2.5 shadow-sm">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-700">Users</p>
                    <p className="mt-1 text-xs font-semibold text-slate-900">
                    {threads.length} chats
                    {totalUnreadIncomingMessages > 0 && (
                        <span className="ml-2 rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">
                        {totalUnreadIncomingMessages} new
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => loadThreads()}
                  type="button"
                    className="rounded-full bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-emerald-700"
                >
                  Refresh
                </button>
              </div>

              <div className="flex-1 min-h-0 space-y-3 overflow-y-auto pr-1 lg:max-h-none">
                {isLoading ? (
                  <p className="px-4 py-6 text-sm text-slate-600">Loading messages...</p>
                ) : threads.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-slate-600">No messages found.</p>
                ) : (
                  threads.map((thread) => {
                    const active = thread.threadId === selectedThreadId;
                    const lastMessage = thread.messages[thread.messages.length - 1];
                    const userLabel = thread.senderName || resolveStudentNames(thread.studentNames, studentNameById)[0] || "Unknown User";
                    const studentLabel = resolveStudentNames(thread.studentNames, studentNameById).join(", ");
                    const unreadCount = getUnreadIncomingMessageCount(thread, adminThreadReadState);
                    const unread = isThreadUnread(thread, adminThreadReadState);
                    const initials = (userLabel || "U")
                      .split(/\s+/)
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0]?.toUpperCase())
                      .join("") || "U";

                    return (
                      <button
                        key={thread.threadId}
                        type="button"
                        onClick={() => handleThreadOpen(thread.threadId)}
                        className={`w-full rounded-3xl border px-3 py-3 text-left transition ${
                          active
                            ? "border-emerald-200 bg-white shadow-[0_10px_30px_rgba(16,185,129,0.12)]"
                            : "border-emerald-700/10 bg-white hover:-translate-y-0.5 hover:shadow-sm"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-emerald-600 to-emerald-400 text-xs font-bold text-white shadow-sm ring-4 ring-emerald-100">
                            {initials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-xs font-bold text-slate-950">{userLabel}</p>
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${unread ? "bg-rose-100 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
                                {unread ? `${unreadCount} new` : "Read"}
                              </span>
                            </div>
                            {studentLabel && studentLabel !== userLabel && (
                              <p className="mt-1 truncate text-[11px] text-slate-400">{studentLabel}</p>
                            )}
                            <p className="mt-2 line-clamp-1 text-xs text-slate-500">{lastMessage?.text || "No messages"}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </aside>

            <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#efeae2]">
              {!selectedThread ? (
                <div className="flex flex-1 items-center justify-center px-6 text-sm text-slate-500">
                  Select a conversation to open the chat.
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between border-b border-emerald-700/10 bg-emerald-600 px-4 py-2 text-white sm:px-5">
                    <div>
                      <h2 className="text-sm font-bold sm:text-base">Dhamma School Admin Chat</h2>
                      <p className="text-[11px] text-emerald-100">
                        {selectedThread.senderName || resolveStudentNames(selectedThread.studentNames, studentNameById)[0] || "Unknown Sender"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-right text-[10px] text-emerald-100">
                      <div>
                        <p>{selectedThread.messages.length} messages</p>
                        <p>
                          {(() => {
                            const names = resolveStudentNames(selectedThread.studentNames, studentNameById);
                            return names.length > 0 ? names.join(", ") : "No linked students";
                          })()}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleDeleteThread}
                        disabled={isDeletingThread}
                        className="rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-[10px] font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isDeletingThread ? "Deleting..." : "Delete full chat"}
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3 sm:px-5 sm:py-4">
                    <div className="space-y-2.5">
                      {selectedThread.messages.length === 0 ? (
                        <p className="text-sm text-slate-500">No conversation messages available.</p>
                      ) : (
                        selectedThread.messages.map((message) => {
                          const senderLabel = getMessageSenderLabel(message, selectedThread, studentNameById);
                          const isAdmin = isAdminSenderName(senderLabel);

                          return (
                            <div key={message.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                              <div
                                className={`max-w-[86%] rounded-3xl px-3 py-2.5 text-sm shadow-sm sm:max-w-[72%] ${
                                  isAdmin ? "rounded-br-md bg-[#d9fdd3] text-slate-800" : "rounded-bl-md bg-white text-slate-800"
                                }`}
                              >
                                      {((message.senderName || senderLabel) && (
                                        <div className="mb-1 text-[10px] text-slate-500">
                                          {message.senderName || senderLabel}
                                        </div>
                                      ))}
                                      <p className="whitespace-pre-wrap leading-5">{message.text}</p>
                                      <div className="mt-1 flex items-center justify-between gap-3 text-[10px] text-slate-500">
                                        <span>{formatTime(message.createdAt)}</span>
                                      </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="border-t border-slate-200 bg-[#f0f2f5] px-3 py-2 sm:px-4 sm:py-3">
                    <div className="rounded-2xl bg-white p-1.5 shadow-sm">
                      <div className="mb-1.5 text-[10px] text-slate-600">Replies are saved as admin automatically.</div>
                      <div className="flex items-end gap-2">
                        <textarea
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          className="min-h-10 flex-1 resize-none rounded-xl border border-transparent bg-transparent px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-300 focus:bg-emerald-50/40"
                          placeholder="Type a reply"
                        />
                        <button
                          type="button"
                          onClick={handleReplySend}
                          disabled={isSendingReply || !replyMessage.trim()}
                          className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                        >
                          {isSendingReply ? "Sending..." : "Send"}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
