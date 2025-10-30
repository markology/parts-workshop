"use client";

import React, { useState, useMemo, useEffect, memo } from "react";
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
  Clock
} from "lucide-react";
import { useUIStore } from "@/features/workspace/state/stores/UI";
import { useFlowNodesContext } from "@/features/workspace/state/FlowNodesContext";
import { useWorkingStore } from "@/features/workspace/state/stores/useWorkingStore";
import { ImpressionList } from "@/features/workspace/constants/Impressions";
import { ImpressionTextType, ImpressionType } from "@/features/workspace/types/Impressions";
import { ImpressionNode } from "@/features/workspace/types/Nodes";
import { NodeBackgroundColors } from "@/features/workspace/constants/Nodes";
import ImpressionInput from "./Impressions/ImpressionInput";

const PartDetailPanel = () => {
  const selectedPartId = useUIStore((s) => s.selectedPartId);
  const setSelectedPartId = useUIStore((s) => s.setSelectedPartId);
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
  
  // Journal state
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [showJournalHistory, setShowJournalHistory] = useState(false);
  const [isLoadingJournal, setIsLoadingJournal] = useState(false);
  const [isExtractingImpressions, setIsExtractingImpressions] = useState(false);

  // Load journal entries when part is selected
  useEffect(() => {
    if (selectedPartId) {
      loadJournalEntries();
    }
  }, [selectedPartId]);

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

  if (!selectedPartId || !partNode) return null;

  const data = partNode.data;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={() => setSelectedPartId(undefined)}
    >
      <div 
        className={`${
          darkMode 
            ? "bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border border-gray-600/50" 
            : "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/50"
        } rounded-xl shadow-lg overflow-hidden w-full max-w-5xl max-h-[85vh] transition-all duration-300`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`${
          darkMode 
            ? "bg-gray-800/80 backdrop-blur-sm border-b border-gray-600/30" 
            : "bg-white/60 backdrop-blur-sm border-b border-blue-200/30"
        } p-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 ${
                darkMode 
                  ? "bg-gray-700 border border-gray-600" 
                  : "bg-white border border-gray-200"
              } rounded-lg shadow-sm overflow-hidden`}>
                {data.image ? (
                  <Image
                    src={data.image as string}
                    alt="Part"
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full ${
                    darkMode ? "bg-gray-600" : "bg-gray-100"
                  } flex items-center justify-center`}>
                    <SquareUserRound size={24} className={darkMode ? "text-gray-300" : "text-gray-400"} />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-black"}`}>
                  {(data.name as string) || (data.label as string) || "Untitled"}
                </h2>
                {editingPartType ? (
                  <select
                    value={tempPartType}
                    onChange={(e) => setTempPartType(e.target.value)}
                    onBlur={savePartType}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") savePartType();
                      if (e.key === "Escape") {
                        setEditingPartType(false);
                        setTempPartType("");
                      }
                    }}
                    className={`text-sm mb-2 bg-transparent border-b ${
                      darkMode 
                        ? "border-gray-500 focus:border-blue-400 text-white" 
                        : "border-gray-300 focus:border-blue-500 text-gray-900"
                    } focus:outline-none min-w-[100px]`}
                    autoFocus
                  >
                    <option value="exile">Exile</option>
                    <option value="manager">Manager</option>
                    <option value="protector">Protector</option>
                    <option value="firefighter">Firefighter</option>
                  </select>
                ) : (
                  <p 
                    className={`${darkMode ? "text-gray-300" : "text-gray-600"} text-sm mb-2 cursor-pointer transition-colors ${
                      darkMode 
                        ? "hover:text-blue-400" 
                        : "hover:text-blue-600"
                    }`}
                    onClick={() => {
                      setTempPartType((data.customPartType as string) || (data.partType as string) || "manager");
                      setEditingPartType(true);
                    }}
                  >
                    {(data.customPartType as string) || (data.partType as string) || "Manager"} Part
                  </p>
                )}
                
                {/* Stats Row */}
                <div className={`flex items-center gap-4 text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  {/* Journal Button */}
                  <button
                    onClick={() => {
                      setShowJournalHistory(!showJournalHistory);
                    }}
                    className={`flex items-center gap-1 px-2 py-1 rounded-full transition-colors ${
                      darkMode 
                        ? "bg-blue-900/50 hover:bg-blue-800/50" 
                        : "bg-blue-100 hover:bg-blue-200"
                    }`}
                  >
                    <BookOpen size={12} />
                    <span>Journal</span>
                    {journalEntries.length > 0 && (
                      <span className="text-xs bg-blue-600 text-white rounded-full px-1.5 py-0.5">
                        {journalEntries.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedPartId(undefined)}
              className={`p-2 rounded-lg transition-colors ${
                darkMode 
                  ? "bg-gray-700/60 hover:bg-gray-600/80" 
                  : "bg-white/60 hover:bg-white/80"
              }`}
            >
              <X size={18} className={darkMode ? "text-gray-300" : "text-gray-600"} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={`p-6 overflow-y-auto max-h-[calc(85vh-100px)] backdrop-blur-sm ${
          darkMode 
            ? "bg-gray-800/80" 
            : "bg-white/80"
        }`}>
          
          {/* Observations Section - Top */}
          <div className="mb-8">
            <h3 className={`text-lg font-bold flex items-center gap-2 mb-4 ${
              darkMode ? "text-white" : "text-black"
            }`}>
              <Eye className="w-5 h-5 text-indigo-600" />
              Observations
            </h3>
            
            {/* Flexible Layout for Observations and Fears */}
            <div className="columns-1 lg:columns-2 gap-4 space-y-4">
              {ImpressionList.map((impression) => {
                const impressions = (data[ImpressionTextType[impression]] as ImpressionNode[]) || [];
                
                return (
                  <div key={impression} className={`break-inside-avoid rounded-lg p-4 border mb-4 ${
                    darkMode 
                      ? "bg-gray-700/40 border-gray-600/50" 
                      : "bg-white/40 border-blue-200/50"
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h4 
                          className="font-semibold capitalize text-sm"
                          style={{ color: NodeBackgroundColors[impression] }}
                        >
                          {impression}
                        </h4>
                        <button
                          onClick={() => {
                            setAddingImpressionType(impression);
                            setCurrentImpressionType(impression);
                          }}
                          className={`p-1 rounded-full transition-colors ${
                            darkMode 
                              ? "hover:bg-gray-600/60" 
                              : "hover:bg-white/60"
                          }`}
                          style={{ color: NodeBackgroundColors[impression] }}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
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
                              color: `${bgColor}FF`, // Much darker version for better readability
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

          {/* Details Section - Bottom */}
          <div>
            <h3 className={`text-lg font-bold flex items-center gap-2 mb-4 ${
              darkMode ? "text-white" : "text-black"
            }`}>
              <SquareUserRound className="w-5 h-5 text-blue-600" />
              Details
            </h3>
            
            {/* Two Column Grid for Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              {/* Left Column - Needs, Fears, Insights */}
              <div className="space-y-4">
                {/* Needs */}
                <div className={`rounded-lg p-4 border ${
                  darkMode 
                    ? "bg-gray-700/40 border-gray-600/50" 
                    : "bg-white/40 border-blue-200/50"
                }`}>
                  <h4 className={`font-semibold mb-3 flex items-center gap-2 text-sm ${
                    darkMode ? "text-white" : "text-black"
                  }`}>
                    <Heart className="w-4 h-4 text-red-500" />
                    Needs
                  </h4>
                  <div className="space-y-1 mb-2">
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
                          <X size={20} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      placeholder="Add need..."
                      className="flex-1 text-xs px-2 py-1 bg-white/60 backdrop-blur-sm border border-blue-200/50 rounded focus:outline-none focus:ring-1 focus:ring-blue-300"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          addListItem("needs", e.currentTarget.value);
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        const input = document.querySelector('input[placeholder="Add need..."]') as HTMLInputElement;
                        if (input?.value) {
                          addListItem("needs", input.value);
                          input.value = "";
                        }
                      }}
                      className="p-1 bg-blue-100 hover:bg-blue-200 rounded transition-colors"
                    >
                      <Plus size={10} />
                    </button>
                  </div>
                </div>

                {/* Fears */}
                <div className="bg-white/40 rounded-lg p-4 border border-blue-200/50">
                  <h4 className="font-semibold text-black mb-3 flex items-center gap-2 text-sm">
                    <Shield className="w-4 h-4 text-orange-500" />
                    Fears
                  </h4>
                  <div className="space-y-1 mb-2">
                    {((data.fears as string[]) || []).map((fear: string, index: number) => (
                      <div key={index} className="group bg-white/40 rounded border border-blue-200/30 p-2 flex items-center justify-between">
                        <span className="text-xs text-black">{fear}</span>
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
                          <X size={20} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      placeholder="Add fear..."
                      className="flex-1 text-xs px-2 py-1 bg-white/60 backdrop-blur-sm border border-blue-200/50 rounded focus:outline-none focus:ring-1 focus:ring-blue-300"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          addListItem("fears", e.currentTarget.value);
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        const input = document.querySelector('input[placeholder="Add fear..."]') as HTMLInputElement;
                        if (input?.value) {
                          addListItem("fears", input.value);
                          input.value = "";
                        }
                      }}
                      className="p-1 bg-blue-100 hover:bg-blue-200 rounded transition-colors"
                    >
                      <Plus size={10} />
                    </button>
                  </div>
                </div>

                {/* Insights */}
                <div className="bg-white/40 rounded-lg p-4 border border-blue-200/50">
                  <h4 className="font-semibold text-black mb-3 flex items-center gap-2 text-sm">
                    <Brain className="w-4 h-4 text-purple-500" />
                    Insights
                  </h4>
                  <div className="space-y-1 mb-2">
                    {((data.insights as string[]) || []).map((insight: string, index: number) => (
                      <div key={index} className="group bg-white/40 rounded border border-blue-200/30 p-2 flex items-center justify-between">
                        <span className="text-xs text-black">{insight}</span>
                        <button 
                          onClick={() => removeListItem("insights", index)}
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
                          <X size={20} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      placeholder="Add insight..."
                      className="flex-1 text-xs px-2 py-1 bg-white/60 backdrop-blur-sm border border-blue-200/50 rounded focus:outline-none focus:ring-1 focus:ring-blue-300"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          addListItem("insights", e.currentTarget.value);
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        const input = document.querySelector('input[placeholder="Add insight..."]') as HTMLInputElement;
                        if (input?.value) {
                          addListItem("insights", input.value);
                          input.value = "";
                        }
                      }}
                      className="p-1 bg-blue-100 hover:bg-blue-200 rounded transition-colors"
                    >
                      <Plus size={10} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column - Relationships */}
              <div className="space-y-4">
                <div className="bg-white/40 rounded-lg p-4 border border-blue-200/50">
                  <h4 className="font-semibold text-black mb-3 flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-green-500" />
                    Relationships
                  </h4>
                  <div className="space-y-1">
                    {relationships.length > 0 ? (
                      relationships.map((rel) => {
                        console.log(rel)
                        const isConflict = rel.relationshipType === "conflict";
                        const isAlly = rel.relationshipType === "ally";
                        
                        return (
                          <div
                            key={rel.id}
                            className={`px-3 py-2 rounded-lg border-2 ${
                              isConflict 
                                ? "border-purple-400 bg-purple-100 shadow-sm" 
                                : isAlly 
                                  ? "border-sky-400 bg-sky-100 shadow-sm"
                                  : "border-blue-200/30 bg-white/40"
                            }`}
                          >
                            <div className={`font-semibold text-sm ${
                              isConflict 
                                ? "text-purple-900" 
                                : isAlly 
                                  ? "text-sky-900"
                                  : "text-black"
                            }`}>
                              {rel.nodeLabel}
                            </div>
                            <div className={`text-xs font-medium capitalize ${
                              isConflict 
                                ? "text-purple-700" 
                                : isAlly 
                                  ? "text-sky-700"
                                  : "text-gray-600"
                            }`}>
                              {isConflict ? "⚔️ Conflict" : isAlly ? "🤝 Ally" : rel.nodeType}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-gray-500 italic bg-white/40 rounded px-2 py-1 border border-blue-200/30 text-xs">
                        No relationships yet
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        </div>
        
        {/* Journal History Section */}
        {showJournalHistory && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div 
              className={`${
                darkMode 
                  ? "bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 border border-gray-600/50" 
                  : "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/50"
              } rounded-xl shadow-lg overflow-hidden w-full max-w-4xl max-h-[85vh] transition-all duration-300`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Journal Header */}
              <div className={`${
                darkMode 
                  ? "bg-gray-800/80 backdrop-blur-sm border-b border-gray-600/30" 
                  : "bg-white/60 backdrop-blur-sm border-b border-blue-200/30"
              } p-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-lg">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">
                        Journal History - {(data.name as string) || (data.label as string) || "Untitled"}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {journalEntries.length} entries
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowJournalHistory(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={20} className="text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Journal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
                {isLoadingJournal ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Loading journal entries...</span>
                  </div>
                ) : journalEntries.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Journal Entries Yet</h3>
                    <p className="text-gray-500">Start writing about this part to see entries here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {journalEntries.map((entry) => (
                      <div key={entry.id} className={`${
                        darkMode 
                          ? "bg-gray-800/50 border border-gray-600/30" 
                          : "bg-white border border-gray-200"
                      } rounded-lg p-4`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {new Date(entry.createdAt).toLocaleDateString()} at {new Date(entry.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                          <button
                            onClick={() => extractImpressionsFromEntry(entry.id)}
                            disabled={isExtractingImpressions}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm rounded-lg transition-colors"
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
                          <h4 className="font-semibold text-gray-800 mb-2">{entry.title}</h4>
                        )}
                        <div className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                          {entry.content}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
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
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
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
      </div>
    </div>
  );
};

export default PartDetailPanel;
