"use client";

import React, { useState, useMemo, useEffect, useRef, memo } from "react";
import Image from "next/image";
import { useThemeContext } from "@/state/context/ThemeContext";
import { 
  Eye, 
  Heart,
  Brain,
  Shield, 
  Users, 
  X, 
  Plus, 
  SquareUserRound,
  BookOpen,
  Calendar,
  User,
  ListRestart,
  FileText,
  Sparkles,
  Clock,
  Upload,
  Pencil
} from "lucide-react";
import { useUIStore } from "@/features/workspace/state/stores/UI";
import { useFlowNodesContext } from "@/features/workspace/state/FlowNodesContext";
import { useWorkingStore } from "@/features/workspace/state/stores/useWorkingStore";
import { useJournalStore } from "@/features/workspace/state/stores/Journal";
import { ImpressionList } from "@/features/workspace/constants/Impressions";
import { ImpressionTextType, ImpressionType } from "@/features/workspace/types/Impressions";
import { ImpressionNode } from "@/features/workspace/types/Nodes";
import { NodeBackgroundColors } from "@/features/workspace/constants/Nodes";
import ImpressionInput from "./Impressions/ImpressionInput";

const PartDetailPanel = () => {
  const selectedPartId = useUIStore((s) => s.selectedPartId);
  const setSelectedPartId = useUIStore((s) => s.setSelectedPartId);
  const [isCollapsing, setIsCollapsing] = useState(false);
  
  const setShouldCollapseSidebar = useUIStore((s) => s.setShouldCollapseSidebar);
  const setJournalTarget = useJournalStore((s) => s.setJournalTarget);

  const handleClose = () => {
    // Detach close behavior from options/sidebar completely
    setSelectedPartId(undefined);
  };
  // Use selective subscriptions - only subscribe to updateNode function, not nodes/edges arrays
  const { updateNode } = useFlowNodesContext();
  
  // Get nodes and edges from store - Zustand handles this efficiently
  const nodes = useWorkingStore((s) => s.nodes);
  const edges = useWorkingStore((s) => s.edges);
  
  // Use useMemo to compute derived values to prevent infinite loops
  const partNode = useMemo(() => {
    if (!selectedPartId) return null;
    return nodes.find(node => node.id === selectedPartId) || null;
  }, [selectedPartId, nodes]);
  
  const relatedEdges = useMemo(() => {
    if (!selectedPartId) return [];
    return edges.filter(
      (edge) => edge.source === selectedPartId || edge.target === selectedPartId
    );
  }, [selectedPartId, edges]);
  const { darkMode } = useThemeContext();
  const [addingImpressionType, setAddingImpressionType] = useState<string | null>(null);
  const [currentImpressionType, setCurrentImpressionType] = useState<string>("emotion");
  const [editingAge, setEditingAge] = useState(false);
  const [editingGender, setEditingGender] = useState(false);
  const [editingPartType, setEditingPartType] = useState(false);
  const [tempAge, setTempAge] = useState("");
  const [tempGender, setTempGender] = useState("");
  const [tempPartType, setTempPartType] = useState("");
  const [tempName, setTempName] = useState("");
  const [tempScratchpad, setTempScratchpad] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);
  
  // Refs for scroll-to-section functionality
  const infoRef = useRef<HTMLDivElement>(null);
  const impressionsRef = useRef<HTMLDivElement>(null);
  const insightsRef = useRef<HTMLDivElement>(null);
  const journalRef = useRef<HTMLDivElement>(null);
  const relationshipsRef = useRef<HTMLDivElement>(null);
  const scrollableContentRef = useRef<HTMLDivElement>(null);
  
  // Active section tracking for TOC
  const [activeSection, setActiveSection] = useState<string>("info");
  
  // Scroll to section handler
  const scrollToSection = (sectionRef: React.RefObject<HTMLDivElement | null>, sectionId: string) => {
    if (sectionRef.current && scrollableContentRef.current) {
      const container = scrollableContentRef.current;
      const sectionElement = sectionRef.current;
      const containerRect = container.getBoundingClientRect();
      const sectionRect = sectionElement.getBoundingClientRect();
      const scrollTop = container.scrollTop;
      const offsetTop = scrollTop + (sectionRect.top - containerRect.top) - 20; // 20px padding from top
      container.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
      setActiveSection(sectionId);
    }
  };

  
  // Journal state
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [showJournalHistory, setShowJournalHistory] = useState(false);
  const [isLoadingJournal, setIsLoadingJournal] = useState(false);
  const [isExtractingImpressions, setIsExtractingImpressions] = useState(false);
  const [showInfoEditModal, setShowInfoEditModal] = useState(false);

  // Load journal entries when part is selected
  useEffect(() => {
    if (selectedPartId) {
      loadJournalEntries();
    }
  }, [selectedPartId]);

  // Initialize temp values from part data when part changes (only on selection change, not on every render)
  useEffect(() => {
    if (partNode && selectedPartId) {
      const data = partNode.data;
      setTempName((data.name as string) || (data.label as string) || "");
      setTempScratchpad((data.scratchpad as string) || "");
      setTempPartType((data.customPartType as string) || (data.partType as string) || "");
      setTempAge((data.age as string) || "Unknown");
      setTempGender((data.gender as string) || "");
      setActiveSection("info"); // Reset to top section when part changes
    }
  }, [selectedPartId]); // Only sync when selectedPartId changes, not on every partNode update

  const loadJournalEntries = async () => {
    if (!selectedPartId) return;
    
    setIsLoadingJournal(true);
    try {
      // Use the existing journal API that works with nodeId
      const response = await fetch(`/api/journal/node/${selectedPartId}`);
      if (response.ok) {
        const entry = await response.json();
        // Convert single entry to array format for consistency
        // Only show entries that have actual content
        if (entry && entry.content && entry.content.trim().length > 0) {
          setJournalEntries([entry]);
        } else {
          setJournalEntries([]);
        }
      } else if (response.status === 404) {
        // No journal entry exists yet
        setJournalEntries([]);
      }
    } catch (error) {
      console.error("Failed to load journal entries:", error);
      setJournalEntries([]);
    } finally {
      setIsLoadingJournal(false);
    }
  };

  const extractImpressionsFromEntry = async (entryId: string) => {
    if (!selectedPartId) return;
    
    setIsExtractingImpressions(true);
    try {
      const response = await fetch(`/api/journal/node/${selectedPartId}/extract-impressions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nodeId: selectedPartId,
          journalEntryId: entryId,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Impressions extracted:", result);
        
        // Add the extracted impressions to the part node's data
        if (result.impressions && result.impressions.length > 0 && partNode) {
          const updatedData = { ...partNode.data };
          
          // Group impressions by type and add them to the appropriate buckets
          result.impressions.forEach((impression: any) => {
            const type = impression.type;
            const impressionTypeKey = ImpressionTextType[type as keyof typeof ImpressionTextType];
            
            if (impressionTypeKey) {
              const currentImpressions = (updatedData[impressionTypeKey] as ImpressionNode[]) || [];
              const newImpression: ImpressionNode = {
                id: impression.id,
                type: type,
                data: {
                  label: impression.label,
                  addedAt: Date.now()
                },
                position: { x: 0, y: 0 }
              };
              
              updatedData[impressionTypeKey] = [...currentImpressions, newImpression];
            }
          });
          
          // Update the part node with the new impressions
          updateNode(selectedPartId, {
            data: updatedData
          });
          
          console.log(`Successfully added ${result.impressions.length} impressions to the part!`);
        }
        
        // Refresh the journal entries to show updated content
        await loadJournalEntries();
      }
    } catch (error) {
      console.error("Failed to extract impressions:", error);
    } finally {
      setIsExtractingImpressions(false);
    }
  };

  // Handle Escape key to close impression modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && addingImpressionType) {
        setAddingImpressionType(null);
      }
    };

    if (addingImpressionType) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [addingImpressionType]);

  const handleRemoveImpression = (impressionType: string, impressionId: string) => {
    if (!selectedPartId || !partNode) return;

    const currentImpressions = (partNode.data[ImpressionTextType[impressionType as keyof typeof ImpressionTextType]] as ImpressionNode[]) || [];
    const filteredImpressions = currentImpressions.filter(imp => imp.id !== impressionId);

    updateNode(selectedPartId, {
      data: {
        ...partNode.data,
        [ImpressionTextType[impressionType as keyof typeof ImpressionTextType]]: filteredImpressions,
      },
    });
  };

  const handleReturnToSidebar = (impressionType: string, impressionId: string) => {
    if (!selectedPartId || !partNode) return;

    const currentImpressions = (partNode.data[ImpressionTextType[impressionType as keyof typeof ImpressionTextType]] as ImpressionNode[]) || [];
    const impressionToReturn = currentImpressions.find(imp => imp.id === impressionId);
    const filteredImpressions = currentImpressions.filter(imp => imp.id !== impressionId);

    // Remove from part
    updateNode(selectedPartId, {
      data: {
        ...partNode.data,
        [ImpressionTextType[impressionType as keyof typeof ImpressionTextType]]: filteredImpressions,
      },
    });

    // Return to sidebar
    if (impressionToReturn) {
      useWorkingStore.getState().addImpression({
        id: impressionToReturn.id,
        type: impressionToReturn.type,
        label: impressionToReturn.data.label,
      });
    }
  };

  const getXButtonColor = (impressionType: string) => {
    const colorMap: { [key: string]: string } = {
      emotion: "#ed9f9f",
      thought: "#9fc7e8", 
      sensation: "#f5c99a",
      behavior: "#a8d4a8",
      conflict: "#c4a8e0",
      ally: "#a8d4a8",
      part: "#c4d4e8",
      other: "#f0b8d0"
    };
    return colorMap[impressionType] || "#ed9f9f";
  };

  // Calculate relationships from the related edges and nodes
  const relationships = useMemo(() => {
    if (!selectedPartId || !relatedEdges.length) return [];
    
    return relatedEdges.map((edge) => {
      const connectedNodeId = edge.source === selectedPartId ? edge.target : edge.source;
      const connectedNode = nodes.find((node) => node.id === connectedNodeId);
      
      return {
        id: edge.id,
        nodeId: connectedNodeId,
        nodeType: connectedNode?.type || "unknown",
        nodeLabel: connectedNode?.data?.label || "Unknown",
        nodeDescription: (connectedNode?.data?.scratchpad as string) || (connectedNode?.data?.description as string) || "",
        relationshipType: edge.data?.relationshipType || "conflict",
      };
    });
  }, [relatedEdges, nodes, selectedPartId]);


  const addListItem = (field: string, newItem: string) => {
    if (!selectedPartId || !partNode || newItem.trim() === "") return;
    
    const currentList = (partNode.data[field as keyof typeof partNode.data] as string[]) || [];
    updateNode(selectedPartId, {
      data: {
        ...partNode.data,
        [field]: [...currentList, newItem.trim()],
      },
    });
  };

  const removeListItem = (field: string, index: number) => {
    if (!selectedPartId || !partNode) return;
    
    const currentList = (partNode.data[field as keyof typeof partNode.data] as string[]) || [];
    const newList = currentList.filter((_, i) => i !== index);
    
    updateNode(selectedPartId, {
      data: {
        ...partNode.data,
        [field]: newList,
      },
    });
  };

  const saveAge = () => {
    if (!selectedPartId || !partNode) return;
    updateNode(selectedPartId, {
      data: {
        ...partNode.data,
        age: tempAge.trim() || "Unknown",
      },
    });
    setEditingAge(false);
    setTempAge("");
  };

  const saveGender = () => {
    if (!selectedPartId || !partNode) return;
    updateNode(selectedPartId, {
      data: {
        ...partNode.data,
        gender: tempGender.trim() || "Unknown",
      },
    });
    setEditingGender(false);
    setTempGender("");
  };

  const savePartType = () => {
    if (!selectedPartId || !partNode) return;
    updateNode(selectedPartId, {
      data: {
        ...partNode.data,
        customPartType: tempPartType || "manager",
      },
    });
    setEditingPartType(false);
    setTempPartType("");
  };

  const saveName = () => {
    if (!selectedPartId || !partNode) return;
    const trimmedName = tempName.trim();
    updateNode(selectedPartId, {
      data: {
        ...partNode.data,
        name: trimmedName || "",
        label: trimmedName || "",
      },
    });
    setTempName(trimmedName);
  };

  const saveScratchpad = () => {
    if (!selectedPartId || !partNode) return;
    const trimmedScratchpad = tempScratchpad.trim();
    updateNode(selectedPartId, {
      data: {
        ...partNode.data,
        scratchpad: trimmedScratchpad,
      },
    });
    setTempScratchpad(trimmedScratchpad);
  };

  const saveInfo = () => {
    if (!selectedPartId || !partNode) return;
    const trimmedName = tempName.trim();
    const trimmedScratchpad = tempScratchpad.trim();
    const trimmedAge = tempAge.trim() === "" || tempAge === "Unknown" ? "Unknown" : tempAge.trim();
    const trimmedGender = tempGender.trim();
    
    // Use requestAnimationFrame to batch the update and avoid ResizeObserver issues
    requestAnimationFrame(() => {
      updateNode(selectedPartId, {
        data: {
          ...partNode.data,
          name: trimmedName || "",
          label: trimmedName || "",
          scratchpad: trimmedScratchpad,
          customPartType: tempPartType || undefined,
          age: trimmedAge || "Unknown",
          gender: trimmedGender || undefined,
        },
      });
      
      setTempName(trimmedName);
      setTempScratchpad(trimmedScratchpad);
      setTempAge(trimmedAge);
      setTempGender(trimmedGender);
    });
  };

  const handleModalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedPartId && partNode) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageDataUrl = event.target?.result as string;
        updateNode(selectedPartId!, {
          data: {
            ...partNode!.data,
            image: imageDataUrl,
          },
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedPartId && partNode) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        updateNode(selectedPartId, {
          data: {
            ...partNode.data,
            image: imageUrl,
          },
        });
      };
      reader.readAsDataURL(file);
    }
  };

  if (!selectedPartId || !partNode) return null;

  const data = partNode.data;
  const containerBase = darkMode
    ? "bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border border-gray-600/50"
    : "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/50";
  const containerClasses = containerBase + " rounded-xl shadow-lg overflow-y-auto w-full max-w-5xl max-h-[85vh] flex flex-col transition-all duration-300";

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={() => setSelectedPartId(undefined)}
    >
      <div
        className={containerClasses}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button - Top Right */}
        <button
          onClick={handleClose}
          className={`absolute top-4 right-4 z-10 p-2 rounded-lg ${
            darkMode 
              ? "bg-gray-700/60 hover:bg-gray-600/80" 
              : "bg-white/60 hover:bg-white/80"
          }`}
        >
          <X size={18} className={darkMode ? "text-gray-300" : "text-gray-600"} />
        </button>

        {/* Content with TOC */}
        <div className="flex flex-row flex-1 overflow-hidden min-h-0">
          {/* Table of Contents - Left Column */}
          <div className={`w-48 flex-shrink-0 border-r flex flex-col ${
            darkMode 
              ? "bg-gray-800/90 border-gray-700/50" 
              : "bg-gray-50/90 border-gray-200/50"
          }`}>
            <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
              <button
                onClick={() => scrollToSection(infoRef, 'info')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                  darkMode
                    ? "text-gray-300 hover:bg-gray-700/50 hover:text-white"
                    : "text-gray-700 hover:bg-gray-200/50 hover:text-gray-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>Info</span>
                </div>
              </button>
              <button
                onClick={() => scrollToSection(insightsRef, 'insights')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                  darkMode
                    ? "text-gray-300 hover:bg-gray-700/50 hover:text-white"
                    : "text-gray-700 hover:bg-gray-200/50 hover:text-gray-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-sky-600" />
                  <span>Insights</span>
                </div>
              </button>
              <button
                onClick={() => scrollToSection(impressionsRef, 'impressions')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                  darkMode
                    ? "text-gray-300 hover:bg-gray-700/50 hover:text-white"
                    : "text-gray-700 hover:bg-gray-200/50 hover:text-gray-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-purple-600" />
                  <span>Impressions</span>
                </div>
              </button>
              <button
                onClick={() => scrollToSection(journalRef, 'journal')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                  darkMode
                    ? "text-gray-300 hover:bg-gray-700/50 hover:text-white"
                    : "text-gray-700 hover:bg-gray-200/50 hover:text-gray-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-600" />
                  <span>Journal</span>
                </div>
              </button>
              <button
                onClick={() => scrollToSection(relationshipsRef, 'relationships')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                  darkMode
                    ? "text-gray-300 hover:bg-gray-700/50 hover:text-white"
                    : "text-gray-700 hover:bg-gray-200/50 hover:text-gray-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-rose-600" />
                  <span>Relationships</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Main Content - Right Column */}
          <div ref={scrollableContentRef} className={`flex-1 p-8 backdrop-blur-sm overflow-y-auto ${
            darkMode 
              ? "bg-gray-800/80" 
              : "bg-white/80"
          }`}>
          
          {/* Info Section */}
          <div ref={infoRef} className="mb-6 transition-all duration-300 relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-xs font-semibold uppercase tracking-wide flex items-center gap-2 ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}>
                <User className="w-3 h-3 text-emerald-600" />
                Info
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (selectedPartId && partNode) {
                      setJournalTarget({
                        type: "node",
                        nodeId: selectedPartId,
                        nodeType: "part",
                        title: partNode.data?.label || "Part",
                      });
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border-2 ${
                    darkMode
                      ? "bg-gray-800 border-purple-600 text-purple-400 hover:bg-gray-700"
                      : "bg-white border-purple-600 text-purple-600 hover:bg-purple-50"
                  } shadow-md`}
                >
                  <Sparkles className={`w-4 h-4 ${darkMode ? "text-purple-400" : "text-purple-600"}`} />
                  <span>Deepen</span>
                </button>
                <button
                  onClick={() => setShowInfoEditModal(true)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                    darkMode
                      ? "bg-blue-800 hover:bg-blue-900 text-white"
                      : "bg-blue-800 hover:bg-blue-900 text-white"
                  } shadow-md`}
                >
                  <Pencil className="w-4 h-4" />
                  <span>Edit</span>
                </button>
              </div>
            </div>
            
            {/* Main Info Grid */}
            <div className="space-y-6">
              {/* First Row: Image and Info */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Image - Left Column */}
                <div className="lg:col-span-1">
                  <div className={`w-full aspect-square relative ${
                    darkMode 
                      ? "bg-gray-700 border border-gray-600" 
                      : "bg-white border border-gray-200"
                  } rounded-lg shadow-sm overflow-hidden group`}>
                    {data.image ? (
                      <>
                        <Image
                          src={data.image as string}
                          alt="Part"
                          width={256}
                          height={256}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100"
                        >
                          <Upload className="w-8 h-8 text-white" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className={`w-full h-full ${
                          darkMode ? "bg-gray-600 hover:bg-gray-500" : "bg-gray-100 hover:bg-gray-200"
                        } flex flex-col items-center justify-center cursor-pointer`}
                      >
                        <SquareUserRound size={64} className={darkMode ? "text-gray-300" : "text-gray-400"} />
                        <span className={`text-xs mt-2 ${darkMode ? "text-gray-300" : "text-gray-500"}`}>
                          Click to upload
                        </span>
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Info Fields - Right Columns */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Name and Part Type Row */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h2 className={`text-3xl font-bold mb-2 ${darkMode ? "text-white" : "text-black"}`}>
                        {(data.name as string) || (data.label as string) || "Untitled"}
                      </h2>
                      <div className="flex items-center gap-2">
                        {['manager', 'firefighter', 'exile'].map((type) => {
                          const currentType = tempPartType || (data.customPartType as string) || (data.partType as string) || "";
                          const isSelected = currentType === type;
                          if (!isSelected) return null;
                          return (
                            <span
                              key={type}
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                type === "manager"
                                  ? "bg-blue-600 text-white"
                                  : type === "firefighter"
                                    ? "bg-red-600 text-white"
                                    : "bg-purple-600 text-white"
                              }`}
                            >
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </span>
                          );
                        })}
                        {!tempPartType && !(data.customPartType as string) && !(data.partType as string) && (
                          <span className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                            No type set
                          </span>
                        )}
                        {/* Age and Gender Display - To the right of part type */}
                        {(data.age as string) || (data.gender as string) ? (
                          <>
                            {(data.age as string) && (data.age as string) !== "Unknown" && (
                              <span className={`px-2 py-1 rounded text-xs ${
                                darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-700"
                              }`}>
                                {data.age as string}
                              </span>
                            )}
                            {(data.gender as string) && (
                              <span className={`px-2 py-1 rounded text-xs ${
                                darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-700"
                              }`}>
                                {data.gender as string}
                              </span>
                            )}
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <p className={`text-base leading-relaxed ${darkMode ? "text-gray-300" : "text-gray-700"} whitespace-pre-wrap`}>
                      {(data.scratchpad as string) || (
                        <span className={darkMode ? "text-gray-500" : "text-gray-400"}>
                          No description added yet.
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Insights Section */}
          <div ref={insightsRef} className="mb-6 transition-all duration-300 relative">
                <h4 className={`text-xs font-semibold uppercase tracking-wide flex items-center gap-2 ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}>
                  <Brain className="w-3 h-3 text-sky-600" />
                  Insights
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Needs */}
                <div className={`rounded-lg p-4 border ${
                  darkMode 
                    ? "bg-gray-700/40 border-gray-600/50" 
                    : "bg-white border-gray-300"
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className={`font-semibold capitalize text-sm ${
                      darkMode ? "text-white" : "text-black"
                    }`}>
                      Needs
                    </h4>
                    <button
                      onClick={() => {
                        const input = prompt("Add a need:");
                        if (input?.trim()) {
                          addListItem("needs", input.trim());
                        }
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        darkMode
                          ? "bg-gray-700/50 hover:bg-gray-700 text-gray-300"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                      }`}
                    >
                      Add
                    </button>
                  </div>
                  <div className="space-y-1">
                    {((data.needs as string[]) || []).map((need: string, index: number) => (
                      <div key={index} className={`group rounded border p-2 flex items-center justify-between ${
                        darkMode 
                          ? "bg-gray-600/40 border-gray-500/30" 
                          : "bg-white/40 border-blue-200/30"
                      }`}>
                        <span className={`text-xs ${darkMode ? "text-white" : "text-black"}`}>{need}</span>
                        <button 
                          onClick={() => removeListItem("needs", index)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:opacity-70"
                          style={{
                            color: "#ed9f9f",
                            height: "28px",
                            width: "24px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    {((data.needs as string[]) || []).length === 0 && (
                      <div className={`text-center py-4 text-xs ${darkMode ? "text-gray-400" : "text-gray-500"} italic`}>
                        No needs added yet
                      </div>
                    )}
                  </div>
                </div>

                {/* Fears */}
                <div className={`rounded-lg p-4 border ${
                  darkMode 
                    ? "bg-gray-700/40 border-gray-600/50" 
                    : "bg-white border-gray-300"
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className={`font-semibold capitalize text-sm ${
                      darkMode ? "text-white" : "text-black"
                    }`}>
                      Fears
                    </h4>
                    <button
                      onClick={() => {
                        const input = prompt("Add a fear:");
                        if (input?.trim()) {
                          addListItem("fears", input.trim());
                        }
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        darkMode
                          ? "bg-gray-700/50 hover:bg-gray-700 text-gray-300"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                      }`}
                    >
                      Add
                    </button>
                  </div>
                  <div className="space-y-1">
                    {((data.fears as string[]) || []).map((fear: string, index: number) => (
                      <div key={index} className={`group rounded border p-2 flex items-center justify-between ${
                        darkMode 
                          ? "bg-gray-600/40 border-gray-500/30" 
                          : "bg-white/40 border-blue-200/30"
                      }`}>
                        <span className={`text-xs ${darkMode ? "text-white" : "text-black"}`}>{fear}</span>
                        <button 
                          onClick={() => removeListItem("fears", index)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:opacity-70"
                          style={{
                            color: "#ed9f9f",
                            height: "28px",
                            width: "24px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    {((data.fears as string[]) || []).length === 0 && (
                      <div className={`text-center py-4 text-xs ${darkMode ? "text-gray-400" : "text-gray-500"} italic`}>
                        No fears added yet
                      </div>
                    )}
                  </div>
                </div>
                </div>
          </div>

          {/* Impressions Section */}
          <div ref={impressionsRef} className="mb-6 transition-all duration-300 relative">
                <h3 className={`text-xs font-semibold uppercase tracking-wide mb-4 flex items-center gap-2 ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}>
                  <Eye className="w-3 h-3 text-purple-600" />
                  Impressions
                </h3>
                
                {/* Flexible Layout for Impressions */}
                <div className="space-y-4">
                  {/* All Impressions: emotion, thought, sensation, behavior, other */}
                  <div className="columns-1 lg:columns-2 gap-4 space-y-4">
                    {ImpressionList.map((impression) => {
                      const impressions = (data[ImpressionTextType[impression]] as ImpressionNode[]) || [];
                      
                      return (
                        <div key={impression} className={`break-inside-avoid rounded-lg p-4 border mb-4 ${
                          darkMode 
                            ? "bg-gray-700/40 border-gray-600/50" 
                            : "bg-white border-gray-300"
                        }`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <h4 
                                className="font-semibold capitalize text-sm"
                                style={{ color: NodeBackgroundColors[impression] }}
                              >
                                {impression}
                              </h4>
                              <span 
                                className="px-2 py-1 rounded-full text-xs font-medium"
                                style={{
                                  backgroundColor: `${NodeBackgroundColors[impression]}20`,
                                  color: NodeBackgroundColors[impression],
                                }}
                              >
                                {impressions.length}
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                setAddingImpressionType(impression);
                                setCurrentImpressionType(impression);
                              }}
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                darkMode 
                                  ? "bg-gray-700/50 hover:bg-gray-700 text-gray-300" 
                                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                              }`}
                              style={{
                                border: `1px solid ${NodeBackgroundColors[impression]}40`,
                              }}
                            >
                              Add
                            </button>
                          </div>
                          
                          <div className="space-y-1 mb-2">
                            {impressions.map((imp, index) => {
                              const bgColor = NodeBackgroundColors[impression];
                              
                              return (
                                <div 
                                  key={index} 
                                  className={`group rounded border p-2 flex items-center justify-between ${
                                    darkMode 
                                      ? "border-gray-600/30" 
                                      : "border-blue-200/30"
                                  }`}
                                  style={{
                                    backgroundColor: `${bgColor}20`,
                                    color: `${bgColor}FF`,
                                  }}
                                >
                                  <span className="font-medium text-xs">{imp.data?.label || imp.id}</span>
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                                    <button 
                                      onClick={() => handleReturnToSidebar(impression, imp.id)}
                                      className="p-1 hover:opacity-70"
                                      style={{
                                        color: getXButtonColor(impression),
                                        height: "28px",
                                        width: "24px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center"
                                      }}
                                      title="Return to sidebar"
                                    >
                                      <ListRestart size={16} />
                                    </button>
                                    <button 
                                      onClick={() => handleRemoveImpression(impression, imp.id)}
                                      className="p-1 hover:opacity-70"
                                      style={{
                                        color: getXButtonColor(impression),
                                        height: "28px",
                                        width: "24px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center"
                                      }}
                                      title="Delete"
                                    >
                                      <X size={16} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
          </div>

           {/* Journal History Section */}
             <div ref={journalRef} className="mt-6 transition-all duration-300 relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-xs font-semibold uppercase tracking-wide flex items-center gap-2 ${
                  darkMode ? "text-gray-400" : "text-gray-500"
                }`}>
                  <BookOpen className="w-3 h-3 text-amber-600" />
                  Journal
                </h3>
                <button
                  onClick={() => {
                    if (selectedPartId && partNode) {
                      setJournalTarget({
                        type: "node",
                        nodeId: selectedPartId,
                        nodeType: "part",
                        title: partNode.data?.label || "Part",
                      });
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border-2 ${
                    darkMode
                      ? "bg-gray-800 border-purple-600 text-purple-400 hover:bg-gray-700"
                      : "bg-white border-purple-600 text-purple-600 hover:bg-purple-50"
                  } shadow-md`}
                >
                  <Sparkles className={`w-3 h-3 ${darkMode ? "text-purple-400" : "text-purple-600"}`} />
                  <span>New Entry</span>
                </button>
              </div>
              
              {isLoadingJournal ? (
                <div className={`flex items-center justify-center py-8 rounded-lg ${
                  darkMode 
                    ? "bg-gray-700/40 border border-gray-600/50" 
                    : "bg-white/40 border border-blue-200/50"
                }`}>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className={`ml-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Loading journal entries...</span>
                </div>
              ) : journalEntries.length === 0 ? (
                <div className={`text-center py-8 rounded-lg ${
                  darkMode 
                    ? "bg-gray-700/40 border border-gray-600/50" 
                    : "bg-white/40 border border-blue-200/50"
                }`}>
                  <BookOpen className={`w-12 h-12 mx-auto mb-4 ${darkMode ? "text-gray-500" : "text-gray-400"}`} />
                  <h3 className={`text-lg font-semibold mb-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>No Journal Entries Yet</h3>
                  <p className={darkMode ? "text-gray-400" : "text-gray-500"}>Start writing about this part to see entries here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {journalEntries.map((entry) => (
                    <div key={entry.id} className={`${
                      darkMode 
                        ? "bg-gray-700/40 border border-gray-600/50" 
                        : "bg-white/40 border border-blue-200/50"
                    } rounded-lg p-5`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Clock className={`w-4 h-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`} />
                          <span className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                            {new Date(entry.createdAt).toLocaleDateString()} at {new Date(entry.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <button
                          onClick={() => extractImpressionsFromEntry(entry.id)}
                          disabled={isExtractingImpressions}
                          className={`flex items-center gap-1 px-3 py-1 text-white text-sm rounded-lg ${
                            isExtractingImpressions
                              ? "bg-gray-400"
                              : darkMode
                                ? "bg-blue-600 hover:bg-blue-700"
                                : "bg-blue-600 hover:bg-blue-700"
                          }`}
                        >
                          {isExtractingImpressions ? (
                            <>
                              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                              <span>Extracting...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3 h-3" />
                              <span>Extract Impressions</span>
                            </>
                          )}
                        </button>
                      </div>
                      {entry.title && (
                        <h4 className={`font-semibold mb-2 ${darkMode ? "text-white" : "text-gray-800"}`}>{entry.title}</h4>
                      )}
                      <div className={`whitespace-pre-wrap text-sm leading-relaxed ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}>
                        {entry.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

             {/* Relationships Section */}
             <div ref={relationshipsRef} className="mt-6 transition-all duration-300 relative">
              <h3 className={`text-xs font-semibold uppercase tracking-wide mb-4 flex items-center gap-2 ${
                darkMode ? "text-gray-400" : "text-gray-500"
              }`}>
                <Users className="w-3 h-3 text-rose-600" />
                Relationships
              </h3>
              
              {relationships.length > 0 ? (
                <div className="space-y-4">
                  {relationships.map((rel) => {
                    const isConflict = rel.relationshipType === "conflict";
                    const isAlly = rel.relationshipType === "ally";
                    
                    return (
                      <div
                        key={rel.id}
                        className={`rounded-lg p-5 ${
                          darkMode 
                            ? "bg-gray-700/40 border border-gray-600/50" 
                            : "bg-white/40 border border-blue-200/50"
                        }`}
                      >
                        <div className={`px-3 py-2 rounded-lg border-2 ${
                          isConflict 
                            ? darkMode
                              ? "border-purple-400 bg-purple-900/40 shadow-sm"
                              : "border-purple-400 bg-purple-100 shadow-sm"
                            : isAlly 
                              ? darkMode
                                ? "border-sky-400 bg-sky-900/40 shadow-sm"
                                : "border-sky-400 bg-sky-100 shadow-sm"
                              : darkMode
                                ? "border-gray-600/50 bg-gray-600/40"
                                : "border-blue-200/30 bg-white/40"
                        }`}>
                          <div className={`font-semibold text-sm mb-2 ${
                            isConflict 
                              ? darkMode
                                ? "text-purple-200"
                                : "text-purple-900"
                              : isAlly 
                                ? darkMode
                                  ? "text-sky-200"
                                  : "text-sky-900"
                                : darkMode
                                  ? "text-white"
                                  : "text-black"
                          }`}>
                            {rel.nodeLabel}
                          </div>
                          {rel.nodeDescription && String(rel.nodeDescription).trim() ? (
                            <div className={`text-xs mb-2 leading-relaxed whitespace-pre-wrap ${
                              isConflict 
                                ? darkMode
                                  ? "text-purple-300"
                                  : "text-purple-700"
                                : isAlly 
                                  ? darkMode
                                    ? "text-sky-300"
                                    : "text-sky-700"
                                  : darkMode
                                    ? "text-gray-300"
                                    : "text-gray-700"
                            }`}>
                              {String(rel.nodeDescription)}
                            </div>
                          ) : null}
                          <div className={`text-xs font-medium capitalize mt-1 ${
                            isConflict 
                              ? darkMode
                                ? "text-purple-300"
                                : "text-purple-700"
                              : isAlly 
                                ? darkMode
                                  ? "text-sky-300"
                                  : "text-sky-700"
                                : darkMode
                                  ? "text-gray-400"
                                  : "text-gray-600"
                          }`}>
                            {isConflict ? "⚔️ Conflict" : isAlly ? "🤝 Ally" : rel.nodeType}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={`text-center py-8 rounded-lg ${
                  darkMode 
                    ? "bg-gray-700/40 border border-gray-600/50" 
                    : "bg-white/40 border border-blue-200/50"
                }`}>
                  <Users className={`w-12 h-12 mx-auto mb-4 ${darkMode ? "text-gray-500" : "text-gray-400"}`} />
                  <h3 className={`text-lg font-semibold mb-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>No Relationships Yet</h3>
                  <p className={darkMode ? "text-gray-400" : "text-gray-500"}>No relationships have been created for this part.</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Impression Input Modal */}
        {addingImpressionType && (
          <div 
            className="absolute inset-0 bg-black/40 flex items-center justify-center z-10"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setAddingImpressionType(null);
              }
            }}
          >
            <div className="bg-white rounded-2xl p-6 w-full max-w-3xl mx-4 shadow-2xl border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: NodeBackgroundColors[currentImpressionType as keyof typeof NodeBackgroundColors] }}
                  ></div>
                  <h3 className="text-xl font-bold text-gray-800">
                    Add {currentImpressionType} to {(data.name as string) || (data.label as string) || "Untitled"}
                  </h3>
                </div>
                <button
                  onClick={() => setAddingImpressionType(null)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <ImpressionInput 
                  onAddImpression={(impressionData) => {
                    // Add impression directly to the part using the actual selected type
                    const impressionTypeKey = ImpressionTextType[impressionData.type as keyof typeof ImpressionTextType];
                    const currentImpressions = (data[impressionTypeKey] as ImpressionNode[]) || [];
                    const newImpression: ImpressionNode = {
                      id: impressionData.id,
                      type: impressionData.type,
                      data: {
                        label: impressionData.label,
                        addedAt: Date.now()
                      },
                      position: { x: 0, y: 0 }
                    };
                    
                    updateNode(selectedPartId!, {
                      data: {
                        ...data,
                        [impressionTypeKey]: [...currentImpressions, newImpression],
                      },
                    });
                    
                    // Don't close the modal, just clear the input
                    // setAddingImpressionType(null);
                  }}
                  onTypeChange={(type) => setCurrentImpressionType(type)}
                  defaultType={addingImpressionType as ImpressionType}
                />
              </div>
            </div>
          </div>
        )}

        {/* Info Edit Modal */}
        {showInfoEditModal && (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4"
            onClick={() => setShowInfoEditModal(false)}
          >
            <div
              className={`rounded-2xl p-8 w-full max-w-2xl mx-4 shadow-2xl border ${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-xl font-bold ${
                  darkMode ? "text-white" : "text-gray-800"
                }`}>
                  Edit Info
                </h3>
                <button
                  onClick={() => setShowInfoEditModal(false)}
                  className={`p-2 rounded-full ${
                    darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                  }`}
                >
                  <X size={20} className={darkMode ? "text-gray-300" : "text-gray-500"} />
                </button>
              </div>

              <div className="space-y-6">
                {/* First Row: Name/Pills on left, Image on right */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Left Column: Name and Part Type Pills */}
                  <div className="space-y-4">
                    {/* Name Input */}
                    <div>
                      <label className={`text-sm font-semibold mb-2 block ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}>
                        Name
                      </label>
                      <input
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        className={`w-full text-lg font-bold ${
                          darkMode 
                            ? "bg-gray-700 border-gray-600 text-white placeholder-gray-500" 
                            : "bg-white border-gray-300 text-black placeholder-gray-400"
                        } border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        placeholder="Part name..."
                      />
                    </div>

                    {/* Part Type Pills */}
                    <div>
                      <label className={`text-sm font-semibold mb-3 block ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}>
                        Part Type
                      </label>
                      <div className="flex gap-2">
                        {['manager', 'firefighter', 'exile'].map((type) => {
                          const currentType = tempPartType || (data.customPartType as string) || (data.partType as string) || "";
                          const isSelected = currentType === type;
                          return (
                            <button
                              key={type}
                              onClick={() => {
                                setTempPartType(type);
                              }}
                              className={`px-4 py-2 rounded-full text-sm font-medium ${
                                isSelected
                                  ? type === "manager"
                                    ? "bg-blue-600 text-white shadow-md"
                                    : type === "firefighter"
                                      ? "bg-red-600 text-white shadow-md"
                                      : "bg-purple-600 text-white shadow-md"
                                  : darkMode
                                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                            >
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Age and Gender - Side by Side */}
                    <div className="grid grid-cols-[1fr_2fr] gap-4">
                      {/* Age Number Picker */}
                      <div>
                        <label className={`text-sm font-semibold mb-2 block ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}>
                          Age
                        </label>
                        <input
                          type="number"
                          value={tempAge === "" || tempAge === "Unknown" ? "" : tempAge}
                          onChange={(e) => setTempAge(e.target.value || "Unknown")}
                          className={`w-full text-sm ${
                            darkMode 
                              ? "bg-gray-700 border-gray-600 text-white placeholder-gray-500" 
                              : "bg-white border-gray-300 text-black placeholder-gray-400"
                          } border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                          placeholder="Unknown"
                          min="0"
                        />
                      </div>

                      {/* Gender Input */}
                      <div>
                        <label className={`text-sm font-semibold mb-2 block ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}>
                          Gender
                        </label>
                        <input
                          type="text"
                          value={tempGender}
                          onChange={(e) => setTempGender(e.target.value)}
                          className={`w-full text-sm ${
                            darkMode 
                              ? "bg-gray-700 border-gray-600 text-white placeholder-gray-500" 
                              : "bg-white border-gray-300 text-black placeholder-gray-400"
                          } border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                          placeholder="Gender..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Image Upload */}
                  <div>
                    <label className={`text-sm font-semibold mb-3 block ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}>
                      Image
                    </label>
                    <div className={`w-full aspect-square relative ${
                      darkMode 
                        ? "bg-gray-700 border border-gray-600" 
                        : "bg-white border border-gray-200"
                    } rounded-lg shadow-sm overflow-hidden group`}>
                      {data.image ? (
                        <>
                          <Image
                            src={data.image as string}
                            alt="Part"
                            width={256}
                            height={256}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => modalFileInputRef.current?.click()}
                            className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100"
                          >
                            <Upload className="w-8 h-8 text-white" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => modalFileInputRef.current?.click()}
                          className={`w-full h-full ${
                            darkMode ? "bg-gray-600 hover:bg-gray-500" : "bg-gray-100 hover:bg-gray-200"
                          } flex flex-col items-center justify-center cursor-pointer`}
                        >
                          <SquareUserRound size={64} className={darkMode ? "text-gray-300" : "text-gray-400"} />
                          <span className={`text-xs mt-2 ${darkMode ? "text-gray-300" : "text-gray-500"}`}>
                            Click to upload
                          </span>
                        </button>
                      )}
                      <input
                        ref={modalFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleModalImageUpload}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Description - Full Width */}
                <div>
                  <label className={`text-sm font-semibold mb-2 block ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}>
                    Description
                  </label>
                  <textarea
                    value={tempScratchpad}
                    onChange={(e) => setTempScratchpad(e.target.value)}
                    className={`w-full text-sm ${
                      darkMode 
                        ? "bg-gray-700 border-gray-600 text-gray-300 placeholder-gray-500" 
                        : "bg-white border-gray-300 text-gray-700 placeholder-gray-400"
                    } border rounded-lg px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    placeholder="Add a description..."
                    rows={6}
                  />
                </div>

                {/* Save Button */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setShowInfoEditModal(false)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      darkMode
                        ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      saveInfo();
                      // Delay closing modal slightly to ensure save completes
                      setTimeout(() => {
                        setShowInfoEditModal(false);
                      }, 0);
                    }}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PartDetailPanel;
