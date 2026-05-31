"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { fetchCurrentUser } from "../../features/auth/api/authApi";
import { fetchContactUsMessagesByUser, submitContactUsMessage } from "../../features/contact/api/contactapi";
import { fetchMyStudents } from "../../features/students/api/studentsApi";

const CONTACT_CHAT_STORAGE_KEY_PREFIX = "dhamma_school_contact_chat_v2";

type ChatMessage = {
  id: string;
  text: string;
  sender: "user" | "system";
  status: "sending" | "sent" | "failed";
  timestamp: string;
  createdAt?: string;
  senderName?: string;
};

type CurrentUser = {
  id?: string | number;
  _id?: string | number;
  userId?: string | number;
  userID?: string | number;
  fullName?: string;
  name?: string;
  email?: string;
};

type StoredChatState = {
  chatName?: string;
  nameInput?: string;
  messageInput?: string;
  messages?: ChatMessage[];
};

function toText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
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

function parseDateValue(value: string): number {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function isAdminSenderName(value: unknown): boolean {
  const normalized = toText(value).toLowerCase();
  return normalized === "admin" || normalized.includes("admin");
}

function formatMessageTimestamp(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getContactStorageKey(userId: string) {
  return `${CONTACT_CHAT_STORAGE_KEY_PREFIX}:${userId || "guest"}`;
}

function normalizeStoredMessages(messages: unknown): ChatMessage[] {
  if (!Array.isArray(messages)) return [];

  return messages
    .filter(
      (msg): msg is ChatMessage =>
        Boolean(msg) &&
        typeof (msg as ChatMessage).id === "string" &&
        typeof (msg as ChatMessage).text === "string" &&
        ((msg as ChatMessage).sender === "user" || (msg as ChatMessage).sender === "system") &&
        ((msg as ChatMessage).status === "sending" || (msg as ChatMessage).status === "sent" || (msg as ChatMessage).status === "failed") &&
        typeof (msg as ChatMessage).timestamp === "string",
    )
    .map((msg) => ({
      ...msg,
      status: msg.status === "sending" ? "failed" : msg.status,
    }));
}

function getRecordUserId(record: Record<string, unknown>): string {
  const user = asObject(record.user || record.customer || record.owner);
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

function getReplyTargetUserId(record: Record<string, unknown>): string {
  const user = asObject(record.user || record.customer || record.owner);
  return toText(
    record.replyToUserId ||
      record.recipientUserId ||
      record.targetUserId ||
      record.parentUserId ||
      record.threadUserId ||
      record.originalUserId ||
      user.replyToUserId ||
      user.recipientUserId ||
      user.targetUserId ||
      user.parentUserId,
  );
}

function recordMatchesCurrentUser(record: Record<string, unknown>, userId: string): boolean {
  const normalizedUserId = userId.trim();
  if (!normalizedUserId) return true;

  const recordUserId = getRecordUserId(record);
  const replyTargetUserId = getReplyTargetUserId(record);

  return (
    recordUserId === normalizedUserId ||
    replyTargetUserId === normalizedUserId ||
    (!recordUserId && !replyTargetUserId)
  );
}

function normalizeUserMessages(payload: unknown, userId: string): ChatMessage[] {
  const normalizedUserId = userId.trim();
  const records = collectRecords(payload);
  const messages: ChatMessage[] = [];

  records.forEach((record, index) => {
    if (!recordMatchesCurrentUser(record, normalizedUserId)) {
      return;
    }

    const contactId = toText(record.id || record._id || record.contactId || record.clientMessageId || `contact-${index}`);
    const createdAt = toText(record.createdAt || record.clientSubmittedAt || record.sentAt || record.date || new Date().toISOString());
    const primaryMessageText = toText(record.messageContent || record.message || record.content || record.text);
    const primarySenderName = toText(record.senderName || record.name || record.sender || record.userName);
    const primaryIsAdmin = isAdminSenderName(primarySenderName);

    if (primaryMessageText) {
      messages.push({
        id: `${contactId}-${primaryIsAdmin ? "admin" : "user"}`,
        text: primaryMessageText,
        sender: primaryIsAdmin ? "system" : "user",
        status: "sent",
        timestamp: formatMessageTimestamp(createdAt),
        createdAt,
        senderName: primarySenderName || "",
      });
    }

    const replyText = toText(record.replyMessage || record.reply || record.adminReply || record.response);
    if (replyText) {
      const replyCreatedAt = toText(record.replyCreatedAt || record.updatedAt || createdAt);
      messages.push({
        id: `${contactId}-admin`,
        text: replyText,
        sender: "system",
        status: "sent",
        timestamp: formatMessageTimestamp(replyCreatedAt),
        createdAt: replyCreatedAt,
        senderName: toText(record.adminSenderName || record.repliedByName || "Admin"),
      });
    }

    if (Array.isArray(record.replies)) {
      record.replies.map(asObject).forEach((replyRecord, replyIndex) => {
        const replyMessage = toText(replyRecord.replyMessage || replyRecord.messageContent || replyRecord.message || replyRecord.content);
        if (!replyMessage) return;

        const replyCreatedAt = toText(replyRecord.createdAt || replyRecord.clientSubmittedAt || createdAt);
        const roleText = toText(replyRecord.role).toUpperCase();
        const isAdmin = roleText === "ADMIN";

        messages.push({
          id: `${contactId}-reply-${replyIndex}`,
          text: replyMessage,
          sender: isAdmin ? "system" : "user",
          status: "sent",
          timestamp: formatMessageTimestamp(replyCreatedAt),
          createdAt: replyCreatedAt,
          senderName: toText(replyRecord.senderName || replyRecord.name) || (isAdmin ? "Admin" : ""),
        });
      });
    }
  });

  const deduped = Array.from(
    messages.reduce((map, message) => map.set(message.id, message), new Map<string, ChatMessage>()).values(),
  );

  return deduped.sort((a, b) => parseDateValue(a.createdAt || a.timestamp) - parseDateValue(b.createdAt || b.timestamp));
}

function mergeMessages(existing: ChatMessage[], incoming: ChatMessage[]) {
  return Array.from(
    [...existing, ...incoming].reduce((map, message) => map.set(message.id, message), new Map<string, ChatMessage>()).values(),
  ).sort((a, b) => parseDateValue(a.createdAt || a.timestamp) - parseDateValue(b.createdAt || b.timestamp));
}

function readStoredChatState(userId: string): StoredChatState | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(getContactStorageKey(userId));
    if (!stored) return null;

    const parsed = JSON.parse(stored) as StoredChatState;
    return {
      chatName: typeof parsed.chatName === "string" ? parsed.chatName : "",
      nameInput: typeof parsed.nameInput === "string" ? parsed.nameInput : "",
      messageInput: typeof parsed.messageInput === "string" ? parsed.messageInput : "",
      messages: normalizeStoredMessages(parsed.messages),
    };
  } catch {
    return null;
  }
}

function writeStoredChatState(userId: string, state: StoredChatState) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(
      getContactStorageKey(userId),
      JSON.stringify({
        chatName: state.chatName || "",
        nameInput: state.nameInput || "",
        messageInput: state.messageInput || "",
        messages: state.messages || [],
      }),
    );
  } catch (error) {
    console.error("Failed to persist contact chat state", error);
  }
}

