import { fetchWithAuth } from '../../auth/api/authApi';
import type { ContactUsPayload } from '../types/contact.types';
import { contactTarget, readResponsePayload } from './contactTransport';
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

  const res = await fetchWithAuth(contactTarget(), {
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
  if (!cleanedUserId) {
    return [];
  }

  const res = await fetchWithAuth(contactTarget('/my-messages'), {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
  });

  if (res.ok) {
    return readResponsePayload(res);
  }

  const text = await res.text().catch(() => '');
  throw new Error(text || `Failed to fetch contact messages with status ${res.status}`);
}
