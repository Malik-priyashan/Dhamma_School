const CONTACT_PROXY_BASE = '/api/proxy/contact-us';

export type ContactUsPayload = {
  name: string;
  senderName?: string;
  userId?: string;
  messageContent: string;
  studentIds: string[];
  clientMessageId?: string;
  clientSubmittedAt?: string;
  deliveryStatus?: 'sending' | 'sent' | 'failed';
  metadata?: Record<string, unknown>;
};

export type AdminReplyPayload = {
  contactId: string;
  replyToUserId?: string;
  userId?: string;
  adminUserId?: string;
  studentIds?: string[];
  senderName: string;
  replyMessage: string;
};

export type DeleteAdminContactThreadPayload = {
  contactId: string;
  threadId?: string;
  replyToUserId?: string;
  userId?: string;
  adminUserId?: string;
  studentIds?: string[];
  senderName?: string;
};

export type MarkAdminContactThreadReadPayload = {
  contactId: string;
  threadId?: string;
  replyToUserId?: string;
  userId?: string;
  adminUserId?: string;
  studentIds?: string[];
  senderName?: string;
  readAt?: string;
};

function contactTarget(path = '') {
  return `${CONTACT_PROXY_BASE}${path}`;
}

async function readResponsePayload(res: Response) {
  const text = await res.text().catch(() => '');

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function submitContactUsMessage(payload: ContactUsPayload) {
  const cleanedName = (payload.senderName ?? payload.name ?? '').trim();
  const cleanedMessage = payload.messageContent.trim();
  const cleanedStudentIds = Array.isArray(payload.studentIds) ? payload.studentIds.filter(Boolean) : [];
  const cleanedUserId = payload.userId?.trim() || '';

  // Send compatibility aliases and metadata so backend DTO/entity mapping can persist to contacts table reliably.
  const requestPayload = {
    name: cleanedName,
    senderName: cleanedName,
    userId: cleanedUserId || undefined,
    userID: cleanedUserId || undefined,
    customerUserId: cleanedUserId || undefined,
    submittedByUserId: cleanedUserId || undefined,
    createdByUserId: cleanedUserId || undefined,
    messageContent: cleanedMessage,
    message: cleanedMessage,
    content: cleanedMessage,
    studentIds: cleanedStudentIds,
    studentId: cleanedStudentIds[0] ?? null,
    clientMessageId: payload.clientMessageId ?? `${Date.now()}-${Math.random()}`,
    clientSubmittedAt: payload.clientSubmittedAt ?? new Date().toISOString(),
    deliveryStatus: payload.deliveryStatus ?? 'sent',
    channel: 'web-chat',
    source: 'contact-us-page',
    metadata: payload.metadata ?? {},
  };

  const res = await fetch(contactTarget(), {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestPayload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Failed to submit contact us message with status ${res.status}`);
  }

  return readResponsePayload(res);
}

export async function fetchContactUsMessagesByUser(userId: string) {
  const cleanedUserId = userId.trim();
  const candidates = [
    '/my-messages',
    `?userId=${encodeURIComponent(cleanedUserId)}`,
    `?userID=${encodeURIComponent(cleanedUserId)}`,
    `?customerUserId=${encodeURIComponent(cleanedUserId)}`,
    `?replyToUserId=${encodeURIComponent(cleanedUserId)}`,
    `?recipientUserId=${encodeURIComponent(cleanedUserId)}`,
    `?targetUserId=${encodeURIComponent(cleanedUserId)}`,
    `/user/${encodeURIComponent(cleanedUserId)}`,
    `/users/${encodeURIComponent(cleanedUserId)}`,
    '',
  ];

  let lastError = 'Failed to fetch contact messages.';

  for (const candidatePath of candidates) {
    const res = await fetch(contactTarget(candidatePath), {
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

    if (res.status !== 404) {
      throw new Error(lastError);
    }
  }

  throw new Error(lastError);
}

export async function fetchAdminContactMessages() {
  const candidates = ['', '/admin', '/messages'];
  let lastError = 'Failed to fetch contact messages.';

  for (const candidatePath of candidates) {
    const res = await fetch(contactTarget(candidatePath), {
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

  const body = {
    contactId: payload.contactId,
    id: payload.contactId,
    name: trimmedSenderName,
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
    { path: '', method: 'POST' },
    { path: '/reply', method: 'POST' },
    { path: `/${payload.contactId}/reply`, method: 'POST' },
    { path: `/${payload.contactId}`, method: 'PATCH' },
  ];

  let lastError = 'Failed to send admin reply.';

  for (const candidate of candidates) {
    const res = await fetch(contactTarget(candidate.path), {
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

    // Continue trying only when endpoint is missing.
    if (res.status !== 404) {
      throw new Error(lastError);
    }
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
    const res = await fetch(contactTarget(candidate.path), {
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
    const res = await fetch(contactTarget(candidate.path), {
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
