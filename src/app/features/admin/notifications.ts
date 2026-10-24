import { fetchAllStudentRequests } from "../studentrequest/api/studentRequestsApi";
import { fetchAllPrefects } from "../prefectboard/api/prefectboardapi";
import { fetchAllAnnouncing } from "../announcing/api/announcingApi";
import { fetchAdminContactMessages } from "../contact/api/adminContactApi";

export type NotificationKind = "student" | "prefect" | "announcing" | "message";

export type AdminNotification = {
  id: string;
  kind: NotificationKind;
  screen: string;
  title: string;
  detail: string;
  createdAt: string;
  href: string;
  isRead?: boolean;
};

type RecordValue = Record<string, unknown>;

const object = (value: unknown): RecordValue =>
  value && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : {};
const text = (value: unknown): string =>
  typeof value === "string" || typeof value === "number" ? String(value).trim() : "";

function records(payload: unknown): RecordValue[] {
  if (Array.isArray(payload)) return payload.map(object);
  const root = object(payload);
  for (const value of [root.data, root.items, root.results, root.messages, root.contacts]) {
    if (Array.isArray(value)) return value.map(object);
    const nested = object(value);
    if (Array.isArray(nested.data)) return nested.data.map(object);
  }
  return [];
}

function dateOf(record: RecordValue): string {
  return text(record.createdAt || record.clientSubmittedAt || record.sentAt || record.date);
}

function idOf(record: RecordValue): string {
  return text(record.id || record._id || record.requestId || record.contactId || record.clientMessageId);
}

function pendingNotifications(payload: unknown, kind: Exclude<NotificationKind, "message">, screen: string, href: string): AdminNotification[] {
  return records(payload).flatMap((record) => {
    if (text(record.status).toUpperCase() !== "PENDING") return [];
    const id = idOf(record);
    if (!id) return [];
    const title = text(record.fullNameWithSurname || record.fullName || record.nameWithInitials || record.name) || "New application";
    return [{ id: `${kind}:${id}`, kind, screen, title, detail: `New ${screen.toLowerCase()} application`, createdAt: dateOf(record), href }];
  });
}

function isAdmin(record: RecordValue): boolean {
  const role = text(record.role).toUpperCase();
  const sender = text(record.senderName || record.name).toLowerCase();
  return role === "ADMIN" || sender === "admin";
}

function messageNotifications(payload: unknown): AdminNotification[] {
  return records(payload).flatMap((record) => {
    const contactId = idOf(record);
    if (!contactId) return [];
    const sender = text(record.senderName || record.name || record.userName) || "New sender";
    const incoming: AdminNotification[] = [];
    const add = (message: RecordValue, id: string, fallbackDate: string) => {
      if (isAdmin(message)) return;
      const body = text(message.messageContent || message.message || message.content || message.text || message.replyMessage);
      if (!body) return;
      incoming.push({
        id: `message:${contactId}:${id}`,
        kind: "message",
        screen: "Messages",
        title: text(message.senderName || message.name) || sender,
        detail: body,
        createdAt: dateOf(message) || fallbackDate,
        href: "/admin/messages",
        isRead: text(message.status || message.readStatus).toUpperCase() === "READ" || message.isRead === true,
      });
    };
    add(record, "original", dateOf(record));
    for (const [index, value] of (Array.isArray(record.replies) ? record.replies : []).entries()) {
      const reply = object(value);
      if (!reply.role && !reply.senderName && !reply.name) continue;
      add(reply, `reply:${idOf(reply) || index}`, dateOf(record));
    }
    return incoming;
  });
}

export async function fetchAdminNotifications(): Promise<{ items: AdminNotification[]; failedSources: string[] }> {
  const sources = await Promise.allSettled([
    fetchAllStudentRequests(1, 100, "PENDING"),
    fetchAllPrefects({ status: "PENDING", page: 1, limit: 100 }),
    fetchAllAnnouncing({ status: "PENDING", page: 1, limit: 100 }),
    fetchAdminContactMessages(),
  ]);
  const names = ["Student Requests", "Prefect Board", "Announcing", "Messages"];
  const collected = sources.flatMap((result, index) => {
    if (result.status !== "fulfilled") return [];
    switch (index) {
      case 0: return pendingNotifications(result.value, "student", names[index], "/admin/student-requests");
      case 1: return pendingNotifications(result.value, "prefect", names[index], "/admin/prefects");
      case 2: return pendingNotifications(result.value, "announcing", names[index], "/admin/announcing");
      default: return messageNotifications(result.value);
    }
  });
  const items = [...new Map(collected.map((item) => [item.id, item])).values()]
    .sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0));
  return { items, failedSources: names.filter((_, index) => sources[index].status === "rejected") };
}
