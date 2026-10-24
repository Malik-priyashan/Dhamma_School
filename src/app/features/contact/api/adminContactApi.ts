import { fetchWithAuth } from '../../auth/api/authApi';
import type { AdminReplyPayload, DeleteAdminContactThreadPayload, MarkAdminContactThreadReadPayload } from '../types/contact.types';
import { contactTarget, readResponsePayload } from './contactTransport';
export async function fetchAdminContactMessages() {
  const candidates = ['', '/admin', '/messages'];
  let lastError = 'Failed to fetch contact messages.';

  for (const candidatePath of candidates) {
    const res = await fetchWithAuth(contactTarget(candidatePath), {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    });

    if (res.ok) {
      return readResponsePayload(res);
    }

    const text = await res.text().catch(() => '');
    lastError = text || `Failed to fetch contact messages with status ${res.status}`;

    // If endpoint does not exist, continue trying fallback candidates.
    if (res.status !== 404) {
      throw new Error(lastError);
    }
  }

  throw new Error(lastError);
}

export async function sendAdminContactReply(payload: AdminReplyPayload) {
  const trimmedSenderName = payload.senderName.trim();
  const trimmedReply = payload.replyMessage.trim();
  const cleanedUserId = payload.userId?.trim() || '';
  const cleanedAdminUserId = payload.adminUserId?.trim() || cleanedUserId;
  const cleanedReplyToUserId = payload.replyToUserId?.trim() || '';
  const cleanedStudentIds = Array.isArray(payload.studentIds) ? payload.studentIds.filter(Boolean) : [];
  const cleanedThreadTargetUserId = cleanedReplyToUserId || cleanedStudentIds[0] || '';

  const body = {
    contactId: payload.contactId,
    id: payload.contactId,
    name: trimmedSenderName,
    userId: cleanedAdminUserId || undefined,
    userID: cleanedAdminUserId || undefined,
    adminUserId: cleanedAdminUserId || undefined,
    adminUserID: cleanedAdminUserId || undefined,
    customerUserId: cleanedThreadTargetUserId || undefined,
    submittedByUserId: cleanedAdminUserId || undefined,
    createdByUserId: cleanedAdminUserId || undefined,
    authorUserId: cleanedAdminUserId || undefined,
    replyToUserId: cleanedThreadTargetUserId || undefined,
    recipientUserId: cleanedThreadTargetUserId || undefined,
    targetUserId: cleanedThreadTargetUserId || undefined,
    parentUserId: cleanedThreadTargetUserId || undefined,
    studentIds: cleanedStudentIds,
    studentId: cleanedStudentIds[0] ?? null,
    senderName: trimmedSenderName,
    adminSenderName: trimmedSenderName,
    replyMessage: trimmedReply,
    reply: trimmedReply,
    message: trimmedReply,
    messageContent: trimmedReply,
    content: trimmedReply,
    role: 'ADMIN',
    source: 'admin-message-center',
    channel: 'web-chat',
    deliveryStatus: 'sent',
  };

  const candidates: Array<{ path: string; method: 'POST' | 'PATCH' }> = [
    { path: '/reply', method: 'POST' },
    { path: `/${payload.contactId}/reply`, method: 'POST' },
    { path: `/${payload.contactId}`, method: 'PATCH' },
    { path: '', method: 'POST' },
  ];

  let lastError = 'Failed to send admin reply.';

  for (const candidate of candidates) {
    const res = await fetchWithAuth(contactTarget(candidate.path), {
      method: candidate.method,
      credentials: 'include',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      return readResponsePayload(res);
    }

    const text = await res.text().catch(() => '');
    lastError = text || `Failed to send admin reply with status ${res.status}`;
  }

  throw new Error(lastError);
}

export async function deleteAdminContactThread(payload: DeleteAdminContactThreadPayload) {
  const cleanedContactId = payload.contactId.trim();
  const cleanedThreadId = payload.threadId?.trim() || '';
  const cleanedUserId = payload.userId?.trim() || '';
  const cleanedAdminUserId = payload.adminUserId?.trim() || cleanedUserId;
  const cleanedReplyToUserId = payload.replyToUserId?.trim() || '';
  const cleanedStudentIds = Array.isArray(payload.studentIds) ? payload.studentIds.filter(Boolean) : [];
  const cleanedSenderName = payload.senderName?.trim() || 'Admin';

  const body = {
    contactId: cleanedContactId,
    id: cleanedContactId,
    threadId: cleanedThreadId || undefined,
    userId: cleanedAdminUserId || undefined,
    userID: cleanedAdminUserId || undefined,
    adminUserId: cleanedAdminUserId || undefined,
    adminUserID: cleanedAdminUserId || undefined,
    customerUserId: cleanedAdminUserId || undefined,
    submittedByUserId: cleanedAdminUserId || undefined,
    createdByUserId: cleanedAdminUserId || undefined,
    replyToUserId: cleanedReplyToUserId || undefined,
    recipientUserId: cleanedReplyToUserId || undefined,
    targetUserId: cleanedReplyToUserId || undefined,
    parentUserId: cleanedReplyToUserId || undefined,
    studentIds: cleanedStudentIds,
    studentId: cleanedStudentIds[0] ?? null,
    senderName: cleanedSenderName,
    adminSenderName: cleanedSenderName,
    role: 'ADMIN',
    source: 'admin-message-center',
    channel: 'web-chat',
  };

  // Prefer thread-scoped paths first (likely to remove full conversation), then fallbacks.
  const candidates: Array<{ path: string; method: 'DELETE' }> = [];

  if (cleanedThreadId && cleanedThreadId !== cleanedContactId) {
    candidates.push(
      { path: `/thread/${cleanedThreadId}`, method: 'DELETE' },
      { path: `/messages/${cleanedThreadId}`, method: 'DELETE' },
      { path: `/admin/${cleanedThreadId}`, method: 'DELETE' },
      { path: `/${cleanedThreadId}`, method: 'DELETE' },
    );
  }

  // Then try contactId-scoped endpoints as additional fallbacks.
  candidates.push(
    { path: `/thread/${cleanedContactId}`, method: 'DELETE' },
    { path: `/messages/${cleanedContactId}`, method: 'DELETE' },
    { path: `/admin/${cleanedContactId}`, method: 'DELETE' },
    { path: `/${cleanedContactId}`, method: 'DELETE' },
  );

  let lastError = 'Failed to delete admin chat.';

  // Try all candidate endpoints. Some backends may return 400 for certain ids
  // (e.g. "uuid is expected") — don't stop on client errors so we can
  // attempt alternative endpoint shapes that might accept the id.
  for (const candidate of candidates) {
    const res = await fetchWithAuth(contactTarget(candidate.path), {
      method: candidate.method,
      credentials: 'include',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      return readResponsePayload(res);
    }

    const text = await res.text().catch(() => '');
    lastError = text || `Failed to delete admin chat with status ${res.status}`;

    // Continue trying other candidates even when we see client errors (400/422),
    // because some backends provide multiple endpoint shapes and one may succeed.
  }

  throw new Error(lastError);
}

export async function markAdminContactThreadRead(payload: MarkAdminContactThreadReadPayload) {
  const cleanedContactId = payload.contactId.trim();
  const cleanedThreadId = payload.threadId?.trim() || '';
  const cleanedUserId = payload.userId?.trim() || '';
  const cleanedAdminUserId = payload.adminUserId?.trim() || cleanedUserId;
  const cleanedReplyToUserId = payload.replyToUserId?.trim() || '';
  const cleanedStudentIds = Array.isArray(payload.studentIds) ? payload.studentIds.filter(Boolean) : [];
  const cleanedSenderName = payload.senderName?.trim() || 'Admin';
  const readAt = payload.readAt?.trim() || new Date().toISOString();

  const body = {
    contactId: cleanedContactId,
    id: cleanedContactId,
    threadId: cleanedThreadId || undefined,
    userId: cleanedAdminUserId || undefined,
    userID: cleanedAdminUserId || undefined,
    adminUserId: cleanedAdminUserId || undefined,
    adminUserID: cleanedAdminUserId || undefined,
    replyToUserId: cleanedReplyToUserId || undefined,
    recipientUserId: cleanedReplyToUserId || undefined,
    targetUserId: cleanedReplyToUserId || undefined,
    parentUserId: cleanedReplyToUserId || undefined,
    studentIds: cleanedStudentIds,
    studentId: cleanedStudentIds[0] ?? null,
    senderName: cleanedSenderName,
    adminSenderName: cleanedSenderName,
    status: 'READ',
    readStatus: 'READ',
    isRead: true,
    hasBeenRead: true,
    readAt,
    openedAt: readAt,
    lastOpenedAt: readAt,
    role: 'ADMIN',
    source: 'admin-message-center',
    channel: 'web-chat',
  };

  const candidates: Array<{ path: string; method: 'PATCH' | 'POST' }> = [
    { path: `/${cleanedContactId}/read`, method: 'PATCH' },
    { path: `/read/${cleanedContactId}`, method: 'PATCH' },
    { path: '/read', method: 'POST' },
    { path: '/status', method: 'PATCH' },
    { path: `/${cleanedContactId}`, method: 'PATCH' },
  ];

  if (cleanedThreadId && cleanedThreadId !== cleanedContactId) {
    candidates.push(
      { path: `/${cleanedThreadId}`, method: 'PATCH' },
      { path: `/${cleanedThreadId}/read`, method: 'PATCH' },
    );
  }

  let lastError = 'Failed to mark admin chat as read.';

  for (const candidate of candidates) {
    const res = await fetchWithAuth(contactTarget(candidate.path), {
      method: candidate.method,
      credentials: 'include',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      return readResponsePayload(res);
    }

    const text = await res.text().catch(() => '');
    lastError = text || `Failed to mark admin chat as read with status ${res.status}`;

    if (res.status !== 404) {
      throw new Error(lastError);
    }
  }

  throw new Error(lastError);
}
