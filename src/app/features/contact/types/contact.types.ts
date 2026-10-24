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
