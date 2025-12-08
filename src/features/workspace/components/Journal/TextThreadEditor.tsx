"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useThemeContext } from "@/state/context/ThemeContext";
import { User, SquareUserRound, Plus, ChevronDown, X } from "lucide-react";
import { ImpressionType } from "@/features/workspace/types/Impressions";

interface TextThreadEditorProps {
  content: string;
  onContentChange: (html: string) => void;
  readOnly?: boolean;
  partNodes?: Array<{ id: string; label: string }>;
  allPartNodes?: Array<{ id: string; label: string }>;
  nodeId?: string;
  nodeType?: ImpressionType | "part" | "tension" | "interaction";
}

interface Message {
  id: string;
  speakerId: string;
  text: string;
  timestamp: Date;
}

export default function TextThreadEditor({
  content,
  onContentChange,
  readOnly = false,
  partNodes = [],
  allPartNodes,
  nodeId,
  nodeType,
}: TextThreadEditorProps) {
  const { darkMode } = useThemeContext();
  const [activeSpeaker, setActiveSpeaker] = useState<string>("self");
  const [previousSpeaker, setPreviousSpeaker] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [addedPartIds, setAddedPartIds] = useState<string[]>([]); // Track parts added via dropdown
  const [showAddPartDropdown, setShowAddPartDropdown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Parse content into messages - store as JSON in content
  const messages = useMemo(() => {
    if (!content) return [];
    try {
      // Try to parse as JSON first (new format)
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed.map((msg) => ({
          ...msg,
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
        }));
      }
    } catch {
      // If not JSON, try to parse old bubble format
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, "text/html");
      const bubbles = doc.querySelectorAll(".message-bubble");
      
      const parsedMessages: Message[] = [];
      bubbles.forEach((bubble, index) => {
        const speakerId = bubble.getAttribute("data-speaker-id") || "self";
        const contentDiv = bubble.querySelector('div[contenteditable="true"]');
        const text = contentDiv?.textContent || "";
        if (text.trim()) {
          parsedMessages.push({
            id: `msg-${index}`,
            speakerId,
            text: text.trim(),
            timestamp: new Date(),
          });
        }
      });
      return parsedMessages;
    }
    return [];
  }, [content]);

  // Get default speakers (Self + relevant parts)
  // Unknown stays in dropdown, not in defaults
  const defaultSpeakers = useMemo(() => {
    const speakers = [
      { id: "self", label: "Self", isSelf: true, isUnknown: false },
    ];
    
    // Add target part if journal is about a part
    if (nodeType === "part" && nodeId && partNodes) {
      const targetPart = partNodes.find(p => p.id === nodeId);
      if (targetPart) {
        speakers.push({ id: targetPart.id, label: targetPart.label, isSelf: false, isUnknown: false });
      }
    }
    
    // For tension/interaction, parts are already filtered in partNodes prop
    // Add all relevant parts from partNodes (these are already filtered to be relevant)
    if (partNodes && nodeType !== "part") {
      // For tension/interaction, add all parts in partNodes
      partNodes.forEach((part) => {
        if (!speakers.find(s => s.id === part.id)) {
          speakers.push({ id: part.id, label: part.label, isSelf: false, isUnknown: false });
        }
      });
    }
    
    return speakers;
  }, [partNodes, nodeId, nodeType]);

  // Auto-add parts that are used in messages but not in default speakers
  // This ensures parts used in existing messages are available even if not in defaults
  useEffect(() => {
    if (messages.length === 0) return;
    
    const defaultPartIds = defaultSpeakers.map(s => s.id);
    const usedPartIds = new Set(
      messages
        .map(m => m.speakerId)
        .filter(id => id !== "self" && id !== "unknown" && !defaultPartIds.includes(id))
    );
    
    if (usedPartIds.size > 0) {
      setAddedPartIds(prev => {
        const newIds = Array.from(usedPartIds).filter(id => !prev.includes(id));
        return newIds.length > 0 ? [...prev, ...newIds] : prev;
      });
    }
  }, [messages, defaultSpeakers]);

  // Get all available speakers (default + added parts)
  const allSpeakers = useMemo(() => {
    const speakerMap = new Map<string, { id: string; label: string; isSelf: boolean; isUnknown: boolean }>();
    
    // Add default speakers
    defaultSpeakers.forEach((s) => speakerMap.set(s.id, s));
    
    // Add parts that were added from dropdown
    // Need to look in allPartNodes, not just partNodes, since added parts might not be in partNodes
    addedPartIds.forEach((partId) => {
      if (!speakerMap.has(partId)) {
        if (partId === "unknown") {
          speakerMap.set("unknown", { id: "unknown", label: "Unknown", isSelf: false, isUnknown: true });
        } else {
          // Look in allPartNodes first, then partNodes as fallback
          const part = allPartNodes?.find(p => p.id === partId) || partNodes?.find(p => p.id === partId);
          if (part) {
            speakerMap.set(part.id, { id: part.id, label: part.label, isSelf: false, isUnknown: false });
          }
        }
      }
    });
    
    return Array.from(speakerMap.values());
  }, [defaultSpeakers, addedPartIds, partNodes, allPartNodes]);

  // Get parts available to add (not already in defaults or added)
  // Unknown is always in the dropdown, not in defaults
  const availablePartsToAdd = useMemo(() => {
    const defaultPartIds = new Set(defaultSpeakers.map(s => s.id));
    const currentPartIds = new Set(partNodes?.map(p => p.id) || []);
    const allShownIds = new Set([...Array.from(defaultPartIds), ...addedPartIds]);
    
    // Get parts from allPartNodes that are not already shown
    const otherParts = (allPartNodes || [])
      .filter(p => !allShownIds.has(p.id) && !currentPartIds.has(p.id))
      .map(p => ({ 
        id: p.id, 
        label: p.label, 
        isUnknown: false 
      }));
    
    // Always include Unknown in dropdown (not in defaults)
    const unknownAvailable = !addedPartIds.includes("unknown");
    
    return [
      ...otherParts,
      ...(unknownAvailable ? [{ id: "unknown", label: "Unknown", isUnknown: true }] : []),
    ];
  }, [partNodes, allPartNodes, defaultSpeakers, addedPartIds]);

  // Add part from dropdown (including Unknown)
  const handleAddPart = useCallback((partId: string) => {
    if (partId === "unknown") {
      // Unknown is special - add it to addedPartIds
      if (!addedPartIds.includes("unknown")) {
        setAddedPartIds(prev => [...prev, "unknown"]);
      }
    } else {
      // Regular part
      if (!addedPartIds.includes(partId)) {
        setAddedPartIds(prev => [...prev, partId]);
      }
    }
    setShowAddPartDropdown(false);
    // Switch to the newly added part
    setPreviousSpeaker(activeSpeaker);
    setActiveSpeaker(partId);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, [addedPartIds, activeSpeaker]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowAddPartDropdown(false);
      }
    };
    
    if (showAddPartDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAddPartDropdown]);

  // Get speaker color
  const getSpeakerColor = useCallback((speakerId: string): string => {
    if (speakerId === "self") {
      return darkMode ? "rgb(59, 130, 246)" : "rgb(37, 99, 235)"; // Peaceful blue - always blue
    }
    if (speakerId === "unknown") {
      return darkMode ? "rgb(107, 114, 128)" : "rgb(156, 163, 175)"; // Grey
    }
    // Generate color for parts - use allPartNodes for consistent color across all parts
    const allParts = allPartNodes || partNodes || [];
    const partIndex = allParts.findIndex((p) => p.id === speakerId);
    if (partIndex >= 0) {
      // Use golden angle for color distribution to ensure different colors
      const hue = (partIndex * 137.508) % 360;
      return `hsl(${hue}, 65%, ${darkMode ? "55%" : "60%"})`;
    }
    // Fallback color if part not found
    return darkMode ? "rgb(239, 68, 68)" : "rgb(220, 38, 38)"; // Red fallback
  }, [darkMode, partNodes, allPartNodes]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle sending message
  const handleSend = useCallback(() => {
    if (!inputText.trim() || readOnly) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      speakerId: activeSpeaker,
      text: inputText.trim(),
      timestamp: new Date(),
    };

    // Add message to array and store as JSON
    const currentMessages = messages;
    const updatedMessages = [...currentMessages, newMessage];
    
    // Store messages as JSON string
    const newContent = JSON.stringify(updatedMessages);
    onContentChange(newContent);
    setInputText("");
    
    // Switch to previous speaker, or default to first non-self default speaker or self
    let nextSpeaker = previousSpeaker;
    if (!nextSpeaker) {
      // Default to first non-self default speaker, or self if none
      const firstPart = defaultSpeakers.find(s => !s.isSelf);
      nextSpeaker = firstPart?.id || "self";
    }
    setPreviousSpeaker(activeSpeaker); // Save current as previous for next time
    setActiveSpeaker(nextSpeaker);
    
    inputRef.current?.focus();
  }, [inputText, activeSpeaker, previousSpeaker, defaultSpeakers, readOnly, messages, onContentChange]);


  // Handle Enter key (Shift+Enter for new line, Enter to send) and Tab (to cycle speakers)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
        return;
      }
      
      // Tab to cycle through speakers
      if (e.key === "Tab") {
        e.preventDefault();
        const currentIndex = allSpeakers.findIndex(s => s.id === activeSpeaker);
        if (currentIndex === -1) {
          setPreviousSpeaker(activeSpeaker); // Save current as previous
          setActiveSpeaker(allSpeakers[0]?.id || "self");
          return;
        }
        
        if (e.shiftKey) {
          // Shift+Tab: go to previous speaker
          const prevIndex = currentIndex === 0 ? allSpeakers.length - 1 : currentIndex - 1;
          setPreviousSpeaker(activeSpeaker); // Save current as previous
          setActiveSpeaker(allSpeakers[prevIndex]?.id || "self");
        } else {
          // Tab: go to next speaker
          const nextIndex = (currentIndex + 1) % allSpeakers.length;
          setPreviousSpeaker(activeSpeaker); // Save current as previous
          setActiveSpeaker(allSpeakers[nextIndex]?.id || "self");
        }
      }
    },
    [handleSend, allSpeakers, activeSpeaker]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Messages Display Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(8px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .message-bubble {
            animation: slideIn 0.2s ease-out;
          }
        `}} />
        {messages.length === 0 ? (
          <div className={`text-center text-sm ${darkMode ? "text-slate-400" : "text-slate-500"} py-8`}>
            Start a conversation...
          </div>
        ) : (
          messages.map((message) => {
            // Find speaker in allSpeakers, or fallback to all partNodes for display
            let speaker = allSpeakers.find((s) => s.id === message.speakerId);
            if (!speaker) {
              // If speaker not in current list, try to find in all partNodes (for messages from removed parts)
              if (message.speakerId === "self") {
                speaker = { id: "self", label: "Self", isSelf: true, isUnknown: false };
              } else if (message.speakerId === "unknown") {
                speaker = { id: "unknown", label: "Unknown", isSelf: false, isUnknown: true };
              } else {
                const partNode = partNodes.find(p => p.id === message.speakerId);
                if (partNode) {
                  speaker = { id: partNode.id, label: partNode.label, isSelf: false, isUnknown: false };
                }
              }
            }
            const speakerColor = getSpeakerColor(message.speakerId);
            const isSelf = message.speakerId === "self";

            return (
              <div
                key={message.id}
                className="flex flex-col"
                style={{
                  alignItems: isSelf ? "flex-end" : "flex-start",
                  maxWidth: "75%",
                  marginLeft: isSelf ? "auto" : "0",
                  marginRight: isSelf ? "0" : "auto",
                }}
              >
                <div
                  className="text-xs font-semibold uppercase tracking-wide mb-1 px-2"
                  style={{
                    color: darkMode ? "rgba(148, 163, 184, 0.8)" : "rgba(71, 85, 105, 0.7)",
                  }}
                >
                  {speaker?.label || "Unknown"}
                </div>
                <div
                  className="px-4 py-3 rounded-2xl text-white shadow-md"
                  style={{
                    backgroundColor: speakerColor,
                    borderRadius: isSelf ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  }}
                >
                  {message.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Speaker Selector */}
      {!readOnly && (
        <div className={`border-t ${darkMode ? "border-slate-700" : "border-slate-200"} p-3`}>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-1">
              <span className={`text-xs font-medium ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                Speaking as:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {allSpeakers.filter(s => !s.isSelf).map((speaker) => {
                  const isActive = activeSpeaker === speaker.id;
                  const speakerColor = getSpeakerColor(speaker.id);

                  return (
                    <button
                      key={speaker.id}
                      type="button"
                    onClick={() => {
                      setPreviousSpeaker(activeSpeaker); // Save current as previous
                      setActiveSpeaker(speaker.id);
                      // Autofocus input after selecting speaker
                      setTimeout(() => {
                        inputRef.current?.focus();
                      }, 0);
                    }}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                        isActive ? "ring-2 ring-offset-2 scale-105" : "hover:scale-102"
                      }`}
                      style={{
                        backgroundColor: isActive ? speakerColor : (darkMode ? "rgba(30, 41, 59, 0.8)" : "rgba(255, 255, 255, 0.9)"),
                        color: isActive ? "white" : (darkMode ? "rgb(203, 213, 225)" : "rgb(71, 85, 105)"),
                        borderColor: isActive ? speakerColor : (darkMode ? "rgba(148, 163, 184, 0.3)" : "rgba(148, 163, 184, 0.2)"),
                        boxShadow: isActive ? `0 4px 12px ${speakerColor}40` : "0 1px 3px rgba(0, 0, 0, 0.1)",
                      }}
                      title={`Switch to ${speaker.label}`}
                    >
                      {speaker.isUnknown ? (
                        <span className="text-sm font-bold">?</span>
                      ) : (
                        <SquareUserRound size={12} />
                      )}
                      {speaker.label}
                      {addedPartIds.includes(speaker.id) && !speaker.isSelf && (
                        <X
                          size={10}
                          className="ml-0.5 opacity-70 hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAddedPartIds(prev => prev.filter(id => id !== speaker.id));
                            if (activeSpeaker === speaker.id) {
                              // Switch to self if removing active speaker
                              setPreviousSpeaker(activeSpeaker);
                              setActiveSpeaker("self");
                            }
                          }}
                        />
                      )}
                    </button>
                  );
                })}
                
                {/* Add Part Dropdown */}
                {availablePartsToAdd.length > 0 && (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowAddPartDropdown(!showAddPartDropdown)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all hover:scale-102 ${
                        darkMode
                          ? "border-slate-600 bg-slate-800/60 text-slate-300 hover:bg-slate-700/60"
                          : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                      title="Add another part"
                    >
                      <Plus size={12} />
                      <span>Add Part</span>
                      <ChevronDown size={10} className={showAddPartDropdown ? "rotate-180" : ""} />
                    </button>
                    
                    {showAddPartDropdown && (
                      <div className={`absolute bottom-full left-0 mb-2 z-50 min-w-[200px] rounded-lg border shadow-lg overflow-hidden ${
                        darkMode
                          ? "border-slate-700 bg-slate-800"
                          : "border-slate-200 bg-white"
                      }`}>
                        <div className="max-h-60 overflow-y-auto">
                          {availablePartsToAdd.map((part) => (
                            <button
                              key={part.id || (part.isUnknown ? "unknown" : "")}
                              type="button"
                              onClick={() => handleAddPart(part.isUnknown ? "unknown" : part.id)}
                              className={`w-full text-left px-3 py-2 text-xs font-medium transition hover:bg-opacity-80 ${
                                darkMode
                                  ? "text-slate-200 hover:bg-slate-700"
                                  : "text-slate-700 hover:bg-slate-100"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-3.5 flex items-center justify-center">
                                  {part.isUnknown ? (
                                    <span className="text-sm font-bold">?</span>
                                  ) : (
                                    <SquareUserRound size={14} />
                                  )}
                                </div>
                                <span>{part.label}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            {/* Self pill aligned to the right */}
            {allSpeakers.filter(s => s.isSelf).map((speaker) => {
              const isActive = activeSpeaker === speaker.id;
              const speakerColor = getSpeakerColor(speaker.id);

              return (
                <button
                  key={speaker.id}
                  type="button"
                    onClick={() => {
                      setPreviousSpeaker(activeSpeaker); // Save current as previous
                      setActiveSpeaker(speaker.id);
                      // Autofocus input after selecting speaker
                      setTimeout(() => {
                        inputRef.current?.focus();
                      }, 0);
                    }}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                    isActive ? "ring-2 ring-offset-2 scale-105" : "hover:scale-102"
                  }`}
                  style={{
                    backgroundColor: isActive ? speakerColor : (darkMode ? "rgba(30, 41, 59, 0.8)" : "rgba(255, 255, 255, 0.9)"),
                    color: isActive ? "white" : (darkMode ? "rgb(203, 213, 225)" : "rgb(71, 85, 105)"),
                    borderColor: isActive ? speakerColor : (darkMode ? "rgba(148, 163, 184, 0.3)" : "rgba(148, 163, 184, 0.2)"),
                    boxShadow: isActive ? `0 4px 12px ${speakerColor}40` : "0 1px 3px rgba(0, 0, 0, 0.1)",
                  }}
                  title={`Switch to ${speaker.label}`}
                >
                  <User size={12} />
                  {speaker.label}
                </button>
              );
            })}
          </div>

          {/* Input Area */}
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className={`flex-1 resize-none rounded-lg border px-4 py-2 text-sm focus:outline-none focus:ring-2 ${
                darkMode
                  ? "border-slate-700 bg-slate-800 text-slate-100 focus:ring-blue-500"
                  : "border-slate-300 bg-white text-slate-900 focus:ring-blue-500"
              }`}
              rows={1}
              style={{
                minHeight: "40px",
                maxHeight: "120px",
              }}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!inputText.trim()}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                inputText.trim()
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : darkMode
                  ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

