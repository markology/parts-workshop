"use client";

import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useThemeContext } from "@/state/context/ThemeContext";
import { useTheme } from "@/features/workspace/hooks/useTheme";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface StudioAssistantProps {
  isOpen: boolean;
  onClose?: () => void;
  position?: { top: number; right: number } | null;
  className?: string;
  containerRef?: React.RefObject<HTMLDivElement>;
}

export default function StudioAssistant({
  isOpen,
  onClose,
  position,
  className = "",
  containerRef,
}: StudioAssistantProps) {
  const { darkMode } = useThemeContext();
  const theme = useTheme();
  const [searchInput, setSearchInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "assistant-initial",
      role: "assistant",
      content: "Hi! I'm here to help you navigate Parts Studio. Ask me anything."
    }
  ]);
  const [isChatSending, setIsChatSending] = useState(false);
  const expandedInputRef = useRef<HTMLTextAreaElement>(null);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      });
    }
  }, [chatMessages, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && expandedInputRef.current) {
      setTimeout(() => {
        expandedInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const handleSendChat = async () => {
    const trimmedMessage = searchInput.trim();
    if (!trimmedMessage || isChatSending) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmedMessage
    };

    const assistantMessageId = `assistant-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    setChatMessages(prev => [
      ...prev,
      userMessage,
      {
        id: assistantMessageId,
        role: "assistant",
        content: ""
      }
    ]);

    setSearchInput("");
    setIsChatSending(true);

    try {
      const response = await fetch("/api/ai/ifs-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userMessage: trimmedMessage
        })
      });

      if (!response.ok) {
        throw new Error("Failed to reach assistant");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        fullContent += decoder.decode(value, { stream: true });

        const content = fullContent;
        setChatMessages(prev =>
          prev.map(message =>
            message.id === assistantMessageId ? { ...message, content } : message
          )
        );
      }

      setChatMessages(prev =>
        prev.map(message =>
          message.id === assistantMessageId ? { ...message, content: fullContent } : message
        )
      );
    } catch (error) {
      console.error("Chat error:", error);
      setChatMessages(prev =>
        prev.map(message =>
          message.id === assistantMessageId
            ? {
                ...message,
                content:
                  "I'm sorry, I'm having trouble responding right now. Please try again in a moment."
              }
            : message
        )
      );
    } finally {
      setIsChatSending(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  const containerStyle = position
    ? {
        position: "fixed" as const,
        top: `${position.top}px`,
        right: `${position.right}px`,
        width: "100%",
        maxWidth: "448px",
        zIndex: 80,
      }
    : {};

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[60vh] h-auto max-h-[600px] rounded-3xl overflow-hidden overflow-x-hidden flex flex-col shadow-[0_18px_35px_rgba(15,23,42,0.26)] ${className}`}
      style={{
        ...containerStyle,
        background: darkMode 
          ? `linear-gradient(152deg, rgb(29, 29, 30), rgb(28, 31, 35))`
          : `linear-gradient(152deg, rgb(255, 255, 255), rgb(248, 250, 252))`,
      }}
    >
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1.5 rounded-lg transition-colors z-10"
          style={{ color: theme.textSecondary }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.buttonHover;
            e.currentTarget.style.color = theme.textPrimary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = theme.textSecondary;
          }}
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <div className="flex-1 px-6 pt-6 pb-4 flex flex-col min-h-0">
        <div>
          <p
            style={{ fontWeight: 500, fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase' }}
          >
            <span
              style={{
                background: 'linear-gradient(90deg, #be54fe, #6366f1, #0ea5e9)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Studio Assistant
            </span>
          </p>
          <p
            className="mt-3 text-sm leading-relaxed"
            style={{ color: theme.textSecondary }}
          >
            Ask for guidance, shortcuts, or reflections tailored to
            your Parts Studio flow.
          </p>
        </div>

        <div className="mt-5 space-y-3 flex-1 overflow-y-auto overflow-x-hidden pr-1 min-h-0">
          {chatMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className="max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm break-words"
                style={
                  message.role === "user"
                    ? {
                        background:
                          "linear-gradient(135deg, #a855f7, #6366f1)",
                        color: "#ffffff",
                      }
                    : {
                        background: darkMode
                          ? `linear-gradient(152deg, rgb(39, 43, 47), rgb(35, 39, 43))`
                          : `linear-gradient(152deg, rgb(248, 250, 252), rgb(241, 245, 249))`,
                        color: theme.textPrimary,
                      }
                }
              >
                {message.content.trim().length > 0 ? message.content : '...'}
              </div>
            </div>
          ))}
          <div ref={chatMessagesEndRef} />
        </div>
      </div>
      <div className="px-6 pb-6 border-0">
        <div className="relative">
          <textarea
            ref={expandedInputRef}
            autoFocus
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                onClose?.();
              } else if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendChat();
              }
            }}
            placeholder="Ask me anything..."
            className="w-full min-h-[56px] resize-none rounded-xl px-5 py-2 text-sm leading-5 focus:outline-none break-words shadow-inner"
            style={{
              background: darkMode
                ? `linear-gradient(152deg, rgb(39, 43, 47), rgb(35, 39, 43))`
                : `linear-gradient(152deg, rgb(248, 250, 252), rgb(241, 245, 249))`,
              borderColor: theme.border,
              color: theme.textPrimary,
            }}
          />
        </div>
      </div>
    </div>
  );
}

