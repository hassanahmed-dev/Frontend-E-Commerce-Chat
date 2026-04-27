"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  askAdminAi,
  ConversationNode,
  createAdminConversation,
  deleteConversationPermanentlyById,
  getAdminConversations,
  getConversationMessages,
  MessageNode,
  renameConversationById
} from "@/lib/api";
import { useAuth } from "@/lib/auth";

function formatDate(value: string | null) {
  if (!value) return "--";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "--";
  return parsed.toLocaleString(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
}

function getUiErrorMessage(error: unknown, fallback: string): string {
  const raw = error instanceof Error ? error.message : "";
  if (!raw) return fallback;

  const normalized = raw.toLowerCase();
  const isProviderQuotaError =
    normalized.includes("resource_exhausted") ||
    normalized.includes("quota exceeded") ||
    normalized.includes("rate limit") ||
    normalized.includes("too many requests") ||
    normalized.includes("code\": 429") ||
    normalized.includes("retrydelay");

  if (isProviderQuotaError) {
    return "AI limit reached right now.";
  }

  if (normalized.includes("gemini request failed") || normalized.includes("groq request failed")) {
    return "AI service is temporarily unavailable. Please try again shortly.";
  }

  return raw.length > 180 ? `${raw.slice(0, 177)}...` : raw;
}

export default function AdminChatsPage() {
  const { token } = useAuth();
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const [conversations, setConversations] = useState<ConversationNode[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageNode[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [search, setSearch] = useState("");
  const [newChatName, setNewChatName] = useState("");
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isAskingAi, setIsAskingAi] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [menuConversationId, setMenuConversationId] = useState<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [editChatName, setEditChatName] = useState("");
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [isDeletingChat, setIsDeletingChat] = useState(false);
  const [feedback, setFeedback] = useState("");

  const authorization = token ? `Bearer ${token}` : "";

  const loadConversations = async () => {
    if (!authorization) return;
    setIsLoadingConversations(true);
    try {
      const list = await getAdminConversations({
        authorization
      });
      setConversations(list);

      if (!list.length) {
        setSelectedId(null);
        setMessages([]);
      } else if (!selectedId || !list.some((conversation) => conversation.id === selectedId)) {
        const latestConversation = [...list].sort((a, b) => {
          const aTime = new Date(a.lastMessageAt ?? a.createdAt).getTime();
          const bTime = new Date(b.lastMessageAt ?? b.createdAt).getTime();
          return bTime - aTime;
        })[0];
        setSelectedId(latestConversation.id);
      }
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Failed to load conversations.");
      setConversations([]);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    if (!authorization) return;
    setIsLoadingMessages(true);
    try {
      const nextMessages = await getConversationMessages({ authorization, conversationId });
      setMessages(nextMessages);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Failed to load messages.");
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    void loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorization]);

  useEffect(() => {
    if (!authorization) return;
    const timeout = window.setTimeout(() => {
      void loadConversations();
    }, 300);
    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    if (!selectedId) return;
    void loadMessages(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, authorization]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages, selectedId]);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedId) ?? null,
    [conversations, selectedId]
  );
  const sortedConversations = useMemo(
    () =>
      [...conversations].sort((a, b) => {
        const aTime = new Date(a.lastMessageAt ?? a.createdAt).getTime();
        const bTime = new Date(b.lastMessageAt ?? b.createdAt).getTime();
        return bTime - aTime;
      }),
    [conversations]
  );
  const filteredConversations = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return sortedConversations;
    return sortedConversations.filter((conversation) => {
      const user = conversation.participants.find((participant) => participant.role === "user")?.user;
      const displayName = conversation.name?.trim() || user?.name || `Chat ${conversation.id.slice(0, 8)}`;
      return displayName.toLowerCase().includes(keyword);
    });
  }, [sortedConversations, search]);

  const customer = selectedConversation?.participants.find((participant) => participant.role === "user")?.user;
  const selectedChatName = selectedConversation
    ? selectedConversation.name?.trim() || customer?.name || `Chat ${selectedConversation.id.slice(0, 8)}`
    : "";

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void loadConversations();
  };

  const handleSend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedId || !messageInput.trim() || !authorization) return;

    setIsAskingAi(true);
    setFeedback("");
    try {
      const response = await askAdminAi({
        authorization,
        conversationId: selectedId,
        prompt: messageInput
      });
      setMessages((prev) => [...prev, response.adminMessage, response.aiMessage]);
      setMessageInput("");
      await loadConversations();
    } catch (error) {
      setFeedback(getUiErrorMessage(error, "Failed to get AI response."));
    } finally {
      setIsAskingAi(false);
    }
  };

  const handleCreateChat = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!authorization || !newChatName.trim()) {
      setFeedback("Chat Name is required to start chat.");
      return;
    }

    setIsCreatingChat(true);
    setFeedback("");
    try {
      const trimmedName = newChatName.trim();
      const createdConversation = await createAdminConversation({
        authorization,
        chatName: trimmedName
      });
      setNewChatName("");
      setSelectedId(createdConversation.id);
      await loadConversations();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Failed to start conversation.");
    } finally {
      setIsCreatingChat(false);
    }
  };

  const openEditModal = (conversation: ConversationNode) => {
    const user = conversation.participants.find((participant) => participant.role === "user")?.user;
    const fallbackName = user?.name || `Chat ${conversation.id.slice(0, 8)}`;
    setActiveConversationId(conversation.id);
    setEditChatName(conversation.name?.trim() || fallbackName);
    setIsDeleteConfirmOpen(false);
    setMenuConversationId(null);
  };

  const handleRenameChat = async () => {
    if (!authorization || !activeConversationId || !editChatName.trim()) return;
    setIsSavingName(true);
    setFeedback("");
    try {
      const updated = await renameConversationById({
        authorization,
        conversationId: activeConversationId,
        chatName: editChatName.trim()
      });
      setConversations((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setActiveConversationId(null);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Failed to rename chat.");
    } finally {
      setIsSavingName(false);
    }
  };

  const handleDeleteChat = async () => {
    if (!authorization || !activeConversationId) return;
    setIsDeletingChat(true);
    setFeedback("");
    try {
      await deleteConversationPermanentlyById({
        authorization,
        conversationId: activeConversationId
      });
      setConversations((prev) => prev.filter((item) => item.id !== activeConversationId));
      if (selectedId === activeConversationId) {
        setSelectedId(null);
        setMessages([]);
      }
      setActiveConversationId(null);
      setIsDeleteConfirmOpen(false);
      await loadConversations();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Failed to delete chat.");
    } finally {
      setIsDeletingChat(false);
    }
  };

  return (
    <AdminShell title="Chats">
      <section className="grid h-[82vh] gap-4 lg:grid-cols-[360px_1fr]">
        <article className="surface-card flex h-full min-h-0 flex-col p-4">
          <form onSubmit={handleSearch} className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search chat by name"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
            <button type="submit" className="btn-secondary w-full justify-center text-sm">
              Search
            </button>
          </form>

          <form onSubmit={handleCreateChat} className="mt-4 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Start New Chat</p>
            <input
              value={newChatName}
              onChange={(event) => setNewChatName(event.target.value)}
              placeholder="Chat Name (required)"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
            
            <button type="submit" className="btn-primary w-full justify-center text-sm" disabled={isCreatingChat}>
              {isCreatingChat ? "Starting..." : "Start Chat"}
            </button>
          </form>

          <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto">
            {isLoadingConversations ? (
              <p className="text-sm text-slate-500">Loading conversations...</p>
            ) : (
              filteredConversations.map((conversation) => {
                const user = conversation.participants.find((participant) => participant.role === "user")?.user;
                const displayName = conversation.name?.trim() || user?.name || `Chat ${conversation.id.slice(0, 8)}`;
                return (
                  <button
                    key={conversation.id}
                    onClick={() => setSelectedId(conversation.id)}
                    className={`relative w-full rounded-lg border p-3 text-left transition ${
                      selectedId === conversation.id ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">{displayName}</p>
                      <button
                        type="button"
                        className="rounded px-2 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                        onClick={(event) => {
                          event.stopPropagation();
                          setMenuConversationId((prev) => (prev === conversation.id ? null : conversation.id));
                        }}
                        aria-label="Chat actions"
                      >
                        ...
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">{formatDate(conversation.lastMessageAt ?? conversation.createdAt)}</span>
                    </div>
                    {menuConversationId === conversation.id && (
                      <div
                        className="absolute right-3 top-9 z-20 w-28 rounded-lg border border-slate-200 bg-white p-1 shadow-lg"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="w-full rounded px-2 py-1 text-left text-xs text-slate-700 hover:bg-slate-100"
                          onClick={() => openEditModal(conversation)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="w-full rounded px-2 py-1 text-left text-xs text-red-600 hover:bg-red-50"
                          onClick={() => {
                            setActiveConversationId(conversation.id);
                            setEditChatName(displayName);
                            setMenuConversationId(null);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </button>
                );
              })
            )}
            {!isLoadingConversations && !filteredConversations.length && (
              <p className="text-sm text-slate-500">No conversations found.</p>
            )}
          </div>
        </article>

        <article className="surface-card flex h-full min-h-0 flex-col p-4">
          {!selectedConversation ? (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50">
              <p className="text-sm text-slate-500">Select a conversation to view messages.</p>
            </div>
          ) : (
            <div className="flex h-full min-h-0 flex-col">
              <header className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{selectedChatName}</h2>
                </div>
              </header>

              <div
                ref={messagesContainerRef}
                className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3"
              >
                {isLoadingMessages ? (
                  <p className="text-sm text-slate-500">Loading messages...</p>
                ) : (
                  messages.map((message) => {
                    const isAdmin = message.senderType === "admin";
                    return (
                      <div key={message.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                            isAdmin ? "bg-blue-600 text-white" : "bg-white text-slate-800"
                          }`}
                        >
                          <p>{message.content}</p>
                          <p className={`mt-1 text-[11px] ${isAdmin ? "text-blue-100" : "text-slate-500"}`}>
                            {formatDate(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                {!isLoadingMessages && !messages.length && (
                  <p className="text-sm text-slate-500">No messages yet in this conversation.</p>
                )}
              </div>

              <form
                onSubmit={handleSend}
                className="sticky bottom-0 z-10 mt-4 flex gap-2 border-t border-slate-200 bg-white pt-3"
              >
                <input
                  value={messageInput}
                  onChange={(event) => setMessageInput(event.target.value)}
                  placeholder="Type your reply or ask AI..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  disabled={isAskingAi}
                />
                <button
                  type="submit"
                  className="btn-primary px-4 py-2 text-sm"
                  disabled={isAskingAi}
                >
                  {isAskingAi ? "Thinking..." : "Send"}
                </button>
              </form>
            </div>
          )}

          {feedback && <p className="mt-3 text-sm text-slate-600">{feedback}</p>}
        </article>
      </section>

      {activeConversationId && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-4 shadow-xl">
            {!isDeleteConfirmOpen ? (
              <>
                <h3 className="text-sm font-semibold text-slate-900">Chat Actions</h3>
                <p className="mt-1 text-xs text-slate-500">Edit chat name or permanently delete this chat.</p>

                <label className="mt-4 block text-xs font-medium text-slate-600">Chat name</label>
                <input
                  value={editChatName}
                  onChange={(event) => setEditChatName(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  placeholder="Enter chat name"
                />

                <div className="mt-4 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60"
                    disabled={isDeletingChat || isSavingName}
                    onClick={() => setIsDeleteConfirmOpen(true)}
                  >
                    Delete
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      disabled={isDeletingChat || isSavingName}
                      onClick={() => {
                        setActiveConversationId(null);
                        setIsDeleteConfirmOpen(false);
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn-primary px-3 py-2 text-sm"
                      disabled={isDeletingChat || isSavingName || !editChatName.trim()}
                      onClick={handleRenameChat}
                    >
                      {isSavingName ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-sm font-semibold text-slate-900">Confirm Permanent Delete</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Is chat ka sara data permanently delete hoga. Is action ko undo nahi kiya ja sakta.
                </p>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    disabled={isDeletingChat}
                    onClick={() => setIsDeleteConfirmOpen(false)}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60"
                    disabled={isDeletingChat}
                    onClick={handleDeleteChat}
                  >
                    {isDeletingChat ? "Deleting..." : "Yes, Delete"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </AdminShell>
  );
}