export default function ContactUsPage() {
  const t = useTranslations();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [chatName, setChatName] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUserName, setCurrentUserName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const hasStartedChat = Boolean(chatName.trim());
  const chatSteps = [
    {
      label: t("contact_us_step_1_label"),
      text: t("contact_us_step_1_text"),
    },
    {
      label: t("contact_us_step_2_label"),
      text: t("contact_us_step_2_text"),
    },
    {
      label: t("contact_us_step_3_label"),
      text: t("contact_us_step_3_text"),
    },
  ];

  useEffect(() => {
    let isActive = true;

    async function loadUserContext() {
      try {
        const [studentResult, userResult] = await Promise.allSettled([fetchMyStudents(), fetchCurrentUser()]);

        if (!isActive) return;

        if (studentResult.status === "fulfilled") {
          const ids = studentResult.value
            .map((student) => student.id)
            .filter((studentId): studentId is string => Boolean(studentId));

          setStudentIds(ids);
        } else {
          console.error("Failed to load contact user students", studentResult.reason);
          setStudentIds([]);
        }

        if (userResult.status === "fulfilled") {
          const user = userResult.value as CurrentUser;
          const resolvedUserId = toText(user.id ?? user._id ?? user.userId ?? user.userID);
          const resolvedUserName = toText(user.fullName || user.name || user.email);

          setCurrentUserId(resolvedUserId);
          setCurrentUserName(resolvedUserName);
        } else {
          setCurrentUserId("");
          setCurrentUserName("");
        }
      } catch (error) {
        console.error("Failed to load contact user context", error);
        if (!isActive) return;
        setStudentIds([]);
        setCurrentUserId("");
        setCurrentUserName("");
      }
    }

    loadUserContext();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    const storageUserId = currentUserId.trim();
    const storedState = readStoredChatState(storageUserId);

    if (storedState) {
      if (storedState.chatName) {
        setChatName(storedState.chatName);
        setNameInput(storedState.chatName);
      } else if (storedState.nameInput) {
        setNameInput(storedState.nameInput);
      } else if (currentUserName) {
        setNameInput(currentUserName);
      }

      if (storedState.messageInput) {
        setMessageInput(storedState.messageInput);
      }

      if ((storedState.messages ?? []).length > 0) {
        setMessages(storedState.messages ?? []);
      }
    } else if (currentUserName) {
      setNameInput(currentUserName);
    }

    let isActive = true;

    async function loadRemoteHistory() {
      if (!storageUserId) return;

      try {
        const historyPayload = await fetchContactUsMessagesByUser(storageUserId);
        if (!isActive) return;

        const remoteMessages = normalizeUserMessages(historyPayload, storageUserId);
        if (remoteMessages.length === 0) {
          setMessages([]);
          setChatName("");
          setNameInput(currentUserName || storedState?.nameInput || "");
          return;
        }

        setMessages((currentMessages) => mergeMessages(currentMessages, remoteMessages));

        setChatName((currentChatName) => currentChatName || currentUserName || nameInput || storedState?.nameInput || "");
        setNameInput((currentNameInput) => currentNameInput || currentUserName || storedState?.nameInput || "");
      } catch (error) {
        console.error("Failed to load contact chat history", error);
      }
    }

    loadRemoteHistory();

    return () => {
      isActive = false;
    }
  }, [currentUserId, currentUserName]);

  useEffect(() => {
    writeStoredChatState(currentUserId.trim(), {
      chatName,
      nameInput,
      messageInput,
      messages,
    });
  }, [chatName, currentUserId, messageInput, messages, nameInput]);

  const handleSendMessage = async () => {
    const trimmedName = chatName.trim();
    const trimmedMessage = messageInput.trim();

    if (!trimmedName || !trimmedMessage) {
      setSubmitError("Enter your name to start chat and type a message.");
      return;
    }

    const messageId = `${Date.now()}-${Math.random()}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const createdAt = new Date().toISOString();

    setMessages((prev) => [
      ...prev,
      {
        id: messageId,
        text: trimmedMessage,
        sender: "user",
        status: "sending",
        timestamp,
        createdAt,
        senderName: chatName || nameInput || currentUserName || "",
      },
    ]);

    setMessageInput("");
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await submitContactUsMessage({
        name: trimmedName,
        senderName: trimmedName,
        userId: currentUserId || undefined,
        messageContent: trimmedMessage,
        studentIds,
        clientMessageId: messageId,
        clientSubmittedAt: createdAt,
        deliveryStatus: "sent",
        metadata: {
          ui: "whatsapp-style-chat",
          linkedStudentCount: studentIds.length,
          userId: currentUserId || undefined,
        },
      });

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                status: "sent",
              }
            : msg,
        ),
      );
    } catch (error) {
      console.error("Failed to submit contact us message", error);
      setSubmitError(error instanceof Error ? error.message : "Failed to send message.");
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                status: "failed",
              }
            : msg,
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartChat = () => {
    const trimmedName = nameInput.trim();
    if (!trimmedName) {
      setSubmitError("Please enter your name to start the chat.");
      return;
    }

    setChatName(trimmedName);
    setNameInput(trimmedName);
    setSubmitError(null);

    setMessages((prev) => {
      if (prev.length > 0) return prev;

      return [
        {
          id: `welcome-${Date.now()}`,
          text: `Hi ${trimmedName}, welcome to Dhamma School support. Please type your message below.`,
          sender: "system",
          status: "sent",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          createdAt: new Date().toISOString(),
          senderName: "Dhamma School",
        },
      ];
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSubmitError(null);
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.14),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(34,197,94,0.1),_transparent_24%),linear-gradient(180deg,_#f8fbff_0%,_#eff6ff_58%,_#ffffff_100%)] px-4 pb-16 pt-28 sm:px-6 sm:pt-32 lg:px-8 lg:pt-36">
      <div className="mx-auto max-w-6xl">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/85 shadow-[0_24px_90px_rgba(15,23,42,0.12)] backdrop-blur">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-24 top-12 h-56 w-56 rounded-full bg-sky-200/40 blur-3xl" />
            <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-emerald-200/30 blur-3xl" />
          </div>

          <div className="relative border-b border-slate-100/80 px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-sky-700">{t("contact_us_hero_badge")}</p>
            <div className="mt-4 max-w-3xl">
              <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                {t("contact_us_hero_title")}
              </h1>
              <p className="mt-4 text-base leading-8 text-slate-600 sm:text-lg">
                {t("contact_us_hero_text")}
              </p>
              <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {t("contact_us_notice")}
              </div>
            </div>
          </div>

          <div className="relative grid gap-0 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
              <div className="grid gap-4 md:grid-cols-3">
                {chatSteps.map((item) => (
                  <div key={item.label} className="rounded-[1.5rem] border border-slate-200/80 bg-gradient-to-br from-white to-sky-50/70 p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">{item.label}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-[1.75rem] border border-slate-200/80 bg-slate-950 p-6 text-white shadow-[0_20px_60px_rgba(15,23,42,0.22)]">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-200">{t("contact_us")}</p>
                <h2 className="mt-3 text-2xl font-black tracking-tight">{t("contact_us_support_title")}</h2>
                <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">{t("contact_us_support_text")}</p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  type="button"
                  className="mt-5 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
                >
                  {t("contact_us_start_chat")}
                </button>
              </div>

              <div className="mt-6 rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">
                    {t("contact_us_quick_links")}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{t("contact_us_sidebar_text")}</p>

                  <div className="mt-5 grid gap-3">
                    <a href="mailto:info@dhammaschool.lk" className="group rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-sky-200 hover:bg-sky-50">
                      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{t("contact_us_email")}</div>
                      <div className="mt-1 text-sm font-medium text-slate-800">info@dhammaschool.lk</div>
                    </a>
                    <a href="tel:+94770000000" className="group rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-sky-200 hover:bg-sky-50">
                      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{t("contact_us_phone")}</div>
                      <div className="mt-1 text-sm font-medium text-slate-800">+94 77 000 0000</div>
                    </a>
                    <a href="https://youtube.com" target="_blank" rel="noreferrer" className="group rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-sky-200 hover:bg-sky-50">
                      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{t("contact_us_youtube")}</div>
                      <div className="mt-1 text-sm font-medium text-slate-800">YouTube</div>
                    </a>
                    <a href="https://facebook.com" target="_blank" rel="noreferrer" className="group rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-sky-200 hover:bg-sky-50">
                      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{t("contact_us_facebook")}</div>
                      <div className="mt-1 text-sm font-medium text-slate-800">Facebook</div>
                    </a>
                  </div>
              </div>
            </div>

            <aside className="border-t border-slate-100/80 bg-gradient-to-b from-slate-50 to-white px-6 py-8 sm:px-8 lg:border-l lg:border-t-0 lg:px-10 lg:py-10">
              <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-700">{t("contact_us_sidebar_tag")}</p>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">{t("contact_us_sidebar_title")}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{t("contact_us_sidebar_text")}</p>

                <div className="mt-6 space-y-4">
                  <div className="rounded-2xl bg-sky-50 px-4 py-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">{t("contact_us_sidebar_step_1_label")}</div>
                    <div className="mt-1 text-sm text-slate-700">{t("contact_us_sidebar_step_1_text")}</div>
                  </div>
                  <div className="rounded-2xl bg-emerald-50 px-4 py-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">{t("contact_us_sidebar_step_2_label")}</div>
                    <div className="mt-1 text-sm text-slate-700">{t("contact_us_sidebar_step_2_text")}</div>
                  </div>
                  <div className="rounded-2xl bg-amber-50 px-4 py-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">{t("contact_us_sidebar_step_3_label")}</div>
                    <div className="mt-1 text-sm text-slate-700">{t("contact_us_sidebar_step_3_text")}</div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>

      {/* Chat Bot Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6">
          <div className="flex h-[90vh] w-[90vw] max-w-[92vw] flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl sm:max-w-[78rem]">
            <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-slate-950 via-sky-900 to-emerald-800 px-4 py-3 text-white sm:px-6">
              <div>
                <h2 className="text-base font-bold sm:text-lg">{t("contact_us_modal_title")}</h2>
                <p className="text-xs text-sky-100">
                  {hasStartedChat ? t("contact_us_modal_started", { name: chatName }) : t("contact_us_modal_subtitle")}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-sm font-semibold uppercase tracking-[0.24em] hover:text-sky-100"
              >
                {t("contact_us_close")}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-[#efeae2] px-3 py-4 sm:px-5">
              {!hasStartedChat ? (
                <div className="mx-auto mt-10 max-w-md rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
                  <label className="block text-sm font-semibold text-slate-700">
                    {t("contact_us_name") || "Your Name"}
                  </label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder={t("contact_us_name_placeholder")}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-200"
                  />
                  <button
                    type="button"
                    onClick={handleStartChat}
                    className="mt-4 w-full rounded-xl bg-gradient-to-r from-sky-600 to-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:from-sky-700 hover:to-emerald-700"
                  >
                    {t("contact_us_start_chat")}
                  </button>
                </div>
              ) : (
                <div className="space-y-3 px-1 pb-2 pt-1">
                  {messages.map((msg) => {
                    const isUser = msg.sender === "user";
                    return (
                      <div key={msg.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm sm:max-w-[72%] ${
                            isUser ? "rounded-br-md bg-[#d9fdd3] text-slate-800" : "rounded-bl-md bg-white text-slate-800"
                          }`}
                        >
                          {((msg.senderName || (isUser ? chatName : "")) && (
                            <div className="mb-1 text-[11px] text-slate-500">
                              {msg.senderName || (isUser ? chatName : "")}
                            </div>
                          ))}
                          <p className="whitespace-pre-wrap leading-6">{msg.text}</p>
                          <p className="mt-1 text-right text-[11px] text-slate-500">
                            {msg.timestamp}
                            {isUser && (msg.status === "sending" ? ` · ${t("contact_us_status_sending")}` : msg.status === "failed" ? ` · ${t("contact_us_status_failed")}` : ` · ${t("contact_us_status_sent")}`)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 bg-[#f0f2f5] px-3 py-3 sm:px-4">
              <div className="mb-2 text-[11px] text-slate-600">
                {studentIds.length > 0
                  ? t("contact_us_linked_students", { count: studentIds.length })
                  : t("contact_us_no_linked_students")}
              </div>

              {submitError && (
                <p className="mb-2 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">{submitError}</p>
              )}

              <div className="flex items-center gap-2 rounded-xl bg-white p-2 shadow-sm">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  disabled={!hasStartedChat || isSubmitting}
                  placeholder={hasStartedChat ? t("contact_us_message_placeholder_short") : t("contact_us_message_disabled_placeholder")}
                  className="h-10 flex-1 rounded-lg border border-transparent bg-transparent px-3 text-sm text-slate-900 outline-none transition focus:border-emerald-300 focus:bg-emerald-50/40"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!hasStartedChat || isSubmitting || !messageInput.trim()}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                >
                  {isSubmitting ? t("contact_us_sending") : t("contact_us_send")}
                </button>
                <button
                  onClick={handleCloseModal}
                  type="button"
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  {t("contact_us_close")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
