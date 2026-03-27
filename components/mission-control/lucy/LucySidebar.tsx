"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { cn } from "@/lib/utils/cn";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolActions?: { tool: string; status: "pending" | "done" }[];
  isStreaming?: boolean;
}

interface LucySidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_MESSAGE: Message = {
  id: "lucy-greeting",
  role: "assistant",
  content:
    "Hola! Soy mcLucy, tu chief of operations. ¿En qué te ayudo hoy?",
};

function generateId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function AvatarImage() {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return (
      <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center text-base select-none flex-shrink-0">
        🤖
      </div>
    );
  }

  return (
    <img
      src="/office/mcmonkes-library/001.png"
      alt="mcLucy"
      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
      onError={() => setImgError(true)}
    />
  );
}

function HeaderAvatar() {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return (
      <div className="w-10 h-10 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center text-xl select-none">
        🤖
      </div>
    );
  }

  return (
    <img
      src="/office/mcmonkes-library/001.png"
      alt="mcLucy avatar"
      className="w-10 h-10 rounded-full object-cover"
      onError={() => setImgError(true)}
    />
  );
}

function ToolActionChip({
  tool,
  status,
}: {
  tool: string;
  status: "pending" | "done";
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono border",
        "bg-green-500/10 text-green-400 border-green-500/20"
      )}
    >
      <span className="text-[10px]">⚡</span>
      <span>{tool}</span>
      <span className="text-green-500/60">·</span>
      {status === "pending" ? (
        <span className="flex gap-0.5 items-center">
          <span
            className="w-1 h-1 rounded-full bg-green-400 animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="w-1 h-1 rounded-full bg-green-400 animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="w-1 h-1 rounded-full bg-green-400 animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </span>
      ) : (
        <span className="text-green-400">done</span>
      )}
    </div>
  );
}

function LoadingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      <span
        className="w-2 h-2 rounded-full bg-white/40 animate-bounce"
        style={{ animationDelay: "0ms" }}
      />
      <span
        className="w-2 h-2 rounded-full bg-white/40 animate-bounce"
        style={{ animationDelay: "150ms" }}
      />
      <span
        className="w-2 h-2 rounded-full bg-white/40 animate-bounce"
        style={{ animationDelay: "300ms" }}
      />
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex flex-col gap-1.5 w-full", isUser ? "items-end" : "items-start")}>
      {!isUser && (
        <div className="flex items-center gap-2">
          <AvatarImage />
          <span className="text-xs text-white/40 font-medium tracking-wide">
            mcLucy
          </span>
        </div>
      )}

      <div className={cn("flex flex-col gap-1.5", isUser ? "items-end" : "items-start pl-10")}>
        {message.toolActions && message.toolActions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {message.toolActions.map((action, idx) => (
              <ToolActionChip
                key={`${action.tool}-${idx}`}
                tool={action.tool}
                status={action.status}
              />
            ))}
          </div>
        )}

        {message.content && (
          <div
            className={cn(
              "px-4 py-2.5 text-sm leading-relaxed w-fit max-w-[80%]",
              isUser
                ? "bg-surface-700 text-white/90 rounded-2xl rounded-tr-sm"
                : "bg-surface-800 border border-surface-700 text-white/85 rounded-2xl rounded-tl-sm"
            )}
          >
            <span className="whitespace-pre-wrap" style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}>
              {message.content}
            </span>
            {message.isStreaming && (
              <span className="inline-block w-0.5 h-3.5 bg-green-400 ml-0.5 animate-pulse align-text-bottom" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function LucySidebar({ isOpen, onClose }: LucySidebarProps) {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const adjustTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const lineHeight = 24;
    const maxHeight = lineHeight * 3 + 16;
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, []);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const assistantId = generateId();
    const assistantMessage: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      toolActions: [],
      isStreaming: true,
    };

    setMessages((prev) => [...prev, assistantMessage]);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const historyForApi = [...messages, userMessage]
        .filter((m) => m.id !== "lucy-greeting" && m.content.trim() !== "")
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch("/api/mclucy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: historyForApi }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const body = response.body;
      if (!body) throw new Error("No response body");

      const reader = body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine.startsWith("data:")) continue;

          const jsonStr = trimmedLine.slice(5).trim();
          if (!jsonStr || jsonStr === "[DONE]") continue;

          let event: Record<string, unknown>;
          try {
            event = JSON.parse(jsonStr);
          } catch {
            continue;
          }

          const eventType = event.type as string | undefined;

          if (eventType === "text") {
            const text = (event.text as string) ?? "";
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: m.content + text }
                  : m
              )
            );
          } else if (eventType === "tool_start") {
            const tool = (event.tool as string) ?? "unknown";
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? {
                      ...m,
                      toolActions: [
                        ...(m.toolActions ?? []),
                        { tool, status: "pending" as const },
                      ],
                    }
                  : m
              )
            );
          } else if (eventType === "tool_result") {
            const tool = (event.tool as string) ?? "unknown";
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id !== assistantId) return m;
                const actions = (m.toolActions ?? []).map((a) =>
                  a.tool === tool && a.status === "pending"
                    ? { ...a, status: "done" as const }
                    : a
                );
                return { ...m, toolActions: actions };
              })
            );
          } else if (eventType === "done") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, isStreaming: false } : m
              )
            );
            setIsLoading(false);
          } else if (eventType === "error") {
            const errMsg = (event.message as string) ?? "Error desconocido";
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? {
                      ...m,
                      content:
                        (m.content || "") +
                        (m.content ? "\n" : "") +
                        `[Error: ${errMsg}]`,
                      isStreaming: false,
                    }
                  : m
              )
            );
            setIsLoading(false);
          }
        }
      }

      // Finalize streaming state in case "done" event wasn't received
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, isStreaming: false } : m
        )
      );
    } catch (err) {
      if ((err as Error).name === "AbortError") return;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: "Lo siento, hubo un error al conectar. Intenta de nuevo.",
                isStreaming: false,
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [input, isLoading, messages]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-[420px] max-w-[100vw]",
          "bg-surface-900 border-l border-surface-700",
          "flex flex-col",
          "transform transition-transform duration-300 ease-out",
          "shadow-2xl shadow-black/60",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-label="mcLucy chat"
        aria-modal="true"
      >
        {/* Header */}
        <header className="flex items-center gap-3 px-5 py-4 border-b border-surface-700 flex-shrink-0">
          <HeaderAvatar />
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-semibold text-sm leading-tight tracking-wide">
              mcLucy
            </h2>
            <p className="text-green-400 text-xs mt-0.5 font-medium tracking-widest uppercase opacity-80">
              Chief of Operations
            </p>
          </div>
          {/* Online indicator */}
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.8)]" />
            <span className="text-xs text-white/40">online</span>
          </div>
          <button
            onClick={onClose}
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
              "text-white/50 hover:text-white hover:bg-surface-700",
              "transition-colors duration-150"
            )}
            aria-label="Cerrar chat"
          >
            <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
          </button>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4 scroll-smooth">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {isLoading &&
            messages[messages.length - 1]?.content === "" &&
            messages[messages.length - 1]?.role === "assistant" && (
              <div className="pl-10">
                <div className="bg-surface-800 border border-surface-700 rounded-2xl rounded-tl-sm inline-block">
                  <LoadingDots />
                </div>
              </div>
            )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="flex-shrink-0 border-t border-surface-700 px-4 py-3">
          <div
            className={cn(
              "flex items-end gap-2 rounded-xl border bg-surface-800",
              "border-surface-600 focus-within:border-green-500/50",
              "transition-colors duration-200 px-3 py-2"
            )}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                adjustTextarea();
              }}
              onKeyDown={handleKeyDown}
              placeholder="Escribe un mensaje..."
              rows={1}
              disabled={isLoading}
              className={cn(
                "flex-1 bg-transparent text-sm text-white/90 placeholder:text-white/30",
                "resize-none outline-none leading-6 py-1",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "min-h-[32px] max-h-[88px]"
              )}
              style={{ height: "32px" }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mb-0.5",
                "transition-all duration-150",
                input.trim() && !isLoading
                  ? "bg-green-500 text-white hover:bg-green-400 active:scale-95"
                  : "bg-surface-700 text-white/20 cursor-not-allowed"
              )}
              aria-label="Enviar mensaje"
            >
              <FontAwesomeIcon icon={faPaperPlane} className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-center text-white/20 text-[10px] mt-2 tracking-wide">
            Enter para enviar · Shift+Enter para nueva línea
          </p>
        </div>
      </aside>
    </>
  );
}
