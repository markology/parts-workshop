"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Send, ArrowLeft, Bot, User } from "lucide-react";
import PageLoader from "@/components/PageLoader";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  revealProgress?: number; // For smooth text reveal animation
}

function AIChatContent({ initialMessage }: { initialMessage: string | null }) {
  const router = useRouter();
  
  const [messages, setMessages] = useState<Message[]>(() => {
    // Check if coming from workspace navigation
    const isFromWorkspace = initialMessage?.trim() === "whats on your mind?";
    
    return [
      {
        id: "1",
        role: "assistant",
        content: initialMessage 
          ? "What's on your mind?"
          : "Hello! I'm here to help you explore your internal world through Internal Family Systems (IFS) therapy. I'll guide you gently as we discover and understand the different parts of yourself. \n\nWhat brings you here today? What's on your mind or heart that you'd like to explore?",
        timestamp: new Date()
      }
    ];
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasAutoSentRef = useRef(false);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToUserMessage = (messageId: string) => {
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    
    if (messageElement) {
      const scrollContainer = document.querySelector('.flex-1.overflow-y-auto');
      
      if (scrollContainer) {
        const messageOffsetTop = (messageElement as HTMLElement).offsetTop;
        const headerHeight = 105;
        const adjustedScrollTop = messageOffsetTop - headerHeight;
        
        // Smooth scroll animation
        scrollContainer.scrollTo({
          top: Math.max(0, adjustedScrollTop),
          behavior: 'smooth'
        });
      }
    }
  };

  const scrollToLatestUserMessage = () => {
    // Find the last user message
    const userMessages = messages.filter(msg => msg.role === "user");
    
    if (userMessages.length > 0) {
      const lastUserMessageId = userMessages[userMessages.length - 1].id;
      
      const messageElement = document.querySelector(`[data-message-id="${lastUserMessageId}"]`);
      
      if (messageElement) {
        const scrollContainer = document.querySelector('.flex-1.overflow-y-auto');
        
        if (scrollContainer) {
          const messageOffsetTop = (messageElement as HTMLElement).offsetTop;
          const headerHeight = 105;
          const adjustedScrollTop = messageOffsetTop - headerHeight;
          
          scrollContainer.scrollTop = Math.max(0, adjustedScrollTop);
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
    // This useEffect is now mainly for debugging
    // The actual scrolling happens in handleSendMessage
  }, [messages, isLoading]);

  const handleSendMessage = useCallback(async (messageText?: string) => {
    const messageToSend = messageText || input.trim();
    if (!messageToSend || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageToSend,
      timestamp: new Date()
    };

    const assistantMessageId = (Date.now() + 1).toString();

    setMessages(prev => [...prev, userMessage]);
    if (!messageText) setInput("");
    setIsLoading(true);

    // Scroll to user message immediately after DOM updates
    setTimeout(() => {
      scrollToUserMessage(userMessage.id);
    }, 50); // Much faster scroll

    // Create a placeholder for the assistant message with typing indicator after scroll
    setTimeout(() => {
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: "...",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    }, 100); // Delay loading dots until after scroll

    try {
      const response = await fetch("/api/ai/ifs-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userMessage: messageToSend,
          mapContext: {} // We'll add context later
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      // Additional delay before streaming starts
      await new Promise(resolve => setTimeout(resolve, 1000));

      const decoder = new TextDecoder();
      let fullContent = "";
      let displayedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;

        // Update content with smooth reveal effect
        displayedContent = fullContent;
        
        // Update the assistant message with the new content
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, content: displayedContent, revealProgress: Math.min(displayedContent.length / 50, 1) }
            : msg
        ));
        
        // Smooth reveal timing
        await new Promise(resolve => setTimeout(resolve, 40));
      }

    } catch (error) {
      console.error("Error sending message:", error);
      // Update the assistant message with error content
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment." }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading]);

  // Auto-send initial message if provided (only once)
  useEffect(() => {
    if (initialMessage && initialMessage.trim() && !hasAutoSentRef.current) {
      hasAutoSentRef.current = true;
      
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

        // Create a placeholder for the assistant message with typing indicator
        const assistantMessageId = (Date.now() + 1).toString();
        const assistantMessage: Message = {
          id: assistantMessageId,
          role: "assistant",
          content: "...",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);

        // For workspace navigation, show custom message instead of API call
        if (initialMessage.trim() === "whats on your mind?") {
          // Simulate typing effect for the custom message
          const customMessage = "What's on your mind?";
          let displayedContent = "";
          
          for (let i = 0; i < customMessage.length; i++) {
            displayedContent += customMessage[i];
            
            // Update the assistant message with the new content
            setMessages(prev => prev.map(msg => 
              msg.id === assistantMessageId 
                ? { ...msg, content: displayedContent, revealProgress: Math.min(displayedContent.length / 50, 1) }
                : msg
            ));
            
            // Smooth reveal timing
            await new Promise(resolve => setTimeout(resolve, 40));
          }
          
          setIsLoading(false);
          return;
        }

        try {
          const response = await fetch("/api/ai/ifs-session", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ userMessage: initialMessage.trim() }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to send message: ${response.status} - ${errorText}`);
          }

          // Handle streaming response
          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error("No response body");
          }

          // Additional delay before streaming starts
          await new Promise(resolve => setTimeout(resolve, 1000));

          const decoder = new TextDecoder();
          let fullContent = "";
          let displayedContent = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            fullContent += chunk;

            // Update content with smooth reveal effect
            displayedContent = fullContent;
            
            // Update the assistant message with the new content
            setMessages(prev => prev.map(msg => 
              msg.id === assistantMessageId 
                ? { ...msg, content: displayedContent, revealProgress: Math.min(displayedContent.length / 50, 1) }
                : msg
            ));
            
            // Smooth reveal timing
            await new Promise(resolve => setTimeout(resolve, 40));
          }

        } catch (error) {
          console.error("Error sending message:", error);
          // Update the assistant message with error content
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment." }
              : msg
          ));
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
            onClick={() => router.push("/workspaces")}
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
                    ? "text-white bg-amber-600"
                    : "text-gray-200 bg-gray-800"
                }`}
                style={message.role === "user" ? {
                  padding: "12px 20px"
                } : {
                  padding: "12px 20px"
                }}
              >
                <div className="flex items-start space-x-3">
                  {message.role === "assistant" && (
                    <div className="p-1 bg-blue-600 rounded-full mt-1">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}
                       <div className="flex-1">
                         <p className="whitespace-pre-wrap leading-relaxed">
                           {message.content === "..." ? (
                             <div className="flex items-center pt-3">
                               <div className="flex space-x-1">
                                 <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                                 <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                                 <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                               </div>
                             </div>
                           ) : (
                             <div 
                               className="relative"
                               style={{
                                 background: message.revealProgress && message.revealProgress < 1 
                                   ? `linear-gradient(90deg, transparent 0%, transparent ${(message.revealProgress * 100)}%, rgba(24, 24, 24, 0.8) ${(message.revealProgress * 100)}%, rgba(24, 24, 24, 0.8) 100%)`
                                   : 'none'
                               }}
                             >
                               {message.content}
                             </div>
                           )}
                         </p>
                       </div>
                </div>
              </div>
              </div>
            </div>
          ))}
          
          
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

function SearchParamsWrapper() {
  const searchParams = useSearchParams();
  const initialMessage = searchParams?.get('message') || null;
  
  return <AIChatContent initialMessage={initialMessage} />;
}

export default function AIChatPage() {
  return (
    <Suspense
      fallback={
        <PageLoader
          title="Connecting to the Studio Assistant"
          subtitle="We’re spinning up a fresh conversation so you can dive right in."
          message="Initializing chat experience..."
        />
      }
    >
      <SearchParamsWrapper />
    </Suspense>
  );
}
