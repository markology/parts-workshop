"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Send, ArrowLeft, Bot, User } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function AIChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMessage = searchParams?.get('message');
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm here to help you explore your internal world through Internal Family Systems (IFS) therapy. I'll guide you gently as we discover and understand the different parts of yourself. \n\nWhat brings you here today? What's on your mind or heart that you'd like to explore?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasAutoSentRef = useRef(false);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToLatestUserMessage = () => {
    console.log("🔍 scrollToLatestUserMessage called");
    console.log("📝 Messages:", messages.length);
    
    // Find the last user message
    const userMessages = messages.filter(msg => msg.role === "user");
    console.log("👤 User messages:", userMessages.length);
    
    if (userMessages.length > 0) {
      const lastUserMessageId = userMessages[userMessages.length - 1].id;
      console.log("🎯 Last user message ID:", lastUserMessageId);
      
      const messageElement = document.querySelector(`[data-message-id="${lastUserMessageId}"]`);
      console.log("📍 Message element found:", !!messageElement);
      
      if (messageElement) {
        // Get the scrollable container
        const scrollContainer = document.querySelector('.flex-1.overflow-y-auto');
        console.log("📦 Scroll container found:", !!scrollContainer);
        
        if (scrollContainer) {
          // Get the offset of the message from the top of its container
          const messageOffsetTop = messageElement.offsetTop;
          
          // Account for the header height + some extra padding (approximately 105px total)
          const headerHeight = 105;
          const adjustedScrollTop = messageOffsetTop - headerHeight;
          
          console.log("📏 Message offset top:", messageOffsetTop);
          console.log("📏 Adjusted scroll top:", adjustedScrollTop);
          console.log("📏 Current scroll top:", scrollContainer.scrollTop);
          
          // Scroll to position the message at the top of the chat area (below header)
          scrollContainer.scrollTop = Math.max(0, adjustedScrollTop);
          console.log("✅ Scrolled to:", scrollContainer.scrollTop);
        }
      }
    }
  };

  // Helper function to determine if we should show a timestamp
  const shouldShowTimestamp = (currentIndex: number) => {
    if (currentIndex === 0) return true; // Always show timestamp for first message
    
    const currentMessage = messages[currentIndex];
    const previousMessage = messages[currentIndex - 1];
    
    // Show timestamp if there's a 20+ minute gap
    const timeDiff = currentMessage.timestamp.getTime() - previousMessage.timestamp.getTime();
    const twentyMinutes = 20 * 60 * 1000; // 20 minutes in milliseconds
    
    return timeDiff >= twentyMinutes;
  };

  // Helper function to format timestamp
  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(timestamp.getFullYear(), timestamp.getMonth(), timestamp.getDate());
    
    if (messageDate.getTime() === today.getTime()) {
      // Today - show time only
      return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      // Different day - show date and time
      return timestamp.toLocaleDateString() + ' ' + timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  useEffect(() => {
    // Only scroll to latest user message when a user sends a message
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "user") {
        // Small delay to ensure DOM is updated
        setTimeout(() => {
          scrollToLatestUserMessage();
        }, 100);
      }
      // Don't scroll for assistant messages - let them appear naturally
    }
  }, [messages]);

  const handleSendMessage = useCallback(async (messageText?: string) => {
    const messageToSend = messageText || input.trim();
    if (!messageToSend || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    if (!messageText) setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/ifs-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userMessage: input.trim(),
          mapContext: {} // We'll add context later
        }),
      });
      console.log(response);

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      console.log({data});
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response_text || "I'm sorry, I couldn't process that. Could you try rephrasing your question?",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading]);

  // Auto-send initial message if provided (only once)
  useEffect(() => {
    if (initialMessage && initialMessage.trim() && !hasAutoSentRef.current) {
      hasAutoSentRef.current = true;
      console.log("Auto-sending initial message:", initialMessage);
      
      // Send the message directly without using handleSendMessage to avoid dependency issues
      const sendInitialMessage = async () => {
        const userMessage: Message = {
          id: Date.now().toString(),
          role: "user",
          content: initialMessage.trim(),
          timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
          console.log("Sending to API:", { userMessage: initialMessage.trim() });
          const response = await fetch("/api/ai/ifs-session", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ userMessage: initialMessage.trim() }),
          });

          console.log("API response status:", response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error("API Error:", errorText);
            throw new Error(`Failed to send message: ${response.status} - ${errorText}`);
          }

          const data = await response.json();
          console.log("API response data:", data);
          
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: data.response_text || "I'm here to help you explore your internal world.",
            timestamp: new Date()
          };

          setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
          console.error("Error sending message:", error);
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMessage]);
        } finally {
          setIsLoading(false);
        }
      };

      sendInitialMessage();
    }
  }, [initialMessage]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-screen text-white flex flex-col" style={{ background: "#181818" }}>
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">IFS Therapy Guide</h1>
              <p className="text-sm text-gray-400">Exploring your internal world</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages - Scrollable area */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-6" style={{ paddingBottom: "100vh" }}>
          {messages.map((message, index) => (
            <div key={message.id} data-message-id={message.id}>
              {/* Show timestamp separator if needed */}
              {shouldShowTimestamp(index) && (
                <div className="flex justify-center my-4">
                  <div className="bg-gray-800 text-gray-400 text-xs px-3 py-1 rounded-full">
                    {formatTimestamp(message.timestamp)}
                  </div>
                </div>
              )}
              
              <div
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
              <div
                className={`max-w-[80%] rounded-2xl ${
                  message.role === "user"
                    ? "text-white"
                    : "text-gray-200"
                }`}
                style={message.role === "user" ? {
                  background: "darkgoldenrod",
                  padding: "12px 20px"
                } : {}}
              >
                <div className="flex items-start space-x-3">
                  {message.role === "assistant" && (
                    <div className="p-1 bg-blue-600 rounded-full mt-1">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </p>
                  </div>
                </div>
              </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 text-gray-100 rounded-2xl px-6 py-4">
                <div className="flex items-center space-x-3">
                  <div className="p-1 bg-blue-600 rounded-full">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input - Fixed at bottom */}
      <div className="bg-gray-900 border-t border-gray-800 px-6 py-4 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="flex space-x-4">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Share what's on your mind..."
              className="flex-1 bg-gray-800 text-white placeholder-gray-400 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={1}
              style={{ minHeight: "48px", maxHeight: "120px" }}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
