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
  const containerClasses = `${
    darkMode
      ? "bg-slate-950/95 border border-slate-800 text-slate-100"
      : "bg-white border border-slate-200/90 text-slate-900"
  } relative rounded-[28px] shadow-[0_24px_60px_rgba(15,23,42,0.28)] overflow-hidden w-full max-w-5xl max-h-[85vh] flex flex-col transition-all duration-300`;

  const navContainerClasses = darkMode
    ? "bg-slate-950/80 border border-slate-800/70 shadow-[0_22px_48px_rgba(8,15,30,0.55)] rounded-[26px] backdrop-blur-xl flex flex-col overflow-hidden"
    : "bg-white/80 border border-slate-200/70 shadow-[0_24px_48px_rgba(15,23,42,0.16)] rounded-[26px] backdrop-blur-xl flex flex-col overflow-hidden";

  const navButtonBaseClasses = "w-full text-left px-4 py-3 rounded-2xl text-sm font-semibold flex items-center justify-between transition-all duration-200 border";

  const navButtonActiveClasses = darkMode
    ? "bg-slate-900/70 border-slate-700 text-white shadow-[0_12px_28px_rgba(8,15,30,0.65)]"
    : "bg-white border-slate-200 text-slate-900 shadow-[0_16px_36px_rgba(15,23,42,0.14)]";

  const navButtonInactiveClasses = darkMode
    ? "border-transparent text-slate-300 hover:bg-slate-900/40"
    : "border-transparent text-slate-600 hover:bg-slate-100";

  const sectionCardClasses = darkMode
    ? "bg-slate-950/75 border border-slate-800/70 shadow-[0_24px_60px_rgba(8,15,30,0.45)] rounded-[26px] backdrop-blur-xl"
    : "bg-white/95 border border-slate-200/90 shadow-[0_28px_65px_rgba(15,23,42,0.12)] rounded-[26px] backdrop-blur-xl";

  const subCardClasses = darkMode
    ? "bg-slate-950/65 border border-slate-800/70 rounded-2xl"
    : "bg-slate-50/80 border border-slate-200 rounded-2xl";

  const listItemClasses = darkMode
    ? "bg-slate-950/55 border border-slate-800/70 text-slate-200"
    : "bg-white/95 border border-slate-200 text-slate-700";

  const modalContainerClasses = darkMode
    ? "bg-slate-950/95 border border-slate-800 text-slate-100"
    : "bg-white border border-slate-200 text-slate-900";

  const modalFieldCardClasses = darkMode
    ? "bg-slate-950/75 border border-slate-800/70 rounded-2xl"
    : "bg-slate-50 border border-slate-200 rounded-2xl";

  const modalInputClasses = darkMode
    ? "bg-slate-900/60 border border-slate-700 text-slate-100 placeholder-slate-500"
    : "bg-white border border-slate-200 text-slate-900 placeholder-slate-400";

  const modalTextareaClasses = darkMode
    ? "bg-slate-900/60 border border-slate-700 text-slate-100 placeholder-slate-500"
    : "bg-white border border-slate-200 text-slate-900 placeholder-slate-400";

  const modalLabelClasses = darkMode ? "text-slate-200" : "text-slate-700";

  return (
    <div
      className="fixed inset-0 bg-slate-950/65 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
      onClick={() => setSelectedPartId(undefined)}
    >
      <div className="relative w-full max-w-5xl">
        {/* Close Button - To the right of container */}
        <button
          onClick={handleClose}
          className="absolute -right-12 top-0 z-[60] hover:opacity-70 transition-opacity"
          aria-label="Close"
        >
          <X 
            className="text-white" 
            strokeWidth={2} 
            size={30} 
          />
        </button>

        <div
          className={containerClasses}
          onClick={(e) => e.stopPropagation()}
        >
        {/* Content with TOC */}
        <div className="flex flex-row flex-1 overflow-hidden min-h-0">
          {/* Table of Contents - Left Column */}
          <div className={`w-60 flex-shrink-0 ${navContainerClasses}`}>
            <div className="px-5 pt-5 pb-3">
              <span className={`text-[11px] uppercase tracking-[0.32em] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                Navigate
              </span>
              <h2 className={`mt-2 text-base font-semibold ${darkMode ? "text-white" : "text-slate-900"}`}>
                Part Sections
              </h2>
            </div>
            <nav className="flex-1 overflow-y-auto px-5 pb-5 space-y-2">
              <button
                onClick={() => scrollToSection(infoRef, 'info')}
                className={`${navButtonBaseClasses} ${activeSection === 'info' ? navButtonActiveClasses : navButtonInactiveClasses}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${
                    darkMode
                      ? "bg-emerald-400/15 text-emerald-200 shadow-inner shadow-emerald-500/10"
                      : "bg-emerald-500/10 text-emerald-600 shadow-inner shadow-emerald-200/60"
                  }`}>
                    <User className="w-4 h-4" />
                  </span>
                  <span>Info</span>
                </div>
                <span
                  className={`h-2.5 w-2.5 rounded-full transition-all ${
                    activeSection === 'info'
                      ? darkMode
                        ? "bg-emerald-300 shadow-[0_0_0_4px_rgba(16,185,129,0.18)]"
                        : "bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.18)]"
                      : "border border-slate-400/40"
                  }`}
                />
              </button>
              <button
                onClick={() => scrollToSection(insightsRef, 'insights')}
                className={`${navButtonBaseClasses} ${activeSection === 'insights' ? navButtonActiveClasses : navButtonInactiveClasses}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${
                    darkMode
                      ? "bg-sky-400/15 text-sky-200 shadow-inner shadow-sky-500/10"
                      : "bg-sky-100 text-sky-600 shadow-inner shadow-sky-200/60"
                  }`}>
                    <Brain className="w-4 h-4" />
                  </span>
                  <span>Insights</span>
                </div>
                <span
                  className={`h-2.5 w-2.5 rounded-full transition-all ${
                    activeSection === 'insights'
                      ? darkMode
                        ? "bg-sky-300 shadow-[0_0_0_4px_rgba(125,211,252,0.18)]"
                        : "bg-sky-500 shadow-[0_0_0_4px_rgba(59,130,246,0.18)]"
                      : "border border-slate-400/40"
                  }`}
                />
              </button>
              <button
                onClick={() => scrollToSection(impressionsRef, 'impressions')}
                className={`${navButtonBaseClasses} ${activeSection === 'impressions' ? navButtonActiveClasses : navButtonInactiveClasses}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${
                    darkMode
                      ? "bg-purple-400/20 text-purple-200 shadow-inner shadow-purple-500/10"
                      : "bg-purple-100 text-purple-600 shadow-inner shadow-purple-200/60"
                  }`}>
                    <Eye className="w-4 h-4" />
                  </span>
                  <span>Impressions</span>
                </div>
                <span
                  className={`h-2.5 w-2.5 rounded-full transition-all ${
                    activeSection === 'impressions'
                      ? darkMode
                        ? "bg-purple-300 shadow-[0_0_0_4px_rgba(192,132,252,0.2)]"
                        : "bg-purple-500 shadow-[0_0_0_4px_rgba(168,85,247,0.18)]"
                      : "border border-slate-400/40"
                  }`}
                />
              </button>
              <button
                onClick={() => scrollToSection(journalRef, 'journal')}
                className={`${navButtonBaseClasses} ${activeSection === 'journal' ? navButtonActiveClasses : navButtonInactiveClasses}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${
                    darkMode
                      ? "bg-amber-400/20 text-amber-200 shadow-inner shadow-amber-500/15"
                      : "bg-amber-100 text-amber-600 shadow-inner shadow-amber-200/60"
                  }`}>
                    <BookOpen className="w-4 h-4" />
                  </span>
                  <span>Journal</span>
                </div>
                <span
                  className={`h-2.5 w-2.5 rounded-full transition-all ${
                    activeSection === 'journal'
                      ? darkMode
                        ? "bg-amber-300 shadow-[0_0_0_4px_rgba(251,191,36,0.2)]"
                        : "bg-amber-500 shadow-[0_0_0_4px_rgba(245,158,11,0.2)]"
                      : "border border-slate-400/40"
                  }`}
                />
              </button>
              <button
                onClick={() => scrollToSection(relationshipsRef, 'relationships')}
                className={`${navButtonBaseClasses} ${activeSection === 'relationships' ? navButtonActiveClasses : navButtonInactiveClasses}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${
                    darkMode
                      ? "bg-rose-400/20 text-rose-200 shadow-inner shadow-rose-500/15"
                      : "bg-rose-100 text-rose-600 shadow-inner shadow-rose-200/60"
                  }`}>
                    <Users className="w-4 h-4" />
                  </span>
                  <span>Relationships</span>
                </div>
                <span
                  className={`h-2.5 w-2.5 rounded-full transition-all ${
                    activeSection === 'relationships'
                      ? darkMode
                        ? "bg-rose-300 shadow-[0_0_0_4px_rgba(244,114,182,0.2)]"
                        : "bg-rose-500 shadow-[0_0_0_4px_rgba(244,63,94,0.2)]"
                      : "border border-slate-400/40"
                  }`}
                />
              </button>
            </nav>
          </div>

          {/* Main Content - Right Column */}
          <div ref={scrollableContentRef} className="flex-1 p-8 lg:p-10 overflow-y-auto space-y-14 bg-transparent">

          {/* Info Section */}
          <div ref={infoRef} className="transition-all duration-300 relative space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${
                  darkMode ? "bg-emerald-400/15 text-emerald-200 shadow-inner shadow-emerald-500/10" : "bg-emerald-100 text-emerald-600 shadow-inner shadow-emerald-200/60"
                }`}>
                  <User className="w-5 h-5" />
                </span>
                <div>
                  <p className={`text-[11px] uppercase tracking-[0.32em] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                    Overview
                  </p>
                  <h3 className={`text-lg font-semibold tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>
                    Info
                  </h3>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowInfoEditModal(true)}
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ${
                    darkMode
                      ? "border border-slate-700 bg-slate-950/60 text-slate-200 hover:bg-slate-900/70"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                  }`}
                  aria-label="Edit info"
                >
                  <Pencil className="w-4 h-4" />
                  <span>Edit</span>
                </button>
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
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all duration-200 ${
                    darkMode
                      ? "bg-slate-900/60 border border-purple-500/30 text-purple-200 hover:border-purple-400/50 hover:bg-slate-900/80"
                      : "bg-white/90 border border-purple-300/60 text-purple-600 hover:border-purple-400/60 hover:bg-purple-50"
                  }`}
                >
                  <Sparkles className={`w-4 h-4 ${darkMode ? "text-purple-300" : "text-purple-500"}`} />
                  <span>Deepen</span>
                </button>
              </div>
            </div>

            <div className={`${sectionCardClasses} overflow-hidden`}>
              <div className={`p-6 lg:p-8 space-y-8 ${
                darkMode
                  ? "bg-gradient-to-br from-slate-950/85 via-slate-950/55 to-transparent"
                  : "bg-gradient-to-br from-sky-50 via-white to-white"
              }`}>
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-6 lg:gap-10">
                  <div className="lg:col-span-1">
                    <div className={`relative w-full aspect-square rounded-[22px] overflow-hidden border ${
                      darkMode
                        ? "border-slate-800/70 shadow-[0_18px_38px_rgba(8,15,30,0.6)]"
                        : "border-slate-200 shadow-[0_22px_48px_rgba(15,23,42,0.18)]"
                    }`}>
                      {data.image ? (
                        <>
                          <Image
                            src={data.image as string}
                            alt="Part"
                            width={320}
                            height={320}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute inset-0 bg-slate-950/0 hover:bg-slate-950/40 transition-colors flex items-center justify-center"
                          >
                            <Upload className="w-8 h-8 text-white" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className={`w-full h-full flex flex-col items-center justify-center gap-3 ${
                            darkMode ? "bg-slate-900/50 text-slate-300 hover:bg-slate-900/40" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                          }`}
                        >
                          <SquareUserRound size={64} />
                          <span className="text-xs font-medium">Upload portrait</span>
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

                  <div className="lg:col-span-1 space-y-6">
                    <div className="space-y-4">
                      <div>
                        <h2 className={`text-3xl lg:text-4xl font-semibold tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>
                          {(data.name as string) || (data.label as string) || "Untitled"}
                        </h2>
                        <p className={`text-sm mt-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                          {(tempPartType || (data.customPartType as string) || (data.partType as string)) ? `Identified as ${(tempPartType || (data.customPartType as string) || (data.partType as string))}` : "Primary details for this part."}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5">
                        {['manager', 'firefighter', 'exile'].map((type) => {
                          const currentType = tempPartType || (data.customPartType as string) || (data.partType as string) || "";
                          const isSelected = currentType === type;
                          if (!isSelected) return null;
                          return (
                            <span
                              key={type}
                              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold uppercase tracking-wide ${
                                type === "manager"
                                  ? darkMode
                                    ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-200"
                                    : "bg-emerald-500/10 border border-emerald-200 text-emerald-600"
                                  : type === "firefighter"
                                    ? darkMode
                                      ? "bg-red-500/15 border border-red-500/30 text-red-200"
                                      : "bg-red-500/10 border border-red-200 text-red-600"
                                    : darkMode
                                      ? "bg-purple-500/15 border border-purple-500/30 text-purple-200"
                                      : "bg-purple-500/10 border border-purple-200 text-purple-600"
                              }`}
                            >
                              {type}
                            </span>
                          );
                        })}
                        {!tempPartType && !(data.customPartType as string) && !(data.partType as string) && (
                          <span className={`text-xs px-3 py-1.5 rounded-full border ${darkMode ? "border-slate-700 text-slate-400" : "border-slate-200 text-slate-500"}`}>
                            No type set
                          </span>
                        )}
                        {(data.age as string) && (data.age as string) !== "Unknown" && (
                          <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border ${darkMode ? "border-slate-700 text-slate-200" : "border-slate-200 text-slate-600"}`}>
                            <Clock className="w-3.5 h-3.5" />
                            {data.age as string}
                          </span>
                        )}
                        {(data.gender as string) && (
                          <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border ${darkMode ? "border-slate-700 text-slate-200" : "border-slate-200 text-slate-600"}`}>
                            {data.gender as string}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className={`${subCardClasses} p-5 lg:p-6`}>
                      <p className={`text-base leading-relaxed ${darkMode ? "text-slate-200" : "text-slate-700"} whitespace-pre-wrap`}>
                        {(data.scratchpad as string) || (
                          <span className={darkMode ? "text-slate-500" : "text-slate-400"}>
                            No description added yet.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Insights Section */}
          <div ref={insightsRef} className="transition-all duration-300 relative space-y-6">
            <div className="flex items-center gap-3">
              <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${
                darkMode ? "bg-sky-400/15 text-sky-200 shadow-inner shadow-sky-500/10" : "bg-sky-100 text-sky-600 shadow-inner shadow-sky-200/60"
              }`}>
                <Brain className="w-5 h-5" />
              </span>
              <div>
                <p className={`text-[11px] uppercase tracking-[0.32em] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Interpret
                </p>
                <h3 className={`text-lg font-semibold tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>
                  Insights
                </h3>
              </div>
            </div>
            <div className={`${sectionCardClasses} p-6 lg:p-7`}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Needs */}
                <div className={`${subCardClasses} p-5 space-y-4 transition-all duration-200 hover:-translate-y-[1px] hover:shadow-xl`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ${
                        darkMode ? "bg-emerald-400/15 text-emerald-200" : "bg-emerald-100 text-emerald-600"
                      }`}>
                        <Heart className="w-4 h-4" />
                      </span>
                      <h4 className={`font-semibold text-sm ${darkMode ? "text-slate-100" : "text-slate-900"}`}>
                        Needs
                      </h4>
                    </div>
                    <button
                      onClick={() => {
                        const input = prompt("Add a need:");
                        if (input?.trim()) {
                          addListItem("needs", input.trim());
                        }
                      }}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                        darkMode
                          ? "bg-slate-900/50 border border-slate-700 text-slate-200 hover:bg-slate-900/70"
                          : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <Plus className="w-3 h-3" />
                      Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {((data.needs as string[]) || []).map((need: string, index: number) => (
                      <div
                        key={index}
                        className={`${listItemClasses} group flex items-center justify-between rounded-xl px-3.5 py-2.5 transition-all duration-200 hover:-translate-y-[1px] hover:shadow-lg`}
                      >
                        <span className={`text-xs font-medium leading-relaxed ${darkMode ? "text-slate-100" : "text-slate-700"}`}>{need}</span>
                        <button
                          onClick={() => removeListItem("needs", index)}
                          className={`opacity-0 group-hover:opacity-100 inline-flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-200 ${
                            darkMode ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                          }`}
                          aria-label="Remove need"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    {((data.needs as string[]) || []).length === 0 && (
                      <div className={`text-center py-4 text-xs italic ${darkMode ? "text-slate-500" : "text-slate-500/80"}`}>
                        No needs added yet
                      </div>
                    )}
                  </div>
                </div>

                {/* Fears */}
                <div className={`${subCardClasses} p-5 space-y-4 transition-all duration-200 hover:-translate-y-[1px] hover:shadow-xl`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ${
                        darkMode ? "bg-rose-400/20 text-rose-200" : "bg-rose-100 text-rose-600"
                      }`}>
                        <Shield className="w-4 h-4" />
                      </span>
                      <h4 className={`font-semibold text-sm ${darkMode ? "text-slate-100" : "text-slate-900"}`}>
                        Fears
                      </h4>
                    </div>
                    <button
                      onClick={() => {
                        const input = prompt("Add a fear:");
                        if (input?.trim()) {
                          addListItem("fears", input.trim());
                        }
                      }}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                        darkMode
                          ? "bg-slate-900/50 border border-slate-700 text-slate-200 hover:bg-slate-900/70"
                          : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <Plus className="w-3 h-3" />
                      Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {((data.fears as string[]) || []).map((fear: string, index: number) => (
                      <div
                        key={index}
                        className={`${listItemClasses} group flex items-center justify-between rounded-xl px-3.5 py-2.5 transition-all duration-200 hover:-translate-y-[1px] hover:shadow-lg`}
                      >
                        <span className={`text-xs font-medium leading-relaxed ${darkMode ? "text-slate-100" : "text-slate-700"}`}>{fear}</span>
                        <button
                          onClick={() => removeListItem("fears", index)}
                          className={`opacity-0 group-hover:opacity-100 inline-flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-200 ${
                            darkMode ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                          }`}
                          aria-label="Remove fear"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    {((data.fears as string[]) || []).length === 0 && (
                      <div className={`text-center py-4 text-xs italic ${darkMode ? "text-slate-500" : "text-slate-500/80"}`}>
                        No fears added yet
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Impressions Section */}
          <div ref={impressionsRef} className="transition-all duration-300 relative space-y-6">
            <div className="flex items-center gap-3">
              <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${
                darkMode ? "bg-purple-400/20 text-purple-200 shadow-inner shadow-purple-500/15" : "bg-purple-100 text-purple-600 shadow-inner shadow-purple-200/60"
              }`}>
                <Eye className="w-5 h-5" />
              </span>
              <div>
                <p className={`text-[11px] uppercase tracking-[0.32em] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Catalogue
                </p>
                <h3 className={`text-lg font-semibold tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>
                  Impressions
                </h3>
              </div>
            </div>

            {/* Flexible Layout for Impressions */}
            <div className={`${sectionCardClasses} p-6 lg:p-7`}>
              <div className="space-y-5">
                {/* All Impressions: emotion, thought, sensation, behavior, other */}
                <div className="columns-1 lg:columns-2 gap-4 space-y-4">
                  {ImpressionList.map((impression) => {
                    const impressions = (data[ImpressionTextType[impression]] as ImpressionNode[]) || [];
                    const accentColor = NodeBackgroundColors[impression];

                    return (
                      <div
                        key={impression}
                        className={`break-inside-avoid ${subCardClasses} p-5 space-y-4 transition-all duration-200 hover:-translate-y-[1px] hover:shadow-xl`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span
                              className="inline-flex h-8 w-8 items-center justify-center rounded-xl shadow-inner"
                              style={{
                                backgroundColor: `${accentColor}20`,
                                color: accentColor,
                              }}
                            >
                              <Sparkles className="w-4 h-4" />
                            </span>
                            <div>
                              <h4
                                className="font-semibold capitalize text-sm"
                                style={{ color: accentColor }}
                              >
                                {impression}
                              </h4>
                              <span className={`text-[11px] uppercase tracking-[0.22em] ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
                                {impressions.length} item{impressions.length === 1 ? "" : "s"}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setAddingImpressionType(impression);
                              setCurrentImpressionType(impression);
                            }}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                              darkMode
                                ? "bg-slate-900/50 text-slate-200 hover:bg-slate-900/70"
                                : "bg-white text-slate-600 hover:bg-slate-100"
                            }`}
                            style={{
                              border: `1px solid ${accentColor}40`,
                              color: accentColor,
                            }}
                          >
                            <Plus className="w-3 h-3" />
                            Add
                          </button>
                        </div>

                        <div className="space-y-2">
                          {impressions.map((imp, index) => (
                            <div
                              key={index}
                              className={`${listItemClasses} group flex items-center justify-between rounded-xl px-3.5 py-2.5 transition-all duration-200 hover:-translate-y-[1px] hover:shadow-lg`}
                              style={{
                                backgroundColor: `${accentColor}15`,
                                borderColor: `${accentColor}35`,
                                color: accentColor,
                              }}
                            >
                              <span className="font-medium text-xs">{imp.data?.label || imp.id}</span>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleReturnToSidebar(impression, imp.id)}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-200"
                                  style={{
                                    color: accentColor,
                                    backgroundColor: `${accentColor}15`,
                                  }}
                                  title="Return to sidebar"
                                >
                                  <ListRestart size={14} />
                                </button>
                                <button
                                  onClick={() => handleRemoveImpression(impression, imp.id)}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-200"
                                  style={{
                                    color: accentColor,
                                    backgroundColor: `${accentColor}15`,
                                  }}
                                  title="Delete"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Journal History Section */}
          <div ref={journalRef} className="transition-all duration-300 relative space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${
                  darkMode ? "bg-amber-400/20 text-amber-200 shadow-inner shadow-amber-500/15" : "bg-amber-100 text-amber-600 shadow-inner shadow-amber-200/60"
                }`}>
                  <BookOpen className="w-5 h-5" />
                </span>
                <div>
                  <p className={`text-[11px] uppercase tracking-[0.32em] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                    Record
                  </p>
                  <h3 className={`text-lg font-semibold tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>
                    Journal
                  </h3>
                </div>
              </div>
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
                className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  darkMode
                    ? "bg-purple-500/20 border border-purple-500/30 text-purple-100 hover:bg-purple-500/30"
                    : "bg-white border border-purple-300/60 text-purple-600 hover:border-purple-400/60 hover:bg-purple-50"
                }`}
              >
                <Sparkles className={`w-4 h-4 ${darkMode ? "text-purple-200" : "text-purple-500"}`} />
                <span>New Entry</span>
              </button>
            </div>

            <div className={`${sectionCardClasses} p-6 lg:p-7`}>
              {isLoadingJournal ? (
                <div className={`${subCardClasses} flex flex-col items-center gap-3 py-10`}>
                  <div className="h-10 w-10 rounded-full border-2 border-slate-400/30 border-t-transparent animate-spin" />
                  <span className={`text-sm ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                    Loading journal entries...
                  </span>
                </div>
              ) : journalEntries.length === 0 ? (
                <div className={`${subCardClasses} text-center py-10 px-4 space-y-3`}>
                  <BookOpen className={`w-12 h-12 mx-auto ${darkMode ? "text-slate-500" : "text-slate-400"}`} />
                  <h3 className={`text-lg font-semibold ${darkMode ? "text-slate-100" : "text-slate-700"}`}>
                    No journal entries yet
                  </h3>
                  <p className={darkMode ? "text-slate-400" : "text-slate-500"}>
                    Start writing about this part to see entries here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {journalEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className={`${subCardClasses} p-5 lg:p-6 transition-all duration-200 hover:-translate-y-[1px] hover:shadow-xl`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <Clock className={`w-4 h-4 ${darkMode ? "text-slate-400" : "text-slate-500"}`} />
                          <span className={`text-sm ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                            {new Date(entry.createdAt).toLocaleDateString()} · {new Date(entry.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <button
                          onClick={() => extractImpressionsFromEntry(entry.id)}
                          disabled={isExtractingImpressions}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                            isExtractingImpressions
                              ? darkMode
                                ? "bg-slate-800 text-slate-500"
                                : "bg-slate-100 text-slate-500"
                              : darkMode
                                ? "bg-slate-100/15 text-slate-100 hover:bg-slate-100/25"
                                : "bg-slate-900 text-white hover:bg-slate-800"
                          }`}
                        >
                          {isExtractingImpressions ? (
                            <>
                              <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                              <span>Extracting...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3 h-3" />
                              <span>Extract impressions</span>
                            </>
                          )}
                        </button>
                      </div>
                      {entry.title && (
                        <h4 className={`font-semibold mb-2 ${darkMode ? "text-slate-100" : "text-slate-800"}`}>
                          {entry.title}
                        </h4>
                      )}
                      <div className={`whitespace-pre-wrap text-sm leading-relaxed ${
                        darkMode ? "text-slate-200" : "text-slate-700"
                      }`}>
                        {entry.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Relationships Section */}
          <div ref={relationshipsRef} className="transition-all duration-300 relative space-y-6">
            <div className="flex items-center gap-3">
              <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${
                darkMode ? "bg-rose-400/20 text-rose-200 shadow-inner shadow-rose-500/15" : "bg-rose-100 text-rose-600 shadow-inner shadow-rose-200/60"
              }`}>
                <Users className="w-5 h-5" />
              </span>
              <div>
                <p className={`text-[11px] uppercase tracking-[0.32em] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Dynamics
                </p>
                <h3 className={`text-lg font-semibold tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>
                  Relationships
                </h3>
              </div>
            </div>

            {relationships.length > 0 ? (
              <div className={`${sectionCardClasses} p-6 lg:p-7 space-y-4`}>
                {relationships.map((rel) => {
                  const isConflict = rel.relationshipType === "conflict";
                  const isAlly = rel.relationshipType === "ally";

                  return (
                    <div
                      key={rel.id}
                      className={`transition-all duration-200 hover:-translate-y-[1px] hover:shadow-xl rounded-2xl p-5 ${
                        darkMode ? "bg-slate-950/55 border border-slate-800/70" : "bg-white border border-slate-200/90"
                      }`}
                    >
                      <div
                        className={`rounded-2xl border px-4 py-3 space-y-2 ${
                          isConflict
                            ? darkMode
                              ? "border-purple-400/50 bg-purple-900/40"
                              : "border-purple-300/70 bg-purple-50"
                            : isAlly
                              ? darkMode
                                ? "border-sky-400/50 bg-sky-900/35"
                                : "border-sky-300/70 bg-sky-50"
                              : darkMode
                                ? "border-slate-700/60 bg-slate-900/60"
                                : "border-slate-200 bg-white"
                        }`}
                      >
                        <div className={`text-sm font-semibold ${
                          isConflict
                            ? darkMode
                              ? "text-purple-200"
                              : "text-purple-900"
                            : isAlly
                              ? darkMode
                                ? "text-sky-200"
                                : "text-sky-900"
                              : darkMode
                                ? "text-slate-100"
                                : "text-slate-900"
                        }`}>
                          {rel.nodeLabel}
                        </div>
                        {rel.nodeDescription && String(rel.nodeDescription).trim() ? (
                          <div className={`text-xs leading-relaxed whitespace-pre-wrap ${
                            isConflict
                              ? darkMode
                                ? "text-purple-300"
                                : "text-purple-700"
                              : isAlly
                                ? darkMode
                                  ? "text-sky-300"
                                  : "text-sky-700"
                                : darkMode
                                  ? "text-slate-300"
                                  : "text-slate-700"
                          }`}>
                            {String(rel.nodeDescription)}
                          </div>
                        ) : null}
                        <div className={`text-xs font-medium capitalize ${
                          isConflict
                            ? darkMode
                              ? "text-purple-300"
                              : "text-purple-700"
                            : isAlly
                              ? darkMode
                                ? "text-sky-300"
                                : "text-sky-700"
                              : darkMode
                                ? "text-slate-400"
                                : "text-slate-600"
                        }`}>
                          {isConflict ? "⚔️ Conflict" : isAlly ? "🤝 Ally" : rel.nodeType}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={`${sectionCardClasses} p-6 lg:p-7`}>
                <div className={`${subCardClasses} text-center py-10 space-y-3`}>
                  <Users className={`w-12 h-12 mx-auto ${darkMode ? "text-slate-500" : "text-slate-400"}`} />
                  <h3 className={`text-lg font-semibold ${darkMode ? "text-slate-100" : "text-slate-700"}`}>
                    No relationships yet
                  </h3>
                  <p className={darkMode ? "text-slate-400" : "text-slate-500"}>
                    No relationships have been created for this part.
                  </p>
                </div>
              </div>
            )}
          </div>
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
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-[2px] flex items-center justify-center z-[60] p-4"
            onClick={() => setShowInfoEditModal(false)}
          >
            <div
              className={`${modalContainerClasses} rounded-[24px] shadow-[0_20px_48px_rgba(15,23,42,0.26)] w-full max-w-2xl max-h-[80vh] mx-4 overflow-hidden flex flex-col`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-5 space-y-6 overflow-y-auto">
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`text-[11px] uppercase tracking-[0.32em] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                      Info
                    </p>
                    <h3 className="text-2xl font-semibold mt-2">Edit details</h3>
                    <p className={`text-sm mt-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                      Update the basics for {(data.name as string) || (data.label as string) || "your part"}.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowInfoEditModal(false)}
                    className={`p-2 rounded-full border transition-colors ${
                      darkMode ? "border-slate-700 text-slate-300 hover:bg-slate-900/60" : "border-slate-200 text-slate-500 hover:bg-slate-100"
                    }`}
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-5">
                  <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-5">
                    <div className={`${modalFieldCardClasses} p-5 space-y-5`}>
                      <div className="space-y-2">
                        <label className={`text-sm font-medium ${modalLabelClasses}`}>Name</label>
                        <input
                          type="text"
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                          className={`w-full text-base rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent ${modalInputClasses}`}
                          placeholder="Part name"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className={`text-sm font-medium ${modalLabelClasses}`}>Part type</label>
                        <div className="flex flex-wrap gap-2">
                          {['manager', 'firefighter', 'exile'].map((type) => {
                            const currentType = tempPartType || (data.customPartType as string) || (data.partType as string) || "";
                            const isSelected = currentType === type;
                            return (
                              <button
                                key={type}
                                onClick={() => {
                                  setTempPartType(type);
                                }}
                                className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-colors ${
                                  isSelected
                                    ? type === "manager"
                                      ? "bg-blue-600 text-white shadow-sm"
                                      : type === "firefighter"
                                        ? "bg-red-500 text-white shadow-sm"
                                        : "bg-purple-500 text-white shadow-sm"
                                    : darkMode
                                      ? "bg-slate-900/50 border border-slate-700 text-slate-200 hover:bg-slate-900"
                                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                                }`}
                              >
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-[0.9fr_1.1fr] gap-4">
                        <div className="space-y-2">
                          <label className={`text-sm font-medium ${modalLabelClasses}`}>Age</label>
                          <input
                            type="number"
                            value={tempAge === "" || tempAge === "Unknown" ? "" : tempAge}
                            onChange={(e) => setTempAge(e.target.value || "Unknown")}
                            className={`w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent ${modalInputClasses}`}
                            placeholder="Unknown"
                            min="0"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className={`text-sm font-medium ${modalLabelClasses}`}>Gender</label>
                          <input
                            type="text"
                            value={tempGender}
                            onChange={(e) => setTempGender(e.target.value)}
                            className={`w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent ${modalInputClasses}`}
                            placeholder="Gender"
                          />
                        </div>
                      </div>
                    </div>

                    <div className={`${modalFieldCardClasses} p-5 space-y-4`}>
                      <div className="space-y-2">
                        <label className={`text-sm font-medium ${modalLabelClasses}`}>Image</label>
                        <div
                          className={`relative aspect-square rounded-2xl overflow-hidden flex items-center justify-center ${
                            darkMode ? "bg-slate-900/60 border border-slate-700" : "bg-white border border-slate-200"
                          }`}
                        >
                          {data.image ? (
                            <>
                              <Image
                                src={data.image as string}
                                alt="Part"
                                width={320}
                                height={320}
                                className="w-full h-full object-cover"
                              />
                              <button
                                onClick={() => modalFileInputRef.current?.click()}
                                className="absolute inset-0 bg-slate-950/0 hover:bg-slate-950/50 transition-colors flex items-center justify-center"
                              >
                                <Upload className="w-7 h-7 text-white" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => modalFileInputRef.current?.click()}
                              className={`w-full h-full flex flex-col items-center justify-center gap-3 ${
                                darkMode ? "text-slate-300 hover:bg-slate-900/40" : "text-slate-500 hover:bg-slate-100"
                              }`}
                            >
                              <SquareUserRound size={60} />
                              <span className="text-xs font-medium">Upload image</span>
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
                  </div>

                  <div className={`${modalFieldCardClasses} p-5 space-y-3`}>
                    <label className={`text-sm font-medium ${modalLabelClasses}`}>Description</label>
                    <textarea
                      value={tempScratchpad}
                      onChange={(e) => setTempScratchpad(e.target.value)}
                      className={`w-full rounded-xl px-4 py-3 min-h-[160px] resize-none focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent ${modalTextareaClasses}`}
                      placeholder="Add a description..."
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setShowInfoEditModal(false)}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                      darkMode
                        ? "border-slate-700 text-slate-300 hover:bg-slate-900/60"
                        : "border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      saveInfo();
                      setTimeout(() => {
                        setShowInfoEditModal(false);
                      }, 0);
                    }}
                    className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                      darkMode
                        ? "bg-slate-100/15 text-white hover:bg-slate-100/25"
                        : "bg-slate-900 text-white hover:bg-slate-800"
                    }`}
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
