"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getUserConversations,
  getUserChatMessages,
  userStartSupportChat,
  userSendMessage,
  type ConversationNode,
  type MessageNode
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { FiMessageCircle, FiSend, FiX } from "react-icons/fi";

type WidgetState = "closed" | "list" | "chat";

export function SupportChatWidget() {
  const { user, token, isReady } = useAuth();

  const [widgetState, setWidgetState] = useState<WidgetState>("closed");
  const [conversations, setConversations] = useState<ConversationNode[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationNode | null>(null);
  const [messages, setMessages] = useState<MessageNode[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (messages.length) scrollToBottom();
  }, [messages]);

  const loadConversations = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await getUserConversations(`Bearer ${token}`);
      setConversations(data);
      const newCount = data.filter((c) => c.status === "open").length;
      setUnreadCount(newCount);
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const openWidget = async () => {
    if (widgetState === "closed") {
      setWidgetState("list");
      await loadConversations();
    } else {
      setWidgetState("closed");
    }
  };

  const openConversation = async (conversation: ConversationNode) => {
    if (!token) return;
    setActiveConversation(conversation);
    setWidgetState("chat");
    setMessages([]);
    setLoading(true);
    try {
      const data = await getUserChatMessages(conversation.id, `Bearer ${token}`);
      setMessages(data);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = async () => {
    if (!token) return;
    setSending(true);
    try {
      const conversation = await userStartSupportChat(`Bearer ${token}`);
      setConversations((prev) => [conversation, ...prev]);
      await openConversation(conversation);
    } catch {
      // silent
    } finally {
      setSending(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !token || !activeConversation || sending) return;
    const content = input.trim();
    setInput("");
    setSending(true);
    try {
      const message = await userSendMessage({
        authorization: `Bearer ${token}`,
        conversationId: activeConversation.id,
        content
      });
      setMessages((prev) => [...prev, message]);
    } catch {
      setInput(content);
    } finally {
      setSending(false);
    }
  };

  if (!isReady || !user || user.role !== "user") return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Widget panel */}
      {widgetState !== "closed" && (
        <div className="flex h-[420px] w-80 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between bg-blue-600 px-4 py-3 text-white">
            {widgetState === "chat" && activeConversation ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setWidgetState("list"); void loadConversations(); }}
                  className="rounded p-0.5 hover:bg-blue-500"
                  aria-label="Back"
                >
                  ‹
                </button>
                <p className="text-sm font-semibold truncate">
                  {activeConversation.name ?? "Support Chat"}
                </p>
              </div>
            ) : (
              <p className="text-sm font-semibold">Support Center</p>
            )}
            <button
              onClick={() => setWidgetState("closed")}
              className="rounded p-1 hover:bg-blue-500"
              aria-label="Close"
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>

          {/* Conversation list */}
          {widgetState === "list" && (
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto">
                {loading && (
                  <p className="p-4 text-xs text-slate-500">Loading conversations...</p>
                )}
                {!loading && conversations.length === 0 && (
                  <div className="p-4 text-center text-xs text-slate-500">
                    <p>No active support threads.</p>
                    <p className="mt-1">Start a new chat below!</p>
                  </div>
                )}
                {!loading && conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => void openConversation(conv)}
                    className="flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50"
                  >
                    <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {conv.name ?? "Support thread"}
                      </p>
                      <p className="text-xs text-slate-500 capitalize">{conv.status}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="border-t border-slate-100 p-3">
                <button
                  onClick={() => void startNewChat()}
                  disabled={sending}
                  className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {sending ? "Starting..." : "+ New Support Chat"}
                </button>
              </div>
            </div>
          )}

          {/* Chat view */}
          {widgetState === "chat" && (
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 space-y-2 overflow-y-auto p-3">
                {loading && <p className="text-xs text-slate-500">Loading messages...</p>}
                {!loading && messages.length === 0 && (
                  <p className="text-center text-xs text-slate-400">Send a message to start the conversation.</p>
                )}
                {messages.map((msg) => {
                  const isUser = msg.senderType === "user";
                  return (
                    <div key={msg.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                          isUser
                            ? "rounded-br-sm bg-blue-600 text-white"
                            : msg.senderType === "ai"
                            ? "rounded-bl-sm bg-purple-100 text-purple-900"
                            : "rounded-bl-sm bg-slate-100 text-slate-800"
                        }`}
                      >
                        {!isUser && (
                          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide opacity-60">
                            {msg.senderType === "ai" ? "AI" : msg.sender?.name ?? "Support"}
                          </p>
                        )}
                        <p className="whitespace-pre-wrap wrap-break-word">{msg.content}</p>
                        <p className="mt-0.5 text-right text-[10px] opacity-60">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-slate-100 p-2">
                <div className="flex items-center gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void handleSend();
                      }
                    }}
                    placeholder="Type a message..."
                    className="flex-1 rounded-full border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() => void handleSend()}
                    disabled={!input.trim() || sending}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40"
                  >
                    <FiSend className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* FAB button */}
      <button
        onClick={() => void openWidget()}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition hover:bg-blue-700 active:scale-95"
        aria-label="Support chat"
      >
        {widgetState !== "closed" ? (
          <FiX className="h-6 w-6" />
        ) : (
          <>
            <FiMessageCircle className="h-6 w-6" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold">
                {unreadCount}
              </span>
            )}
          </>
        )}
      </button>
    </div>
  );
}
